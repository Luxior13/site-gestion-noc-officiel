/** Stable page destinations, independent of navigation labels and API paths. */
export const PAGE_PATHS = {
  account: '/mon-compte',
  games: '/esport/jeux',
  home: '/',
  internalNews: '/activite/actualites',
  login: '/login',
  newPerson: '/personnes/repertoire/nouveau',
  newUser: '/systeme/utilisateurs/nouveau',
  persons: '/personnes/repertoire',
  roadmap: '/systeme/feuille-de-route',
  staff: '/structure/bureau-staff',
  system: '/systeme',
  systemActivity: '/systeme/journal-activite',
  systemSettings: '/systeme/parametres',
  users: '/systeme/utilisateurs',
} as const;

// These aliases go straight to the canonical destination. Only the resource
// collections accept suffixes; an alias creates no new page. The pole Membres
// became Personnes on 8 November 2026: /personnes is now the pole itself, so
// its former alias (/personnes/:id) is gone.
export const LEGACY_PAGE_ALIASES = [
  {
    collection: true,
    destination: PAGE_PATHS.persons,
    source: '/membres/repertoire',
  },
  {
    collection: true,
    destination: PAGE_PATHS.persons,
    source: '/vie-interne/repertoire',
  },
  {
    collection: true,
    destination: PAGE_PATHS.users,
    source: '/administration/utilisateurs',
  },
  {
    collection: false,
    destination: PAGE_PATHS.roadmap,
    source: '/vie-interne/actualite-interne',
  },
  // The internal news module is parked on the roadmap: its former page now
  // leads to the planning page instead of exposing a removed destination.
  {
    collection: false,
    destination: PAGE_PATHS.roadmap,
    source: PAGE_PATHS.internalNews,
  },
  {
    collection: false,
    destination: PAGE_PATHS.roadmap,
    source: '/feuille-de-route',
  },
  {
    collection: false,
    destination: PAGE_PATHS.users,
    source: '/administration',
  },
  {
    collection: false,
    destination: PAGE_PATHS.home,
    source: '/tableau-de-bord',
  },
  // The notifications module was parked on the roadmap: its former inbox now
  // leads to the planning page instead of exposing a removed destination.
  {
    collection: false,
    destination: PAGE_PATHS.roadmap,
    source: '/mes-notifications',
  },
  {
    collection: false,
    destination: PAGE_PATHS.roadmap,
    source: '/tableau-de-bord/mes-notifications',
  },
  // The full search page was removed: its former URL returns to the home page
  // while the header quick navigation keeps the shared page catalogue.
  {
    collection: false,
    destination: PAGE_PATHS.home,
    source: '/recherche',
  },
] as const;

// Temporary (307) on purpose: a browser keeps a permanent redirect in its
// cache, so an address reused later (/personnes became a pole on 8 November
// 2026) stayed trapped in the former destination. The site is private: no
// search engine needs the permanent form.
export const PAGE_REDIRECTS = LEGACY_PAGE_ALIASES.map((alias) => ({
  destination: `${alias.destination}${alias.collection ? '/:path*' : ''}`,
  permanent: false,
  source: `${alias.source}${alias.collection ? '/:path*' : ''}`,
}));

export const getCanonicalPagePathname = (pathname: string): string => {
  const alias = LEGACY_PAGE_ALIASES.find(
    (entry) =>
      pathname === entry.source ||
      (entry.collection && pathname.startsWith(`${entry.source}/`)),
  );

  return alias
    ? `${alias.destination}${pathname.slice(alias.source.length)}`
    : pathname;
};

export const gameDetailPath = (id: string): string =>
  `${PAGE_PATHS.games}/${encodeURIComponent(id)}`;

/** Team records sit in the Esport pole, outside the Jeux list's path. */
export const TEAM_RECORDS_PATH = '/esport/equipes';

export const teamDetailPath = (id: string): string =>
  `${TEAM_RECORDS_PATH}/${encodeURIComponent(id)}`;

export const personDetailPath = (id: string): string =>
  `${PAGE_PATHS.persons}/${encodeURIComponent(id)}`;

export const userDetailPath = (id: string): string =>
  `${PAGE_PATHS.users}/${encodeURIComponent(id)}`;
