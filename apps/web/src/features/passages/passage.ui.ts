import type { StatusBadgeTone } from '$ui/status-badge';
import {
  type ApproximateDate,
  approximateDateEnd,
  formatApproximateDate,
  formatApproximateRange,
} from '$utils/approximate-date.utils';
import { normalizeSearchText } from '$utils/search-text.utils';

import type { PassageItem } from './types/passage.types';

type Dated = Readonly<{ end: ApproximateDate | null; start: ApproximateDate }>;

export type PassageState = 'current' | 'former' | 'upcoming';

const STATE_BADGES: ReadonlyMap<
  PassageState,
  Readonly<{ label: string; tone: StatusBadgeTone }>
> = new Map([
  ['current', { label: 'Actuel', tone: 'success' }],
  ['former', { label: 'Ancien', tone: 'muted' }],
  ['upcoming', { label: 'À venir', tone: 'info' }],
]);

/** The badge of a roster line, as the Répertoire's status. */
export const passageStateBadge = (
  state: PassageState,
): Readonly<{ label: string; tone: StatusBadgeTone }> =>
  STATE_BADGES.get(state) ?? { label: 'Actuel', tone: 'success' };

/**
 * Where a passage stands on a day (YYYY-MM-DD): a start counts from the first
 * day of its period, an end until the last (« 2024 » covers the year).
 */
export const passageStateOn = (passage: Dated, day: string): PassageState =>
  passage.start.date > day
    ? 'upcoming'
    : passage.end && approximateDateEnd(passage.end) < day
      ? 'former'
      : 'current';

/**
 * The Roster tab shows what is there and what is coming, never the former
 * passages (owner, 9 November 2026: « je ne veux pas mélanger les anciens
 * avec les en cours et à venir, car sur le très long terme ça fera bordel »):
 * the current ones first, then those to come, each in the server's order.
 */
export const rosterLines = (
  passages: readonly PassageItem[],
  day: string,
): PassageItem[] => [
  ...passages.filter((passage) => passageStateOn(passage, day) === 'current'),
  ...passages.filter((passage) => passageStateOn(passage, day) === 'upcoming'),
];

/** The year a former passage ended in: the archive's groups. */
export const passageEndYear = (passage: Dated): number =>
  Number((passage.end ? approximateDateEnd(passage.end) : '').slice(0, 4));

/** The archive of a team: its former passages, the latest ended first. */
export const formerLines = (
  passages: readonly PassageItem[],
  day: string,
): PassageItem[] =>
  passages
    .filter((passage) => passageStateOn(passage, day) === 'former')
    .sort(
      (left, right) =>
        approximateDateEnd(right.end ?? right.start).localeCompare(
          approximateDateEnd(left.end ?? left.start),
        ) ||
        left.person.displayName.localeCompare(right.person.displayName, 'fr', {
          sensitivity: 'base',
        }),
    );

/** A search of the roster: every word in the name or the function. */
export const matchesRosterSearch = (
  passage: PassageItem,
  query: string,
): boolean => {
  const text = normalizeSearchText(
    `${passage.person.displayName} ${passage.function.name}`,
  );

  return normalizeSearchText(query)
    .split(' ')
    .filter(Boolean)
    .every((term) => text.includes(term));
};

/** The counts of the record's tabs: people there today, people gone. */
export type TeamPeopleCounts = Readonly<{
  formerCount: number;
  memberCount: number;
}>;

/** People in a state on a day, each once whatever their functions. */
export const countPeopleOn = (
  passages: readonly PassageItem[],
  day: string,
  state: PassageState,
): number =>
  new Set(
    passages
      .filter((passage) => passageStateOn(passage, day) === state)
      .map((passage) => passage.person.id),
  ).size;

export const peopleCountsOf = (
  passages: readonly PassageItem[],
  day: string,
): TeamPeopleCounts => ({
  formerCount: countPeopleOn(passages, day, 'former'),
  memberCount: countPeopleOn(passages, day, 'current'),
});

const since = (value: ApproximateDate): string =>
  `${value.precision === 'DAY' ? 'le ' : ''}${formatApproximateDate(value)}`;

/**
 * « depuis mars 2024 », « mars 2024 → juin 2025 », « 3 → 5 novembre 2026 »
 * (the year said once), « à partir du 1er
 * septembre 2026 » for a passage still to come.
 */
export const passagePeriodLabel = (passage: Dated, today: string): string => {
  if (passage.end) return formatApproximateRange(passage.start, passage.end);

  return passage.start.date > today
    ? `à partir ${passage.start.precision === 'DAY' ? 'du' : 'de'} ${formatApproximateDate(passage.start)}`
    : `depuis ${since(passage.start)}`;
};
