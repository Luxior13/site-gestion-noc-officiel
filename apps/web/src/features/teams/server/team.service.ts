import 'server-only';

import type { Prisma } from '@prisma/client';
import { AuditAction, AuditCategory } from '@repo/database';

import { FEATURES } from '$constants/feature-registry.constants';
import { PERMISSIONS } from '$constants/permissions.constants';
import type { TeamPeopleCounts } from '$features/passages/passage.ui';
import { countPlacePeople } from '$features/passages/server/passage-counts';
import {
  isPrismaForeignKeyError,
  isPrismaUniqueConstraintError,
} from '$server/api-response';
import { createAuditLogWithHeaders } from '$server/audit-log';
import {
  assertCoversGame,
  assertIncludesTeam,
  authorizeEsportAction,
  type EsportScope,
  teamScopeWhere,
} from '$server/esport-scope';
import { planManualOrder } from '$server/manual-order';
import { prisma } from '$server/prisma';
import { ServiceError, serviceErrors } from '$server/service-error';
import { ErrorCode } from '$types/api.types';
import type { SessionType, UserType } from '$types/auth.types';
import { compareRank } from '$utils/active-order.utils';
import { formatApproximateDate } from '$utils/approximate-date.utils';
import { normalizeSearchText } from '$utils/search-text.utils';

import type {
  TeamDetail,
  TeamInput,
  TeamItem,
  TeamUpdateInput,
} from '../types/team.types';

export type TeamActor = Readonly<{
  actor: Pick<UserType, 'id'>;
  session: SessionType | null;
}>;

type AuditValues = Readonly<{
  founded: string;
  game: string;
  isActive: boolean;
  name: string;
}>;

type GameRef = TeamDetail['game'];

const DUPLICATE_NAME = 'Ce jeu a déjà une équipe de ce nom.';

const duplicateName = (): ServiceError =>
  new ServiceError(ErrorCode.CONFLICT, DUPLICATE_NAME, 409, {
    details: { name: [DUPLICATE_NAME] },
  });
const teamChanged = (): ServiceError =>
  serviceErrors.conflict(
    'Cette équipe a été modifiée entre-temps. Rechargez la liste avant de recommencer.',
  );
const teamMissing = (): ServiceError =>
  serviceErrors.notFound('Cette équipe n’existe plus. Rechargez la liste.');
/** A reorder names every active team of the game, as they are now. */
const teamsChanged = (): ServiceError =>
  serviceErrors.conflict(
    'Les équipes de ce jeu ont changé entre-temps. Elles sont rechargées : recommencez le déplacement.',
  );
const gameMissing = (): ServiceError =>
  serviceErrors.notFound('Ce jeu n’existe plus. Rechargez la liste.');
/** A team that has been used stays in the history: it is made inactive. */
const teamUsed = (): ServiceError =>
  serviceErrors.conflict(
    'Cette équipe a déjà servi : rendez-la inactive plutôt que de la supprimer.',
  );

const GAME_REF = { id: true, isActive: true, name: true } as const;
const WITH_GAME = {
  _count: { select: { passages: true } },
  game: { select: GAME_REF },
} as const;
type TeamRow = Prisma.TeamGetPayload<{ include: typeof WITH_GAME }>;

const toTeamItem = (team: Omit<TeamRow, '_count' | 'game'>): TeamItem => ({
  founded: {
    date: team.foundedOn.toISOString().slice(0, 10),
    precision: team.foundedPrecision,
  },
  gameId: team.gameId,
  id: team.id,
  isActive: team.isActive,
  name: team.name,
  position: team.position,
  updatedAt: team.updatedAt.toISOString(),
  version: team.version,
});

const toTeamDetail = (team: TeamRow, counts: TeamPeopleCounts): TeamDetail => ({
  ...toTeamItem(team),
  ...counts,
  game: team.game,
  passageCount: team._count.passages,
});

