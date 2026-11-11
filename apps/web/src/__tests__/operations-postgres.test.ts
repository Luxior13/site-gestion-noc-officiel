import { randomUUID } from 'node:crypto';

import {
  type FinancialAccount,
  type Person,
  PrismaClient,
  type User,
} from '@prisma/client';
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
  PATCH as PATCH_ACCOUNT,
} from '$app/api/finances/comptes/[id]/route';
import { GET as GET_ACCOUNTS } from '$app/api/finances/comptes/route';
import {
  DELETE as DELETE_CHOICE,
  PATCH as PATCH_CHOICE,
} from '$app/api/finances/listes/[liste]/[id]/route';
import { POST as POST_COMMON } from '$app/api/finances/listes/[liste]/courantes/route';
import { POST as POST_ORDER } from '$app/api/finances/listes/[liste]/ordre/route';
import { GET as GET_CHOICES } from '$app/api/finances/listes/[liste]/route';
import {
  GET as GET_OPERATION,
  PATCH as PATCH_OPERATION,
} from '$app/api/finances/operations/[id]/route';
import {
  GET as GET_OPERATIONS,
  POST as POST_OPERATION,
} from '$app/api/finances/operations/route';
import { DELETE as DELETE_ORGANIZATION } from '$app/api/relations/organisations/[id]/route';
import { PERMISSIONS } from '$constants/permissions.constants';
import type { FinancialAccountsOverview } from '$features/financial-accounts/types/financial-account.types';
import type {
  OperationItem,
  OperationsPage,
} from '$features/operations/types/operation.types';
import type { TreasuryChoiceItem } from '$features/treasury-lists/types/treasury-list.types';
import { mapUserToUserType } from '$server/user-projection';
import { formatEuros } from '$utils/money.utils';

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
          throw new Error('Isolated operations database not initialized');
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

const target = process.env.OPERATIONS_TEST_DATABASE_URL;

type Body = {
  data?: unknown;
  error?: { code: string; details?: Record<string, string[]>; message: string };
};

const TREASURER = {
  [PERMISSIONS.FINANCIAL_ACCOUNTS.MANAGE]: true,
  [PERMISSIONS.FINANCIAL_ACCOUNTS.VIEW]: true,
  [PERMISSIONS.OPERATIONS.MANAGE]: true,
  [PERMISSIONS.OPERATIONS.VIEW]: true,
  [PERMISSIONS.ORGANIZATIONS.MANAGE]: true,
  [PERMISSIONS.ORGANIZATIONS.VIEW]: true,
  [PERMISSIONS.PERSONS.VIEW]: true,
};

/**
 * Opérations (owner, « ok go », 11 November 2026): money received, paid or
 * moved between two accounts of one entity; the lists that class them; the
 * balance of each account; what an operation names stays; every change in
 * the journal, every refusal said by the service and kept by the base.
 */
