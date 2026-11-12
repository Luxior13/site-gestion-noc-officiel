import 'server-only';

import type { Prisma } from '@prisma/client';
import { AuditAction, AuditCategory } from '@repo/database';

import { FEATURES } from '$constants/feature-registry.constants';
import { PERMISSIONS } from '$constants/permissions.constants';
import { isPrismaUniqueConstraintError } from '$server/api-response';
import { createAuditLogWithHeaders } from '$server/audit-log';
import { authorizeEsportAction, type EsportScope } from '$server/esport-scope';
import { prisma } from '$server/prisma';
import { ServiceError, serviceErrors } from '$server/service-error';
import { ErrorCode } from '$types/api.types';
import type { SessionType, UserType } from '$types/auth.types';
import { normalizeSearchText } from '$utils/search-text.utils';

import { TOURNAMENT_FORMAT_LABELS } from '../tournament.constants';
import {
  dayLabel,
  entryFeeLabel,
  tournamentDatesLabel,
  tournamentTitle,
} from '../tournament.ui';
import type {
  TournamentCreateInput,
  TournamentDetail,
  TournamentInput,
} from '../types/tournament.types';
import {
  asDay,
  dayOf,
  precisionOf,
  readTournamentDetail,
  tournamentMissing,
  tournamentScopeWhere,
} from './tournament-read';

export type TournamentActor = Readonly<{
  actor: Pick<UserType, 'id'>;
  session: SessionType | null;
}>;

type AuditValues = Readonly<{
  cancelled: string;
  dates: string;
  edition: string | null;
  entryFee: string | null;
  format: string;
  game: string;
  linkUrl: string | null;
  location: string | null;
  name: string;
  organizer: string | null;
  registrationDeadline: string | null;
}>;

export const fieldError = (
  field: string,
  message: string,
  status: 400 | 404 | 409,
): ServiceError =>
  new ServiceError(
    status === 409
      ? ErrorCode.CONFLICT
      : status === 404
        ? ErrorCode.NOT_FOUND
        : ErrorCode.VALIDATION_ERROR,
    message,
    status,
    { details: { [field]: [message] } },
  );
const tournamentChanged = (): ServiceError =>
  serviceErrors.conflict(
    'Ce tournoi a été modifié entre-temps. Rechargez-le avant de recommencer.',
  );

