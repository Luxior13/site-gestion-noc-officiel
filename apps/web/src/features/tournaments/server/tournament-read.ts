import 'server-only';

import type { Prisma } from '@prisma/client';

import { passageToday } from '$features/passages/server/passage-today';
import type { EsportScope } from '$server/esport-scope';
import { prisma } from '$server/prisma';
import { type ServiceError, serviceErrors } from '$server/service-error';

import { tournamentPeriod } from '../tournament.ui';
import type {
  TournamentChoices,
  TournamentDetail,
  TournamentEntryItem,
  TournamentItem,
} from '../types/tournament.types';

export const tournamentMissing = (): ServiceError =>
  serviceErrors.notFound('Ce tournoi n’existe plus. Rechargez la liste.');

/** YYYY-MM-DD of a `DATE` column. */
export const dayOf = (value: Date): string => value.toISOString().slice(0, 10);
export const asDay = (day: string): Date => new Date(`${day}T00:00:00.000Z`);
const dayOrNull = (value: Date | null): string | null =>
  value ? dayOf(value) : null;
/** Only DAY and MONTH are stored (`Tournament_dates_check`). */
export const precisionOf = (value: string): 'DAY' | 'MONTH' =>
  value === 'MONTH' ? 'MONTH' : 'DAY';

/**
 * The days a person counts in a team for a tournament: its known period,
 * its month, or today while it has no date (12 November 2026).
 */
const rosterWindow = (
  row: Readonly<{
    datePrecision: string;
    endOn: Date | null;
    startOn: Date | null;
  }>,
): { endOn: Date; startOn: Date } => {
  const period = tournamentPeriod({
    datePrecision: precisionOf(row.datePrecision),
    endOn: dayOrNull(row.endOn),
    startOn: dayOrNull(row.startOn),
  });
  const today = passageToday();

  return {
    endOn: asDay(period?.to ?? today),
    startOn: asDay(period?.from ?? today),
  };
};

/**
 * The tournaments of the scope (11 November 2026): every one, those of the
 * chosen games, or those where a chosen team is engaged.
 */
export const tournamentScopeWhere = (
  scope: EsportScope,
): Prisma.TournamentWhereInput =>
  scope.kind === 'ALL'
    ? {}
    : scope.kind === 'GAMES'
      ? { gameId: { in: [...scope.ids] } }
      : { entries: { some: { teamId: { in: [...scope.ids] } } } };

/** The engaged teams of the scope: a scope of teams sees only its own. */
const entryScopeWhere = (
  scope: EsportScope,
): Prisma.TournamentEntryWhereInput =>
  scope.kind === 'TEAMS' ? { teamId: { in: [...scope.ids] } } : {};

const TEAM_REF = { id: true, isActive: true, name: true } as const;
const NAMED = { id: true, name: true } as const;

/* eslint-disable @typescript-eslint/explicit-function-return-type -- its
   literal type gives the rows' type: no wider return type. */
const itemInclude = (
  scope: EsportScope,
  entryWhere: Prisma.TournamentEntryWhereInput = {},
) =>
  ({
    entries: {
      include: { team: { select: TEAM_REF } },
      orderBy: [{ team: { position: 'asc' } }, { team: { name: 'asc' } }],
      where: { AND: [entryScopeWhere(scope), entryWhere] },
    },
    game: { select: NAMED },
    organizer: { select: NAMED },
  }) satisfies Prisma.TournamentInclude;
/* eslint-enable @typescript-eslint/explicit-function-return-type */

type ItemRow = Prisma.TournamentGetPayload<{
  include: ReturnType<typeof itemInclude>;
}>;

const toItem = (row: ItemRow): TournamentItem => ({
  datePrecision: precisionOf(row.datePrecision),
  edition: row.edition,
  endOn: dayOrNull(row.endOn),
  entries: row.entries.map((entry) => ({
    id: entry.id,
    placementFrom: entry.placementFrom,
    placementTo: entry.placementTo,
    team: entry.team,
  })),
  format: row.format,
  game: row.game,
  id: row.id,
  isCancelled: row.isCancelled,
  location: row.location,
  name: row.name,
  organizer: row.organizer,
  startOn: dayOrNull(row.startOn),
});

/** A tournament with its engaged teams and their placement. */
export const readTournamentDetail = async (
  client: Prisma.TransactionClient,
  id: string,
  scope: EsportScope,
): Promise<TournamentDetail> => {
  const row = await client.tournament.findFirst({
    include: {
      _count: { select: { operations: true } },
      entries: {
        include: { team: { select: TEAM_REF } },
        orderBy: [{ team: { position: 'asc' } }, { team: { name: 'asc' } }],
        where: entryScopeWhere(scope),
      },
      game: { select: NAMED },
      organizer: { select: NAMED },
    },
    where: { AND: [{ id }, tournamentScopeWhere(scope)] },
  });
  if (!row) throw tournamentMissing();
  const entries: TournamentEntryItem[] = row.entries.map((entry) => ({
    id: entry.id,
    placementFrom: entry.placementFrom,
    placementTo: entry.placementTo,
    team: entry.team,
    version: entry.version,
  }));

  return {
    ...toItem({ ...row, entries: [] }),
    entries,
    entryFeeCents: row.entryFeeCents,
    linkUrl: row.linkUrl,
    operationCount: row._count.operations,
    registrationDeadlineOn: dayOrNull(row.registrationDeadlineOn),
    updatedAt: row.updatedAt.toISOString(),
    version: row.version,
  };
};

