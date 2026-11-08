import { FEATURES } from '$constants/feature-registry.constants';
import {
  getAccessLabel as getPermissionAccessLabel,
  hasPermission,
  isKnownPermissionKey,
  type PermissionsData,
} from '$constants/permissions.constants';
import { PAGE_PATHS } from '$constants/routes.constants';
import type { UserType } from '$types/auth.types';
import type {
  NavigationAvailability,
  NavigationAvailabilityFilter,
  NavigationSpace,
  NavItem,
  NavSection,
} from '$types/navigation.types';
export const SITE_CONFIG = {
  description: 'Espace de gestion de Noctambule.',
  logo: '/assets/noc.png',
  name: 'Noctambule',
  subtitle: 'Espace de gestion',
  tag: 'NC',
};

export type {
  NavigationAvailability,
  NavigationAvailabilityFilter,
  NavigationSpace,
  NavItem,
  NavSection,
} from '$types/navigation.types';

type NavigationUser = Pick<
  UserType,
  'isProtected' | 'permissions' | 'role'
> | null;

const featureNavigation = (
  feature: (typeof FEATURES)[keyof typeof FEATURES],
): NavItem => ({
  availability: 'live',
  description: feature.description,
  featureId: feature.id,
  href: feature.href,
  icon: feature.icon,
  keywords: feature.keywords,
  label: feature.label,
  permissionMode: feature.permissionMode,
  requiredPermissions: feature.requiredPermissions,
});

export const NAV_SPACES: NavigationSpace[] = [
  {
    description: 'Ce qui m’attend et ce que je dois traiter.',
    href: '/',
    icon: 'LayoutDashboard',
    id: 'dashboard',
    label: 'Aujourd’hui',
    sections: [
      {
        id: 'today',
        items: [featureNavigation(FEATURES.dashboard)],
        label: 'Pilotage',
        position: 'top',
      },
    ],
    summary: 'Ce qui m’attend',
    tone: 'dashboard',
  },
  {
    description: 'Identités, adhésions, recrutement et parcours des personnes.',
    href: PAGE_PATHS.persons,
    icon: 'Users',
    id: 'internal',
    label: 'Personnes',
    matchHrefs: ['/personnes'],
    sections: [
      {
        id: 'people',
        items: [featureNavigation(FEATURES.persons)],
        label: 'Identité',
        position: 'top',
      },
    ],
    summary: 'Qui est passé par la structure',
    tone: 'internal',
  },
  {
    description: 'Les jeux de la structure, leurs équipes et leurs tournois.',
    href: PAGE_PATHS.games,
    icon: 'Gamepad2',
    id: 'esport',
    label: 'Esport',
    matchHrefs: ['/esport'],
    sections: [
      {
        id: 'sections',
        items: [featureNavigation(FEATURES.games)],
        label: 'Sections',
        position: 'top',
      },
    ],
    summary: 'Quelles équipes, quels tournois',
    tone: 'esport',
  },
  {
    description: 'Comptes, sécurité, configuration et projet.',
    href: '/systeme',
    icon: 'Settings',
    id: 'system',
    label: 'Système',
    // Former addresses are redirected before the application: only the
    // pole prefix is needed once the space href follows the visible pages.
    matchHrefs: [PAGE_PATHS.system],
    sections: [
      {
        id: 'system',
        items: [
          featureNavigation(FEATURES.users),
          featureNavigation(FEATURES.systemActivity),
          featureNavigation(FEATURES.systemSettings),
        ],
        label: 'Administration',
        position: 'top',
      },
      {
        // Open to every account (no permission of its own): it must not sit
        // under Administration for a member (audit DRT-04, 25 October 2026).
        id: 'project',
        items: [featureNavigation(FEATURES.roadmap)],
        label: 'Projet',
        position: 'top',
      },
    ],
    summary: 'Comptes, configuration et projet',
    tone: 'system',
  },
];

export function getNavigationAvailability(
  item: NavItem,
): NavigationAvailability {
  return item.availability ?? 'planned';
}

export const getAccessLabel = (
  user: Pick<UserType, 'isProtected' | 'role'>,
): string => {
  return getPermissionAccessLabel(user);
};

