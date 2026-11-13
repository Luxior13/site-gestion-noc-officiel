import {
  approximateDateEnd,
  formatApproximateDate,
  formatApproximateDuration,
  formatApproximateRange,
  monthName,
  parseDateOnly,
} from '$utils/approximate-date.utils';
import { formatEuros } from '$utils/money.utils';

import type { TournamentState } from './tournament.constants';
import type { TournamentItem } from './types/tournament.types';

/**
 * How a tournament is named everywhere (12 November 2026): its name, then
 * its edition when it has one, « Lyon e-Sport · Saison 2 ».
 */
export const tournamentTitle = (
  tournament: Readonly<{ edition: string | null; name: string }>,
): string =>
  tournament.edition
    ? `${tournament.name} · ${tournament.edition}`
    : tournament.name;

type Dated = Pick<TournamentItem, 'datePrecision' | 'endOn' | 'startOn'>;

/**
 * The days a tournament covers, as far as they are known (12 November
 * 2026): from its first day to its last, or its first alone; its whole
 * month when only the month is known; none without a date.
 */
export const tournamentPeriod = (
  tournament: Dated,
): { from: string; to: string } | null => {
  if (!tournament.startOn) return null;
  if (tournament.datePrecision === 'MONTH')
    return {
      from: tournament.startOn,
      to: approximateDateEnd({ date: tournament.startOn, precision: 'MONTH' }),
    };

  return {
    from: tournament.startOn,
    to: tournament.endOn ?? tournament.startOn,
  };
};

/**
 * Where a tournament stands on a day, from its dates (8 November 2026); a
 * called-off one says so whatever its dates (11 November 2026); without a
 * date, « Date à fixer », and known to the month only, to come until that
 * month ends (12 November 2026).
 */
export const tournamentStateOn = (
  tournament: Dated & Pick<TournamentItem, 'isCancelled'>,
  today: string,
): TournamentState => {
  if (tournament.isCancelled) return 'cancelled';
  const period = tournamentPeriod(tournament);
  if (!period) return 'unscheduled';
  if (today > period.to) return 'finished';
  if (tournament.datePrecision === 'MONTH' || today < period.from)
    return 'upcoming';

  return 'ongoing';
};

/** « Date à fixer », « mars 2027 », « 15 mars 2027 », « 15 → 17 mars 2027 ». */
export const tournamentDatesLabel = (tournament: Dated): string => {
  if (!tournament.startOn) return 'Date à fixer';
  if (tournament.datePrecision === 'MONTH')
    return formatApproximateDate({
      date: tournament.startOn,
      precision: 'MONTH',
    });

  return formatApproximateRange(
    { date: tournament.startOn, precision: 'DAY' },
    { date: tournament.endOn ?? tournament.startOn, precision: 'DAY' },
  );
};

const SHORT_MONTHS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
] as const;

type Day = Readonly<{ day: number; month: number; year: number }>;

const dayNumber = (day: number): string => (day === 1 ? '1er' : String(day));

/** « 29 oct. », « 1er nov. », its two words never parted. */
const shortDay = (parts: Day): string =>
  `${dayNumber(parts.day)} ${SHORT_MONTHS[parts.month - 1] ?? ''}`;

/** The first and last days of a tournament known to the day, or null. */
const dayBounds = (
  tournament: Dated,
): Readonly<{
  endOn: string;
  first: Day;
  last: Day;
  startOn: string;
}> | null => {
  if (!tournament.startOn || tournament.datePrecision === 'MONTH') return null;
  const endOn = tournament.endOn ?? tournament.startOn;
  const first = parseDateOnly(tournament.startOn);
  const last = parseDateOnly(endOn);

  return first && last
    ? { endOn, first, last, startOn: tournament.startOn }
    : null;
};

/** « 15 mars », « 15 → 17 mars », « 29 oct. → 6 nov. ». */
const daysLabel = (first: Day, last: Day): string => {
  const sameMonth = first.year === last.year && first.month === last.month;
  if (sameMonth && first.day === last.day) return shortDay(first);

  return `${sameMonth ? dayNumber(first.day) : shortDay(first)} → ${shortDay(last)}`;
};

