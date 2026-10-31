import { afterEach, describe, expect, it, vi } from 'vitest';

import { pageTitle } from '$utils/page-title.utils';

vi.mock('$features/dashboard/components/HomePage', () => ({
  HomePage: (): null => null,
}));

// Audit RR-10 of 31 October 2026: every view names itself in the tab.
describe('browser tab titles', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('names the view first and the site last', () => {
    expect(pageTitle()).toBe('Noctambule');
    expect(pageTitle('Nouvel utilisateur', 'Utilisateurs')).toBe(
      'Nouvel utilisateur · Utilisateurs · Noctambule',
    );
  });

  it('names the home page and the missing page', async () => {
    expect((await import('$app/page')).metadata.title).toBe(
      'Mon travail · Noctambule',
    );
    expect((await import('$app/not-found')).metadata.title).toBe(
      'Page introuvable · Noctambule',
    );
  });

  it('marks development tabs on every page', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.resetModules();
    const { pageTitle: developmentTitle } =
      await import('$utils/page-title.utils');

    expect(developmentTitle('Répertoire')).toBe(
      'Répertoire · Noctambule · Dev',
    );
  });
});
