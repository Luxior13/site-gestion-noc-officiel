import type { FunctionScopeType } from '$features/member-functions/member-function.constants';
import type { StatusBadgeTone } from '$ui/status-badge';
import {
  type ApproximateDate,
  approximateDateEnd,
  formatApproximateDate,
  formatApproximateRange,
} from '$utils/approximate-date.utils';
import { normalizeSearchText } from '$utils/search-text.utils';

import type {
  JourneyItem,
  PassageItem,
  PassageScope,
} from './types/passage.types';

type Dated = Readonly<{ end: ApproximateDate | null; start: ApproximateDate }>;

/** How a place says itself on screen: a team's Roster, the structure's Effectif. */
export type PlaceWords = Readonly<{
  /** The list of functions it chooses from. */
  addFunctions: string;
  /** « Ce jeu n’a pas encore de fonctions (Joueur, Coach…). » */
  functionScope: FunctionScopeType;
  /** « Les ajouter dans la fiche du jeu ». */
  loadError: string;
  /** « Le Roster ne peut pas être chargé ». */
  members: string;
  /** What an empty list invites to add. */
  noFunctions: string;
  /** « du Roster », « de l’Effectif ». */
  ofList: string;
  /** « le Roster », « l’Effectif ». */
  theList: string;
  /** « au Roster », « à l’Effectif ». */
  toList: string;
}>;

const TEAM_WORDS: PlaceWords = {
  addFunctions: 'Les ajouter dans la fiche du jeu',
  functionScope: 'game',
  loadError: 'Le Roster ne peut pas être chargé',
  members: 'les joueurs et l’encadrement',
  noFunctions: 'Ce jeu n’a pas encore de fonctions (Joueur, Coach…).',
  ofList: 'du Roster',
  theList: 'le Roster',
  toList: 'au Roster',
};

/** « Effectif » for Bureau & staff, where « roster » would sound wrong. */
const STRUCTURE_WORDS: PlaceWords = {
  addFunctions: 'Les ajouter dans l’onglet Fonctions',
  functionScope: 'structure',
  loadError: 'L’Effectif ne peut pas être chargé',
  members: 'le bureau et le staff',
  noFunctions:
    'La structure n’a pas encore de fonctions (Président, Graphiste…).',
  ofList: 'de l’Effectif',
  theList: 'l’Effectif',
  toList: 'à l’Effectif',
};

export const placeWordsOf = (type: PassageScope['type']): PlaceWords =>
  type === 'team' ? TEAM_WORDS : STRUCTURE_WORDS;

export type PassageState = 'current' | 'former' | 'upcoming';

const STATE_BADGES: ReadonlyMap<
  PassageState,
  Readonly<{ label: string; tone: StatusBadgeTone }>
> = new Map([
  ['current', { label: 'Actuel', tone: 'success' }],
  // The mauve grey of what is past, as a former member (10 November 2026).
  ['former', { label: 'Ancien', tone: 'former' }],
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

/**
 * A person's journey in two blocks, never mixed, as the Roster and its former
 * members: what is there and coming (the earliest start first, those to come
 * after), then what ended (the latest end first).
 */
export const journeyBlocks = (
  passages: readonly JourneyItem[],
  day: string,
): Readonly<{ current: JourneyItem[]; former: JourneyItem[] }> => {
  const byStart = (left: Dated, right: Dated): number =>
    left.start.date.localeCompare(right.start.date);
  const of = (state: PassageState): JourneyItem[] =>
    passages
      .filter((passage) => passageStateOn(passage, day) === state)
      .sort(byStart);

  return {
    current: [...of('current'), ...of('upcoming')],
    former: of('former').sort(
      (left, right) =>
        approximateDateEnd(right.end ?? right.start).localeCompare(
          approximateDateEnd(left.end ?? left.start),
        ) || byStart(right, left),
    ),
  };
};

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
