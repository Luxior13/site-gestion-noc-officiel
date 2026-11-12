/** Played online or at a LAN (11 November 2026). */
export const TOURNAMENT_FORMATS = ['ONLINE', 'LAN'] as const;
export type TournamentFormat = (typeof TOURNAMENT_FORMATS)[number];

export const TOURNAMENT_FORMAT_LABELS: Readonly<
  Record<TournamentFormat, string>
> = {
  LAN: 'LAN',
  ONLINE: 'En ligne',
};

/**
 * Where a tournament stands, computed from its dates (decision of
 * 8 November 2026), « Date à fixer » without one (12 November 2026), or
 * called off (« Annulé », 11 November 2026).
 */
export const TOURNAMENT_STATES = [
  'unscheduled',
  'upcoming',
  'ongoing',
  'finished',
  'cancelled',
] as const;
export type TournamentState = (typeof TOURNAMENT_STATES)[number];

export const TOURNAMENT_STATE_LABELS: Readonly<
  Record<TournamentState, string>
> = {
  cancelled: 'Annulé',
  finished: 'Terminé',
  ongoing: 'En cours',
  unscheduled: 'Date à fixer',
  upcoming: 'À venir',
};

/** The quick filters of the list, plural. */
export const TOURNAMENT_STATE_FILTER_LABELS: Readonly<
  Record<TournamentState, string>
> = {
  cancelled: 'Annulés',
  finished: 'Terminés',
  ongoing: 'En cours',
  unscheduled: 'Date à fixer',
  upcoming: 'À venir',
};

/** A tournament's dates are known to the day, or only to the month. */
export const TOURNAMENT_DATE_PRECISIONS = ['DAY', 'MONTH'] as const;
export type TournamentDatePrecision =
  (typeof TOURNAMENT_DATE_PRECISIONS)[number];

export const TOURNAMENT_NAME_MAX_LENGTH = 120;
/** « Saison 2 », « Split 1 », « 2027 » (12 November 2026). */
export const TOURNAMENT_EDITION_MAX_LENGTH = 40;
export const TOURNAMENT_LOCATION_MAX_LENGTH = 200;
export const TOURNAMENT_LINK_MAX_LENGTH = 500;
/** A line-up holds a team and its staff, never a crowd. */
export const TOURNAMENT_LINEUP_MAX = 30;
/** The last place a final ranking may give. */
export const TOURNAMENT_PLACEMENT_MAX = 10_000;

/** Slot of the record's save bar, outside the sections. */
export const TOURNAMENT_ACTION_BAR_SLOT = 'tournament-record-action-bar';
