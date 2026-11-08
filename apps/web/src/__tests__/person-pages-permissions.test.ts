import { createElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PERMISSIONS,
  ROADMAP_PERMISSIONS,
} from '$constants/permissions.constants';
import { getPersonCapabilities } from '$features/persons/person.permissions';

const mocks = vi.hoisted(() => ({
  createForm: vi.fn(() => null),
  getPageAuthSession: vi.fn(),
  personsList: vi.fn(() => null),
  useUser: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: (): URLSearchParams => new URLSearchParams(),
}));

vi.mock('$components/AuthenticatedLayout', () => ({
  default: ({ children }: { children: ReactNode }): ReactNode => children,
}));

vi.mock('$context/UserContext', () => ({ useUser: mocks.useUser }));

vi.mock('$features/persons/components/PersonsList', () => ({
  PersonsList: mocks.personsList,
}));

vi.mock('$features/persons/components/PersonCreateForm', () => ({
  PersonCreateForm: mocks.createForm,
}));

vi.mock('$server/session', () => ({
  getPageAuthSession: mocks.getPageAuthSession,
}));

vi.mock('$features/persons/server/person-deletion', () => ({
  assertPersonFeatureReady: vi.fn(),
}));

vi.mock('$features/persons/server/person.service', () => ({
  getPerson: vi.fn(),
  listPersons: vi.fn(),
}));

import PersonPage from '$app/personnes/repertoire/[id]/page';
import NewPersonPage from '$app/personnes/repertoire/nouveau/page';
import { PersonsPageClient as PersonsPage } from '$features/persons/components/PersonsPageClient';

const user = (
  permissions: Record<string, boolean>,
): {
  id: string;
  isProtected: boolean;
  permissions: Record<string, boolean>;
  role: 'USER';
} => ({
  id: 'user-1',
  isProtected: false,
  permissions,
  role: 'USER',
});

describe('direct Person page permission boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getPageAuthSession.mockResolvedValue({
      session: null,
      user: user({}),
    });
  });

  it('resolves every page action independently and ignores the retired field history key', () => {
    expect(
      getPersonCapabilities(
        user({
          [ROADMAP_PERMISSIONS.BACKUPS.VIEW]: true,
          'audit:view_field_history': true,
          [PERMISSIONS.PERSONS.CREATE]: true,
          [PERMISSIONS.PERSONS.DELETE]: true,
          [PERMISSIONS.PERSONS.UPDATE]: true,
          [PERMISSIONS.PERSONS.VIEW]: true,
        }) as never,
      ),
    ).toEqual({
      canCreate: true,
      canDelete: true,
      canUpdate: true,
      canUpdateContact: false,
      canView: true,
      canViewContact: false,
    });
  });

  it('denies a direct list-page visit without persons:view before rendering data', () => {
    mocks.useUser.mockReturnValue({ userData: user({}) });

    const html = renderToStaticMarkup(createElement(PersonsPage));

    expect(html).toContain('autorisation de consulter le répertoire');
    expect(mocks.personsList).not.toHaveBeenCalled();
  });

  it('passes the create capability to the visible list', () => {
    mocks.useUser.mockReturnValue({
      userData: user({
        [PERMISSIONS.PERSONS.CREATE]: true,
        [PERMISSIONS.PERSONS.DELETE]: false,
        [PERMISSIONS.PERSONS.VIEW]: true,
      }),
    });

    renderToStaticMarkup(createElement(PersonsPage));

    expect(mocks.personsList).toHaveBeenCalledWith(
      {
        canCreate: true,
        canViewContact: false,
        createHref:
          '/personnes/repertoire/nouveau?returnTo=%2Fpersonnes%2Frepertoire',
        initialState: undefined,
        navigationScope: 'user-1',
        returnHref: '/personnes/repertoire',
      },
      undefined,
    );
  });

  it('denies /personnes/repertoire/nouveau without persons:create and never mounts its form', () => {
    mocks.useUser.mockReturnValue({
      userData: user({ [PERMISSIONS.PERSONS.VIEW]: true }),
    });

    const html = renderToStaticMarkup(createElement(NewPersonPage));

    expect(html).toContain('autorisation de créer une fiche');
    expect(mocks.createForm).not.toHaveBeenCalled();
  });

  it('mounts the creation form only with persons:create', () => {
    mocks.useUser.mockReturnValue({
      userData: user({
        [PERMISSIONS.PERSONS.CREATE]: true,
        [PERMISSIONS.PERSONS.VIEW]: true,
      }),
    });

    renderToStaticMarkup(createElement(NewPersonPage));

    expect(mocks.createForm).toHaveBeenCalledOnce();
    expect(mocks.createForm).toHaveBeenCalledWith(
      { returnHref: '/personnes/repertoire' },
      undefined,
    );
  });

  it('uses stable URL-addressable detail sections and safely defaults to identity', async () => {
    const coordinates = (await PersonPage({
      params: Promise.resolve({ id: 'person-1' }),
      searchParams: Promise.resolve({ section: 'coordonnees' }),
    })) as ReactElement<{ activeSection: string; personId: string }>;
    const invalidSection = (await PersonPage({
      params: Promise.resolve({ id: 'person-1' }),
      searchParams: Promise.resolve({ section: 'inconnue' }),
    })) as ReactElement<{ activeSection: string; personId: string }>;

    expect(coordinates.props).toMatchObject({
      activeSection: 'coordonnees',
      personId: 'person-1',
    });
    expect(invalidSection.props.activeSection).toBe('identite');
  });

  it('denies a direct detail-page visit without persons:view', async () => {
    mocks.useUser.mockReturnValue({ userData: user({}) });
    const element = await PersonPage({
      params: Promise.resolve({ id: 'person-1' }),
    });

    const html = renderToStaticMarkup(element);

    expect(html).toContain('autorisation de consulter cette fiche');
  });
});
