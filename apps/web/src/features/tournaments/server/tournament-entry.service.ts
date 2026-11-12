import 'server-only';

import type { Prisma } from '@prisma/client';

import { getPersonDisplayName } from '$features/persons/person.ui';
import { isPrismaUniqueConstraintError } from '$server/api-response';
import type { EsportScope } from '$server/esport-scope';
import { prisma } from '$server/prisma';
import { type ServiceError, serviceErrors } from '$server/service-error';

import { placementLabel, tournamentTitle } from '../tournament.ui';
import type {
  TournamentDetail,
  TournamentEntryInput,
} from '../types/tournament.types';
import {
  auditTournament,
  authorizeTournamentChange,
  fieldError,
  readScopedTournament,
  type TournamentActor,
} from './tournament.service';
import { readTournamentDetail, tournamentScopeWhere } from './tournament-read';

type EntryValues = Readonly<{
  lineup: string | null;
  placement: string | null;
  team: string;
}>;

const entryChanged = (): ServiceError =>
  serviceErrors.conflict(
    'Cette équipe engagée a été modifiée entre-temps. Rechargez le tournoi avant de recommencer.',
  );
const entryMissing = (): ServiceError =>
  serviceErrors.notFound(
    'Cette équipe n’est plus engagée dans ce tournoi. Rechargez-le.',
  );

/** The line-up's names, in the order given, for the journal. */
const lineupNames = async (
  transaction: Prisma.TransactionClient,
  personIds: readonly string[],
): Promise<string | null> => {
  if (personIds.length === 0) return null;
  const persons = await transaction.person.findMany({
    select: { firstName: true, id: true, lastName: true, nickname: true },
    where: { id: { in: [...personIds] } },
  });
  if (persons.length !== personIds.length)
    throw fieldError(
      'lineup',
      'Une fiche du line-up n’existe plus. Rechargez le tournoi.',
      400,
    );
  const names = new Map(
    persons.map((person) => [person.id, getPersonDisplayName(person)]),
  );

  return personIds.map((id) => names.get(id) ?? '').join(', ');
};

const valuesOf = (
  team: string,
  lineup: string | null,
  placement: Pick<TournamentEntryInput, 'placementFrom' | 'placementTo'>,
): EntryValues => ({
  lineup,
  placement: placementLabel({
    placementFrom: placement.placementFrom,
    placementTo: placement.placementTo ?? placement.placementFrom,
  }),
  team,
});

const placementData = (
  input: TournamentEntryInput,
): { placementFrom: number | null; placementTo: number | null } => ({
  placementFrom: input.placementFrom,
  // One place is a range of one.
  placementTo:
    input.placementFrom === null
      ? null
      : (input.placementTo ?? input.placementFrom),
});

/** A team of the tournament's game, in the actor's scope. */
const readScopedTeam = async (
  transaction: Prisma.TransactionClient,
  teamId: string,
  gameId: string,
  scope: EsportScope,
): Promise<{ id: string; name: string }> => {
  const team = await transaction.team.findFirst({
    select: { id: true, name: true },
    where: { gameId, id: teamId },
  });
  if (!team || (scope.kind === 'TEAMS' && !scope.ids.has(team.id)))
    throw fieldError('teamId', 'Choisissez une équipe de ce jeu.', 400);

  return team;
};

/**
 * Engages one of our teams (11 November 2026), with its line-up and
 * placement when known. A team is engaged once per tournament.
 */
export const createTournamentEntry = async (
  tournamentId: string,
  input: TournamentEntryInput & { teamId: string },
  context: TournamentActor,
): Promise<TournamentDetail> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const scope = await authorizeTournamentChange(transaction, context);
      const tournament = await readScopedTournament(
        transaction,
        tournamentId,
        scope,
      );
      const team = await readScopedTeam(
        transaction,
        input.teamId,
        tournament.gameId,
        scope,
      );
      const lineup = await lineupNames(transaction, input.lineup);
      await transaction.tournamentEntry.create({
        data: {
          ...placementData(input),
          lineup: {
            create: input.lineup.map((personId) => ({ personId })),
          },
          teamId: team.id,
          tournamentId,
        },
      });
      const after = valuesOf(team.name, lineup, input);
      const changes = (Object.keys(after) as (keyof EntryValues)[]).filter(
        // eslint-disable-next-line security/detect-object-injection
        (key) => after[key] !== null,
      );
      await auditTournament(transaction, {
        action: 'TOURNAMENT_ENTRY_CREATE',
        actorId: context.actor.id,
        after: Object.fromEntries(
          // eslint-disable-next-line security/detect-object-injection
          changes.map((key) => [key, after[key]]),
        ),
        before: null,
        changes,
        description: `Équipe engagée : ${team.name}, ${tournamentTitle(tournament)}`,
        game: tournament.game,
        team,
        tournament: { id: tournament.id, name: tournamentTitle(tournament) },
      });

      return readTournamentDetail(transaction, tournamentId, scope);
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error))
      throw fieldError(
        'teamId',
        'Cette équipe est déjà engagée dans ce tournoi.',
        409,
      );
    throw error;
  }
};

const ENTRY_INCLUDE = {
  lineup: { orderBy: { createdAt: 'asc' }, select: { personId: true } },
  team: { select: { id: true, name: true } },
} as const;

