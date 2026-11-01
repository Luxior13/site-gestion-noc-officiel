import { type RankedSearchItem } from '$components/layout/global-search.utils';
import {
  canAccessNavigationItem,
  getDefaultNavigationSpace,
  getNavigationAvailability,
  getNavigationSectionItems,
  type NavigationSpace,
  type NavItem,
} from '$constants/app.constants';
import { canSeeAccountSecurity } from '$features/account/account-sections';
import type { UserType } from '$types/auth.types';
import { normalizeSearchText } from '$utils/search-text.utils';

export type SearchCatalogItem = RankedSearchItem & {
  description?: string;
  groupLabel: string;
  href: string;
  icon: NavItem['icon'];
  /** A tab opens one section of a page; it is never suggested on its own. */
  kind: 'page' | 'tab';
  label: string;
  space: NavigationSpace;
};

type SearchUser =
  | (NonNullable<Parameters<typeof canAccessNavigationItem>[0]> &
      Partial<Pick<UserType, 'mustChangePassword'>>)
  | null;

type CatalogEntry = Pick<
  NavItem,
  'description' | 'href' | 'icon' | 'keywords' | 'label'
>;

const createCatalogItem = (
  item: CatalogEntry,
  space: NavigationSpace,
  place: { groupLabel: string; kind?: 'tab'; sectionLabel?: string },
): SearchCatalogItem => {
  const keywords = item.keywords?.join(' ') ?? '';
  // A tab is found by its own words: « compte » keeps naming the page.
  const groupLabel = place.kind === 'tab' ? '' : place.groupLabel;

  return {
    description: item.description,
    groupLabel: place.groupLabel,
    href: item.href,
    icon: item.icon,
    keywordSearchText: normalizeSearchText(keywords),
    kind: place.kind ?? 'page',
    label: item.label,
    labelSearchText: normalizeSearchText(item.label),
    searchText: normalizeSearchText(
      `${groupLabel} ${place.sectionLabel ?? ''} ${item.label} ${item.description ?? ''} ${keywords}`,
    ),
    sectionSearchText: normalizeSearchText(place.sectionLabel ?? ''),
    space,
    spaceSearchText: normalizeSearchText(groupLabel),
  };
};

// Tabs of Mon compte reached straight from the search (audit RR-07), in
// their page order, each under the rule that shows it on the page.
const ACCOUNT_TABS: ReadonlyArray<
  CatalogEntry & { isVisible: (user: NonNullable<SearchUser>) => boolean }
> = [
  {
    description: 'Vos autorisations, en lecture seule.',
    href: '/mon-compte?section=access',
    icon: 'Shield',
    // Always shown: a read-only summary of one's own rights (DRT-07).
    isVisible: () => true,
    keywords: ['droits', 'permissions', 'accès'],
    label: 'Autorisations',
  },
  {
    description: 'Mot de passe, double authentification et sessions.',
    href: '/mon-compte?section=security',
    icon: 'Key',
    isVisible: canSeeAccountSecurity,
    keywords: ['codes de secours', 'appareils', '2fa', 'mfa'],
    label: 'Sécurité',
  },
];

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
        keywords: ['email de contact'],
        label: 'Mon compte',
      },
      accountSpace,
      { groupLabel: 'Compte personnel' },
    ),
  );
  for (const { isVisible, ...tab } of ACCOUNT_TABS) {
    if (isVisible(user))
      results.push(
        createCatalogItem(tab, accountSpace, {
          groupLabel: 'Mon compte',
          kind: 'tab',
        }),
      );
  }

  return results;
};

export const getSuggestedSearchItems = (
  results: readonly SearchCatalogItem[],
  activeSpace: NavigationSpace,
  limit = 8,
): SearchCatalogItem[] => {
  const pages = results.filter((result) => result.kind === 'page');
  const activeSpaceResults = pages.filter(
    (result) => result.space.id === activeSpace.id,
  );
  const otherResults = pages.filter(
    (result) => result.space.id !== activeSpace.id,
  );

  return [...activeSpaceResults, ...otherResults].slice(0, limit);
};