/** What the journal shows: the game by its name, the date as precisely as known. */
const auditValues = (
  team: TeamItem | TeamUpdateInput,
  game: GameRef,
): AuditValues => ({
  founded: formatApproximateDate(team.founded),
  game: game.name,
  isActive: team.isActive,
  name: team.name,
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

const editableData = (
  input: TeamUpdateInput,
): Omit<Prisma.TeamUncheckedCreateInput, 'gameId'> => ({
  foundedOn: new Date(`${input.founded.date}T00:00:00.000Z`),
  foundedPrecision: input.founded.precision,
  isActive: input.isActive,
  name: input.name,
  normalizedName: normalizeSearchText(input.name),
});

const findGame = async (
  transaction: Prisma.TransactionClient,
  id: string,
): Promise<GameRef> => {
  const game = await transaction.game.findUnique({
    select: GAME_REF,
    where: { id },
  });
  if (!game) throw gameMissing();

  return game;
};

const audit = async (
  transaction: Prisma.TransactionClient,
  input: {
    action: 'TEAM_CREATE' | 'TEAM_DELETE' | 'TEAM_UPDATE';
    actorId: string;
    after: Partial<AuditValues> | null;
    before: Partial<AuditValues> | null;
    changes: readonly string[];
    description: string;
    game: GameRef;
    team: Pick<TeamItem, 'id' | 'name'>;
  },
): Promise<void> =>
  createAuditLogWithHeaders(
    {
      action: AuditAction[input.action],
      category: AuditCategory.TEAM,
      description: input.description,
      metadata: {
        after: input.after,
        before: input.before,
        changes: input.changes,
        gameId: input.game.id,
        gameName: input.game.name,
        teamId: input.team.id,
        teamName: input.team.name,
        // Teams are managed on the Jeux page, under their game.
        ...FEATURES.games.audit,
      },
      targetUserId: null,
      userId: input.actorId,
    },
    { client: transaction, required: true },
  );

/**
 * Every team of the reader's Esport scope, in its game's dragged order; the
 * page groups them by game.
 */
export const listTeams = async (scope: EsportScope): Promise<TeamItem[]> =>
  (await prisma.team.findMany({ where: teamScopeWhere(scope) }))
    .map(toTeamItem)
    .sort(compareRank);

/**
 * A team with its game, for its record. Outside the reader's scope, it
 * answers as missing.
 */
export const getTeam = async (
  id: string,
  scope: EsportScope,
): Promise<TeamDetail> => {
  const team = await prisma.team.findFirst({
    include: WITH_GAME,
    // Both conditions: the scope's ids would be overwritten in one object.
    where: { AND: [teamScopeWhere(scope), { id }] },
  });
  if (!team) throw teamMissing();

  return toTeamDetail(team, await countPlacePeople(prisma, team.id));
};

/** Adds a team to a game; its name is unique within the game only. */
export const createTeam = async (
  input: TeamInput,
  { actor, session }: TeamActor,
): Promise<TeamDetail> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      // A new team joins the whole game: a scope of teams cannot add one.
      assertCoversGame(
        await authorizeEsportAction(
          transaction,
          { actorId: actor.id, session },
          PERMISSIONS.TEAMS.MANAGE,
        ),
        input.gameId,
        gameMissing,
      );
      const game = await findGame(transaction, input.gameId);
      const team = toTeamDetail(
        await transaction.team.create({
          data: {
            ...editableData(input),
            gameId: input.gameId,
            // Last of its game; its managers drag it higher if it matters more.
            position:
              ((
                await transaction.team.aggregate({
                  _max: { position: true },
                  where: { gameId: input.gameId },
                })
              )._max.position ?? -1) + 1,
          },
          include: WITH_GAME,
        }),
        // A new team has no passage yet.
        { formerCount: 0, memberCount: 0 },
      );
      const after = auditValues(team, game);
      await audit(transaction, {
        action: 'TEAM_CREATE',
        actorId: actor.id,
        after,
        before: null,
        changes: Object.keys(after),
        description: `Équipe ajoutée : ${team.name} (${game.name})`,
        game,
        team,
      });

      return team;
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) throw duplicateName();
    // The game was deleted between the check and the insert.
    if (isPrismaForeignKeyError(error)) throw gameMissing();
    throw error;
  }
};

/**
 * Edits a team under optimistic versioning. Renaming corrects a typo for now;
 * former names come with the team page. Its game never changes (the base
 * refuses it too, `Team_gameId_immutable`). An unchanged form answers the
 * current state without writing.
 */
