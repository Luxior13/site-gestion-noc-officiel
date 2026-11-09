import 'server-only';

import type { Prisma } from '@prisma/client';
import { AuditAction, AuditCategory } from '@repo/database';

import { FEATURES } from '$constants/feature-registry.constants';
import { PERMISSIONS } from '$constants/permissions.constants';
import {
  isPrismaForeignKeyError,
  isPrismaUniqueConstraintError,
} from '$server/api-response';
import { createAuditLogWithHeaders } from '$server/audit-log';
import { planManualOrder } from '$server/manual-order';
import { prisma } from '$server/prisma';
import { ServiceError, serviceErrors } from '$server/service-error';
import { authorizeUserAction } from '$server/user-action-authorization';
import { ErrorCode } from '$types/api.types';
import type { SessionType, UserType } from '$types/auth.types';
import { compareActiveThenRank } from '$utils/active-order.utils';
import { formatApproximateDate } from '$utils/approximate-date.utils';
import { normalizeSearchText } from '$utils/search-text.utils';

import type { GameInput, GameItem } from '../types/game.types';

export type GameActor = Readonly<{
  actor: Pick<UserType, 'id'>;
  session: SessionType | null;
}>;

type AuditValues = Readonly<{
  firstOpened: string;
  isActive: boolean;
  name: string;
  shortName: string | null;
}>;

const DUPLICATE_NAME = 'Un jeu porte déjà ce nom.';

const duplicateName = (): ServiceError =>
  new ServiceError(ErrorCode.CONFLICT, DUPLICATE_NAME, 409, {
    details: { name: [DUPLICATE_NAME] },
  });
const gameChanged = (): ServiceError =>
  serviceErrors.conflict(
    'Ce jeu a été modifié entre-temps. Rechargez la liste avant de recommencer.',
  );
/** A reorder names every active game, as they are now. */
const gamesChanged = (): ServiceError =>
  serviceErrors.conflict(
    'La liste des jeux a changé entre-temps. Elle est rechargée : recommencez le déplacement.',
  );
const gameMissing = (): ServiceError =>
  serviceErrors.notFound('Ce jeu n’existe plus. Rechargez la liste.');
/** A game that has teams stays in the history: it is made inactive instead. */
const gameHasTeams = (count: number | null): ServiceError =>
  serviceErrors.conflict(
    `Ce jeu a ${count === null ? 'des équipes' : count > 1 ? `${count} équipes` : 'une équipe'} : rendez-le inactif plutôt que de le supprimer.`,
  );

const WITH_COUNTS = {
  _count: { select: { functions: true, teams: true } },
} as const;
type GameRow = Prisma.GameGetPayload<{ include: typeof WITH_COUNTS }>;

const toGameItem = (game: GameRow): GameItem => ({
  firstOpened: {
    date: game.firstOpenedOn.toISOString().slice(0, 10),
    precision: game.firstOpenedPrecision,
  },
  functionCount: game._count.functions,
  id: game.id,
  isActive: game.isActive,
  name: game.name,
  position: game.position,
  shortName: game.shortName,
  teamCount: game._count.teams,
  updatedAt: game.updatedAt.toISOString(),
  version: game.version,
});

/** What the journal shows: readable values, the date as precisely as known. */
const auditValues = (game: GameItem | GameInput): AuditValues => ({
  firstOpened: formatApproximateDate(game.firstOpened),
  isActive: game.isActive,
  name: game.name,
  shortName: game.shortName,
});

const changedKeys = (
  before: AuditValues,
  after: AuditValues,
): (keyof AuditValues)[] =>
  (Object.keys(after) as (keyof AuditValues)[]).filter(
    // Keys come from the closed AuditValues type.
    // eslint-disable-next-line security/detect-object-injection
    (key) => before[key] !== after[key],
  );

const pick = (
  values: AuditValues,
  keys: readonly (keyof AuditValues)[],
): Partial<AuditValues> =>
  Object.fromEntries(
    // eslint-disable-next-line security/detect-object-injection
    keys.map((key) => [key, values[key]]),
  ) as Partial<AuditValues>;

