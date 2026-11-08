import { z } from 'zod';

/**
 * How precisely a date is known (registre historique): a date known to the
 * year is entered to the year, without an invented day. Shared by every
 * approximate date of the site: a game's first opening, a team's creation and,
 * later, the start and end of a passage.
 */
export const DATE_PRECISIONS = ['DAY', 'MONTH', 'YEAR'] as const;
export type DatePrecision = (typeof DATE_PRECISIONS)[number];

export const DATE_PRECISION_LABELS: Record<DatePrecision, string> = {
  DAY: 'Jour précis',
  MONTH: 'Mois',
  YEAR: 'Année',
};

/** A date known to the day, the month or the year (`date` is YYYY-MM-DD). */
export type ApproximateDate = Readonly<{
  date: string;
  precision: DatePrecision;
}>;

/** Earliest and latest year accepted for an approximate date. */
export const APPROXIMATE_DATE_FIRST_YEAR = 1970;
export const APPROXIMATE_DATE_LAST_YEAR = 2100;

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value: number): string => String(value).padStart(2, '0');

/** Year, month and day of a real calendar date, or null. */
export const parseDateOnly = (
  value: string,
): { day: number; month: number; year: number } | null => {
  const match = DATE_ONLY.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? { day, month, year }
    : null;
};

/** A date known to the year sits on 1 January, to the month on its first day. */
export const normalizeApproximateDate = (
  value: ApproximateDate,
): ApproximateDate => {
  const parts = parseDateOnly(value.date);
  if (!parts) return value;
  const month = value.precision === 'YEAR' ? 1 : parts.month;
  const day = value.precision === 'DAY' ? parts.day : 1;

  return {
    date: `${parts.year}-${pad(month)}-${pad(day)}`,
    precision: value.precision,
  };
};

const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const;

/** « 2019 », « mars 2021 » or « 15 mars 2021 », as precisely as it is known. */
export const formatApproximateDate = (value: ApproximateDate): string => {
  const parts = parseDateOnly(value.date);
  if (!parts) return value.date;
  const month = MONTHS[parts.month - 1] ?? '';
  if (value.precision === 'YEAR') return String(parts.year);
  if (value.precision === 'MONTH') return `${month} ${parts.year}`;

  return `${parts.day === 1 ? '1er' : parts.day} ${month} ${parts.year}`;
};

/** Today in the browser's calendar, as YYYY-MM-DD: the prefilled date of a new record. */
export const getLocalToday = (now: Date = new Date()): string =>
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

/** Keeps a date valid when its precision changes in the form. */
export const changeDatePrecision = (
  value: ApproximateDate,
  precision: DatePrecision,
): ApproximateDate => normalizeApproximateDate({ ...value, precision });

/** Validates a date and its precision, then stores it at the start of its period. */
export const approximateDateSchema = z
  .object({
    date: z.string(),
    precision: z.enum(DATE_PRECISIONS),
  })
  .strict()
  .superRefine((value, context) => {
    const parts = parseDateOnly(value.date);
    if (!parts) {
      context.addIssue({ code: 'custom', message: 'Date invalide' });

      return;
    }
    if (
      parts.year < APPROXIMATE_DATE_FIRST_YEAR ||
      parts.year > APPROXIMATE_DATE_LAST_YEAR
    )
      context.addIssue({
        code: 'custom',
        message: `L’année doit être comprise entre ${APPROXIMATE_DATE_FIRST_YEAR} et ${APPROXIMATE_DATE_LAST_YEAR}`,
      });
  })
  .transform(normalizeApproximateDate);
