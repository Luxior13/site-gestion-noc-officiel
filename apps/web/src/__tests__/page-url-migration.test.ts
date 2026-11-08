import { existsSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { getActiveNavigationSpace } from '$constants/app.constants';
import {
  LEGACY_PAGE_ALIASES,
  PAGE_PATHS,
  PAGE_REDIRECTS,
  personDetailPath,
  userDetailPath,
} from '$constants/routes.constants';
import { getSafePersonReturnHref } from '$features/persons/person.ui';
import {
  getCanonicalInternalHref,
  isKnownInternalPageHref,
} from '$utils/internal-href.utils';
import {
  getSafeCollectionReturnHref,
  getSafeReturnPath,
} from '$utils/navigation.utils';

describe('page URL migration', () => {
  it.each([
    ['/membres/repertoire', '/personnes/repertoire'],
    ['/membres/repertoire/record-1', '/personnes/repertoire/record-1'],
    ['/vie-interne/repertoire/nouveau', '/personnes/repertoire/nouveau'],
    [
      '/vie-interne/repertoire/record-1?section=coordonnees#contact',
      '/personnes/repertoire/record-1?section=coordonnees#contact',
    ],
    [
      '/administration/utilisateurs/user-1?section=access',
      '/systeme/utilisateurs/user-1?section=access',
    ],
    ['/administration/utilisateurs/nouveau', '/systeme/utilisateurs/nouveau'],
    ['/administration', '/systeme/utilisateurs'],
    ['/vie-interne/actualite-interne', '/systeme/feuille-de-route'],
    ['/activite/actualites', '/systeme/feuille-de-route'],
    [
      '/feuille-de-route?pole=people&phase=3',
      '/systeme/feuille-de-route?pole=people&phase=3',
    ],
    ['/tableau-de-bord', '/'],
    [
      '/tableau-de-bord/mes-notifications?status=unread',
      '/systeme/feuille-de-route?status=unread',
    ],
    [
      '/mes-notifications?status=unread',
      '/systeme/feuille-de-route?status=unread',
    ],
  ])(
    'preserves the destination of historical links: %s',
    (legacy, expected) => {
      expect(getCanonicalInternalHref(legacy)).toBe(expected);
      expect(isKnownInternalPageHref(legacy)).toBe(true);
      expect(isKnownInternalPageHref(expected)).toBe(true);
      expect(getSafeReturnPath(legacy)).toBe(expected);
    },
  );

  // Never cached by the browser, so a reused address is never trapped.
  it('keeps each redirect direct, temporary and outside its own source', () => {
    for (const redirect of PAGE_REDIRECTS) {
      expect(redirect.permanent).toBe(false);
      expect(
        LEGACY_PAGE_ALIASES.some(
          (alias) =>
            redirect.destination === alias.source ||
            redirect.destination.startsWith(`${alias.source}/`),
        ),
      ).toBe(false);
    }
  });

  it.each([
    'personnes/repertoire',
    'personnes/repertoire/nouveau',
    'personnes/repertoire/[id]',
    'systeme/utilisateurs',
    'systeme/utilisateurs/nouveau',
    'systeme/utilisateurs/[id]',
    'systeme/feuille-de-route',
  ])('has a concrete page for the canonical destination %s', (route) => {
    // Test-owned routes only.

    expect(
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      existsSync(new URL(`../app/${route}/page.tsx`, import.meta.url)),
    ).toBe(true);
  });

  it('preserves nested old return paths and their list filters', () => {
    expect(
      getSafePersonReturnHref(
        '/vie-interne/repertoire?q=Alex&sort=updated&cursor=abc',
      ),
    ).toBe('/personnes/repertoire?q=Alex&sort=updated&cursor=abc');
    expect(
      getSafeCollectionReturnHref(
        '/administration/utilisateurs?search=Alex&page=3&status=inactive',
        PAGE_PATHS.users,
      ),
    ).toBe('/systeme/utilisateurs?search=Alex&page=3&status=inactive');
    const legacyHref = `/membres/repertoire/record-1?${new URLSearchParams({ returnTo: '/vie-interne/repertoire?q=Alex', section: 'coordonnees' })}`;
    const destination = new URL(
      getSafeReturnPath(legacyHref),
      'https://example.test',
    );
    expect(destination.pathname).toBe('/personnes/repertoire/record-1');
    expect(destination.searchParams.get('section')).toBe('coordonnees');
    expect(
      getSafePersonReturnHref(destination.searchParams.get('returnTo')),
    ).toBe('/personnes/repertoire?q=Alex');
  });

  it.each([
    'https://evil.test',
    '//evil.test',
    '/personnes-archive',
    '/personnes/record-1/unknown',
    '/administration/utilisateurs-extra',
    '/vie-interne/actualite-interne/unknown',
    '/feuille-de-route/unknown',
  ])('does not admit unrelated or non-page paths: %s', (href) => {
    expect(isKnownInternalPageHref(href)).toBe(false);
    expect(getSafePersonReturnHref(href)).toBe(PAGE_PATHS.persons);
    expect(getSafeCollectionReturnHref(href, PAGE_PATHS.users)).toBe(
      PAGE_PATHS.users,
    );
  });

  it('parks the removed internal news page on the roadmap', () => {
    expect(isKnownInternalPageHref(PAGE_PATHS.internalNews)).toBe(true);
    expect(getCanonicalInternalHref(PAGE_PATHS.internalNews)).toBe(
      PAGE_PATHS.roadmap,
    );
    expect(PAGE_REDIRECTS).toContainEqual({
      destination: PAGE_PATHS.roadmap,
      permanent: false,
      source: PAGE_PATHS.internalNews,
    });
  });

  it('parks the removed notifications page on the roadmap', () => {
    expect(isKnownInternalPageHref('/mes-notifications')).toBe(true);
    expect(getCanonicalInternalHref('/mes-notifications')).toBe(
      PAGE_PATHS.roadmap,
    );
    expect(PAGE_REDIRECTS).toContainEqual({
      destination: PAGE_PATHS.roadmap,
      permanent: false,
      source: '/mes-notifications',
    });
    expect(PAGE_REDIRECTS).toContainEqual({
      destination: PAGE_PATHS.roadmap,
      permanent: false,
      source: '/tableau-de-bord/mes-notifications',
    });
  });

  it('serves the rebuilt activity journal at its own address', () => {
    // Parked on the roadmap from 9 to 30 October 2026, then rebuilt.
    expect(isKnownInternalPageHref(PAGE_PATHS.systemActivity)).toBe(true);
    expect(getCanonicalInternalHref(PAGE_PATHS.systemActivity)).toBe(
      PAGE_PATHS.systemActivity,
    );
    expect(
      PAGE_REDIRECTS.some(
        (redirect) => redirect.source === PAGE_PATHS.systemActivity,
      ),
    ).toBe(false);
  });

  it('assigns canonical details to the right pole and encodes record IDs', () => {
    expect(getActiveNavigationSpace(personDetailPath('record-1')).id).toBe(
      'internal',
    );
    expect(getActiveNavigationSpace(userDetailPath('user-1')).id).toBe(
      'system',
    );
    expect(getActiveNavigationSpace(PAGE_PATHS.roadmap).id).toBe('system');
    expect(personDetailPath('id with space')).toBe(
      '/personnes/repertoire/id%20with%20space',
    );
  });
});
