import { randomUUID } from 'node:crypto';

import { type Person, PrismaClient, type User } from '@prisma/client';
import { NextRequest } from 'next/server';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  DELETE as DELETE_CONTACT,
  PATCH as PATCH_CONTACT,
} from '$app/api/relations/organisations/[id]/contacts/[contactId]/route';
import { POST as POST_CONTACT } from '$app/api/relations/organisations/[id]/contacts/route';
import {
  DELETE as DELETE_ORGANIZATION,
  GET as GET_ORGANIZATION,
  PATCH as PATCH_ORGANIZATION,
} from '$app/api/relations/organisations/[id]/route';
import { POST as ADD_ORGANIZER } from '$app/api/relations/organisations/organisateurs/route';
import { GET as SEARCH_PERSONS } from '$app/api/relations/organisations/personnes/route';
import {
  GET as GET_ORGANIZATIONS,
  POST as POST_ORGANIZATION,
} from '$app/api/relations/organisations/route';
import { PERMISSIONS } from '$constants/permissions.constants';
import type {
  OrganizationDetail,
  OrganizationItem,
  OrganizerAdded,
} from '$features/organizations/types/organization.types';
import { getPersonDisplayName } from '$features/persons/person.ui';
import type { PersonSuggestions } from '$features/persons/types/person.types';
import { mapUserToUserType } from '$server/user-projection';

const connection = vi.hoisted(() => ({
  client: null as PrismaClient | null,
  session: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('$env', () => ({ env: { NODE_ENV: 'test' } }));
vi.mock('$server/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn() },
}));
vi.mock('$server/prisma', () => ({
  prisma: new Proxy(
    {},
    {
      get: (_target, key): unknown => {
        if (!connection.client)
          throw new Error('Isolated organizations database not initialized');
        const value: unknown = Reflect.get(connection.client, key);

        return typeof value === 'function'
          ? value.bind(connection.client)
          : value;
      },
    },
  ),
}));
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(async () => new Headers()),
}));
vi.mock('$server/rate-limiter', () => ({
  clearRateLimit: vi.fn(async () => undefined),
  reserveAuthenticatedApiRateLimit: vi.fn(async () => ({ allowed: true })),
  reserveSensitiveActionRateLimit: vi.fn(async () => ({ allowed: true })),
}));
vi.mock('$server/session', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$server/session')>()),
  getAuthSession: connection.session,
}));

const target = process.env.ORGANIZATIONS_TEST_DATABASE_URL;

type Body = {
  data?: unknown;
  error?: { code: string; details?: Record<string, string[]>; message: string };
};

const MANAGE = {
  [PERMISSIONS.ORGANIZATIONS.MANAGE]: true,
  [PERMISSIONS.ORGANIZATIONS.VIEW]: true,
};

/**
 * Organisations (owner, 11 November 2026: « oui go »): one record per
 * organisation whatever it is to the structure, its kinds together; the
 * people to reach there, by name or by their record of the Répertoire,
 * which stays with who may read it; every change in the journal.
 */