const writeData = (input: GameInput): Prisma.GameUncheckedCreateInput => ({
  firstOpenedOn: new Date(`${input.firstOpened.date}T00:00:00.000Z`),
  firstOpenedPrecision: input.firstOpened.precision,
  isActive: input.isActive,
  name: input.name,
  normalizedName: normalizeSearchText(input.name),
  shortName: input.shortName,
});

const audit = async (
  transaction: Prisma.TransactionClient,
  input: {
    action: 'GAME_CREATE' | 'GAME_DELETE' | 'GAME_UPDATE';
    actorId: string;
    after: Partial<AuditValues> | null;
    before: Partial<AuditValues> | null;
    changes: readonly string[];
    description: string;
    game: Pick<GameItem, 'id' | 'name'>;
  },
): Promise<void> =>
  createAuditLogWithHeaders(
    {
      action: AuditAction[input.action],
      category: AuditCategory.GAME,
      description: input.description,
      metadata: {
        after: input.after,
        before: input.before,
        changes: input.changes,
        gameId: input.game.id,
        gameName: input.game.name,
        ...FEATURES.games.audit,
      },
      targetUserId: null,
      userId: input.actorId,
    },
    { client: transaction, required: true },
  );

/** Every game: the active ones in their order, then the inactive ones. */
const readGames = async (
  client: Prisma.TransactionClient,
): Promise<GameItem[]> =>
  (await client.game.findMany({ include: WITH_COUNTS }))
    .map(toGameItem)
    .sort(compareActiveThenRank);

export const listGames = (): Promise<GameItem[]> => readGames(prisma);

/** A game with its numbers of teams and functions, for its record. */
export const getGame = async (id: string): Promise<GameItem> => {
  const game = await prisma.game.findUnique({
    include: WITH_COUNTS,
    where: { id },
  });
  if (!game) throw gameMissing();

  return toGameItem(game);
};

/** Adds a game; its name is unique whatever the case or the accents. */
export const createGame = async (
  input: GameInput,
  { actor, session }: GameActor,
): Promise<GameItem> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      await authorizeUserAction(
        transaction,
        { actorId: actor.id, session },
        PERMISSIONS.GAMES.MANAGE,
      );
      const game = toGameItem(
        await transaction.game.create({
          data: {
            ...writeData(input),
            // Last of the list; its managers drag it higher if it matters more.
            position:
              ((await transaction.game.aggregate({ _max: { position: true } }))
                ._max.position ?? -1) + 1,
          },
          include: WITH_COUNTS,
        }),
      );
      const after = auditValues(game);
      await audit(transaction, {
        action: 'GAME_CREATE',
        actorId: actor.id,
        after,
        before: null,
        changes: Object.keys(after),
        description: `Jeu ajouté : ${game.name}`,
        game,
      });

      return game;
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) throw duplicateName();
    throw error;
  }
};

/**
 * Edits a game under optimistic versioning. Renaming corrects a typo: a game
 * that really changes becomes a new game (registre historique). An unchanged
 * form answers the current state without writing.
 */
export const updateGame = async (
  id: string,
  input: GameInput & { expectedVersion: number },
  { actor, session }: GameActor,
): Promise<GameItem> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      await authorizeUserAction(
        transaction,
        { actorId: actor.id, session },
        PERMISSIONS.GAMES.MANAGE,
      );
      const previous = await transaction.game.findUnique({
        include: WITH_COUNTS,
        where: { id },
      });
      if (!previous) throw gameMissing();
      if (previous.version !== input.expectedVersion) throw gameChanged();
      const current = toGameItem(previous);
      const before = auditValues(current);
      const after = auditValues(input);
      // The formatted date differs whenever the date or its precision does.
      const changes = changedKeys(before, after);
      if (changes.length === 0) return current;
      const result = await transaction.game.updateMany({
        data: { ...writeData(input), version: { increment: 1 } },
        where: { id, version: input.expectedVersion },
      });
      if (result.count !== 1) throw gameChanged();
      const game = toGameItem(
        await transaction.game.findUniqueOrThrow({
          include: WITH_COUNTS,
          where: { id },
        }),
      );
      await audit(transaction, {
        action: 'GAME_UPDATE',
        actorId: actor.id,
        after: pick(after, changes),
        before: pick(before, changes),
        changes,
        description: `Jeu modifié : ${game.name}`,
        game,
      });

      return game;
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) throw duplicateName();
    throw error;
  }
};

