import 'server-only';

import type { Prisma } from '@prisma/client';

import { passageToday } from '$features/passages/server/passage-today';
import {
  PERSON_REF_SELECT,
  toPersonRef,
} from '$features/persons/server/person-suggestions';
import type { EsportScope } from '$server/esport-scope';
import { prisma } from '$server/prisma';
import { type ServiceError, serviceErrors } from '$server/service-error';

import { tournamentPeriod } from '../tournament.ui';
import type {
  TournamentChoices,
  TournamentDetail,
  TournamentEntryItem,
  TournamentItem,
  TournamentLineupCandidate,
  TournamentLineupMemberItem,
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
 * The days a line-up is read in the Roster: the tournament's known period,
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

const PERSON_SELECT = { ...PERSON_REF_SELECT, sortName: true } as const;
type PersonRow = Prisma.PersonGetPayload<{ select: typeof PERSON_SELECT }>;
type FunctionRow = Readonly<{
  kind: 'BOARD' | 'PLAYER' | 'STAFF';
  name: string;
  position: number;
}>;

/** Players first, then staff, each in the order of the game's functions. */
const functionRank = (row: FunctionRow | null): [number, number, string] =>
  row ? [row.kind === 'PLAYER' ? 0 : 1, row.position, row.name] : [2, 0, ''];

const compareMembers = (
  left: { fn: FunctionRow | null; person: PersonRow },
  right: { fn: FunctionRow | null; person: PersonRow },
): number => {
  const [a, b] = [functionRank(left.fn), functionRank(right.fn)];

  return (
    a[0] - b[0] ||
    a[1] - b[1] ||
    a[2].localeCompare(b[2], 'fr') ||
    left.person.sortName.localeCompare(right.person.sortName, 'fr')
  );
};

const toMember = (
  fn: FunctionRow | null,
  person: PersonRow,
): TournamentLineupMemberItem => ({
  function: fn && fn.kind !== 'BOARD' ? { kind: fn.kind, name: fn.name } : null,
  person: toPersonRef(person),
});

/**
 * The functions held in the teams' Rosters during the tournament: a passage
 * begun before its end and not ended before its start. One per person and
 * team, the first in the game's order.
 */
const readRosterFunctions = async (
  client: Prisma.TransactionClient,
  where: Readonly<{
    endOn: Date;
    personIds?: readonly string[];
    startOn: Date;
    teamIds: readonly string[];
  }>,
): Promise<
  Map<string, { fn: FunctionRow; person: PersonRow; teamId: string }>
> => {
  const passages = await client.personPassage.findMany({
    include: {
      memberFunction: { select: { kind: true, name: true, position: true } },
      person: { select: PERSON_SELECT },
    },
    where: {
      OR: [{ endOn: null }, { endOn: { gte: where.startOn } }],
      startOn: { lte: where.endOn },
      teamId: { in: [...where.teamIds] },
      ...(where.personIds ? { personId: { in: [...where.personIds] } } : {}),
    },
  });
  const best = new Map<
    string,
    { fn: FunctionRow; person: PersonRow; teamId: string }
  >();
  for (const passage of passages) {
    const key = `${passage.teamId ?? ''}:${passage.personId}`;
    const current = best.get(key);
    const next = {
      fn: passage.memberFunction,
      person: passage.person,
      teamId: passage.teamId ?? '',
    };
    if (!current || compareMembers(next, current) < 0) best.set(key, next);
  }

  return best;
};

/** A tournament with its engaged teams, their line-up and placement. */
export const readTournamentDetail = async (
  client: Prisma.TransactionClient,
  id: string,
  scope: EsportScope,
): Promise<TournamentDetail> => {
  const row = await client.tournament.findFirst({
    include: {
      _count: { select: { operations: true } },
      entries: {
        include: {
          lineup: { include: { person: { select: PERSON_SELECT } } },
          team: { select: TEAM_REF },
        },
        orderBy: [{ team: { position: 'asc' } }, { team: { name: 'asc' } }],
        where: entryScopeWhere(scope),
      },
      game: { select: NAMED },
      organizer: { select: NAMED },
    },
    where: { AND: [{ id }, tournamentScopeWhere(scope)] },
  });
  if (!row) throw tournamentMissing();
  const functions = await readRosterFunctions(client, {
    ...rosterWindow(row),
    personIds: row.entries.flatMap((entry) =>
      entry.lineup.map((member) => member.personId),
    ),
    teamIds: row.entries.map((entry) => entry.teamId),
  });
  const entries: TournamentEntryItem[] = row.entries.map((entry) => ({
    id: entry.id,
    lineup: entry.lineup
      .map((member) => ({
        fn: functions.get(`${entry.teamId}:${member.personId}`)?.fn ?? null,
        person: member.person,
      }))
      .sort(compareMembers)
      .map(({ fn, person }) => toMember(fn, person)),
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

/**
 * The tournaments of the scope, the latest first: a few hundred over the
 * years, filtered on the page. For a team's record, those it played; for a
 * person's Parcours, those whose line-up holds them.
 */
export const listTournaments = async (
  scope: EsportScope,
  filters: Readonly<{ personId?: string; teamId?: string }> = {},
): Promise<TournamentItem[]> => {
  // A team's record, or a person's Parcours, shows the line it concerns.
  const entryWhere: Prisma.TournamentEntryWhereInput = {
    ...(filters.teamId ? { teamId: filters.teamId } : {}),
    ...(filters.personId
      ? { lineup: { some: { personId: filters.personId } } }
      : {}),
  };
  const rows = await prisma.tournament.findMany({
    include: itemInclude(scope, entryWhere),
    // Undated first: they are to be scheduled.
    orderBy: [
      { startOn: { nulls: 'first', sort: 'desc' } },
      { name: 'asc' },
      { id: 'asc' },
    ],
    where: {
      AND: [
        tournamentScopeWhere(scope),
        filters.teamId || filters.personId
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

/**
 * The members of a team's Roster during the tournament, to choose its
 * line-up: one line per person, players first in the game's order.
 */
export const getLineupCandidates = async (
  tournamentId: string,
  teamId: string,
  scope: EsportScope,
): Promise<TournamentLineupCandidate[]> => {
  const tournament = await prisma.tournament.findFirst({
    select: { datePrecision: true, endOn: true, gameId: true, startOn: true },
    where: { AND: [{ id: tournamentId }, tournamentScopeWhere(scope)] },
  });
  if (!tournament) throw tournamentMissing();
  const team = await prisma.team.findFirst({
    select: { gameId: true, id: true },
    where: { gameId: tournament.gameId, id: teamId },
  });
  if (
    !team ||
    (scope.kind === 'TEAMS' && !scope.ids.has(team.id)) ||
    (scope.kind === 'GAMES' && !scope.ids.has(team.gameId))
  )
    throw serviceErrors.notFound('Cette équipe n’existe plus.');
  const functions = await readRosterFunctions(prisma, {
    ...rosterWindow(tournament),
    teamIds: [teamId],
  });

  return [...functions.values()]
    .sort(compareMembers)
    .map(({ fn, person }) => toMember(fn, person));
};
