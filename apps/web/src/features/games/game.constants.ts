/** Limits shared by the form, the API and the database (CHECK constraints). */
export const GAME_NAME_MAX_LENGTH = 60;
export const GAME_SHORT_NAME_MAX_LENGTH = 12;
/** Earliest and latest year accepted for a first opening. */
export const GAME_FIRST_YEAR = 1970;
export const GAME_LAST_YEAR = 2100;

/**
 * How precisely a date is known (registre historique): a date known to the
 * year is entered to the year, without an invented day.
 */
export const DATE_PRECISIONS = ['DAY', 'MONTH', 'YEAR'] as const;
export type DatePrecision = (typeof DATE_PRECISIONS)[number];

export const DATE_PRECISION_LABELS: Record<DatePrecision, string> = {
  DAY: 'Jour précis',
  MONTH: 'Mois',
  YEAR: 'Année',
};

export const GAME_STATE_FILTERS = ['all', 'active', 'inactive'] as const;
export type GameStateFilter = (typeof GAME_STATE_FILTERS)[number];

export const GAME_STATE_FILTER_LABELS: Record<GameStateFilter, string> = {
  active: 'Actifs',
  all: 'Tous',
  inactive: 'Inactifs',
};
