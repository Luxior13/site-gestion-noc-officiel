import { describe, expect, it } from 'vitest';

import {
  canAccessNavigationItem,
  getActiveNavigationSpace,
  getDesktopSidebarSections,
  getNavigationAvailability,
  getNavigationSpaceItems,
  getVisibleNavigationSpaces,
  NAV_SPACES,
  type NavigationAvailabilityFilter,
  type NavItem,
} from '$constants/app.constants';
import {
  PERMISSIONS,
  ROADMAP_PERMISSIONS,
} from '$constants/permissions.constants';
import { ROADMAP_ITEMS } from '$features/roadmap/roadmap.constants';

type TestUser = {
  isProtected: boolean;
  permissions: Record<string, boolean>;
  role: 'ADMIN' | 'USER';
};

function buildUser(
  permissions: Record<string, boolean> = {},
  isProtected = false,
): TestUser {
  return {
    isProtected,
    permissions,
    role: 'USER',
  } as const;
}

function buildAdmin(): TestUser {
  return {
    isProtected: false,
    permissions: {},
    role: 'ADMIN',
  };
}

function flattenHrefs(items: readonly NavItem[]): string[] {
  return items.flatMap((item) => [
    item.href,
    ...flattenHrefs(item.children ?? []),
  ]);
}

function getVisibleHrefs(
  permissions: Record<string, boolean> = {},
  isProtected = false,
  availability: NavigationAvailabilityFilter = 'live',
): string[] {
  return getVisibleNavigationSpaces(
    buildUser(permissions, isProtected),
    availability,
  )
    .flatMap((space) => space.sections)
    .flatMap((section) => flattenHrefs(section.items));
}

function getRoadmapHrefs(): string[] {
  return ROADMAP_ITEMS.flatMap((item) => item.legacyHrefs ?? []);
}

