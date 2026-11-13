import { z } from 'zod';

/**
 * How precisely a date is known (registre historique): a date known to the
 * year is entered to the year, without an invented day. Shared by every
 * approximate date of the site: a game's first opening, a team's creation and,
 * later, the start and end of a passage.
 */
const DATE_PRECISIONS = ['DAY', 'MONTH', 'YEAR'] as const;
export type DatePrecision = (typeof DATE_PRECISIONS)[number];

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

/** « mars » for 3. */
export const monthName = (month: number): string => MONTHS[month - 1] ?? '';

/** « 2019 », « mars 2021 » or « 15 mars 2021 », as precisely as it is known. */
export const formatApproximateDate = (value: ApproximateDate): string => {
  const parts = parseDateOnly(value.date);
  if (!parts) return value.date;
  const month = MONTHS[parts.month - 1] ?? '';
  if (value.precision === 'YEAR') return String(parts.year);
  if (value.precision === 'MONTH') return `${month} ${parts.year}`;

  return `${parts.day === 1 ? '1er' : parts.day} ${month} ${parts.year}`;
};

const DAY_MS = 86_400_000;

const nextDay = (value: string): string =>
  new Date(Date.parse(`${value}T00:00:00.000Z`) + DAY_MS)
    .toISOString()
    .slice(0, 10);

/** « 2 ans 8 mois », « 1 an », « 8 mois ». */
const yearsAndMonths = (months: number): string => {
  const years = Math.floor(months / 12);
  const rest = months % 12;

  return [
    years > 0 ? `${years} an${years > 1 ? 's' : ''}` : '',
    rest > 0 ? `${rest} mois` : '',
  ]
    .filter(Boolean)
    .join(' ');
};

/**
 * How long a period lasted, or has lasted until today (owner, 9 November
 * 2026: « le temps entre le début et aujourd'hui, ou la date de fin si
 * passé »), never more precisely than its bounds: in years, « environ 3
 * ans », when one is known to the year; in years and months when one is
 * known to the month; in days under a month when both are known to the day.
 * The last day counts: « 3 → 5 novembre » lasted 3 days. Null before it
 * begins.
 */
export const formatApproximateDuration = (
  start: ApproximateDate,
  end: ApproximateDate | null,
  today: string,
): string | null => {
  if (start.date > today) return null;
  const last = end ? approximateDateEnd(end) : today;
  const first = parseDateOnly(start.date);
  const after = parseDateOnly(nextDay(last));
  if (!first || !after) return null;
  if (start.precision === 'YEAR' || end?.precision === 'YEAR') {
    const years = Number(last.slice(0, 4)) - first.year;

    return years < 1
      ? 'moins d’un an'
      : `environ ${years} an${years > 1 ? 's' : ''}`;
  }
  const months =
    (after.year - first.year) * 12 +
    (after.month - first.month) -
    (after.day < first.day ? 1 : 0);
  if (months >= 1) return yearsAndMonths(months);
  if (start.precision === 'MONTH' || end?.precision === 'MONTH')
    return 'moins d’un mois';
  const days = Math.round(
    (Date.parse(`${nextDay(last)}T00:00:00.000Z`) -
      Date.parse(`${start.date}T00:00:00.000Z`)) /
      DAY_MS,
  );

  return `${days} jour${days > 1 ? 's' : ''}`;
};

/**
 * A period written once, as French does (owner, 9 November 2026: a period
 * cut on two lines): the year said once when it repeats, « 3 → 5 novembre
 * 2026 », « mars → juin 2024 », « 3 septembre → 5 novembre 2026 »; a period
 * of one month or one year, « mars 2024 ». A bound known to the year, or two
 * years, keeps both dates whole: « 2024 → juin 2024 » stays clear.
 */
export const formatApproximateRange = (
  start: ApproximateDate,
  end: ApproximateDate,
): string => {
  const from = formatApproximateDate(start);
  const to = formatApproximateDate(end);
  if (from === to) return to;
  // The arrow stays with the start: a wrapped period never opens a line on it.
  const first = parseDateOnly(start.date);
  const last = parseDateOnly(end.date);
  if (
    !first ||
    !last ||
    first.year !== last.year ||
    start.precision === 'YEAR' ||
    end.precision === 'YEAR'
  )
    return `${from}\u00a0→ ${to}`;
  const day = first.day === 1 ? '1er' : String(first.day);
  const month = MONTHS[first.month - 1] ?? '';
  const head =
    start.precision === 'MONTH'
      ? month
      : end.precision === 'DAY' && first.month === last.month
        ? day
        : `${day} ${month}`;

  return `${head}\u00a0→ ${to}`;
};

/**
 * The last day of a date's period: « 2024 » ends on 31 December, « mars 2024 »
 * on 31 March. An end of passage is stored there (registre historique), so
 * « who was there on a date » stays a plain comparison.
 */
export const approximateDateEnd = (value: ApproximateDate): string => {
  const parts = parseDateOnly(value.date);
  if (!parts) return value.date;
  if (value.precision === 'YEAR') return `${parts.year}-12-31`;
  if (value.precision === 'MONTH') {
    const lastDay = new Date(Date.UTC(parts.year, parts.month, 0)).getUTCDate();

    return `${parts.year}-${pad(parts.month)}-${pad(lastDay)}`;
  }

  return value.date;
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
