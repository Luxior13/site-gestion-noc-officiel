import {
  approximateDateEnd,
  formatApproximateDate,
  formatApproximateRange,
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
