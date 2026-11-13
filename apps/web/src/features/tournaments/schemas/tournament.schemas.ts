import { z } from 'zod';

import { daySchema } from '$features/financial-accounts/schemas/financial-account.schemas';
import { approximateDateEnd } from '$utils/approximate-date.utils';
import { MAX_AMOUNT_CENTS } from '$utils/money.utils';
import { requiredNameSchema } from '$utils/zod.utils';

import {
  TOURNAMENT_DATE_PRECISIONS,
  TOURNAMENT_EDITION_MAX_LENGTH,
  TOURNAMENT_FORMATS,
  TOURNAMENT_LINK_MAX_LENGTH,
  TOURNAMENT_LOCATION_MAX_LENGTH,
  TOURNAMENT_NAME_MAX_LENGTH,
  TOURNAMENT_PLACEMENT_MAX,
  type TournamentDatePrecision,
} from '../tournament.constants';

const id = z.string().min(1).max(128);
const optionalId = id.nullable();

/** A trimmed optional text: blank means none. */
const optionalText = (
  max: number,
): z.ZodType<string | null, string | null | undefined> =>
  z
    .string()
    .max(max * 2)
    .nullable()
    .optional()
    .transform((value) => {
      const trimmed = value?.trim() ?? '';

      return trimmed.length > 0 ? trimmed : null;
    })
    .pipe(z.string().max(max, `${max} caractères au maximum`).nullable());

const INVALID_LINK =
  'Adresse invalide : un lien vers la page du tournoi, en https://';

/**
 * The tournament's page (registration, rules, bracket, 12 November 2026):
 * « start.gg/lyon » is read as « https://start.gg/lyon ».
 */
const linkUrlSchema: z.ZodType<string | null, string | null | undefined> = z
  .string()
  .max(TOURNAMENT_LINK_MAX_LENGTH * 2)
  .nullable()
  .optional()
  .transform((value, context) => {
    const trimmed = value?.trim() ?? '';
    if (!trimmed) return null;
    const typed = /^https?:\/\//iu.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    try {
      const url = new URL(typed);
      if (/\s/u.test(trimmed) || !url.hostname.includes('.'))
        throw new TypeError(INVALID_LINK);

      return url.href;
    } catch {
      context.addIssue({ code: 'custom', message: INVALID_LINK });

      return z.NEVER;
    }
  })
  .pipe(
    z
      .string()
      .max(
        TOURNAMENT_LINK_MAX_LENGTH,
        `${TOURNAMENT_LINK_MAX_LENGTH} caractères au maximum`,
      )
      .nullable(),
  );

const optionalDay = daySchema.nullable();

const issueAt =
  (context: z.RefinementCtx) =>
  (path: string, message: string): void =>
    context.addIssue({ code: 'custom', message, path: [path] });

/** « mars 2027 » is kept on its first day. */
const firstOfMonth = (day: string): string => `${day.slice(0, 7)}-01`;

const dateFields = {
  datePrecision: z.enum(TOURNAMENT_DATE_PRECISIONS).default('DAY'),
  endOn: optionalDay.default(null),
  startOn: optionalDay.default(null),
};

type Dated = Readonly<{
  datePrecision: TournamentDatePrecision;
  endOn: string | null;
  startOn: string | null;
}>;

/**
 * Dates are optional (owner, 12 November 2026): known to the day, a last
 * day may follow, never before the first; known to the month, none.
 */
const checkDates = (value: Dated, context: z.RefinementCtx): void => {
  const issue = issueAt(context);
  if (value.endOn && !value.startOn)
    issue('startOn', 'Indiquez d’abord le premier jour');
  else if (value.endOn && value.datePrecision === 'MONTH')
    issue('endOn', 'Un dernier jour seulement avec un premier jour précis');
  else if (value.endOn && value.startOn && value.endOn < value.startOn)
    issue('endOn', 'La fin ne précède pas le début');
};

/** A month is kept on its first day; no date, no precision to keep. */
const normalizeDates = <Value extends Dated>(value: Value): Value =>
  value.startOn && value.datePrecision === 'MONTH'
    ? { ...value, endOn: null, startOn: firstOfMonth(value.startOn) }
    : value.startOn
      ? value
      : { ...value, datePrecision: 'DAY', endOn: null };

/**
 * Creating a tournament asks only what it is (12 November 2026): its name
 * and game; its dates, its organiser and an engaged team if already known,
 * the team required for an account that only sees chosen teams.
 */