/**
 * The dates in a list's column (owner, 13 November 2026, the year left
 * alone on a second line): the days on the first line, months shortened,
 * « 29 oct. → 6 nov. », « 15 → 17 mars » ; under them, discreet, the year
 * and how long it lasts, « 2026 · 9 jours », « 2026 → 2027 · 7 jours ».
 * Known to the month: « Mars », « 2027 · jours à fixer ». Without a date,
 * « Date à fixer » and no second line.
 */
export const tournamentDatesCell = (
  tournament: Dated,
): Readonly<{ days: string; detail: string | null }> => {
  const month = tournament.startOn ? parseDateOnly(tournament.startOn) : null;
  if (tournament.datePrecision === 'MONTH' && month) {
    const name = monthName(month.month);

    return {
      days: name.charAt(0).toUpperCase() + name.slice(1),
      detail: `${month.year} · jours à fixer`,
    };
  }
  const bounds = dayBounds(tournament);
  if (!bounds) return { days: 'Date à fixer', detail: null };
  const { endOn, first, last, startOn } = bounds;
  const days = daysLabel(first, last);
  if (endOn === startOn) return { days, detail: String(first.year) };
  const years =
    first.year === last.year
      ? String(first.year)
      : `${first.year} → ${last.year}`;
  const length = formatApproximateDuration(
    { date: startOn, precision: 'DAY' },
    { date: endOn, precision: 'DAY' },
    endOn,
  );

  return { days, detail: length ? `${years} · ${length}` : years };
};

/**
 * The same dates on one line, for a phone's card (13 November 2026):
 * « 29 oct. → 6 nov. 2026 », « 28 déc. 2026 → 3 janv. 2027 », the year
 * kept with its day; « septembre 2027 », « Date à fixer ».
 */
export const tournamentDatesShortLabel = (tournament: Dated): string => {
  const bounds = dayBounds(tournament);
  if (!bounds) return tournamentDatesLabel(tournament);
  const { first, last } = bounds;

  return first.year === last.year
    ? `${daysLabel(first, last)} ${last.year}`
    : `${shortDay(first)} ${first.year} → ${shortDay(last)} ${last.year}`;
};

/** « 15 mars 2027 », for a deadline. */
export const dayLabel = (day: string): string =>
  formatApproximateDate({ date: day, precision: 'DAY' });

const ordinal = (place: number): string => (place === 1 ? '1er' : `${place}e`);

/**
 * A final placement (owner, 11 November 2026): one place, « 1er », or a
 * range shared by several teams, « 3e–4e », « 5e–8e ».
 */
export const placementLabel = (
  entry: Readonly<{ placementFrom: number | null; placementTo: number | null }>,
): string | null => {
  if (entry.placementFrom === null) return null;
  const to = entry.placementTo ?? entry.placementFrom;

  return to === entry.placementFrom
    ? ordinal(to)
    : `${ordinal(entry.placementFrom)}–${ordinal(to)}`;
};

type Placed = Readonly<{ placementFrom: number | null }>;

/** The best placed first, then those without a placement. */
const placementRank = (entry: Placed): number =>
  entry.placementFrom ?? Number.MAX_SAFE_INTEGER;

/**
 * The engaged teams a list's line shows (owner, 13 November 2026: « chaque
 * équipe en plus fait augmenter la hauteur »): two at most, so a row keeps
 * the two lines of its Dates and Tournoi cells; the best placed first, then
 * those without a placement in their given order. The others are counted,
 * « +1 » : the tournament's Participants lists them all, and the search
 * still finds them.
 */
export const listedEntries = <Entry extends Placed>(
  entries: readonly Entry[],
): Readonly<{ hidden: number; shown: Entry[] }> => {
  const shown = [...entries]
    .sort((a, b) => placementRank(a) - placementRank(b))
    .slice(0, 2);

  return { hidden: entries.length - shown.length, shown };
};

/** « Gratuit », « 50,00 € par équipe ». */
export const entryFeeLabel = (cents: number | null): string | null =>
  cents === null
    ? null
    : cents === 0
      ? 'Gratuit'
      : `${formatEuros(cents)} par équipe`;

/** The tournament's year, for the list's filter; none without a date. */
export const tournamentYear = (
  tournament: Pick<TournamentItem, 'startOn'>,
): number | null =>
  tournament.startOn ? Number(tournament.startOn.slice(0, 4)) : null;