describe.skipIf(!target)('Operations on fully migrated PostgreSQL', () => {
  let db: PrismaClient;
  let current: FinancialAccount;
  let paypal: FinancialAccount;
  let kaiz: Person;
  let startedAt = new Date();

  const login = (): string =>
    'test.' + randomUUID().replaceAll('-', '').slice(0, 20);
  const signIn = async (
    permissions: Record<string, boolean>,
  ): Promise<User> => {
    const user = await db.user.create({
      data: {
        firstName: 'Operations fixture',
        loginName: login(),
        passwordHash: '!fictive',
        permissions,
        role: 'USER',
      },
    });
    await db.loginNameReservation.create({
      data: { loginName: user.loginName, userId: user.id },
    });
    const source = await db.session.create({
      data: {
        expiresAt: new Date(Date.now() + 3600_000),
        idleExpiresAt: new Date(Date.now() + 1800_000),
        mfaMethod: 'TOTP',
        mfaVerifiedAt: new Date(),
        securityVersion: user.securityVersion,
        token: randomUUID(),
        userId: user.id,
      },
    });
    connection.session.mockResolvedValue({
      session: source,
      user: mapUserToUserType(user),
    });

    return user;
  };
  const request = (
    url: string,
    method = 'GET',
    payload?: unknown,
  ): NextRequest =>
    new NextRequest(`http://localhost${url}`, {
      method,
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
    });
  const call = async (
    response: Promise<Response>,
  ): Promise<{ body: Body; status: number }> => {
    const done = await response;

    return { body: (await done.json()) as Body, status: done.status };
  };
  const listParams = (
    liste: string,
  ): { params: Promise<{ liste: string }> } => ({
    params: Promise.resolve({ liste }),
  });
  const choiceParams = (
    liste: string,
    id: string,
  ): { params: Promise<{ id: string; liste: string }> } => ({
    params: Promise.resolve({ id, liste }),
  });
  const idParams = (id: string): { params: Promise<{ id: string }> } => ({
    params: Promise.resolve({ id }),
  });

  const categories = async (): Promise<TreasuryChoiceItem[]> =>
    (
      await call(
        GET_CHOICES(
          request('/api/finances/listes/categories'),
          listParams('categories'),
        ),
      )
    ).body.data as TreasuryChoiceItem[];
  const categoryId = async (name: string): Promise<string> =>
    (await categories()).find((item) => item.name === name)?.id ?? '';

  const enter = (
    payload: Record<string, unknown>,
  ): Promise<{ body: Body; status: number }> =>
    call(
      POST_OPERATION(
        request('/api/finances/operations', 'POST', {
          accountId: current.id,
          amountCents: 10_000,
          categoryId: null,
          gameId: null,
          kind: 'EXPENSE',
          label: null,
          note: null,
          occurredOn: '2026-11-01',
          organizationId: null,
          paymentMethodId: null,
          teamId: null,
          toAccountId: null,
          ...payload,
        }),
      ),
    );
  const operation = async (
    payload: Record<string, unknown>,
  ): Promise<OperationItem> => {
    const { body, status } = await enter(payload);
    expect(status, JSON.stringify(body.error)).toBe(201);

    return body.data as OperationItem;
  };
  const operations = async (query = ''): Promise<OperationsPage> =>
    (await call(GET_OPERATIONS(request(`/api/finances/operations${query}`))))
      .body.data as OperationsPage;
  const journal = async (): Promise<
    { action: string; description: string; metadata: unknown }[]
  > =>
    db.auditLog.findMany({
      orderBy: { createdAt: 'asc' },
      select: { action: true, description: true, metadata: true },
      where: {
        category: { in: ['FINANCIAL_OPERATION', 'TREASURY_CHOICE'] },
        createdAt: { gte: startedAt },
      },
    });

  beforeAll(async () => {
    if (!target) throw new Error('Missing isolated operations database');
    const url = new URL(target);
    if (
      !['127.0.0.1', 'localhost'].includes(url.hostname) ||
      url.pathname !== '/operations_test'
    )
      throw new Error('A local operations_test database is required');
    db = new PrismaClient({ datasourceUrl: target });
    connection.client = db;
  });
  beforeEach(async () => {
    // This dedicated database belongs to this suite only.
    await db.financialOperation.deleteMany();
    await db.treasuryChoice.deleteMany();
    await db.financialAccount.deleteMany();
    await db.legalEntity.deleteMany();
    await db.organization.deleteMany();
    await db.team.deleteMany();
    await db.game.deleteMany();
    await db.person.deleteMany();
    const association = await db.legalEntity.create({
      data: {
        form: 'ASSOCIATION',
        isPrincipal: true,
        name: 'Noctambule',
        normalizedName: 'noctambule',
        startOn: new Date('2025-10-01T00:00:00Z'),
        startPrecision: 'MONTH',
      },
    });
    const account = (name: string, cents: number): Promise<FinancialAccount> =>
      db.financialAccount.create({
        data: {
          entityId: association.id,
          kind: 'BANK',
          name,
          normalizedName: name.toLowerCase(),
          openingBalanceCents: cents,
          openingOn: new Date('2026-10-01T00:00:00Z'),
        },
      });
    current = await account('Compte courant', 125_000);
    paypal = await account('PayPal', 2_300);
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
    await signIn(TREASURER);
    const common = await call(
      POST_COMMON(
        request('/api/finances/listes/categories/courantes', 'POST', {}),
        listParams('categories'),
      ),
    );
    expect(common.status, JSON.stringify(common.body.error)).toBe(201);
  });
  afterAll(async () => {
    await db?.$disconnect();
    connection.client = null;
  });

  it('keeps the lists: common values in their blocks, a hand order, a used value kept', async () => {
    const all = await categories();
    expect(all.filter((item) => item.kind === 'INCOME_CATEGORY')).toHaveLength(
      6,
    );
    // A second click meets the first one's values.
    expect(
      (
        await call(
          POST_COMMON(
            request('/api/finances/listes/categories/courantes', 'POST', {}),
            listParams('categories'),
          ),
        )
      ).status,
    ).toBe(409);
    const incomes = all.filter((item) => item.kind === 'INCOME_CATEGORY');
    const reordered = await call(
      POST_ORDER(
        request('/api/finances/listes/categories/ordre', 'POST', {
          ids: [...incomes].reverse().map(({ id }) => id),
          kind: 'INCOME_CATEGORY',
        }),
        listParams('categories'),
      ),
    );
    expect(reordered.status, JSON.stringify(reordered.body.error)).toBe(200);
    expect(
      (reordered.body.data as TreasuryChoiceItem[])
        .filter((item) => item.kind === 'INCOME_CATEGORY')
        .map(({ name }) => name),
    ).toEqual([...incomes].reverse().map(({ name }) => name));
    // A category of another list is « not found » in this one.
    const material = all.find((item) => item.name === 'Matériel');
    expect(
      (
        await call(
          DELETE_CHOICE(
            request(
              `/api/finances/listes/moyens-de-paiement/${material?.id}`,
              'DELETE',
              { expectedVersion: 1 },
            ),
            choiceParams('moyens-de-paiement', material?.id ?? ''),
          ),
        )
      ).status,
    ).toBe(404);
    await operation({ categoryId: material?.id, label: 'Clavier' });
    // Used: it keeps its kind and is not deleted, here and in the base.
    const turned = await call(
      PATCH_CHOICE(
        request(`/api/finances/listes/categories/${material?.id}`, 'PATCH', {
          expectedVersion: 1,
          isActive: true,
          kind: 'INCOME_CATEGORY',
          name: 'Matériel',
        }),
        choiceParams('categories', material?.id ?? ''),
      ),
    );
    expect(turned.status).toBe(409);
    expect(turned.body.error?.details?.kind).toBeDefined();
    await expect(
      db.treasuryChoice.update({
        data: { kind: 'INCOME_CATEGORY' },
        where: { id: material?.id },
      }),
    ).rejects.toThrow();
    expect(
      (
        await call(
          DELETE_CHOICE(
            request(
              `/api/finances/listes/categories/${material?.id}`,
              'DELETE',
              {
                expectedVersion: 1,
              },
            ),
            choiceParams('categories', material?.id ?? ''),
          ),
        )
      ).status,
    ).toBe(409);
    expect(
      (await categories()).find((item) => item.name === 'Matériel')?.useCount,
    ).toBe(1);
    const events = await journal();
    expect(
      events.filter(({ action }) => action === 'TREASURY_CHOICE_CREATE'),
    ).toHaveLength(12);
    expect(events.map(({ action }) => action)).toContain(
      'TREASURY_CHOICE_REORDER',
    );
  });

  it('enters money received, paid and moved, and gives each account its balance', async () => {
    const lyon = await db.organization.create({
      data: {
        kinds: ['ORGANIZER'],
        name: 'Lyon e-Sport',
        normalizedName: 'lyon e sport',
      },
    });
    const valorant = await db.game.create({
      data: {
        firstOpenedOn: new Date('2021-03-15T00:00:00Z'),
        name: 'Valorant',
        normalizedName: 'valorant',
      },
    });
    const team = await db.team.create({
      data: {
        foundedOn: new Date('2021-03-15T00:00:00Z'),
        gameId: valorant.id,
        name: 'Noctambule Valorant',
        normalizedName: 'noctambule valorant',
      },
    });
    const gain = await operation({
      amountCents: 60_000,
      categoryId: await categoryId('Gains de tournois'),
      kind: 'INCOME',
      label: 'Gain 2e place Lyon e-Sport 2027',
      occurredOn: '2026-11-03',
      organizationId: lyon.id,
      teamId: team.id,
    });
    expect(gain).toMatchObject({
      assignment: { gameName: 'Valorant', kind: 'team' },
      organization: { name: 'Lyon e-Sport' },
    });
    await operation({
      amountCents: 5_000,
      categoryId: await categoryId('Inscriptions aux tournois'),
      label: 'Inscription Lyon e-Sport 2027',
      organizationId: lyon.id,
    });
    await operation({
      amountCents: 10_000,
      categoryId: await categoryId('Gains reversés aux joueurs'),
      label: 'Part du gain',
      occurredOn: '2026-11-04',
      personId: kaiz.id,
    });
    await operation({
      accountId: current.id,
      amountCents: 20_000,
      kind: 'TRANSFER',
      occurredOn: '2026-11-05',
      toAccountId: paypal.id,
    });

    const overview = (
      await call(GET_ACCOUNTS(request('/api/finances/comptes')))
    ).body.data as FinancialAccountsOverview;
    const balance = (id: string): number | undefined =>
      overview.accounts.find((account) => account.id === id)?.balanceCents;
    expect(balance(current.id)).toBe(
      125_000 + 60_000 - 5_000 - 10_000 - 20_000,
    );
    expect(balance(paypal.id)).toBe(2_300 + 20_000);

    const page = await operations();
    expect(page.counts).toEqual({ ALL: 4, EXPENSE: 2, INCOME: 1, TRANSFER: 1 });
    // The latest first.
    expect(page.items.map(({ kind }) => kind)).toEqual([
      'TRANSFER',
      'EXPENSE',
      'INCOME',
      'EXPENSE',
    ]);
    expect((await operations('?sens=entrees')).total).toBe(1);
    // The search ignores accents and case; an account finds its transfers.
    expect((await operations('?q=LYON%20e-sport')).total).toBe(2);
    expect((await operations(`?compte=${paypal.id}`)).items).toHaveLength(1);
    expect(
      (await operations(`?organisation=${lyon.id}`)).items.map(
        ({ amountCents }) => amountCents,
      ),
      // The latest first: the gain of 3 November, then the fee of the 1st.
    ).toEqual([60_000, 5_000]);
    const events = await journal();
    const created = events.filter(
      ({ action }) => action === 'FINANCIAL_OPERATION_CREATE',
    );
    expect(created).toHaveLength(4);
    expect(created[0]?.metadata).toMatchObject({
      after: {
        amount: formatEuros(60_000),
        assignment: 'Noctambule Valorant (Valorant)',
        category: 'Gains de tournois',
        kind: 'Entrée',
        organization: 'Lyon e-Sport',
      },
      operationLabel: 'Gain 2e place Lyon e-Sport 2027',
      pageKey: 'operations',
    });
    expect(created[3]?.description).toBe(
      `Opération ajoutée : Virement : Compte courant → PayPal, ${formatEuros(20_000)}`,
    );
  });

  it('refuses what the treasury cannot hold, in the service and the base', async () => {
    const material = await categoryId('Matériel');
    const sponsoring = await categoryId('Sponsoring');
    const refusal = async (
      payload: Record<string, unknown>,
      field: string,
    ): Promise<void> => {
      const { body, status } = await enter({
        categoryId: material,
        label: 'Clavier',
        ...payload,
      });
      expect(status, JSON.stringify(body)).toBe(400);
      // `field` is one of the fields the cases below name.
      // eslint-disable-next-line security/detect-object-injection
      expect(body.error?.details?.[field], field).toBeDefined();
    };
    // Before the account's opening, in the future, of the wrong kind.
    await refusal({ occurredOn: '2026-09-30' }, 'occurredOn');
    await refusal({ occurredOn: '2999-01-01' }, 'occurredOn');
    await refusal({ categoryId: sponsoring }, 'categoryId');
    // A transfer stays in one entity.
    const company = await db.legalEntity.create({
      data: {
        form: 'SAS',
        name: 'Noctambule SAS',
        normalizedName: 'noctambule sas',
        startOn: new Date('2026-01-01T00:00:00Z'),
      },
    });
    const other = await db.financialAccount.create({
      data: {
        entityId: company.id,
        kind: 'BANK',
        name: 'Compte SAS',
        normalizedName: 'compte sas',
        openingBalanceCents: 0,
        openingOn: new Date('2026-10-01T00:00:00Z'),
      },
    });
    await refusal({ kind: 'TRANSFER', toAccountId: other.id }, 'toAccountId');
    const base = {
      accountId: current.id,
      amountCents: 100,
      kind: 'EXPENSE' as const,
      label: 'Direct',
      occurredOn: new Date('2026-11-01T00:00:00Z'),
    };
    await expect(
      db.financialOperation.create({
        data: { ...base, categoryId: sponsoring },
      }),
    ).rejects.toThrow();
    await expect(
      db.financialOperation.create({
        data: {
          ...base,
          categoryId: null,
          kind: 'TRANSFER',
          toAccountId: other.id,
        },
      }),
    ).rejects.toThrow();
    // An operation keeps its kind; a stale version is refused.
    const entered = await operation({ categoryId: material, label: 'Clavier' });
    const payload = {
      accountId: current.id,
      amountCents: 12_000,
      categoryId: sponsoring,
      gameId: null,
      kind: 'INCOME',
      label: 'Clavier',
      note: null,
      occurredOn: entered.occurredOn,
      organizationId: null,
      paymentMethodId: null,
      teamId: null,
      toAccountId: null,
    };
    const turned = await call(
      PATCH_OPERATION(
        request(`/api/finances/operations/${entered.id}`, 'PATCH', {
          ...payload,
          expectedVersion: 1,
        }),
        idParams(entered.id),
      ),
    );
    expect(turned.status).toBe(400);
    expect(turned.body.error?.details?.kind).toBeDefined();
    const corrected = await call(
      PATCH_OPERATION(
        request(`/api/finances/operations/${entered.id}`, 'PATCH', {
          ...payload,
          categoryId: material,
          expectedVersion: 1,
          kind: 'EXPENSE',
        }),
        idParams(entered.id),
      ),
    );
    expect(corrected.status, JSON.stringify(corrected.body.error)).toBe(200);
    expect((corrected.body.data as OperationItem).amountCents).toBe(12_000);
    expect(
      (
        await call(
          PATCH_OPERATION(
            request(`/api/finances/operations/${entered.id}`, 'PATCH', {
              ...payload,
              categoryId: material,
              expectedVersion: 1,
              kind: 'EXPENSE',
            }),
            idParams(entered.id),
          ),
        )
      ).status,
    ).toBe(409);
  });

  it('keeps what an operation names: its account, its period, its payer', async () => {
    const lyon = await db.organization.create({
      data: {
        kinds: ['ORGANIZER'],
        name: 'Lyon e-Sport',
        normalizedName: 'lyon',
      },
    });
    await operation({
      categoryId: await categoryId('Matériel'),
      label: 'Clavier',
      occurredOn: '2026-11-02',
      organizationId: lyon.id,
    });
    await operation({
      categoryId: await categoryId('Matériel'),
      label: 'Souris',
      occurredOn: '2026-11-06',
      personId: kaiz.id,
    });
    const accountPayload = {
      closedOn: null,
      expectedVersion: 1,
      institution: null,
      kind: 'BANK',
      name: 'Compte courant',
      openingBalanceCents: 125_000,
      openingOn: '2026-10-01',
    };
    const patchAccount = (
      changes: Record<string, unknown>,
    ): Promise<{ body: Body; status: number }> =>
      call(
        PATCH_ACCOUNT(
          request(`/api/finances/comptes/${current.id}`, 'PATCH', {
            ...accountPayload,
            ...changes,
          }),
          idParams(current.id),
        ),
      );
    const later = await patchAccount({ openingOn: '2026-11-03' });
    expect(later.status).toBe(409);
    expect(later.body.error?.details?.openingOn).toBeDefined();
    const closed = await patchAccount({ closedOn: '2026-11-05' });
    expect(closed.status).toBe(409);
    expect(closed.body.error?.details?.closedOn).toBeDefined();
    // The base keeps the period too.
    await expect(
      db.financialAccount.update({
        data: { openingOn: new Date('2026-11-03T00:00:00Z') },
        where: { id: current.id },
      }),
    ).rejects.toThrow();
    expect(
      (
        await call(
          DELETE_ACCOUNT(
            request(`/api/finances/comptes/${current.id}`, 'DELETE', {
              expectedVersion: 1,
            }),
            idParams(current.id),
          ),
        )
      ).status,
    ).toBe(409);
    expect(
      (
        await call(
          DELETE_ORGANIZATION(
            request(`/api/relations/organisations/${lyon.id}`, 'DELETE', {
              expectedVersion: 1,
            }),
            idParams(lyon.id),
          ),
        )
      ).status,
    ).toBe(409);
    await expect(
      db.person.delete({ where: { id: kaiz.id } }),
    ).rejects.toThrow();
  });

  it('keeps the operations, and the Répertoire, to who may read them', async () => {
    const entered = await operation({
      amountCents: 10_000,
      categoryId: await categoryId('Gains reversés aux joueurs'),
      label: 'Part du gain',
      personId: kaiz.id,
    });
    expect(entered.person?.id).toBe(kaiz.id);

    // The operations without the Répertoire: the record is hidden, kept.
    await signIn({
      [PERMISSIONS.OPERATIONS.MANAGE]: true,
      [PERMISSIONS.OPERATIONS.VIEW]: true,
    });
    const hidden = (
      await call(
        GET_OPERATION(
          request(`/api/finances/operations/${entered.id}`),
          idParams(entered.id),
        ),
      )
    ).body.data as OperationItem;
    expect(hidden).toMatchObject({ person: null, personLinked: true });
    const payload = {
      accountId: current.id,
      amountCents: 12_000,
      categoryId: entered.category?.id,
      gameId: null,
      kind: 'EXPENSE',
      label: 'Part du gain',
      note: null,
      occurredOn: entered.occurredOn,
      organizationId: null,
      paymentMethodId: null,
      teamId: null,
      toAccountId: null,
    };
    const kept = await call(
      PATCH_OPERATION(
        request(`/api/finances/operations/${entered.id}`, 'PATCH', {
          ...payload,
          expectedVersion: 1,
        }),
        idParams(entered.id),
      ),
    );
    expect(kept.status, JSON.stringify(kept.body.error)).toBe(200);
    expect(
      (
        await db.financialOperation.findUniqueOrThrow({
          where: { id: entered.id },
        })
      ).personId,
    ).toBe(kaiz.id);
    expect(
      (
        await call(
          PATCH_OPERATION(
            request(`/api/finances/operations/${entered.id}`, 'PATCH', {
              ...payload,
              expectedVersion: 2,
              personId: null,
            }),
            idParams(entered.id),
          ),
        )
      ).status,
    ).toBe(403);

    // Without the operations, nothing.
    await signIn({ [PERMISSIONS.FINANCIAL_ACCOUNTS.VIEW]: true });
    expect(
      (await GET_OPERATIONS(request('/api/finances/operations'))).status,
    ).toBe(403);
  });
});
