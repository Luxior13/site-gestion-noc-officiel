import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  type RankedSearchItem,
  rankSearchResults,
} from '$components/layout/global-search.utils';
import {
  getActiveNavigationSpace,
  getVisibleNavigationSpaces,
} from '$constants/app.constants';
import { PERMISSIONS } from '$constants/permissions.constants';
import { canSeeAccountSecurity } from '$features/account/account-sections';
import {
  buildSearchCatalog,
  getSuggestedSearchItems,
} from '$features/search/search-catalog';
import { normalizeSearchText } from '$utils/search-text.utils';

type SearchFixture = RankedSearchItem & {
  id: string;
};

const createFixture = ({
  description = '',
  id,
  label,
  space = '',
}: {
  description?: string;
  id: string;
  label: string;
  space?: string;
}): SearchFixture => ({
  id,
  labelSearchText: normalizeSearchText(label),
  searchText: normalizeSearchText(`${space} ${label} ${description}`),
  spaceSearchText: normalizeSearchText(space),
});

// Static, test-owned path only.
// eslint-disable-next-line security/detect-non-literal-fs-filename
const globalSearchSource = readFileSync(
  new URL('../components/layout/GlobalSearch.tsx', import.meta.url),
  'utf8',
);
// Static, test-owned path only.
// eslint-disable-next-line security/detect-non-literal-fs-filename
const searchCatalogSource = readFileSync(
  new URL('../features/search/search-catalog.ts', import.meta.url),
  'utf8',
);

// Static, test-owned path only.
// eslint-disable-next-line security/detect-non-literal-fs-filename
const commandSource = readFileSync(
  new URL('../components/ui/command.tsx', import.meta.url),
  'utf8',
);

