import 'server-only';

import type { Prisma } from '@prisma/client';

import {
  ESPORT_SCOPE_LABELS,
  type EsportScopeKind,
  type EsportScopeValue,
  FULL_ESPORT_SCOPE_VALUE,
  normalizeEsportScope,
  sameEsportScope,
} from '$constants/esport-scope.constants';
import { hasPermission, PERMISSIONS } from '$constants/permissions.constants';
import { assertPermission } from '$server/api-auth';
import { readEsportScope } from '$server/esport-scope';
import { prisma } from '$server/prisma';
import { serviceErrors } from '$server/service-error';
import type { UserType } from '$types/auth.types';

/**
 * The Esport scope of an account in its authorizations (owner, 10 November
 * 2026): every game, chosen games or chosen teams. Its own rules: who may
 * change it, what an administrator keeps, how the journal says it.
 */
export const ESPORT_SCOPE_SELECT = {
  esportScope: true,
  esportScopeItems: { select: { gameId: true, teamId: true } },
} as const satisfies Prisma.UserSelect;

type StoredScope = Readonly<{
  esportScope?: EsportScopeKind;
  esportScopeItems?: readonly Readonly<{
    gameId: string | null;
    teamId: string | null;
  }>[];
}>;

/** An account read without its scope is taken at the column's default. */
export const storedEsportScope = (user: StoredScope): EsportScopeValue => {
  const items = user.esportScopeItems ?? [];

  return normalizeEsportScope({
    gameIds: items.flatMap(({ gameId }) => (gameId ? [gameId] : [])),
    kind: user.esportScope ?? 'ALL',
    teamIds: items.flatMap(({ teamId }) => (teamId ? [teamId] : [])),
  });
};

/** Who reads an account's scope: who reads its access, and the account. */
export const canReadEsportScope = (
  actor: UserType,
  targetId: string,
): boolean =>
  actor.isProtected ||
  actor.id === targetId ||
  hasPermission(actor.role, PERMISSIONS.USERS.VIEW_ACCESS, actor.permissions);

const ownScopeRefusal = (): Error =>
  serviceErrors.forbidden(
    'Seul un compte qui voit tous les jeux peut choisir les jeux et équipes visibles d’un autre compte.',
  );

/**
 * Changing a scope can open and close access at once: it needs both rights,
 * and an actor who sees every game, so no one widens a scope beyond their own.
 * Never on one's own account. Throws the refusal.
 */
export const assertEsportScopeAuthority = (
  actor: UserType,
  targetId: string,
): void => {
  if (targetId === actor.id)
    throw serviceErrors.forbidden(
      'Vous ne pouvez pas modifier vos propres autorisations',
    );
  if (actor.isProtected) return;
  assertPermission(actor, PERMISSIONS.USERS.GRANT_ACCESS);
  assertPermission(actor, PERMISSIONS.USERS.REVOKE_ACCESS);
  if ((actor.esportScope ?? 'ALL') !== 'ALL') throw ownScopeRefusal();
};

/** The same, under the lock of the update: the actor's scope read again. */
export const assertActorSeesEveryGame = async (
  transaction: Prisma.TransactionClient,
  actorId: string,
): Promise<void> => {
  if ((await readEsportScope(transaction, { id: actorId })).kind !== 'ALL')
    throw ownScopeRefusal();
};

/** Refuses a chosen game or team that no longer exists. */
export const assertEsportScopeTargets = async (
  value: EsportScopeValue,
): Promise<void> => {
  const found =
    value.kind === 'GAMES'
      ? await prisma.game.count({ where: { id: { in: [...value.gameIds] } } })
      : value.kind === 'TEAMS'
        ? await prisma.team.count({
            where: { id: { in: [...value.teamIds] } },
          })
        : 0;
  const expected =
    value.kind === 'GAMES'
      ? value.gameIds.length
      : value.kind === 'TEAMS'
        ? value.teamIds.length
        : 0;
  if (found !== expected)
    throw serviceErrors.validation(
      'Un jeu ou une équipe choisi n’existe plus. Rechargez la fiche.',
    );
};

export type EsportScopeChange = Readonly<{
  after: EsportScopeValue;
  before: EsportScopeValue;
}>;

/**
 * The scope after the update: an administrator always sees every game
 * (`User_esportScope_admin_check`), a promotion resets it. Null when nothing
 * changes. Throws a restricted scope asked for an administrator.
 */
export const resolveEsportScopeChange = (
  existing: StoredScope,
  requested: EsportScopeValue | undefined,
  resultingRole: UserType['role'],
): EsportScopeChange | null => {
  const before = storedEsportScope(existing);
  if (
    resultingRole === 'ADMIN' &&
    requested &&
    requested.kind !== FULL_ESPORT_SCOPE_VALUE.kind
  )
    throw serviceErrors.validation(
      'Un administrateur voit toujours tous les jeux et toutes les équipes.',
    );
  const after =
    resultingRole === 'ADMIN'
      ? FULL_ESPORT_SCOPE_VALUE
      : normalizeEsportScope(requested ?? before);

  return sameEsportScope(before, after) ? null : { after, before };
};

export type EsportScopeRows = Readonly<{
  items: readonly Readonly<{ gameId?: string; teamId?: string }>[];
  kind: EsportScopeKind;
}>;

/** The kind and the rows that replace an account's scope. */
export const esportScopeRows = (value: EsportScopeValue): EsportScopeRows => ({
  items: [
    ...value.gameIds.map((gameId) => ({ gameId })),
    ...value.teamIds.map((teamId) => ({ teamId })),
  ],
  kind: value.kind,
});

/**
 * Replaces an account's chosen games or teams, inside its update. Explicit
 * statements: a nested write would run its delete after its create.
 */
export const replaceEsportScopeItems = async (
  transaction: Prisma.TransactionClient,
  userId: string,
  items: EsportScopeRows['items'],
): Promise<void> => {
  await transaction.userEsportScopeItem.deleteMany({ where: { userId } });
  if (items.length > 0)
    await transaction.userEsportScopeItem.createMany({
      data: items.map((item) => ({ ...item, userId })),
    });
};

const joinNames = (names: readonly string[]): string =>
  names.length === 0 ? 'aucun' : names.join(', ');

/**
 * The scope in words, as the journal keeps it: « Tous les jeux »,
 * « Jeux : Valorant, Rocket League », « Équipes : Academy (Valorant) ».
 * Names are read when the change is made.
 */
export const describeEsportScope = async (
  value: EsportScopeValue,
): Promise<string> => {
  if (value.kind === 'ALL') return ESPORT_SCOPE_LABELS.ALL;
  if (value.kind === 'GAMES') {
    const games = await prisma.game.findMany({
      orderBy: { name: 'asc' },
      select: { name: true },
      where: { id: { in: [...value.gameIds] } },
    });

    return `Jeux : ${joinNames(games.map(({ name }) => name))}`;
  }
  const teams = await prisma.team.findMany({
    orderBy: [{ game: { name: 'asc' } }, { name: 'asc' }],
    select: { game: { select: { name: true } }, name: true },
    where: { id: { in: [...value.teamIds] } },
  });

  return `Équipes : ${joinNames(teams.map(({ game, name }) => `${name} (${game.name})`))}`;
};