describe.skipIf(!target)('Organisations on fully migrated PostgreSQL', () => {
  let db: PrismaClient;
  let kaiz: Person;
  let startedAt = new Date();

  const login = (): string =>
    'test.' + randomUUID().replaceAll('-', '').slice(0, 20);
  const createUser = async (
    permissions: Record<string, boolean>,
  ): Promise<User> => {
    const user = await db.user.create({
      data: {
        firstName: 'Organizations fixture',
        loginName: login(),
        passwordHash: '!fictive',
        permissions,
        role: 'USER',
      },
    });
    await db.loginNameReservation.create({
      data: { loginName: user.loginName, userId: user.id },
    });

    return user;
  };
  const authenticate = async (user: User): Promise<void> => {
    const fresh = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    const source = await db.session.create({
      data: {
        expiresAt: new Date(Date.now() + 3600_000),
        idleExpiresAt: new Date(Date.now() + 1800_000),
        mfaMethod: 'TOTP',
        mfaVerifiedAt: new Date(),
        securityVersion: fresh.securityVersion,
        token: randomUUID(),
        userId: fresh.id,
      },
    });
    connection.session.mockResolvedValue({
      session: source,
      user: mapUserToUserType(fresh),
    });
  };
  const signIn = async (permissions: Record<string, boolean>): Promise<void> =>
    authenticate(await createUser(permissions));
  const params = (id: string): { params: Promise<{ id: string }> } => ({
    params: Promise.resolve({ id }),
  });
  const contactParams = (
    id: string,
    contactId: string,
  ): { params: Promise<{ contactId: string; id: string }> } => ({
    params: Promise.resolve({ contactId, id }),
  });
  const request = (
    url: string,
    method = 'GET',
    payload?: unknown,
  ): NextRequest =>
    new NextRequest(`http://localhost${url}`, {
      method,
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
    });
  const read = async (response: Response): Promise<Body> =>
    (await response.json()) as Body;
  const call = async (
    response: Promise<Response>,
  ): Promise<{ body: Body; status: number }> => {
    const done = await response;

    return { body: await read(done), status: done.status };
  };

  const createOrganization = (
    payload: Record<string, unknown>,
  ): Promise<{ body: Body; status: number }> =>
    call(
      POST_ORGANIZATION(
        request('/api/relations/organisations', 'POST', payload),
      ),
    );
  const organization = async (
    name: string,
    kinds: string[],
  ): Promise<OrganizationDetail> => {
    const { body, status } = await createOrganization({ kinds, name });
    expect(status, JSON.stringify(body.error)).toBe(201);

    return body.data as OrganizationDetail;
  };
  const updateOrganization = (
    current: OrganizationDetail,
    changes: Record<string, unknown>,
  ): Promise<{ body: Body; status: number }> =>
    call(
      PATCH_ORGANIZATION(
        request(`/api/relations/organisations/${current.id}`, 'PATCH', {
          address: current.address,
          expectedVersion: current.version,
          kinds: current.kinds,
          name: current.name,
          siretNumber: current.siretNumber,
          website: current.website,
          ...changes,
        }),
        params(current.id),
      ),
    );
  const addContact = (
    id: string,
    payload: Record<string, unknown>,
  ): Promise<{ body: Body; status: number }> =>
    call(
      POST_CONTACT(
        request(`/api/relations/organisations/${id}/contacts`, 'POST', {
          email: null,
          phone: null,
          phoneCountry: 'FR',
          role: null,
          ...payload,
        }),
        params(id),
      ),
    );
  const updateContact = (
    id: string,
    contactId: string,
    payload: Record<string, unknown>,
  ): Promise<{ body: Body; status: number }> =>
    call(
      PATCH_CONTACT(
        request(
          `/api/relations/organisations/${id}/contacts/${contactId}`,
          'PATCH',
          {
            email: null,
            phone: null,
            phoneCountry: 'FR',
            role: null,
            ...payload,
          },
        ),
        contactParams(id, contactId),
      ),
    );
  const detail = async (id: string): Promise<OrganizationDetail> =>
    (
      await read(
        await GET_ORGANIZATION(
          request(`/api/relations/organisations/${id}`),
          params(id),
        ),
      )
    ).data as OrganizationDetail;
  const journal = async (): Promise<
    {
      action: string;
      description: string;
      metadata: unknown;
      severity: string;
    }[]
  > =>
    db.auditLog.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        action: true,
        description: true,
        metadata: true,
        severity: true,
      },
      where: { category: 'ORGANIZATION', createdAt: { gte: startedAt } },
    });

  beforeAll(async () => {
    if (!target) throw new Error('Missing isolated organizations database');
    const url = new URL(target);
    if (
      !['127.0.0.1', 'localhost'].includes(url.hostname) ||
      url.pathname !== '/organizations_test'
    )
      throw new Error('A local organizations_test database is required');
    db = new PrismaClient({ datasourceUrl: target });
    connection.client = db;
  });
  beforeEach(async () => {
    // This dedicated database belongs to this suite only.
    await db.organization.deleteMany();
    await db.person.deleteMany();
    kaiz = await db.person.create({
      data: {
        firstName: 'Camille',
        lastName: 'Exemple',
        nickname: 'Kaiz',
        normalizedFirstName: 'camille',
        normalizedLastName: 'exemple',
        normalizedNickname: 'kaiz',
        sortName: 'exemple camille',
      },
    });
    startedAt = new Date();
    await signIn({ ...MANAGE, [PERMISSIONS.PERSONS.VIEW]: true });
  });
  afterAll(async () => {
    await db?.$disconnect();
    connection.client = null;
  });

  it('keeps one record per organisation, its kinds together, every change traced', async () => {
    const ldlc = await organization('LDLC', ['SUPPLIER', 'SPONSOR']);
    expect(ldlc).toMatchObject({
      contactCount: 0,
      contacts: [],
      kinds: ['SPONSOR', 'SUPPLIER'],
      version: 1,
    });
    // A name is unique whatever the case or the accents.
    const duplicate = await createOrganization({
      kinds: ['CLIENT'],
      name: 'ldlc',
    });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error?.details?.name).toBeDefined();

    const saved = await updateOrganization(ldlc, {
      address: ' 2 rue des Érables, 69760 Limonest ',
      siretNumber: '403 554 181 00098',
      website: 'ldlc.com',
    });
    expect(saved.status, JSON.stringify(saved.body.error)).toBe(200);
    const current = saved.body.data as OrganizationDetail;
    expect(current).toMatchObject({
      address: '2 rue des Érables, 69760 Limonest',
      siretNumber: '40355418100098',
      version: 2,
      website: 'https://ldlc.com',
    });
    // A stale version is refused; an unchanged one writes nothing.
    expect((await updateOrganization(ldlc, { name: 'LDLC.com' })).status).toBe(
      409,
    );
    expect(
      ((await updateOrganization(current, {})).body.data as OrganizationDetail)
        .version,
    ).toBe(2);
    expect(
      (
        (await read(
          await GET_ORGANIZATIONS(request('/api/relations/organisations')),
        )) as { data: OrganizationItem[] }
      ).data.map(({ name }) => name),
    ).toEqual(['LDLC']);

    // The base keeps one kind at least, each once, and a real site.
    for (const kinds of ['{}', '{SPONSOR,SPONSOR}'])
      await expect(
        db.$executeRawUnsafe(
          `UPDATE "Organization" SET "kinds" = '${kinds}' WHERE "id" = $1`,
          ldlc.id,
        ),
      ).rejects.toThrow();
    await expect(
      db.organization.update({
        data: { website: 'ldlc.com' },
        where: { id: ldlc.id },
      }),
    ).rejects.toThrow();

    const events = await journal();
    expect(events.map(({ action }) => action)).toEqual([
      'ORGANIZATION_CREATE',
      'ORGANIZATION_UPDATE',
    ]);
    expect(events[1]?.metadata).toMatchObject({
      changes: ['address', 'siretNumber', 'website'],
      organizationName: 'LDLC',
      pageKey: 'organizations',
      poleKey: 'legal',
    });
  });

  it('adds a typed organiser, or gives the kind to the organisation of that name', async () => {
    const addOrganizer = (
      name: unknown,
    ): Promise<{ body: Body; status: number }> =>
      call(
        ADD_ORGANIZER(
          request('/api/relations/organisations/organisateurs', 'POST', {
            name,
          }),
        ),
      );
    const ldlc = await organization('LDLC', ['SPONSOR']);

    // A new name: a record of kind Organisateur.
    const created = await addOrganizer('  Lyon Gaming ');
    expect(created.status, JSON.stringify(created.body.error)).toBe(201);
    const lyon = created.body.data as OrganizerAdded;
    expect(lyon).toMatchObject({
      organizer: { name: 'Lyon Gaming' },
      outcome: 'created',
    });
    expect(await detail(lyon.organizer.id)).toMatchObject({
      kinds: ['ORGANIZER'],
      version: 1,
    });
    // The same name again, case and accents ignored: the same record.
    const again = await addOrganizer('lyon gaming');
    expect(again.status).toBe(200);
    expect(again.body.data).toEqual({
      organizer: lyon.organizer,
      outcome: 'existing',
    });
    // A sponsor that organises: its record gains the kind, in the order of
    // the list, nothing else.
    const sponsor = await addOrganizer('ldlc');
    expect(sponsor.status).toBe(200);
    expect(sponsor.body.data).toEqual({
      organizer: { id: ldlc.id, name: 'LDLC' },
      outcome: 'kind-added',
    });
    expect(await detail(ldlc.id)).toMatchObject({
      kinds: ['SPONSOR', 'ORGANIZER'],
      version: 2,
    });
    expect((await addOrganizer('   ')).status).toBe(400);

    const events = await journal();
    expect(events.map(({ description }) => description)).toEqual([
      'Organisation ajoutée : LDLC',
      'Organisation ajoutée : Lyon Gaming',
      'Organisation modifiée : LDLC',
    ]);
    expect(events[2]?.metadata).toMatchObject({
      after: { kinds: 'Sponsor, Organisateur' },
      before: { kinds: 'Sponsor' },
      changes: ['kinds'],
      organizationId: ldlc.id,
    });

    // Who only reads the organisations adds none.
    await signIn({ [PERMISSIONS.ORGANIZATIONS.VIEW]: true });
    expect((await addOrganizer('Toornament')).status).toBe(403);
    expect(await db.organization.count()).toBe(2);
  });

  it('adds contacts by name or by their record, never the same record twice', async () => {
    const ldlc = await organization('LDLC', ['SUPPLIER']);
    const lea = await addContact(ldlc.id, {
      email: 'Lea.Martin@LDLC.com',
      name: 'Léa Martin',
      phone: '06 12 34 56 78',
      role: 'Responsable partenariats',
    });
    expect(lea.status, JSON.stringify(lea.body.error)).toBe(201);
    expect((lea.body.data as OrganizationDetail).contacts).toEqual([
      expect.objectContaining({
        email: 'lea.martin@ldlc.com',
        name: 'Léa Martin',
        person: null,
        personLinked: false,
        phone: '+33612345678',
      }),
    ]);
    // A name, or a record that gives it.
    const nameless = await addContact(ldlc.id, { name: null });
    expect(nameless.status).toBe(400);
    expect(nameless.body.error?.details?.name).toBeDefined();
    const linked = await addContact(ldlc.id, {
      name: 'ignoré',
      personId: kaiz.id,
    });
    expect(linked.status, JSON.stringify(linked.body.error)).toBe(201);
    const withKaiz = (linked.body.data as OrganizationDetail).contacts.find(
      (contact) => contact.personLinked,
    );
    expect(withKaiz).toMatchObject({
      name: getPersonDisplayName(kaiz),
      person: { id: kaiz.id },
    });
    const twice = await addContact(ldlc.id, { personId: kaiz.id });
    expect(twice.status).toBe(409);
    expect(twice.body.error?.details?.personId).toBeDefined();

    // Edited without `personId`, the link stays.
    const edited = await updateContact(ldlc.id, withKaiz?.id ?? '', {
      expectedVersion: withKaiz?.version,
      name: null,
      role: 'Trésorier du sponsor',
    });
    expect(edited.status, JSON.stringify(edited.body.error)).toBe(200);
    expect(
      await db.organizationContact.findUniqueOrThrow({
        where: { id: withKaiz?.id ?? '' },
      }),
    ).toMatchObject({ personId: kaiz.id, role: 'Trésorier du sponsor' });

    // A deleted record leaves the contact with its name.
    await db.person.delete({ where: { id: kaiz.id } });
    const after = await detail(ldlc.id);
    expect(after.contactCount).toBe(2);
    expect(
      after.contacts.find((contact) => contact.id === withKaiz?.id),
    ).toMatchObject({
      name: getPersonDisplayName(kaiz),
      person: null,
      personLinked: false,
    });

    const removed = await call(
      DELETE_CONTACT(
        request(
          `/api/relations/organisations/${ldlc.id}/contacts/${withKaiz?.id ?? ''}`,
          'DELETE',
          { expectedVersion: 1 },
        ),
        contactParams(ldlc.id, withKaiz?.id ?? ''),
      ),
    );
    // Its version moved with the edit.
    expect(removed.status).toBe(409);

    const events = await journal();
    expect(events.map(({ description }) => description)).toEqual([
      'Organisation ajoutée : LDLC',
      'Contact ajouté : Léa Martin (LDLC)',
      `Contact ajouté : ${getPersonDisplayName(kaiz)} (LDLC)`,
      `Contact modifié : ${getPersonDisplayName(kaiz)} (LDLC)`,
    ]);
    expect(events[1]?.metadata).toMatchObject({
      after: {
        email: 'lea.martin@ldlc.com',
        name: 'Léa Martin',
        phone: '+33 6 12 34 56 78',
        role: 'Responsable partenariats',
      },
      contactName: 'Léa Martin',
    });
    expect(events[2]?.metadata).toMatchObject({ after: { person: 'Liée' } });
  });

  it('keeps the Répertoire to who reads it', async () => {
    const ldlc = await organization('LDLC', ['SPONSOR']);
    const linked = (await addContact(ldlc.id, { personId: kaiz.id })).body
      .data as OrganizationDetail;
    const contact = linked.contacts[0];
    const query = (): NextRequest =>
      request('/api/relations/organisations/personnes?q=kaiz');
    expect(
      (
        (await read(await SEARCH_PERSONS(query()))).data as PersonSuggestions
      ).persons.map(({ id }) => id),
    ).toEqual([kaiz.id]);

    // Managing the organisations without the Répertoire.
    await signIn(MANAGE);
    expect((await SEARCH_PERSONS(query())).status).toBe(403);
    const hidden = (await detail(ldlc.id)).contacts[0];
    expect(hidden).toMatchObject({ person: null, personLinked: true });
    const kept = await updateContact(ldlc.id, contact?.id ?? '', {
      email: 'kaiz@ldlc.com',
      expectedVersion: contact?.version,
      name: null,
    });
    expect(kept.status, JSON.stringify(kept.body.error)).toBe(200);
    expect(
      await db.organizationContact.findUniqueOrThrow({
        where: { id: contact?.id ?? '' },
      }),
    ).toMatchObject({ email: 'kaiz@ldlc.com', personId: kaiz.id });
    const unlinked = await updateContact(ldlc.id, contact?.id ?? '', {
      expectedVersion: 2,
      name: 'Kaiz',
      personId: null,
    });
    expect(unlinked.status).toBe(403);
    expect(
      (await addContact(ldlc.id, { name: null, personId: kaiz.id })).status,
    ).toBe(403);

    // Without the organisations, nothing.
    await signIn({ [PERMISSIONS.PERSONS.VIEW]: true });
    expect(
      (await GET_ORGANIZATIONS(request('/api/relations/organisations'))).status,
    ).toBe(403);
  });

  it('deletes an organisation with its contacts, the journal keeping it', async () => {
    const ldlc = await organization('LDLC', ['SUPPLIER']);
    await addContact(ldlc.id, { name: 'Léa Martin' });
    const current = (await addContact(ldlc.id, { name: 'Marc Petit' })).body
      .data as OrganizationDetail;
    const stale = await call(
      DELETE_ORGANIZATION(
        request(`/api/relations/organisations/${ldlc.id}`, 'DELETE', {
          expectedVersion: 7,
        }),
        params(ldlc.id),
      ),
    );
    expect(stale.status).toBe(409);
    const deleted = await call(
      DELETE_ORGANIZATION(
        request(`/api/relations/organisations/${ldlc.id}`, 'DELETE', {
          expectedVersion: current.version,
        }),
        params(ldlc.id),
      ),
    );
    expect(deleted.status, JSON.stringify(deleted.body.error)).toBe(200);
    expect(await db.organizationContact.count()).toBe(0);
    const last = (await journal()).at(-1);
    expect(last).toMatchObject({
      action: 'ORGANIZATION_DELETE',
      description: 'Organisation supprimée : LDLC, avec ses 2 contacts',
      severity: 'WARNING',
    });
  });

  it('bounds the contacts of an organisation', async () => {
    const ldlc = await organization('LDLC', ['SUPPLIER']);
    await db.organizationContact.createMany({
      data: Array.from({ length: 50 }, (_, index) => ({
        name: `Contact ${index}`,
        organizationId: ldlc.id,
      })),
    });
    const refused = await addContact(ldlc.id, { name: 'Un de trop' });
    expect(refused.status).toBe(409);
    expect(await db.organizationContact.count()).toBe(50);
  });
});
