import 'server-only';

import type { Prisma } from '@prisma/client';
import { AuditAction, AuditCategory, type Game } from '@repo/database';

import { FEATURES } from '$constants/feature-registry.constants';
import { PERMISSIONS } from '$constants/permissions.constants';
import { isPrismaUniqueConstraintError } from '$server/api-response';
import { createAuditLogWithHeaders } from '$server/audit-log';
import { prisma } from '$server/prisma';
import { ServiceError, serviceErrors } from '$server/service-error';
import { authorizeUserAction } from '$server/user-action-authorization';
import { ErrorCode } from '$types/api.types';
import type { SessionType, UserType } from '$types/auth.types';
import { normalizeSearchText } from '$utils/search-text.utils';

import { formatApproximateDate } from '../game-date.utils';
import { compareGames } from '../game-order.utils';
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
const gameMissing = (): ServiceError =>
  serviceErrors.notFound('Ce jeu n’existe plus. Rechargez la liste.');

const toGameItem = (game: Game): GameItem => ({
  firstOpened: {
    date: game.firstOpenedOn.toISOString().slice(0, 10),
    precision: game.firstOpenedPrecision,
  },
  id: game.id,
  isActive: game.isActive,
  name: game.name,
  shortName: game.shortName,
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

/** Every game, active ones first: the list stays short (one section per game). */
export const listGames = async (): Promise<GameItem[]> =>
  (await prisma.game.findMany()).map(toGameItem).sort(compareGames);

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
        await transaction.game.create({ data: writeData(input) }),
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
      const previous = await transaction.game.findUnique({ where: { id } });
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
        await transaction.game.findUniqueOrThrow({ where: { id } }),
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
 * Deletes a game created by mistake. Nothing references a game yet; teams,
 * players and tournaments will, and the database will then refuse to delete
 * a game that has been used (it is made inactive instead).
 */
export const deleteGame = async (
  id: string,
  expectedVersion: number,
  { actor, session }: GameActor,
): Promise<{ id: string }> =>
  prisma.$transaction(async (transaction) => {
    await authorizeUserAction(
      transaction,
      { actorId: actor.id, session },
      PERMISSIONS.GAMES.MANAGE,
    );
    const previous = await transaction.game.findUnique({ where: { id } });
    if (!previous) throw gameMissing();
    if (previous.version !== expectedVersion) throw gameChanged();
    const result = await transaction.game.deleteMany({
      where: { id, version: expectedVersion },
    });
    if (result.count !== 1) throw gameChanged();
    const game = toGameItem(previous);
    const before = auditValues(game);
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
