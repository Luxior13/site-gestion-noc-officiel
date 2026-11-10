/**
 * Which games and teams an account reaches in the Esport pole (owner,
 * 10 November 2026: « c'est l'utilisateur et ses autorisations qui font, pas
 * un rôle dans une équipe »). Chosen in the account's authorizations; a
 * function held in a roster never opens anything. The permissions say what
 * the account may do, the scope where.
 */
export const ESPORT_SCOPE_KINDS = ['ALL', 'GAMES', 'TEAMS'] as const;
export type EsportScopeKind = (typeof ESPORT_SCOPE_KINDS)[number];

export const ESPORT_SCOPE_LABELS: Readonly<Record<EsportScopeKind, string>> = {
  ALL: 'Tous les jeux',
  GAMES: 'Certains jeux',
  TEAMS: 'Certaines équipes',
};

export const ESPORT_SCOPE_DESCRIPTIONS: Readonly<
  Record<EsportScopeKind, string>
> = {
  ALL: 'Tous les jeux et toutes leurs équipes.',
  GAMES: 'Ces jeux et toutes leurs équipes, celles créées plus tard comprises.',
  TEAMS: 'Ces équipes seulement, chacune avec son jeu.',
};

/** At most this many games or teams in one scope. */
export const ESPORT_SCOPE_MAX_ITEMS = 50;

/** A scope as the editor and the API carry it. */
export type EsportScopeValue = Readonly<{
  gameIds: readonly string[];
  kind: EsportScopeKind;
  teamIds: readonly string[];
}>;

export const FULL_ESPORT_SCOPE_VALUE: EsportScopeValue = {
  gameIds: [],
  kind: 'ALL',
  teamIds: [],
};

const sortedUnique = (ids: readonly string[]): string[] =>
  [...new Set(ids)].sort();

/**
 * Only the ids its kind reads, sorted and once each: two scopes are the same
 * when their normal forms are.
 */
export const normalizeEsportScope = (
  value: EsportScopeValue,
): EsportScopeValue => ({
  gameIds: value.kind === 'GAMES' ? sortedUnique(value.gameIds) : [],
  kind: value.kind,
  teamIds: value.kind === 'TEAMS' ? sortedUnique(value.teamIds) : [],
});

export const sameEsportScope = (
  first: EsportScopeValue,
  second: EsportScopeValue,
): boolean => {
  const a = normalizeEsportScope(first);
  const b = normalizeEsportScope(second);

  return (
    a.kind === b.kind &&
    a.gameIds.join(',') === b.gameIds.join(',') &&
    a.teamIds.join(',') === b.teamIds.join(',')
  );
};

/** A restricted scope with nothing chosen: it would open nothing. */
export const isEmptyEsportScope = (value: EsportScopeValue): boolean =>
  (value.kind === 'GAMES' && value.gameIds.length === 0) ||
  (value.kind === 'TEAMS' && value.teamIds.length === 0);

/** Every game and team, in their dragged order, to choose from. */
export type EsportScopeOptions = Readonly<{
  games: readonly Readonly<{ id: string; isActive: boolean; name: string }>[];
  teams: readonly Readonly<{
    gameId: string;
    id: string;
    isActive: boolean;
    name: string;
  }>[];
}>;
