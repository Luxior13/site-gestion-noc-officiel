import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PERMISSIONS,
  ROADMAP_PERMISSIONS,
} from '$constants/permissions.constants';

const mocks = vi.hoisted(() => ({
  getPageAuthSession: vi.fn(),
  redirect: vi.fn((href: string) => {
    throw new Error(`REDIRECT:${href}`);
  }),
  SystemSettingsPage: vi.fn(() => null),
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}));

vi.mock('$server/session', () => ({
  getPageAuthSession: mocks.getPageAuthSession,
}));

vi.mock('$features/settings/components/SystemSettingsPage', () => ({
  SystemSettingsPage: mocks.SystemSettingsPage,
}));

const APP_ROOT = resolve(import.meta.dirname, '../app/systeme');

describe('/systeme routes (explicit since 31 October 2026, SYS-14)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    [null, '/login'],
    [
      { isProtected: true, permissions: {}, role: 'ADMIN' },
      '/systeme/utilisateurs',
    ],
    [
      {
        isProtected: false,
        permissions: { [ROADMAP_PERMISSIONS.BACKUPS.VIEW]: true },
        role: 'USER',
      },
      '/systeme/feuille-de-route',
    ],
    [
      {
        isProtected: false,
        permissions: { [PERMISSIONS.SETTINGS.VIEW]: true },
        role: 'USER',
      },
      '/systeme/feuille-de-route',
    ],
    [
      {
        isProtected: false,
        permissions: {
          [PERMISSIONS.AUDIT.VIEW]: false,
          [PERMISSIONS.USERS.VIEW]: false,
        },
        role: 'ADMIN',
      },
      // An ADMIN holds every access permission: stale denies are ignored.
      '/systeme/utilisateurs',
    ],
  ])('redirects the system root to an accessible page', async (user, href) => {
    mocks.getPageAuthSession.mockResolvedValue({ user });
    const { default: SystemIndexPage } = await import('$app/systeme/page');

    await expect(SystemIndexPage()).rejects.toThrow(`REDIRECT:${href}`);
  });

  it('renders the settings page from its own route, named in the tab', async () => {
    const route = await import('$app/systeme/parametres/page');

    expect(route.default()).toMatchObject({ type: mocks.SystemSettingsPage });
    expect(route.metadata.title).toBe('Paramètres système · Noctambule');
  });

  it('keeps no generic route: an unknown destination is a plain 404', () => {
    // Paths are constants of the application tree.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(existsSync(resolve(APP_ROOT, '[[...slug]]'))).toBe(false);
    for (const page of [
      'page.tsx',
      'parametres/page.tsx',
      'journal-activite/page.tsx',
      'utilisateurs/page.tsx',
      'feuille-de-route/page.tsx',
    ]) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      expect(existsSync(resolve(APP_ROOT, page))).toBe(true);
    }
  });
});