export const updateTeam = async (
  id: string,
  input: TeamUpdateInput & { expectedVersion: number },
  { actor, session }: TeamActor,
): Promise<TeamDetail> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const scope = await authorizeEsportAction(
        transaction,
        { actorId: actor.id, session },
        PERMISSIONS.TEAMS.MANAGE,
      );
      const previous = await transaction.team.findUnique({
        include: WITH_GAME,
        where: { id },
      });
      if (!previous) throw teamMissing();
      assertIncludesTeam(scope, previous, teamMissing);
      if (previous.version !== input.expectedVersion) throw teamChanged();
      const current = toTeamItem(previous);
      const { game } = previous;
      const before = auditValues(current, game);
      const after = auditValues(input, game);
      // The formatted date differs whenever the date or its precision does.
      const changes = changedKeys(before, after);
      if (changes.length === 0)
        return toTeamDetail(previous, await countPlacePeople(transaction, id));
      const result = await transaction.team.updateMany({
        data: { ...editableData(input), version: { increment: 1 } },
        where: { id, version: input.expectedVersion },
      });
      if (result.count !== 1) throw teamChanged();
      const team = toTeamDetail(
        await transaction.team.findUniqueOrThrow({
          include: WITH_GAME,
          where: { id },
        }),
        await countPlacePeople(transaction, id),
      );
      await audit(transaction, {
        action: 'TEAM_UPDATE',
        actorId: actor.id,
        after: pick(after, changes),
        before: pick(before, changes),
        changes,
        description: `Équipe modifiée : ${team.name} (${game.name})`,
        game,
        team,
      });

      return team;
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) throw duplicateName();
    throw error;
  }
};

/**
 * Sets the order of a game's teams, as their managers dragged it (owner,
 * 9 November 2026). The request names every team of the game: one added or
 * deleted in between refuses it.
 * One order for every item of the list, active or not: an inactive item
 * never blocks (owner, 9 November 2026).
 * One trace holds the order before and after. Answers every team of the
 * game, in the new order.
 */
export const reorderTeams = async (
  gameId: string,
  ids: readonly string[],
  { actor, session }: TeamActor,
): Promise<TeamItem[]> =>
  prisma.$transaction(async (transaction) => {
    // The order names every team of the game: it needs the whole game.
    assertCoversGame(
      await authorizeEsportAction(
        transaction,
        { actorId: actor.id, session },
        PERMISSIONS.TEAMS.MANAGE,
      ),
      gameId,
      gameMissing,
    );
    const game = await findGame(transaction, gameId);
    // One reorder of a game's teams at a time.
    await transaction.$queryRaw`SELECT "id" FROM "Team" WHERE "gameId" = ${gameId} ORDER BY "id" FOR UPDATE`;
    const read = async (): Promise<TeamItem[]> =>
      (await transaction.team.findMany({ where: { gameId } }))
        .map(toTeamItem)
        .sort(compareRank);
    const plan = planManualOrder(await read(), ids);
    if (!plan) throw teamsChanged();
    if (plan.changed) {
      for (const { id, position } of plan.moves)
        await transaction.team.update({ data: { position }, where: { id } });
      await createAuditLogWithHeaders(
        {
          action: AuditAction.TEAM_REORDER,
          category: AuditCategory.TEAM,
          description: `Ordre des équipes modifié : ${game.name}`,
          metadata: {
            after: { order: plan.after },
            before: { order: plan.before },
            changes: ['order'],
            gameId: game.id,
            gameName: game.name,
            ...FEATURES.games.audit,
          },
          targetUserId: null,
          userId: actor.id,
        },
        { client: transaction, required: true },
      );
    }

    return read();
  });

/**
 * Deletes a team created by mistake. Nothing references a team yet; the
 * roster will, with `ON DELETE RESTRICT`, and a team that has been used is
 * then refused here: it is made inactive instead.
 */
export const deleteTeam = async (
  id: string,
  expectedVersion: number,
  { actor, session }: TeamActor,
): Promise<{ id: string }> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const scope = await authorizeEsportAction(
        transaction,
        { actorId: actor.id, session },
        PERMISSIONS.TEAMS.MANAGE,
      );
      const previous = await transaction.team.findUnique({
        include: WITH_GAME,
        where: { id },
      });
      if (!previous) throw teamMissing();
      assertIncludesTeam(scope, previous, teamMissing);
      if (previous.version !== expectedVersion) throw teamChanged();
      const result = await transaction.team.deleteMany({
        where: { id, version: expectedVersion },
      });
      if (result.count !== 1) throw teamChanged();
      const team = toTeamItem(previous);
      const before = auditValues(team, previous.game);
      await audit(transaction, {
        action: 'TEAM_DELETE',
        actorId: actor.id,
        after: null,
        before,
        changes: Object.keys(before),
        description: `Équipe supprimée : ${team.name} (${previous.game.name})`,
        game: previous.game,
        team,
      });

      return { id };
    });
  } catch (error) {
    if (isPrismaForeignKeyError(error)) throw teamUsed();
    throw error;
  }
};