export const tournamentCreateSchema = z
  .object({
    ...dateFields,
    edition: optionalText(TOURNAMENT_EDITION_MAX_LENGTH),
    gameId: id,
    name: requiredNameSchema(TOURNAMENT_NAME_MAX_LENGTH),
    organizerId: optionalId,
    teamId: optionalId,
  })
  .superRefine(checkDates)
  .transform(normalizeDates);

const tournamentFields = {
  ...dateFields,
  edition: optionalText(TOURNAMENT_EDITION_MAX_LENGTH),
  entryFeeCents: z
    .number()
    .int('Les frais comptent au plus deux décimales')
    .min(0, 'Les frais ne sont pas négatifs')
    .max(MAX_AMOUNT_CENTS, 'Dix millions d’euros au plus')
    .nullable(),
  format: z.enum(TOURNAMENT_FORMATS),
  isCancelled: z.boolean(),
  linkUrl: linkUrlSchema,
  location: optionalText(TOURNAMENT_LOCATION_MAX_LENGTH),
  name: requiredNameSchema(TOURNAMENT_NAME_MAX_LENGTH),
  organizerId: optionalId,
  registrationDeadlineOn: optionalDay,
};

type TournamentShape = Dated &
  Readonly<{
    format: string;
    location: string | null;
    registrationDeadlineOn: string | null;
  }>;

/** The last day the tournament may end on, when known. */
const lastDayOf = (value: Dated): string | null =>
  !value.startOn
    ? null
    : value.datePrecision === 'MONTH'
      ? approximateDateEnd({ date: value.startOn, precision: 'MONTH' })
      : (value.endOn ?? value.startOn);

/** A place only at a LAN; the registration closes before the end. */
const checkTournament = (
  value: TournamentShape,
  context: z.RefinementCtx,
): void => {
  const issue = issueAt(context);
  checkDates(value, context);
  if (value.location && value.format !== 'LAN')
    issue('location', 'Un lieu seulement pour une LAN');
  const last = lastDayOf(value);
  if (
    value.registrationDeadlineOn &&
    last &&
    value.registrationDeadlineOn > last
  )
    issue(
      'registrationDeadlineOn',
      'Les inscriptions ferment avant la fin du tournoi',
    );
};

export const tournamentSchema = z
  .object(tournamentFields)
  .superRefine(checkTournament)
  .transform(normalizeDates);

export const updateTournamentSchema = z
  .object({
    ...tournamentFields,
    expectedVersion: z.number().int().min(1),
  })
  .superRefine(checkTournament)
  .transform(normalizeDates);

export const tournamentVersionSchema = z.object({
  expectedVersion: z.number().int().min(1),
});

export const tournamentIdSchema = id;

const placement = z
  .number()
  .int()
  .min(1, 'Une place commence à 1')
  .max(TOURNAMENT_PLACEMENT_MAX, `${TOURNAMENT_PLACEMENT_MAX} au plus`)
  .nullable();

const entryFields = {
  placementFrom: placement,
  placementTo: placement,
};

type EntryShape = Readonly<{
  placementFrom: number | null;
  placementTo: number | null;
}>;

/**
 * One place, or a shared range read from its first place (« 3 à 4 »): the
 * second place alone means nothing.
 */
const checkPlacement = (value: EntryShape, context: z.RefinementCtx): void => {
  const issue = issueAt(context);
  if (value.placementFrom === null && value.placementTo !== null)
    issue('placementFrom', 'Indiquez d’abord la première place');
  if (
    value.placementFrom !== null &&
    value.placementTo !== null &&
    value.placementTo < value.placementFrom
  )
    issue('placementTo', 'La dernière place suit la première');
};

/** Engaging a team: the team, then its line-up and placement if known. */
// Strict: a line-up is no longer kept (13 November 2026), one sent is refused.
export const tournamentEntryCreateSchema = z
  .object({ ...entryFields, teamId: id })
  .strict()
  .superRefine(checkPlacement);

export const tournamentEntryUpdateSchema = z
  .object({ ...entryFields, expectedVersion: z.number().int().min(1) })
  .strict()
  .superRefine(checkPlacement);

/** The list read for a team's record or a person's Parcours. */
export const tournamentQuerySchema = z.object({
  equipe: id.optional(),
  personne: id.optional(),
});