describe('navigation availability', () => {
  it('shows the live baseline destinations without individual grants', () => {
    const hrefs = getVisibleHrefs({
      [PERMISSIONS.DASHBOARD.VIEW]: false,
    });

    expect(hrefs).toEqual(['/', '/systeme/feuille-de-route']);
    expect(hrefs).not.toContain('/tableau-de-bord/mes-taches');
    expect(hrefs).not.toContain('/vie-interne');
  });

  it('publishes the complete roadmap without dormant permission grants', () => {
    const hrefs = getRoadmapHrefs();

    expect(hrefs).toContain('/tableau-de-bord/mes-taches');
    expect(hrefs).toContain('/vie-interne/reunions');
    expect(hrefs).toContain('/bureau-juridique/decisions-bureau');
    expect(hrefs).not.toContain('/personnes/repertoire');
    expect(hrefs).toContain('/bureau-juridique/documents');
    expect(hrefs).toContain('/bureau-juridique/partenaires');
    expect(hrefs).toContain('/tresorerie/operations');
    expect(hrefs).toContain('/sport-team-control');
    expect(hrefs).not.toContain('/systeme/parametres');
  });

  it('keeps planned capabilities ineffective and outside the operational menu', () => {
    const tasks: NavItem = {
      href: '/tableau-de-bord/mes-taches',
      icon: 'ClipboardList',
      label: 'Mes tâches',
      requiredPermissions: [ROADMAP_PERMISSIONS.TASKS.VIEW],
    };
    expect(
      NAV_SPACES.flatMap(getNavigationSpaceItems).some(
        (item) => item.href === tasks.href,
      ),
    ).toBe(false);
    expect(getNavigationAvailability(tasks)).toBe('planned');
    expect(
      canAccessNavigationItem(
        buildUser({ [ROADMAP_PERMISSIONS.TASKS.VIEW]: true }),
        tasks,
      ),
    ).toBe(false);
  });

  it('does not let the protected bypass hide a typo on a live item', () => {
    const mistypedLiveItem: NavItem = {
      availability: 'live',
      href: '/test-live',
      icon: 'Settings',
      label: 'Test live',
      requiredPermissions: ['users:veiw'],
    };
    const plannedItem: NavItem = {
      href: '/test-planned',
      icon: 'Settings',
      label: 'Test planned',
      requiredPermissions: [ROADMAP_PERMISSIONS.TASKS.VIEW],
    };

    expect(canAccessNavigationItem(buildUser({}, true), mistypedLiveItem)).toBe(
      false,
    );
    expect(canAccessNavigationItem(buildUser({}, true), plannedItem)).toBe(
      true,
    );
  });

  it('groups live user administration under the system space', () => {
    const hrefs = getVisibleHrefs({ [PERMISSIONS.USERS.VIEW]: true });

    expect(hrefs).toContain('/systeme/utilisateurs');
    expect(hrefs).not.toContain('/systeme');
    expect(hrefs).not.toContain('/systeme/parametres');
    expect(hrefs).not.toContain('/systeme/journal-activite');
  });

  it('publishes the canonical persons page in the internal space', () => {
    const user = buildUser({ [PERMISSIONS.PERSONS.VIEW]: true });
    const hrefs = getVisibleHrefs(user.permissions);

    expect(hrefs).toContain('/personnes/repertoire');
    expect(hrefs).not.toContain('/vie-interne/membres');
    expect(hrefs).not.toContain('/bureau-juridique/personnes-contacts');
    expect(
      getActiveNavigationSpace('/personnes/repertoire', [
        ...getVisibleNavigationSpaces(user),
      ]).id,
    ).toBe('internal');
  });

  it('shows system settings live for administrators and removes them from the roadmap', () => {
    const liveHrefs = getVisibleHrefs({
      [ROADMAP_PERMISSIONS.BACKUPS.VIEW]: true,
    });
    const adminHrefs = getVisibleNavigationSpaces(buildAdmin()).flatMap(
      (space) =>
        space.sections.flatMap((section) => flattenHrefs(section.items)),
    );
    const roadmapHrefs = getRoadmapHrefs();

    expect(liveHrefs).not.toContain('/systeme/journal-activite');
    expect(liveHrefs).not.toContain('/systeme');
    expect(liveHrefs).not.toContain('/systeme/utilisateurs');
    expect(liveHrefs).not.toContain('/systeme/parametres');
    expect(adminHrefs).toContain('/systeme/parametres');
    expect(roadmapHrefs).not.toContain('/systeme/parametres');
    expect(roadmapHrefs).not.toContain('/systeme/journal-activite');
  });

  it('keeps the desktop sidebar live on a direct planned route', () => {
    const sidebarHrefs = getDesktopSidebarSections(
      buildUser(),
      '/vie-interne/reunions',
    ).flatMap((section) => flattenHrefs(section.items));

    expect(sidebarHrefs).toEqual(['/']);
    expect(sidebarHrefs).not.toContain('/vie-interne/reunions');
  });

  it('detects active live spaces for dashboard and administration routes', () => {
    const user = buildUser({ [PERMISSIONS.USERS.VIEW]: true });
    const spaces = getVisibleNavigationSpaces(user);

    expect(getActiveNavigationSpace('/', spaces).id).toBe('dashboard');
    expect(getActiveNavigationSpace('/systeme/utilisateurs', spaces).id).toBe(
      'system',
    );
    const personSpaces = getVisibleNavigationSpaces(
      buildUser({ [PERMISSIONS.PERSONS.VIEW]: true }),
    );
    expect(
      getActiveNavigationSpace('/personnes/repertoire', personSpaces).id,
    ).toBe('internal');
    // The system pole has no hub page anymore: its remaining destinations must
    // still resolve to the system space for the sidebar highlight.
    expect(
      getActiveNavigationSpace(
        '/systeme/parametres',
        getVisibleNavigationSpaces(buildAdmin()),
      ).id,
    ).toBe('system');
  });

  it('returns only planned destinations from the roadmap helper', () => {
    const hrefs = getRoadmapHrefs();

    expect(hrefs).toContain('/vie-interne/reunions');
    expect(hrefs).not.toContain('/personnes/repertoire');
    expect(hrefs).not.toContain('/');
    expect(hrefs).not.toContain('/mon-compte');
    expect(hrefs).not.toContain('/systeme/utilisateurs');
  });

  it('shows only live destinations to protected users by default', () => {
    const liveHrefs = getVisibleHrefs({}, true);
    const allHrefs = getVisibleHrefs({}, true, 'all');
    const rawHrefs = NAV_SPACES.flatMap((space) => space.sections).flatMap(
      (section) => flattenHrefs(section.items),
    );

    expect(liveHrefs).toEqual([
      '/',
      '/personnes/repertoire',
      '/systeme/utilisateurs',
      '/systeme/journal-activite',
      '/systeme/parametres',
      '/systeme/feuille-de-route',
    ]);
    expect(allHrefs).toEqual(rawHrefs);
  });
});
