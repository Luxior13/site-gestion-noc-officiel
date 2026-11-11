import { randomUUID } from 'node:crypto';

import { PrismaClient, type User } from '@prisma/client';
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
  DELETE as DELETE_ACCOUNT,
  GET as GET_ACCOUNT,
  PATCH as PATCH_ACCOUNT,
} from '$app/api/finances/comptes/[id]/route';
import {
  GET as GET_ACCOUNTS,
  POST as POST_ACCOUNT,
} from '$app/api/finances/comptes/route';
import {
  DELETE as DELETE_ENTITY,
  GET as GET_ENTITY,
  PATCH as PATCH_ENTITY,
} from '$app/api/structure/entites/[id]/route';
import {
  GET as GET_ENTITIES,
  POST as POST_ENTITY,
} from '$app/api/structure/entites/route';
import { PERMISSIONS } from '$constants/permissions.constants';
import type { LegalEntityItem } from '$features/entities/types/entity.types';
import type {
  FinancialAccountItem,
  FinancialAccountsOverview,
} from '$features/financial-accounts/types/financial-account.types';
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
          throw new Error('Isolated treasury database not initialized');
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

const target = process.env.TREASURY_TEST_DATABASE_URL;

type Body = {
  data?: unknown;
  error?: { code: string; details?: Record<string, string[]>; message: string };
};

const MANAGE_ALL = {
  [PERMISSIONS.ENTITIES.MANAGE]: true,
  [PERMISSIONS.ENTITIES.VIEW]: true,
  [PERMISSIONS.FINANCIAL_ACCOUNTS.MANAGE]: true,
  [PERMISSIONS.FINANCIAL_ACCOUNTS.VIEW]: true,
};

const day = (
  date: string,
  precision: 'DAY' | 'MONTH' | 'YEAR' = 'DAY',
): { date: string; precision: 'DAY' | 'MONTH' | 'YEAR' } => ({
  date,
  precision,
});

/**
 * Entités and Comptes (owner, 10 November 2026: « ok pour moi »): the legal
 * forms over time, one principal entity, accounts held by an entity that
 * existed on their opening day, never moved to another one; every change in
 * the journal, every refusal said by the service and kept by the base.
 */
