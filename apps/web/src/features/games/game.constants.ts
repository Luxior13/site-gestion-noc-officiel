/** Limits shared by the form, the API and the database (CHECK constraints). */
export const GAME_NAME_MAX_LENGTH = 60;
export const GAME_SHORT_NAME_MAX_LENGTH = 12;

export const GAME_STATE_FILTERS = ['all', 'active', 'inactive'] as const;
export type GameStateFilter = (typeof GAME_STATE_FILTERS)[number];

export const GAME_STATE_FILTER_LABELS: Record<GameStateFilter, string> = {
  active: 'Actifs',
  all: 'Tous',
  inactive: 'Inactifs',
};

/** Where the record's save bar renders: at page level, outside the tabs. */
export const GAME_ACTION_BAR_SLOT = 'game-record-action-bar';