describe('global page search', () => {
  it('matches page content without inheriting unrelated section summary terms', () => {
    const user = { isProtected: true, permissions: {}, role: 'ADMIN' as const };
    const catalog = buildSearchCatalog(
      getVisibleNavigationSpaces(user, 'live'),
      user,
    );

    expect(
      rankSearchResults(catalog, normalizeSearchText('compte')).map(
        (item) => item.href,
      ),
    ).toEqual(['/mon-compte', '/systeme/utilisateurs']);
    expect(
      rankSearchResults(catalog, normalizeSearchText('SYSTÈME')).map(
        (item) => item.href,
      ),
    ).toEqual([
      '/systeme/parametres',
      '/systeme/utilisateurs',
      '/systeme/journal-activite',
      '/systeme/feuille-de-route',
    ]);
  });

  it('keeps forbidden destinations out of matching page descriptions', () => {
    const user = { isProtected: false, permissions: {}, role: 'USER' as const };
    const catalog = buildSearchCatalog(
      getVisibleNavigationSpaces(user, 'live'),
      user,
    );

    expect(
      rankSearchResults(catalog, normalizeSearchText('compte')).map(
        (item) => item.href,
      ),
    ).toEqual(['/mon-compte']);
    // Mon compte has its own Autorisations tab (AC-38); Utilisateurs stays out.
    expect(
      rankSearchResults(catalog, normalizeSearchText('autorisations')).map(
        (item) => item.href,
      ),
    ).toEqual(['/mon-compte?section=access', '/mon-compte']);
  });

  // Audit RR-01 to RR-05 of 31 October 2026: the words people actually use.
  const searchAs = (
    user: Parameters<typeof buildSearchCatalog>[1],
    query: string,
  ): string[] =>
    rankSearchResults(
      buildSearchCatalog(getVisibleNavigationSpaces(user, 'live'), user),
      normalizeSearchText(query),
    ).map((item) => item.href);
  const superadmin = {
    isProtected: true,
    permissions: {},
    role: 'ADMIN' as const,
  };
  const member = { isProtected: false, permissions: {}, role: 'USER' as const };

  it.each([
    ['personne', '/personnes/repertoire'],
    ['logs', '/systeme/journal-activite'],
    ['historique', '/systeme/journal-activite'],
    ['mot de passe', '/mon-compte?section=security'],
    ['double authentification', '/mon-compte?section=security'],
    ['sécurité', '/mon-compte?section=security'],
    ['réglages', '/systeme/parametres'],
    ['tableau de bord', '/'],
    ['projet', '/systeme/feuille-de-route'],
    ['droits', '/systeme/utilisateurs'],
  ])('finds the page meant by « %s » first', (query, href) => {
    expect(searchAs(superadmin, query)[0]).toBe(href);
  });

  it('finds the pages of a navigation section by its name', () => {
    expect(searchAs(superadmin, 'Administration')).toEqual([
      '/systeme/utilisateurs',
      '/systeme/journal-activite',
      '/systeme/parametres',
    ]);
  });

  it('never reveals a forbidden page through its keywords or section', () => {
    expect(searchAs(member, 'logs')).toEqual([]);
    expect(searchAs(member, 'personnes')).toEqual([]);
    expect(searchAs(member, 'administration')).toEqual([]);
    expect(searchAs(member, 'droits')).toEqual(['/mon-compte?section=access']);
  });

  // Audit RR-07: the Mon compte tabs, under the rule that shows them. Every
  // security permission of one's own account is always enabled, so even a
  // stale deny keeps Sécurité, on the page as in the search.
  it('opens the Mon compte tabs that the page shows', () => {
    const staleDenies = {
      ...member,
      permissions: {
        [PERMISSIONS.ACCOUNT.CHANGE_PASSWORD]: false,
        [PERMISSIONS.ACCOUNT.MANAGE_MFA]: false,
        [PERMISSIONS.ACCOUNT.MANAGE_SESSIONS]: false,
        [PERMISSIONS.ACCOUNT.VIEW_SECURITY]: false,
      },
    };

    expect(canSeeAccountSecurity(staleDenies)).toBe(true);
    expect(searchAs(staleDenies, 'mot de passe')).toEqual([
      '/mon-compte?section=security',
    ]);
    expect(searchAs(member, 'autorisations')[0]).toBe(
      '/mon-compte?section=access',
    );
  });

  it('suggests pages only, never a tab on its own', () => {
    const spaces = getVisibleNavigationSpaces(superadmin, 'live');
    const suggestions = getSuggestedSearchItems(
      buildSearchCatalog(spaces, superadmin),
      getActiveNavigationSpace('/', spaces),
    ).map((item) => item.href);

    expect(suggestions).toHaveLength(8);
    expect(suggestions.some((href) => href.includes('?'))).toBe(false);
  });

  it('normalizes accents, ligatures, punctuation and repeated spaces', () => {
    expect(normalizeSearchText('  Modèles—d’activité / ÉQUIPE & œuvre  ')).toBe(
      'modeles d activite equipe oeuvre',
    );
    expect(normalizeSearchText('Membres & adhérents')).toBe(
      'membres adherents',
    );
    expect(normalizeSearchText('… / —')).toBe('');
  });

  it('matches all query words regardless of punctuation or order', () => {
    const fixtures = [
      createFixture({
        id: 'users',
        label: 'Utilisateurs',
        space: 'Système',
      }),
      createFixture({
        id: 'journal',
        label: 'Journal d’activité',
        space: 'Système',
      }),
    ];

    expect(
      rankSearchResults(fixtures, normalizeSearchText('utilisateurs')).map(
        (item) => item.id,
      ),
    ).toEqual(['users']);
    expect(
      rankSearchResults(fixtures, normalizeSearchText('journal activite')).map(
        (item) => item.id,
      ),
    ).toEqual(['journal']);
  });

  it('ranks exact and label-prefix matches before descriptions', () => {
    const fixtures = [
      createFixture({
        description: 'Consulter le journal central.',
        id: 'description',
        label: 'Historique',
      }),
      createFixture({ id: 'prefix', label: 'Journal d’activité' }),
      createFixture({ id: 'exact', label: 'Journal' }),
    ];

    expect(
      rankSearchResults(fixtures, normalizeSearchText('journal')).map(
        (item) => item.id,
      ),
    ).toEqual(['exact', 'prefix', 'description']);
  });

  it('keeps catalog order for equal scores and respects the result limit', () => {
    const fixtures = ['first', 'second', 'third'].map((id) =>
      createFixture({ id, label: 'Page test' }),
    );

    expect(
      rankSearchResults(fixtures, normalizeSearchText('page'), 2).map(
        (item) => item.id,
      ),
    ).toEqual(['first', 'second']);
  });

  it('delegates keyboard and ARIA behavior to the shadcn Command primitive', () => {
    expect(commandSource).toContain("from 'cmdk'");
    for (const primitive of ['CommandInput', 'CommandList', 'CommandItem'])
      expect(globalSearchSource).toContain('<' + primitive);
    expect(globalSearchSource).toContain('shouldFilter={false}');
    expect(globalSearchSource).toMatch(/<Command[\s\S]+?\bloop\b/);
    expect(globalSearchSource).toContain('value={activeResultHref}');
    expect(globalSearchSource).toContain('onValueChange={setActiveResultHref}');
    expect(globalSearchSource).toContain(
      'onSelect={() => navigateToHref(result.href)}',
    );
  });

  it('opens from its accessible button without a global keyboard shortcut', () => {
    expect(globalSearchSource).toContain('<DialogTrigger asChild>');
    expect(globalSearchSource).not.toContain('aria-keyshortcuts');
    expect(globalSearchSource).not.toContain("addEventListener('keydown'");
    expect(globalSearchSource).not.toContain('<kbd');
  });

  it('keeps mobile dismissal explicit and only indexes live pages', () => {
    expect(globalSearchSource).toContain(
      'aria-label="Fermer la navigation rapide"',
    );
    expect(globalSearchSource).toContain('size-11');
    expect(searchCatalogSource).toContain(
      "getNavigationAvailability(item) !== 'live'",
    );
    expect(searchCatalogSource).toContain(
      '!canAccessNavigationItem(user, item)',
    );
    expect(searchCatalogSource).toContain("href: '/mon-compte'");
    expect(globalSearchSource).toContain('aria-label="Effacer la recherche"');
  });

  it('preserves selection by destination and marks one current result', () => {
    expect(globalSearchSource).toContain('activeResultHref');
    expect(globalSearchSource).toContain('currentResultHref');
    expect(globalSearchSource).toContain(
      'const isCurrentResult = result.href === currentResultHref',
    );
    expect(globalSearchSource).not.toContain('setActiveIndex');
  });

  it('keeps a flat dialog hierarchy and explicit mobile safe areas', () => {
    expect(globalSearchSource).toContain('bg-popover h-dvh');
    expect(commandSource).toContain('border-border-divider mx-4');
    expect(globalSearchSource).toContain(
      'border-border-divider text-muted-foreground mx-4',
    );
    expect(commandSource).toContain(
      'data-[selected=true]:bg-surface-navigation-active',
    );
    expect(globalSearchSource).not.toContain('bg-surface-panel-raised/95');
    expect(globalSearchSource).not.toContain('ring-primary/30');
    expect(globalSearchSource).toContain('Pages suggérées');
    expect(commandSource).toContain('safe-area-inset-top');
    expect(globalSearchSource).toContain('safe-area-inset-bottom');
    expect(globalSearchSource).toContain('hidden truncate sm:inline');
    expect(globalSearchSource).not.toContain('focus-within:border-primary');
  });
});