/** What the journal shows: readable values. */
const auditValues = (
  value: TournamentInput,
  names: Readonly<{ game: string; organizer: string | null }>,
): AuditValues => ({
  cancelled: value.isCancelled ? 'Oui' : 'Non',
  dates: tournamentDatesLabel(value),
  edition: value.edition,
  entryFee: entryFeeLabel(value.entryFeeCents),
  format: TOURNAMENT_FORMAT_LABELS[value.format],
  game: names.game,
  linkUrl: value.linkUrl,
  location: value.location,
  name: value.name,
  organizer: names.organizer,
  registrationDeadline: value.registrationDeadlineOn
    ? dayLabel(value.registrationDeadlineOn)
    : null,
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

/** Every « Tournoi … » and « Participation … » line of the journal. */
export const auditTournament = async (
  transaction: Prisma.TransactionClient,
  input: {
    action:
      | 'TOURNAMENT_CREATE'
      | 'TOURNAMENT_DELETE'
      | 'TOURNAMENT_ENTRY_CREATE'
      | 'TOURNAMENT_ENTRY_DELETE'
      | 'TOURNAMENT_ENTRY_UPDATE'
      | 'TOURNAMENT_UPDATE';
    actorId: string;
    after: Record<string, unknown> | null;
    before: Record<string, unknown> | null;
    changes: readonly string[];
    description: string;
    game: Readonly<{ id: string; name: string }>;
    team?: Readonly<{ id: string; name: string }>;
    tournament: Readonly<{ id: string; name: string }>;
  },
): Promise<void> =>
  createAuditLogWithHeaders(
    {
      action: AuditAction[input.action],
      category: AuditCategory.TOURNAMENT,
      description: input.description,
      metadata: {
        after: input.after,
        before: input.before,
        changes: input.changes,
        gameId: input.game.id,
        gameName: input.game.name,
        ...(input.team
          ? { teamId: input.team.id, teamName: input.team.name }
          : {}),
        tournamentId: input.tournament.id,
        tournamentName: input.tournament.name,
        ...FEATURES.tournaments.audit,
      },
      targetUserId: null,
      userId: input.actorId,
    },
    { client: transaction, required: true },
  );

export const authorizeTournamentChange = (
  transaction: Prisma.TransactionClient,
  { actor, session }: TournamentActor,
): Promise<EsportScope> =>
  authorizeEsportAction(
    transaction,
    { actorId: actor.id, session },
    PERMISSIONS.TOURNAMENTS.MANAGE,
  );

/**
 * A name and its edition are once per game (owner, 12 November 2026):
 * without an edition, asks for one; with it, says the pair is taken. The
 * unique index refuses it anyway.
 */
const refusingDuplicates = async <T>(
  input: Readonly<{ edition: string | null; name: string }>,
  run: () => Promise<T>,
): Promise<T> => {
  try {
    return await run();
  } catch (error) {
    if (!isPrismaUniqueConstraintError(error)) throw error;
    throw fieldError(
      'edition',
      input.edition
        ? `« ${tournamentTitle(input)} » existe déjà dans ce jeu : changez l’édition.`
        : `Un tournoi ${input.name} existe déjà dans ce jeu : précisez l’édition (Saison 2, Split 1, 2027…).`,
      409,
    );
  }
};

/** An organiser of the list, or none. */
const readOrganizer = async (
  transaction: Prisma.TransactionClient,
  organizerId: string | null,
): Promise<string | null> => {
  if (!organizerId) return null;
  const organizer = await transaction.organization.findUnique({
    select: { name: true },
    where: { id: organizerId },
  });
  if (!organizer)
    throw fieldError(
      'organizerId',
      'Cette organisation n’existe plus. Choisissez-en une autre.',
      400,
    );

  return organizer.name;
};

const writeData = (
  input: TournamentInput,
): Omit<Prisma.TournamentUncheckedCreateInput, 'gameId'> => ({
  datePrecision: input.startOn ? input.datePrecision : 'DAY',
  edition: input.edition,
  endOn: input.endOn ? asDay(input.endOn) : null,
  entryFeeCents: input.entryFeeCents,
  format: input.format,
  isCancelled: input.isCancelled,
  linkUrl: input.linkUrl,
  location: input.format === 'LAN' ? input.location : null,
  name: input.name,
  normalizedEdition: normalizeSearchText(input.edition ?? ''),
  normalizedName: normalizeSearchText(input.name),
  organizerId: input.organizerId,
  registrationDeadlineOn: input.registrationDeadlineOn
    ? asDay(input.registrationDeadlineOn)
    : null,
  searchText: normalizeSearchText(
    [input.name, input.edition ?? '', input.location ?? ''].join(' '),
  ).slice(0, 700),
  startOn: input.startOn ? asDay(input.startOn) : null,
});

/**
 * Adds a tournament from what it is and when (11 November 2026); its record
 * does the rest. A scope of teams engages one of its teams at once, or the
 * tournament would vanish from its own list.
 */
export const createTournament = (
  input: TournamentCreateInput,
  context: TournamentActor,
): Promise<TournamentDetail> =>
  refusingDuplicates(input, () =>
    prisma.$transaction(async (transaction) => {
      const scope = await authorizeTournamentChange(transaction, context);
      const game = await transaction.game.findUnique({
        select: { id: true, name: true },
        where: { id: input.gameId },
      });
      if (
        !game ||
        (scope.kind === 'GAMES' && !scope.ids.has(game.id)) ||
        (scope.kind === 'TEAMS' &&
          !(
            await transaction.team.findMany({
              select: { id: true },
              where: { gameId: game.id, id: { in: [...scope.ids] } },
            })
          ).length)
      )
        throw fieldError('gameId', 'Ce jeu n’existe plus.', 400);
      if (scope.kind === 'TEAMS' && !input.teamId)
        throw fieldError(
          'teamId',
          'Choisissez l’équipe engagée : votre compte ne voit que ses équipes.',
          400,
        );
      const team = input.teamId
        ? await transaction.team.findFirst({
            select: { id: true, name: true },
            where: { gameId: game.id, id: input.teamId },
          })
        : null;
      if (
        input.teamId &&
        (!team || (scope.kind === 'TEAMS' && !scope.ids.has(team.id)))
      )
        throw fieldError('teamId', 'Choisissez une équipe de ce jeu.', 400);
      const full: TournamentInput = {
        datePrecision: input.datePrecision,
        edition: input.edition,
        endOn: input.endOn,
        entryFeeCents: null,
        format: 'ONLINE',
        isCancelled: false,
        linkUrl: null,
        location: null,
        name: input.name,
        organizerId: input.organizerId,
        registrationDeadlineOn: null,
        startOn: input.startOn,
      };
      const organizer = await readOrganizer(transaction, input.organizerId);
      const created = await transaction.tournament.create({
        data: { ...writeData(full), gameId: game.id },
        select: { id: true },
      });
      const after = auditValues(full, { game: game.name, organizer });
      // Only what was given: a tournament may have no date yet.
      const keys = (['name', 'game', 'organizer', 'dates'] as const).filter(
        (key) =>
          (key !== 'organizer' || organizer) &&
          (key !== 'dates' || input.startOn),
      );
      const tournament = { id: created.id, name: tournamentTitle(input) };
      await auditTournament(transaction, {
        action: 'TOURNAMENT_CREATE',
        actorId: context.actor.id,
        after: pick(after, keys),
        before: null,
        changes: keys,
        description: `Tournoi ajouté : ${tournament.name} (${game.name})`,
        game,
        tournament,
      });
      if (team) {
        await transaction.tournamentEntry.create({
          data: { teamId: team.id, tournamentId: created.id },
        });
        await auditTournament(transaction, {
          action: 'TOURNAMENT_ENTRY_CREATE',
          actorId: context.actor.id,
          after: { team: team.name },
          before: null,
          changes: ['team'],
          description: `Équipe engagée : ${team.name}, ${tournament.name}`,
          game,
          team,
          tournament,
        });
      }

      return readTournamentDetail(transaction, created.id, scope);
    }),
  );

const TOURNAMENT_INCLUDE = {
  game: { select: { id: true, name: true } },
  organizer: { select: { name: true } },
} as const;
type TournamentRow = Prisma.TournamentGetPayload<{
  include: typeof TOURNAMENT_INCLUDE;
}>;

const inputOf = (row: TournamentRow): TournamentInput => ({
  datePrecision: precisionOf(row.datePrecision),
  edition: row.edition,
  endOn: row.endOn ? dayOf(row.endOn) : null,
  entryFeeCents: row.entryFeeCents,
  format: row.format,
  isCancelled: row.isCancelled,
  linkUrl: row.linkUrl,
  location: row.location,
  name: row.name,
  organizerId: row.organizerId,
  registrationDeadlineOn: row.registrationDeadlineOn
    ? dayOf(row.registrationDeadlineOn)
    : null,
  startOn: row.startOn ? dayOf(row.startOn) : null,
});

/** A tournament of the actor's scope, as it is now. */
export const readScopedTournament = async (
  transaction: Prisma.TransactionClient,
  id: string,
  scope: EsportScope,
): Promise<TournamentRow> => {
  const row = await transaction.tournament.findFirst({
    include: TOURNAMENT_INCLUDE,
    where: { AND: [{ id }, tournamentScopeWhere(scope)] },
  });
  if (!row) throw tournamentMissing();

  return row;
};

/** Edits a tournament's information under optimistic versioning. */
export const updateTournament = (
  id: string,
  input: TournamentInput & { expectedVersion: number },
  context: TournamentActor,
): Promise<TournamentDetail> =>
  refusingDuplicates(input, () =>
    prisma.$transaction(async (transaction) => {
      const scope = await authorizeTournamentChange(transaction, context);
      const previous = await readScopedTournament(transaction, id, scope);
      if (previous.version !== input.expectedVersion) throw tournamentChanged();
      const organizer =
        input.organizerId === previous.organizerId
          ? (previous.organizer?.name ?? null)
          : await readOrganizer(transaction, input.organizerId);
      const before = auditValues(inputOf(previous), {
        game: previous.game.name,
        organizer: previous.organizer?.name ?? null,
      });
      const after = auditValues(input, { game: previous.game.name, organizer });
      const changes = changedKeys(before, after);
      if (changes.length === 0)
        return readTournamentDetail(transaction, id, scope);
      const result = await transaction.tournament.updateMany({
        data: { ...writeData(input), version: { increment: 1 } },
        where: { id, version: input.expectedVersion },
      });
      if (result.count !== 1) throw tournamentChanged();
      await auditTournament(transaction, {
        action: 'TOURNAMENT_UPDATE',
        actorId: context.actor.id,
        after: pick(after, changes),
        before: pick(before, changes),
        changes,
        description: `Tournoi modifié : ${tournamentTitle(input)} (${previous.game.name})`,
        game: previous.game,
        tournament: { id, name: tournamentTitle(input) },
      });

      return readTournamentDetail(transaction, id, scope);
    }),
  );

const entriesLabel = (count: number): string =>
  count > 1 ? `ses ${count} équipes engagées` : 'son équipe engagée';

/**
 * Deletes a tournament entered by mistake, its engaged teams with it. One
 * that has operations stays (`ON DELETE RESTRICT`); a scope of teams deletes
 * only a tournament where every engaged team is its own.
 */
export const deleteTournament = async (
  id: string,
  expectedVersion: number,
  context: TournamentActor,
): Promise<{ id: string }> =>
  prisma.$transaction(async (transaction) => {
    const scope = await authorizeTournamentChange(transaction, context);
    const previous = await readScopedTournament(transaction, id, scope);
    if (previous.version !== expectedVersion) throw tournamentChanged();
    if (
      (await transaction.financialOperation.count({
        where: { tournamentId: id },
      })) > 0
    )
      throw serviceErrors.conflict(
        'Ce tournoi a des opérations : il reste, pour l’historique de la trésorerie.',
      );
    const entries = await transaction.tournamentEntry.findMany({
      select: { teamId: true },
      where: { tournamentId: id },
    });
    if (
      scope.kind === 'TEAMS' &&
      entries.some((entry) => !scope.ids.has(entry.teamId))
    )
      throw serviceErrors.forbidden(
        'Une autre équipe est engagée dans ce tournoi : seul un compte qui la voit peut le supprimer.',
      );
    const result = await transaction.tournament.deleteMany({
      where: { id, version: expectedVersion },
    });
    if (result.count !== 1) throw tournamentChanged();
    const before = auditValues(inputOf(previous), {
      game: previous.game.name,
      organizer: previous.organizer?.name ?? null,
    });
    await auditTournament(transaction, {
      action: 'TOURNAMENT_DELETE',
      actorId: context.actor.id,
      after: null,
      before,
      changes: Object.keys(before),
      description:
        entries.length > 0
          ? `Tournoi supprimé : ${tournamentTitle(previous)} (${previous.game.name}), avec ${entriesLabel(entries.length)}`
          : `Tournoi supprimé : ${tournamentTitle(previous)} (${previous.game.name})`,
      game: previous.game,
      tournament: { id: previous.id, name: tournamentTitle(previous) },
    });

    return { id };
  });
