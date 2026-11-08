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

import { DELETE, GET as GET_GAME, PATCH } from '$app/api/jeux/[id]/route';
import { GET, POST } from '$app/api/jeux/route';
import { PERMISSIONS } from '$constants/permissions.constants';
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
          throw new Error('Isolated games database not initialized');
        const value: unknown = Reflect.get(connection.client, key);

        return typeof value === 'function'
          ? value.bind(connection.client)
          : value;
      },
    },
  ),
}));
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock('$server/rate-limiter', () => ({
  reserveAuthenticatedApiRateLimit: vi.fn(async () => ({ allowed: true })),
}));
vi.mock('$server/session', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$server/session')>()),
  getAuthSession: connection.session,
}));

const target = process.env.GAMES_TEST_DATABASE_URL;
const BASE = 'http://localhost/api/jeux';

type GameBody = {
  data?: {
    firstOpened: { date: string; precision: string };
    id: string;
    isActive: boolean;
    name: string;
    shortName: string | null;
    version: number;
  };
  error?: { code: string; details?: Record<string, string[]> };
};

describe.skipIf(!target)('games on fully migrated PostgreSQL', () => {
  let db: PrismaClient;
  let admin: User;
  // The journal is append-only: each test reads the traces written since it began.
  let startedAt = new Date();

  const authenticate = async (user: User): Promise<void> => {
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
  };
  const createUser = (
    role: 'ADMIN' | 'USER',
    permissions: Record<string, boolean> | null = null,
  ): Promise<User> =>
    db.user.create({
      data: {
        firstName: 'Games fixture',
        loginName: 'test.' + randomUUID().replaceAll('-', '').slice(0, 20),
        passwordHash: '!fictive',
        permissions: permissions ?? undefined,
        role,
      },
    });
  const body = async (response: Response): Promise<GameBody> =>
    (await response.json()) as GameBody;
  const post = (payload: unknown): ReturnType<typeof POST> =>
    POST(
      new NextRequest(BASE, {
        body: JSON.stringify(payload),
        method: 'POST',
      }),
    );
  const patch = (id: string, payload: unknown): ReturnType<typeof PATCH> =>
    PATCH(
      new NextRequest(`${BASE}/${id}`, {
        body: JSON.stringify(payload),
        method: 'PATCH',
      }),
      { params: Promise.resolve({ id }) },
    );
  const remove = (
    id: string,
    expectedVersion: number,
  ): ReturnType<typeof DELETE> =>
    DELETE(
      new NextRequest(`${BASE}/${id}`, {
        body: JSON.stringify({ expectedVersion }),
        method: 'DELETE',
      }),
      { params: Promise.resolve({ id }) },
    );
  const valorant = {
    firstOpened: { date: '2021-03-15', precision: 'DAY' },
    isActive: true,
    name: '  Valorant ',
    shortName: 'VAL',
  };
  const auditWhere = (
    action: string,
  ): { action: never; createdAt: { gte: Date } } => ({
    action: action as never,
    createdAt: { gte: startedAt },
  });
  const audits = (action: string): Promise<number> =>
    db.auditLog.count({ where: auditWhere(action) });
  const lastAudit = (
    action: string,
  ): ReturnType<PrismaClient['auditLog']['findFirstOrThrow']> =>
    db.auditLog.findFirstOrThrow({
      orderBy: { createdAt: 'desc' },
      where: auditWhere(action),
    });

  beforeAll(async () => {
    if (!target) throw new Error('Missing isolated games database');
    const url = new URL(target);
    if (
      !['127.0.0.1', 'localhost'].includes(url.hostname) ||
      url.pathname !== '/games_service_test'
    )
      throw new Error('A local games_service_test database is required');
    db = new PrismaClient({ datasourceUrl: target });
    connection.client = db;
    admin = await createUser('ADMIN');
  });
  beforeEach(async () => {
    // This dedicated database belongs to this suite only.
    await db.game.deleteMany();
    startedAt = new Date();
    await authenticate(admin);
  });
  afterAll(async () => {
    await db?.$disconnect();
    connection.client = null;
  });

  it('adds a game with a trimmed name and traces it in the same request', async () => {
    const response = await post(valorant);
    expect(response.status).toBe(201);
    const created = (await body(response)).data;
    expect(created).toMatchObject({
      firstOpened: { date: '2021-03-15', precision: 'DAY' },
      isActive: true,
      name: 'Valorant',
      shortName: 'VAL',
      version: 1,
    });
    const stored = await db.game.findUniqueOrThrow({
      where: { id: created?.id },
    });
    expect(stored.normalizedName).toBe('valorant');
    const audit = await lastAudit('GAME_CREATE');
    expect(audit).toMatchObject({
      category: 'GAME',
      pageKey: 'games',
      poleKey: 'esport',
      userId: admin.id,
    });
    expect(audit.metadata).toMatchObject({
      after: {
        firstOpened: '15 mars 2021',
        isActive: true,
        name: 'Valorant',
        shortName: 'VAL',
      },
      gameId: created?.id,
      gameName: 'Valorant',
    });

    const list = await GET(new NextRequest(BASE));
    expect((await list.json()).data).toHaveLength(1);
  });

  it('refuses a second game of the same name whatever the case or the accents', async () => {
    expect((await post(valorant)).status).toBe(201);
    for (const name of ['valorant', 'VALÓRANT']) {
      const response = await post({ ...valorant, name });
      expect(response.status).toBe(409);
      expect((await body(response)).error?.details?.name).toEqual([
        'Un jeu porte déjà ce nom.',
      ]);
    }
    expect(await db.game.count()).toBe(1);
    expect(await audits('GAME_CREATE')).toBe(1);
  });

  it('edits under its version, traces only the changed fields and ignores an unchanged form', async () => {
    const created = (await body(await post(valorant))).data;
    if (!created) throw new Error('Missing game');
    const unchanged = await patch(created.id, {
      ...valorant,
      expectedVersion: 1,
    });
    expect((await body(unchanged)).data?.version).toBe(1);
    expect(await audits('GAME_UPDATE')).toBe(0);

    const edited = await patch(created.id, {
      ...valorant,
      expectedVersion: 1,
      firstOpened: { date: '2020-06-02', precision: 'YEAR' },
      isActive: false,
    });
    expect(edited.status).toBe(200);
    expect((await body(edited)).data).toMatchObject({
      firstOpened: { date: '2020-01-01', precision: 'YEAR' },
      isActive: false,
      version: 2,
    });
    const audit = await lastAudit('GAME_UPDATE');
    expect(audit.metadata).toMatchObject({
      after: { firstOpened: '2020', isActive: false },
      before: { firstOpened: '15 mars 2021', isActive: true },
      changes: ['firstOpened', 'isActive'],
    });

    const stale = await patch(created.id, {
      ...valorant,
      expectedVersion: 1,
      name: 'Valorant 2',
    });
    expect(stale.status).toBe(409);
    expect(
      (await db.game.findUniqueOrThrow({ where: { id: created.id } })).name,
    ).toBe('Valorant');
    expect(await audits('GAME_UPDATE')).toBe(1);
  });

  it('deletes a game under its version and traces it', async () => {
    const created = (await body(await post(valorant))).data;
    if (!created) throw new Error('Missing game');
    expect((await remove(created.id, 2)).status).toBe(409);
    expect((await remove(created.id, 1)).status).toBe(200);
    expect(await db.game.count()).toBe(0);
    const audit = await lastAudit('GAME_DELETE');
    expect(audit.metadata).toMatchObject({
      after: null,
      before: { name: 'Valorant' },
    });
    expect((await remove(created.id, 1)).status).toBe(404);
  });

  it('reads a game with its number of teams for its record', async () => {
    const created = (await body(await post(valorant))).data;
    if (!created) throw new Error('Missing game');
    const read = (id: string): ReturnType<typeof GET_GAME> =>
      GET_GAME(new NextRequest(`${BASE}/${id}`), {
        params: Promise.resolve({ id }),
      });
    const response = await read(created.id);
    expect(response.status).toBe(200);
    expect((await response.json()).data).toMatchObject({
      id: created.id,
      name: 'Valorant',
      teamCount: 0,
    });
    expect((await read('missing-game')).status).toBe(404);
    await authenticate(await createUser('USER'));
    expect((await read(created.id)).status).toBe(403);
  });

  it('lets a reader see the games without changing them, and refuses anyone else', async () => {
    await post(valorant);
    await authenticate(
      await createUser('USER', { [PERMISSIONS.GAMES.VIEW]: true }),
    );
    expect((await GET(new NextRequest(BASE))).status).toBe(200);
    expect(
      (await post({ ...valorant, name: 'League of Legends' })).status,
    ).toBe(403);
    await authenticate(await createUser('USER'));
    expect((await GET(new NextRequest(BASE))).status).toBe(403);
    expect(await db.game.count()).toBe(1);
  });

  it('rolls the game back when its trace cannot be written', async () => {
    const name = 'games_audit_failure_' + randomUUID().replaceAll('-', '');
    await db.$executeRawUnsafe(
      `CREATE FUNCTION "${name}"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Injected games audit failure'; END; $$`,
    );
    try {
      await db.$executeRawUnsafe(
        `CREATE TRIGGER "${name}" BEFORE INSERT ON "AuditLog" FOR EACH ROW WHEN (NEW."category" = 'GAME') EXECUTE FUNCTION "${name}"()`,
      );
      expect((await post(valorant)).status).toBe(500);
    } finally {
      await db.$executeRawUnsafe(
        `DROP TRIGGER IF EXISTS "${name}" ON "AuditLog"`,
      );
      await db.$executeRawUnsafe(`DROP FUNCTION "${name}"()`);
    }
    expect(await db.game.count()).toBe(0);
  });

  it('keeps the database guards: no padded name, no invented day', async () => {
    const insert = (
      name: string,
      date: string,
      precision: string,
    ): Promise<number> =>
      db.$executeRawUnsafe(
        `INSERT INTO "Game" ("id", "name", "normalizedName", "firstOpenedOn", "firstOpenedPrecision", "updatedAt") VALUES ($1, $2, $3, $4::date, $5::"DatePrecision", CURRENT_TIMESTAMP)`,
        randomUUID(),
        name,
        name.trim().toLowerCase(),
        date,
        precision,
      );
    await expect(insert(' Valorant', '2021-01-01', 'YEAR')).rejects.toThrow(
      /Game_name_check/,
    );
    await expect(insert('Valorant', '2021-03-15', 'YEAR')).rejects.toThrow(
      /Game_firstOpened_precision_check/,
    );
    await expect(insert('Valorant', '2021-03-15', 'MONTH')).rejects.toThrow(
      /Game_firstOpened_precision_check/,
    );
    expect(await insert('Valorant', '2021-03-01', 'MONTH')).toBe(1);
  });
});
