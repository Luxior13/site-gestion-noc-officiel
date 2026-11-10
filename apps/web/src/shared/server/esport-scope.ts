import 'server-only';

import type { Prisma } from '@prisma/client';

import type { EsportScopeKind } from '$constants/esport-scope.constants';
import { prisma } from '$server/prisma';
import { type ServiceError, serviceErrors } from '$server/service-error';
import {
  authorizeUserAction,
  type UserActionAuthority,
} from '$server/user-action-authorization';

/**
 * The Esport scope of the account at hand (owner, 10 November 2026): every
 * game, chosen games with all their teams, or chosen teams. Read again at each
 * request and inside each guarded mutation, so a change applies at the
 * account's next action. Something outside the scope answers as missing: the
 * account learns nothing of it.
 */
export type EsportScope = Readonly<{
  /** The games (`GAMES`) or the teams (`TEAMS`) chosen; empty for `ALL`. */
  ids: ReadonlySet<string>;
  kind: EsportScopeKind;
}>;

export const FULL_ESPORT_SCOPE: EsportScope = { ids: new Set(), kind: 'ALL' };

/** Reaches nothing: an account that can no longer be read. */
const NO_ESPORT_SCOPE: EsportScope = { ids: new Set(), kind: 'TEAMS' };

/**
 * Reads an account's scope. Inside a mutation, call it after
 * `authorizeUserAction`, whose lock on the account keeps a scope change from
 * passing in between.
 */
export const readEsportScope = async (
  client: Prisma.TransactionClient,
  account: Readonly<{ id: string }>,
): Promise<EsportScope> => {
  const user = await client.user.findUnique({
    select: { esportScope: true },
    where: { id: account.id },
  });
  if (!user) return NO_ESPORT_SCOPE;
  if (user.esportScope === 'ALL') return FULL_ESPORT_SCOPE;
  const items = await client.userEsportScopeItem.findMany({
    select: { gameId: true, teamId: true },
    where: { userId: account.id },
  });

  return {
    ids: new Set(
      items.flatMap(({ gameId, teamId }) => {
        // Only the rows of the scope's kind count.
        const id = user.esportScope === 'GAMES' ? gameId : teamId;

        return id ? [id] : [];
      }),
    ),
    kind: user.esportScope,
  };
};

/** The scope of the request's account, for a read. */
export const readActorEsportScope = (
  account: Readonly<{ id: string }>,
): Promise<EsportScope> => readEsportScope(prisma, account);

/** The teams of the scope, to add to a team query. */
export const teamScopeWhere = (scope: EsportScope): Prisma.TeamWhereInput =>
  scope.kind === 'ALL'
    ? {}
    : scope.kind === 'GAMES'
      ? { gameId: { in: [...scope.ids] } }
      : { id: { in: [...scope.ids] } };

/** The games of the scope: chosen, or holding a chosen team. */
export const gameScopeWhere = (scope: EsportScope): Prisma.GameWhereInput =>
  scope.kind === 'ALL'
    ? {}
    : scope.kind === 'GAMES'
      ? { id: { in: [...scope.ids] } }
      : { teams: { some: { id: { in: [...scope.ids] } } } };

export const includesTeam = (
  scope: EsportScope,
  team: Readonly<{ gameId: string; id: string }>,
): boolean =>
  scope.kind === 'ALL' ||
  (scope.kind === 'GAMES'
    ? scope.ids.has(team.gameId)
    : scope.ids.has(team.id));

/**
 * The whole game is in the scope: what concerns all its teams (its record,
 * its functions, a new team, their order) needs it.
 */
export const coversGame = (scope: EsportScope, gameId: string): boolean =>
  scope.kind === 'ALL' || (scope.kind === 'GAMES' && scope.ids.has(gameId));

const wholeGameNeeded = (): ServiceError =>
  serviceErrors.forbidden(
    'Seul un compte qui voit tout ce jeu peut faire cette action.',
  );

/**
 * Refuses an action on a whole game outside the scope. A game not chosen
 * answers as missing; a scope of teams never covers a whole game, and says so
 * whatever the game, so the answer reveals nothing.
 */
export const assertCoversGame = (
  scope: EsportScope,
  gameId: string,
  missing: () => ServiceError,
): void => {
  if (coversGame(scope, gameId)) return;
  throw scope.kind === 'TEAMS' ? wholeGameNeeded() : missing();
};

/** Refuses a team outside the scope, as if it did not exist. */
export const assertIncludesTeam = (
  scope: EsportScope,
  team: Readonly<{ gameId: string; id: string }>,
  missing: () => ServiceError,
): void => {
  if (!includesTeam(scope, team)) throw missing();
};

/** Adding a game or ordering them concerns every game. */
export const assertAllGames = (scope: EsportScope): void => {
  if (scope.kind !== 'ALL')
    throw serviceErrors.forbidden(
      'Seul un compte qui voit tous les jeux peut faire cette action.',
    );
};

/**
 * `authorizeUserAction` for an Esport mutation, then the actor's scope, read
 * under the lock it holds on the account.
 */
export const authorizeEsportAction = async (
  transaction: Prisma.TransactionClient,
  authority: UserActionAuthority,
  permission: string,
): Promise<EsportScope> => {
  await authorizeUserAction(transaction, authority, permission);

  return readEsportScope(transaction, { id: authority.actorId });
};
