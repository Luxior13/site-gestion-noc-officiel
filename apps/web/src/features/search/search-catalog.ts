import {
  normalizeSearchValue,
  type RankedSearchItem,
} from '$components/layout/global-search.utils';
import {
  canAccessNavigationItem,
  getDefaultNavigationSpace,
  getNavigationAvailability,
  getNavigationSectionItems,
  type NavigationSpace,
  type NavItem,
} from '$constants/app.constants';

export type SearchCatalogItem = RankedSearchItem & {
  description?: string;
  groupLabel: string;
  href: string;
  icon: NavItem['icon'];
  label: string;
  space: NavigationSpace;
};

type SearchUser = Parameters<typeof canAccessNavigationItem>[0];

const createCatalogItem = (
  item: Pick<NavItem, 'description' | 'href' | 'icon' | 'keywords' | 'label'>,
  space: NavigationSpace,
  place: { groupLabel: string; sectionLabel?: string },
): SearchCatalogItem => {
  const keywords = item.keywords?.join(' ') ?? '';

  return {
    description: item.description,
    groupLabel: place.groupLabel,
    href: item.href,
    icon: item.icon,
    keywordSearchText: normalizeSearchValue(keywords),
    label: item.label,
    labelSearchText: normalizeSearchValue(item.label),
    searchText: normalizeSearchValue(
      `${place.groupLabel} ${place.sectionLabel ?? ''} ${item.label} ${item.description ?? ''} ${keywords}`,
    ),
    sectionSearchText: normalizeSearchValue(place.sectionLabel ?? ''),
    space,
    spaceSearchText: normalizeSearchValue(place.groupLabel),
  };
};

export const buildSearchCatalog = (
  spaces: readonly NavigationSpace[],
  user: SearchUser,
): SearchCatalogItem[] => {
  const seenHrefs = new Set<string>();
  const results: SearchCatalogItem[] = [];

  for (const space of spaces) {
    for (const section of space.sections) {
      for (const item of getNavigationSectionItems(section)) {
        if (
          seenHrefs.has(item.href) ||
          getNavigationAvailability(item) !== 'live' ||
          !canAccessNavigationItem(user, item)
        ) {
          continue;
        }

        seenHrefs.add(item.href);
        results.push(
          createCatalogItem(item, space, {
            groupLabel: space.label,
            sectionLabel: section.label,
          }),
        );
      }
    }
  }

  if (!user || seenHrefs.has('/mon-compte')) return results;

  const accountSpace =
    spaces.find((space) => space.id === 'dashboard') ??
    getDefaultNavigationSpace();
  results.push(
    createCatalogItem(
      {
        // The account menu names the same three tabs (AC-38, RR-02).
        description: 'Profil, autorisations et sécurité.',
        href: '/mon-compte',
        icon: 'UserCheck',
        keywords: [
          'mot de passe',
          'double authentification',
          'codes de secours',
          'sessions',
          'email de contact',
          'droits',
          'permissions',
        ],
        label: 'Mon compte',
      },
      accountSpace,
      { groupLabel: 'Compte personnel' },
    ),
  );

  return results;
};

export const getSuggestedSearchItems = (
  results: readonly SearchCatalogItem[],
  activeSpace: NavigationSpace,
  limit = 8,
): SearchCatalogItem[] => {
  const activeSpaceResults = results.filter(
    (result) => result.space.id === activeSpace.id,
  );
  const otherResults = results.filter(
    (result) => result.space.id !== activeSpace.id,
  );

  return [...activeSpaceResults, ...otherResults].slice(0, limit);
};