describe.skipIf(!target)('Treasury base on fully migrated PostgreSQL', () => {
  let db: PrismaClient;
  let manager: User;
  let startedAt = new Date();

  const login = (): string =>
    'test.' + randomUUID().replaceAll('-', '').slice(0, 20);
  const createUser = async (
    permissions: Record<string, boolean>,
  ): Promise<User> => {
    const user = await db.user.create({
      data: {
        firstName: 'Treasury fixture',
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
  const params = (id: string): { params: Promise<{ id: string }> } => ({
    params: Promise.resolve({ id }),
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

  const createEntity = async (
    payload: Record<string, unknown>,
  ): Promise<{ body: Body; status: number }> => {
    const response = await POST_ENTITY(
      request('/api/structure/entites', 'POST', {
        end: null,
        otherForm: null,
        ...payload,
      }),
    );

    return { body: await read(response), status: response.status };
  };
  const entity = async (
    payload: Record<string, unknown>,
  ): Promise<LegalEntityItem> => {
    const { body, status } = await createEntity(payload);
    expect(status, JSON.stringify(body.error)).toBe(201);

    return body.data as LegalEntityItem;
  };
  const updateEntity = async (
    current: LegalEntityItem,
    changes: Partial<Record<string, unknown>>,
  ): Promise<{ body: Body; status: number }> => {
    const response = await PATCH_ENTITY(
      request(`/api/structure/entites/${current.id}`, 'PATCH', {
        end: current.end,
        expectedVersion: current.version,
        form: current.form,
        headOffice: current.headOffice,
        isPrincipal: current.isPrincipal,
        name: current.name,
        otherForm: current.otherForm,
        rnaNumber: current.rnaNumber,
        siretNumber: current.siretNumber,
        start: current.start,
        ...changes,
      }),
      params(current.id),
    );

    return { body: await read(response), status: response.status };
  };
  const reload = async (id: string): Promise<LegalEntityItem> =>
    (
      await read(
        await GET_ENTITY(request(`/api/structure/entites/${id}`), params(id)),
      )
    ).data as LegalEntityItem;
  const openAccount = async (
    payload: Record<string, unknown>,
  ): Promise<{ body: Body; status: number }> => {
    const response = await POST_ACCOUNT(
      request('/api/finances/comptes', 'POST', {
        entityId: null,
        institution: null,
        kind: 'BANK',
        openingBalanceCents: 125_000,
        openingOn: '2026-01-01',
        ...payload,
      }),
    );

    return { body: await read(response), status: response.status };
  };
  const journal = async (): Promise<
    { action: string; description: string; metadata: unknown }[]
  > =>
    db.auditLog.findMany({
      orderBy: { createdAt: 'asc' },
      select: { action: true, description: true, metadata: true },
      where: {
        category: { in: ['LEGAL_ENTITY', 'FINANCIAL_ACCOUNT'] },
        createdAt: { gte: startedAt },
      },
    });

  beforeAll(async () => {
    if (!target) throw new Error('Missing isolated treasury database');
    const url = new URL(target);
    if (
      !['127.0.0.1', 'localhost'].includes(url.hostname) ||
      url.pathname !== '/treasury_test'
    )
      throw new Error('A local treasury_test database is required');
    db = new PrismaClient({ datasourceUrl: target });
    connection.client = db;
  });
  beforeEach(async () => {
    // This dedicated database belongs to this suite only.
    await db.financialAccount.deleteMany();
    await db.legalEntity.deleteMany();
    startedAt = new Date();
    manager = await createUser(MANAGE_ALL);
    await authenticate(manager);
  });
  afterAll(async () => {
    await db?.$disconnect();
  });

  it('makes the first entity with a legal form the principal one, never the period before', async () => {
    const before = await entity({
      end: day('2025-09-30'),
      form: 'NONE',
      name: 'Avant l’association',
      start: day('2014-01-01', 'YEAR'),
    });
    expect(before.isPrincipal).toBe(false);
    const association = await entity({
      form: 'ASSOCIATION',
      name: 'Noctambule',
      start: day('2025-10-01', 'MONTH'),
    });
    expect(association.isPrincipal).toBe(true);
    // In the order of time, the period before first.
    expect(
      (
        (await read(await GET_ENTITIES(request('/api/structure/entites'))))
          .data as LegalEntityItem[]
      ).map(({ name }) => name),
    ).toEqual(['Avant l’association', 'Noctambule']);
    // The period before has neither identifier nor seat, and is never
    // principal: the schema says so, the base keeps it.
    const refused = await updateEntity(before, { rnaNumber: 'W751234567' });
    expect(refused.status).toBe(400);
    expect(refused.body.error?.details?.rnaNumber).toBeDefined();
    await expect(
      db.legalEntity.update({
        data: { isPrincipal: true },
        where: { id: before.id },
      }),
    ).rejects.toThrow();
    // A name is unique whatever the case or the accents.
    const duplicate = await createEntity({
      form: 'SAS',
      name: 'NOCTAMBULE',
      start: day('2028-01-01'),
    });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error?.details?.name).toBeDefined();
  });

  it('checks the identifiers and keeps « Autre » named', async () => {
    const association = await entity({
      form: 'ASSOCIATION',
      name: 'Noctambule',
      start: day('2025-10-01'),
    });
    const wrong = await updateEntity(association, {
      rnaNumber: 'X12',
      siretNumber: '123',
    });
    expect(wrong.status).toBe(400);
    expect(Object.keys(wrong.body.error?.details ?? {})).toEqual(
      expect.arrayContaining(['rnaNumber', 'siretNumber']),
    );
    const saved = await updateEntity(association, {
      headOffice: ' 1 rue de l’Exemple, 75001 Paris ',
      rnaNumber: 'w751 234 567',
      siretNumber: '123 456 789 00012',
    });
    expect(saved.status).toBe(200);
    expect(saved.body.data).toMatchObject({
      headOffice: '1 rue de l’Exemple, 75001 Paris',
      rnaNumber: 'W751234567',
      siretNumber: '12345678900012',
    });
    expect(
      (
        await createEntity({
          form: 'OTHER',
          name: 'X',
          start: day('2028-01-01'),
        })
      ).body.error?.details?.otherForm,
    ).toBeDefined();
    await expect(
      db.legalEntity.update({
        data: { rnaNumber: 'W12' },
        where: { id: association.id },
      }),
    ).rejects.toThrow();
  });

  it('moves the principal mark, traced on both, and never simply removes it', async () => {
    const association = await entity({
      form: 'ASSOCIATION',
      name: 'Noctambule',
      start: day('2025-10-01'),
    });
    const company = await entity({
      form: 'SAS',
      name: 'Noctambule Esport',
      start: day('2028-01-01'),
    });
    expect(company.isPrincipal).toBe(false);
    const unset = await updateEntity(association, { isPrincipal: false });
    expect(unset.status).toBe(400);
    expect(unset.body.error?.details?.isPrincipal).toBeDefined();
    const moved = await updateEntity(company, { isPrincipal: true });
    expect(moved.status).toBe(200);
    expect((await reload(association.id)).isPrincipal).toBe(false);
    expect((await reload(company.id)).isPrincipal).toBe(true);
    const events = await journal();
    // Both in one transaction: the same instant, in either order.
    expect(events.map(({ description }) => description)).toEqual(
      expect.arrayContaining([
        'Entité modifiée : Noctambule (n’est plus l’entité principale)',
        'Entité modifiée : Noctambule Esport (entité principale à la place de Noctambule)',
      ]),
    );
    // The base keeps one principal entity at most.
    await expect(
      db.legalEntity.update({
        data: { isPrincipal: true },
        where: { id: association.id },
      }),
    ).rejects.toThrow();
    // The principal entity goes only when no other could take its place.
    const refused = await DELETE_ENTITY(
      request(`/api/structure/entites/${company.id}`, 'DELETE', {
        expectedVersion: (await reload(company.id)).version,
      }),
      params(company.id),
    );
    expect(refused.status).toBe(409);
  });

  it('deduces the entity of an account from its opening day, and asks only between several', async () => {
    // No entity yet: every account belongs to one.
    expect(
      (await openAccount({ name: 'Compte courant' })).body.error?.details,
    ).toHaveProperty('openingOn');
    const association = await entity({
      end: day('2027-12-31'),
      form: 'ASSOCIATION',
      name: 'Noctambule',
      start: day('2025-10-01'),
    });
    await entity({
      end: day('2025-09-30'),
      form: 'NONE',
      name: 'Avant l’association',
      start: day('2014-01-01', 'YEAR'),
    });
    // One entity on that day: it applies by itself.
    const opened = await openAccount({ name: 'Compte courant' });
    expect(opened.status, JSON.stringify(opened.body.error)).toBe(201);
    expect((opened.body.data as FinancialAccountItem).entity).toEqual({
      id: association.id,
      name: 'Noctambule',
    });
    // Before the association, nobody held an account.
    expect(
      (await openAccount({ name: 'Caisse 2020', openingOn: '2020-01-01' })).body
        .error?.details,
    ).toHaveProperty('openingOn');
    // Two entities on that day: the holder is asked, and must exist then.
    const company = await entity({
      form: 'SAS',
      name: 'Noctambule Esport',
      start: day('2027-06-01'),
    });
    const ask = await openAccount({
      name: 'Compte pro',
      openingOn: '2027-07-01',
    });
    expect(ask.status).toBe(400);
    expect(ask.body.error?.details).toHaveProperty('entityId');
    expect(
      (
        await openAccount({
          entityId: company.id,
          name: 'Compte pro',
          openingOn: '2027-01-01',
        })
      ).body.error?.details,
    ).toHaveProperty('entityId');
    const chosen = await openAccount({
      entityId: company.id,
      name: 'Compte pro',
      openingOn: '2027-07-01',
    });
    expect(chosen.status).toBe(201);
    // Each entity may have its own « Compte courant », never two.
    expect(
      (
        await openAccount({
          entityId: company.id,
          name: 'Compte courant',
          openingOn: '2027-07-01',
        })
      ).status,
    ).toBe(201);
    expect(
      (await openAccount({ name: 'COMPTE COURANT' })).body.error?.details,
    ).toHaveProperty('name');
    // The list names the holders for the opening window.
    const overview = (
      await read(await GET_ACCOUNTS(request('/api/finances/comptes')))
    ).data as FinancialAccountsOverview;
    expect(overview.accounts).toHaveLength(3);
    expect(overview.holders.map(({ name }) => name)).toEqual([
      'Noctambule',
      'Noctambule Esport',
    ]);
  });

  it('keeps an account with its entity, and the entity covering its accounts', async () => {
    const association = await entity({
      form: 'ASSOCIATION',
      name: 'Noctambule',
      start: day('2025-10-01'),
    });
    const company = await entity({
      form: 'SAS',
      name: 'Noctambule Esport',
      start: day('2028-01-01'),
    });
    const account = (await openAccount({ name: 'Compte courant' })).body
      .data as FinancialAccountItem;
    // The base refuses another holder, and a holder without a legal form.
    await expect(
      db.financialAccount.update({
        data: { entityId: company.id },
        where: { id: account.id },
      }),
    ).rejects.toThrow(/FinancialAccount_entityId_immutable/u);
    await expect(
      db.legalEntity.update({
        data: { form: 'NONE', isPrincipal: false },
        where: { id: association.id },
      }),
    ).rejects.toThrow();
    // The service says it before the base: the period still covers the
    // opening day, the form stays, the entity is ended rather than deleted.
    const shrink = await updateEntity(association, {
      start: day('2026-06-01'),
    });
    expect(shrink.status).toBe(409);
    expect(shrink.body.error?.details?.start?.[0]).toContain('Compte courant');
    const deleted = await DELETE_ENTITY(
      request(`/api/structure/entites/${association.id}`, 'DELETE', {
        expectedVersion: association.version,
      }),
      params(association.id),
    );
    expect(deleted.status).toBe(409);
    expect((await read(deleted)).error?.message).toContain('date de fin');
    // An account's own opening day stays in its entity's period.
    const before = await PATCH_ACCOUNT(
      request(`/api/finances/comptes/${account.id}`, 'PATCH', {
        closedOn: null,
        expectedVersion: account.version,
        institution: null,
        kind: 'BANK',
        name: account.name,
        openingBalanceCents: account.openingBalanceCents,
        openingOn: '2024-01-01',
      }),
      params(account.id),
    );
    expect(before.status).toBe(400);
  });

  it('edits, closes and deletes an account, every change in the journal', async () => {
    await entity({
      form: 'ASSOCIATION',
      name: 'Noctambule',
      start: day('2025-10-01'),
    });
    const account = (await openAccount({ kind: 'CASH', name: 'Caisse' })).body
      .data as FinancialAccountItem;
    // A cash box is never below zero, and has no bank behind it.
    expect(
      (
        await openAccount({
          kind: 'CASH',
          name: 'Caisse 2',
          openingBalanceCents: -100,
        })
      ).status,
    ).toBe(400);
    await expect(
      db.financialAccount.update({
        data: { openingBalanceCents: -1 },
        where: { id: account.id },
      }),
    ).rejects.toThrow();
    const patch = (payload: Record<string, unknown>): Promise<Response> =>
      PATCH_ACCOUNT(
        request(`/api/finances/comptes/${account.id}`, 'PATCH', {
          closedOn: null,
          expectedVersion: account.version,
          institution: 'Ignorée',
          kind: 'CASH',
          name: 'Caisse',
          openingBalanceCents: 125_000,
          openingOn: '2026-01-01',
          ...payload,
        }),
        params(account.id),
      );
    expect((await patch({ closedOn: '2025-12-31' })).status).toBe(400);
    const closed = await patch({
      closedOn: '2026-06-30',
      openingBalanceCents: 4_250,
    });
    expect(closed.status).toBe(200);
    expect((await read(closed)).data).toMatchObject({
      closedOn: '2026-06-30',
      institution: null,
      openingBalanceCents: 4_250,
      version: 2,
    });
    // A stale version is refused.
    expect((await patch({ name: 'Autre' })).status).toBe(409);
    expect(
      (
        await DELETE_ACCOUNT(
          request(`/api/finances/comptes/${account.id}`, 'DELETE', {
            expectedVersion: 2,
          }),
          params(account.id),
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await GET_ACCOUNT(
          request(`/api/finances/comptes/${account.id}`),
          params(account.id),
        )
      ).status,
    ).toBe(404);
    const events = await journal();
    expect(events.map(({ action }) => action)).toEqual([
      'LEGAL_ENTITY_CREATE',
      'FINANCIAL_ACCOUNT_CREATE',
      'FINANCIAL_ACCOUNT_UPDATE',
      'FINANCIAL_ACCOUNT_DELETE',
    ]);
    expect(events[2]?.metadata).toMatchObject({
      after: { closedOn: '30 juin 2026', openingBalance: '42,50\u00a0€' },
      before: { closedOn: null, openingBalance: '1\u202f250,00\u00a0€' },
      changes: ['closedOn', 'openingBalance'],
    });
  });

  it('refuses whoever lacks the right, read or write', async () => {
    const association = await entity({
      form: 'ASSOCIATION',
      name: 'Noctambule',
      start: day('2025-10-01'),
    });
    await authenticate(
      await createUser({
        [PERMISSIONS.ENTITIES.VIEW]: true,
        [PERMISSIONS.FINANCIAL_ACCOUNTS.VIEW]: true,
      }),
    );
    expect((await GET_ENTITIES(request('/api/structure/entites'))).status).toBe(
      200,
    );
    expect(
      (
        await createEntity({
          form: 'SAS',
          name: 'Intrus',
          start: day('2028-01-01'),
        })
      ).status,
    ).toBe(403);
    expect((await updateEntity(association, { name: 'Autre' })).status).toBe(
      403,
    );
    expect((await openAccount({ name: 'Compte' })).status).toBe(403);
    await authenticate(await createUser({}));
    expect((await GET_ENTITIES(request('/api/structure/entites'))).status).toBe(
      403,
    );
    expect((await GET_ACCOUNTS(request('/api/finances/comptes'))).status).toBe(
      403,
    );
    // Permissions read again inside the transaction: a right withdrawn after
    // the session was read refuses the change.
    const revoked = await createUser(MANAGE_ALL);
    await authenticate(revoked);
    await db.user.update({
      data: { permissions: { [PERMISSIONS.ENTITIES.VIEW]: true } },
      where: { id: revoked.id },
    });
    expect((await updateEntity(association, { name: 'Autre' })).status).toBe(
      403,
    );
  });
});