/**
 * Sets the order of the active games, or of the inactive ones, as their
 * managers dragged it (owner, 9 November 2026). The request names every game
 * of that state: one added, (de)activated in between refuses it.
 * The active and the inactive items rank apart, the inactive ones below;
 * both are ranked (owner, 9 November 2026: « un jeu inactif ne doit jamais
 * bloquer »).
 * One trace holds the order before and after; the order is not part of a
 * game's version. Answers every game, in the new order.
 */
export const reorderGames = async (
  { active, ids }: Readonly<{ active: boolean; ids: readonly string[] }>,
  { actor, session }: GameActor,
): Promise<GameItem[]> =>
  prisma.$transaction(async (transaction) => {
    await authorizeUserAction(
      transaction,
      { actorId: actor.id, session },
      PERMISSIONS.GAMES.MANAGE,
    );
    // One reorder at a time: the second waits, then reads the first.
    await transaction.$queryRaw`SELECT "id" FROM "Game" WHERE "isActive" = ${active} ORDER BY "id" FOR UPDATE`;
    const plan = planManualOrder(
      (await readGames(transaction)).filter((game) => game.isActive === active),
      ids,
    );
    if (!plan) throw gamesChanged();
    if (plan.changed) {
      for (const { id, position } of plan.moves)
        await transaction.game.update({ data: { position }, where: { id } });
      await createAuditLogWithHeaders(
        {
          action: AuditAction.GAME_REORDER,
          category: AuditCategory.GAME,
          description: active
            ? 'Ordre des jeux modifié'
            : 'Ordre des jeux inactifs modifié',
          metadata: {
            active,
            after: { order: plan.after },
            before: { order: plan.before },
            changes: ['order'],
            ...FEATURES.games.audit,
          },
          targetUserId: null,
          userId: actor.id,
        },
        { client: transaction, required: true },
      );
    }

    return readGames(transaction);
  });

/**
 * Deletes a game created by mistake. A game that has teams is refused here
 * with its count, and by the database (`Team_gameId_fkey`, `ON DELETE
 * RESTRICT`) if a team arrives in between: it is made inactive instead.
 * Without a team, none of its functions has served: they are removed with it,
 * explicitly and named in the trace (`MemberFunction_gameId_fkey` stays
 * RESTRICT, never CASCADE).
 */
export const deleteGame = async (
  id: string,
  expectedVersion: number,
  { actor, session }: GameActor,
): Promise<{ id: string }> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      await authorizeUserAction(
        transaction,
        { actorId: actor.id, session },
        PERMISSIONS.GAMES.MANAGE,
      );
      const previous = await transaction.game.findUnique({
        include: WITH_COUNTS,
        where: { id },
      });
      if (!previous) throw gameMissing();
      if (previous.version !== expectedVersion) throw gameChanged();
      if (previous._count.teams > 0) throw gameHasTeams(previous._count.teams);
      const functions = await transaction.memberFunction.findMany({
        orderBy: { name: 'asc' },
        select: { name: true },
        where: { gameId: id },
      });
      await transaction.memberFunction.deleteMany({ where: { gameId: id } });
      const result = await transaction.game.deleteMany({
        where: { id, version: expectedVersion },
      });
      if (result.count !== 1) throw gameChanged();
      const game = toGameItem(previous);
      const before = {
        ...auditValues(game),
        ...(functions.length
          ? { functions: functions.map(({ name }) => name).join(', ') }
          : {}),
      };
      await audit(transaction, {
        action: 'GAME_DELETE',
        actorId: actor.id,
        after: null,
        before,
        changes: Object.keys(before),
        description: `Jeu supprimé : ${game.name}`,
        game,
      });

      return { id };
    });
  } catch (error) {
    if (isPrismaForeignKeyError(error)) throw gameHasTeams(null);
    throw error;
  }
};