/** An engaged team of the actor's scope, in that tournament. */
const readScopedEntry = async (
  transaction: Prisma.TransactionClient,
  tournamentId: string,
  entryId: string,
  scope: EsportScope,
): Promise<
  Prisma.TournamentEntryGetPayload<{ include: typeof ENTRY_INCLUDE }>
> => {
  const entry = await transaction.tournamentEntry.findFirst({
    include: ENTRY_INCLUDE,
    where: { id: entryId, tournamentId },
  });
  if (!entry || (scope.kind === 'TEAMS' && !scope.ids.has(entry.teamId)))
    throw entryMissing();

  return entry;
};

/** Sets an engaged team's line-up and placement, under its version. */
export const updateTournamentEntry = async (
  tournamentId: string,
  entryId: string,
  input: TournamentEntryInput & { expectedVersion: number },
  context: TournamentActor,
): Promise<TournamentDetail> =>
  prisma.$transaction(async (transaction) => {
    const scope = await authorizeTournamentChange(transaction, context);
    const tournament = await readScopedTournament(
      transaction,
      tournamentId,
      scope,
    );
    const entry = await readScopedEntry(
      transaction,
      tournamentId,
      entryId,
      scope,
    );
    if (entry.version !== input.expectedVersion) throw entryChanged();
    const previousIds = entry.lineup.map(({ personId }) => personId);
    const before = valuesOf(
      entry.team.name,
      await lineupNames(transaction, previousIds),
      entry,
    );
    const after = valuesOf(
      entry.team.name,
      await lineupNames(transaction, input.lineup),
      input,
    );
    const sameLineup =
      previousIds.length === input.lineup.length &&
      input.lineup.every((id) => previousIds.includes(id));
    const changes = (['lineup', 'placement'] as const).filter((key) =>
      key === 'lineup'
        ? !sameLineup
        : // eslint-disable-next-line security/detect-object-injection
          before[key] !== after[key],
    );
    if (changes.length === 0)
      return readTournamentDetail(transaction, tournamentId, scope);
    const result = await transaction.tournamentEntry.updateMany({
      data: { ...placementData(input), version: { increment: 1 } },
      where: { id: entryId, version: input.expectedVersion },
    });
    if (result.count !== 1) throw entryChanged();
    if (!sameLineup) {
      await transaction.tournamentLineupMember.deleteMany({
        where: { entryId },
      });
      await transaction.tournamentLineupMember.createMany({
        data: input.lineup.map((personId) => ({ entryId, personId })),
      });
    }
    await auditTournament(transaction, {
      action: 'TOURNAMENT_ENTRY_UPDATE',
      actorId: context.actor.id,
      after: Object.fromEntries(
        // eslint-disable-next-line security/detect-object-injection
        changes.map((key) => [key, after[key]]),
      ),
      before: Object.fromEntries(
        // eslint-disable-next-line security/detect-object-injection
        changes.map((key) => [key, before[key]]),
      ),
      changes,
      description: `Participation modifiée : ${entry.team.name}, ${tournamentTitle(tournament)}`,
      game: tournament.game,
      team: entry.team,
      tournament: { id: tournament.id, name: tournamentTitle(tournament) },
    });

    return readTournamentDetail(transaction, tournamentId, scope);
  });

/**
 * Withdraws an engaged team, its line-up with it. Null when the tournament
 * leaves the actor's scope with its last team of a scope of teams.
 */
export const deleteTournamentEntry = async (
  tournamentId: string,
  entryId: string,
  expectedVersion: number,
  context: TournamentActor,
): Promise<TournamentDetail | null> =>
  prisma.$transaction(async (transaction) => {
    const scope = await authorizeTournamentChange(transaction, context);
    const tournament = await readScopedTournament(
      transaction,
      tournamentId,
      scope,
    );
    const entry = await readScopedEntry(
      transaction,
      tournamentId,
      entryId,
      scope,
    );
    if (entry.version !== expectedVersion) throw entryChanged();
    const before = valuesOf(
      entry.team.name,
      await lineupNames(
        transaction,
        entry.lineup.map(({ personId }) => personId),
      ),
      entry,
    );
    const result = await transaction.tournamentEntry.deleteMany({
      where: { id: entryId, version: expectedVersion },
    });
    if (result.count !== 1) throw entryChanged();
    const changes = (Object.keys(before) as (keyof EntryValues)[]).filter(
      // eslint-disable-next-line security/detect-object-injection
      (key) => before[key] !== null,
    );
    await auditTournament(transaction, {
      action: 'TOURNAMENT_ENTRY_DELETE',
      actorId: context.actor.id,
      after: null,
      before: Object.fromEntries(
        // eslint-disable-next-line security/detect-object-injection
        changes.map((key) => [key, before[key]]),
      ),
      changes,
      description: `Équipe retirée : ${entry.team.name}, ${tournamentTitle(tournament)}`,
      game: tournament.game,
      team: entry.team,
      tournament: { id: tournament.id, name: tournamentTitle(tournament) },
    });

    const visible = await transaction.tournament.count({
      where: { AND: [{ id: tournamentId }, tournamentScopeWhere(scope)] },
    });

    return visible > 0
      ? readTournamentDetail(transaction, tournamentId, scope)
      : null;
  });