const LIST_ORDER = [
  // Undated first: they are to be scheduled.
  { startOn: { nulls: 'first', sort: 'desc' } },
  { name: 'asc' },
  { id: 'asc' },
] satisfies Prisma.TournamentOrderByWithRelationInput[];

/**
 * A person's tournaments (13 November 2026, no line-up kept): those where a
 * team was engaged while the person had a passage in it, at the
 * tournament's dates (its month, or today without a date). Only the lines
 * of those teams.
 */
const listPersonTournaments = async (
  scope: EsportScope,
  personId: string,
): Promise<TournamentItem[]> => {
  const passages = await prisma.personPassage.findMany({
    select: { endOn: true, startOn: true, teamId: true },
    where: { personId, teamId: { not: null } },
  });
  const teamIds = [
    ...new Set(passages.flatMap((passage) => passage.teamId ?? [])),
  ];
  if (teamIds.length === 0) return [];
  const rows = await prisma.tournament.findMany({
    include: itemInclude(scope, { teamId: { in: teamIds } }),
    orderBy: LIST_ORDER,
    where: {
      AND: [
        tournamentScopeWhere(scope),
        {
          entries: {
            some: {
              AND: [entryScopeWhere(scope), { teamId: { in: teamIds } }],
            },
          },
        },
      ],
    },
  });

  return rows.flatMap((row) => {
    const window = rosterWindow(row);
    const entries = row.entries.filter((entry) =>
      passages.some(
        (passage) =>
          passage.teamId === entry.teamId &&
          passage.startOn <= window.endOn &&
          (passage.endOn === null || passage.endOn >= window.startOn),
      ),
    );

    return entries.length > 0 ? [toItem({ ...row, entries })] : [];
  });
};

/**
 * The tournaments of the scope, the latest first: a few hundred over the
 * years, filtered on the page. For a team's record, those it played; for a
 * person's Parcours, those of the teams they were in at the time.
 */
export const listTournaments = async (
  scope: EsportScope,
  filters: Readonly<{ personId?: string; teamId?: string }> = {},
): Promise<TournamentItem[]> => {
  if (filters.personId) return listPersonTournaments(scope, filters.personId);
  // A team's record shows the line it concerns.
  const entryWhere: Prisma.TournamentEntryWhereInput = filters.teamId
    ? { teamId: filters.teamId }
    : {};
  const rows = await prisma.tournament.findMany({
    include: itemInclude(scope, entryWhere),
    orderBy: LIST_ORDER,
    where: {
      AND: [
        tournamentScopeWhere(scope),
        filters.teamId
          ? {
              entries: {
                some: { AND: [entryScopeWhere(scope), entryWhere] },
              },
            }
          : {},
      ],
    },
  });

  return rows.map(toItem);
};

export const getTournament = (
  id: string,
  scope: EsportScope,
): Promise<TournamentDetail> => readTournamentDetail(prisma, id, scope);

/**
 * What the windows propose: the games and teams of the scope, active first
 * in their order, and the organisations of kind Organisateur.
 */
export const getTournamentChoices = async (
  scope: EsportScope,
): Promise<TournamentChoices> => {
  const [games, organizers] = await Promise.all([
    prisma.game.findMany({
      include: {
        teams: {
          orderBy: [{ isActive: 'desc' }, { position: 'asc' }, { name: 'asc' }],
          select: TEAM_REF,
          where: scope.kind === 'TEAMS' ? { id: { in: [...scope.ids] } } : {},
        },
      },
      orderBy: [{ isActive: 'desc' }, { position: 'asc' }, { name: 'asc' }],
      where:
        scope.kind === 'ALL'
          ? {}
          : scope.kind === 'GAMES'
            ? { id: { in: [...scope.ids] } }
            : { teams: { some: { id: { in: [...scope.ids] } } } },
    }),
    prisma.organization.findMany({
      orderBy: [{ normalizedName: 'asc' }, { id: 'asc' }],
      select: NAMED,
      where: { kinds: { has: 'ORGANIZER' } },
    }),
  ]);

  return {
    games: games.map((game) => ({
      id: game.id,
      isActive: game.isActive,
      name: game.name,
      teams: game.teams,
    })),
    organizers,
  };
};