export function canAccessNavigationItem(
  user: NavigationUser,
  item: NavItem,
): boolean {
  if (!user) return false;
  if (!item.requiredPermissions?.length) return true;
  if (user.isProtected) {
    // A protected account must not hide a typo on a live navigation item.
    return (
      getNavigationAvailability(item) === 'planned' ||
      item.requiredPermissions.every(isKnownPermissionKey)
    );
  }

  const permissionChecks = item.requiredPermissions.map((permissionKey) =>
    hasPermission(
      user.role,
      permissionKey,
      user.permissions as PermissionsData | null,
    ),
  );

  return item.permissionMode === 'any'
    ? permissionChecks.some(Boolean)
    : permissionChecks.every(Boolean);
}

function filterNavItems(
  items: readonly NavItem[],
  user: NavigationUser,
  availability: NavigationAvailabilityFilter,
): NavItem[] {
  return items
    .map((item) => {
      const visibleChildren = item.children
        ? filterNavItems(item.children, user, availability)
        : undefined;

      return {
        ...item,
        ...(visibleChildren ? { children: visibleChildren } : {}),
      };
    })
    .filter((item) => {
      const hasVisibleChildren = (item.children?.length ?? 0) > 0;
      const hasExpectedAvailability =
        availability === 'all' ||
        getNavigationAvailability(item) === availability;

      return (
        hasVisibleChildren ||
        (hasExpectedAvailability && canAccessNavigationItem(user, item))
      );
    });
}

function filterNavSections(
  sections: readonly NavSection[],
  user: NavigationUser,
  availability: NavigationAvailabilityFilter,
): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: filterNavItems(section.items, user, availability),
    }))
    .filter((section) => section.items.length > 0);
}

function isPathInSpace(pathname: string, space: NavigationSpace): boolean {
  const matchHrefs = [space.href, ...(space.matchHrefs ?? [])];

  return matchHrefs.some(
    (href) => pathname === href || pathname.startsWith(`${href}/`),
  );
}

function filterNavigationSpace(
  space: NavigationSpace,
  user: NavigationUser,
  availability: NavigationAvailabilityFilter = 'live',
): NavigationSpace {
  const sections = filterNavSections(space.sections, user, availability);
  const visibleItems = flattenNavItems(
    sections.flatMap((section) => section.items),
  );
  const href = visibleItems.some((item) => item.href === space.href)
    ? space.href
    : (visibleItems[0]?.href ?? space.href);

  return {
    ...space,
    href,
    sections,
  };
}

function flattenNavItems(items: readonly NavItem[]): NavItem[] {
  return items.flatMap((item) => [
    item,
    ...flattenNavItems(item.children ?? []),
  ]);
}

export function getNavigationSectionItems(section: NavSection): NavItem[] {
  return flattenNavItems(section.items);
}

export function getNavigationSpaceItems(space: NavigationSpace): NavItem[] {
  return space.sections.flatMap(getNavigationSectionItems);
}

export function getVisibleNavigationSpaces(
  user: NavigationUser,
  availability: NavigationAvailabilityFilter = 'live',
): NavigationSpace[] {
  return NAV_SPACES.map((space) =>
    filterNavigationSpace(space, user, availability),
  ).filter((space) => space.sections.length > 0);
}

export function getDefaultNavigationSpace(): NavigationSpace {
  const fallbackSpace = NAV_SPACES.find((space) => space.id === 'dashboard');

  if (!fallbackSpace) {
    throw new Error('Navigation space dashboard is missing');
  }

  return fallbackSpace;
}

export function getActiveNavigationSpace(
  pathname: string,
  spaces: readonly NavigationSpace[] = NAV_SPACES,
): NavigationSpace {
  const activeSpace = spaces.find((space) => isPathInSpace(pathname, space));

  return activeSpace ?? spaces[0] ?? getDefaultNavigationSpace();
}

export function getDesktopSidebarSections(
  user: NavigationUser,
  pathname: string,
): NavSection[] {
  const visibleSpaces = getVisibleNavigationSpaces(user, 'live');

  // Never reveal the unfiltered dashboard when every space is denied.
  if (visibleSpaces.length === 0) return [];

  const activeSpace = getActiveNavigationSpace(pathname, visibleSpaces);

  return activeSpace.sections;
}
