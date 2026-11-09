import { randomUUID } from 'node:crypto';

import { type Game, PrismaClient, type User } from '@prisma/client';
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

import { DELETE, GET as GET_TEAM, PATCH } from '$app/api/equipes/[id]/route';
import { GET, POST } from '$app/api/equipes/route';
import { PUT as PUT_ORDER } from '$app/api/jeux/[id]/equipes/ordre/route';
import { DELETE as DELETE_GAME } from '$app/api/jeux/[id]/route';
import { GET as GET_GAMES } from '$app/api/jeux/route';
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
          throw new Error('Isolated teams database not initialized');
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

const target = process.env.TEAMS_TEST_DATABASE_URL;
const BASE = 'http://localhost/api/equipes';

type TeamBody = {
  data?: {
    founded: { date: string; precision: string };
    gameId: string;
    id: string;
    isActive: boolean;
    name: string;
    version: number;
  };
  error?: { code: string; details?: Record<string, string[]>; message: string };
};

describe.skipIf(!target)('teams on fully migrated PostgreSQL', () => {
  let db: PrismaClient;
  let admin: User;
  let valorant: Game;
  let league: Game;
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
        firstName: 'Teams fixture',
        loginName: 'test.' + randomUUID().replaceAll('-', '').slice(0, 20),
        passwordHash: '!fictive',
        permissions: permissions ?? undefined,
        role,
      },
    });
  const createGame = (name: string): Promise<Game> =>
    db.game.create({
      data: {
        firstOpenedOn: new Date('2021-01-01T00:00:00Z'),
        firstOpenedPrecision: 'YEAR',
        name,
        normalizedName: name.toLowerCase(),
      },
    });
  const body = async (response: Response): Promise<TeamBody> =>
    (await response.json()) as TeamBody;
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
  const removeGame = (game: Game): ReturnType<typeof DELETE_GAME> =>
    DELETE_GAME(
      new NextRequest(`http://localhost/api/jeux/${game.id}`, {
        body: JSON.stringify({ expectedVersion: game.version }),
        method: 'DELETE',
      }),
      { params: Promise.resolve({ id: game.id }) },
    );
  const academy = (gameId: string): Record<string, unknown> => ({
    founded: { date: '2023-09-14', precision: 'DAY' },
    gameId,
    isActive: true,
    name: '  Noctambule Academy ',
  });
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
    if (!target) throw new Error('Missing isolated teams database');
    const url = new URL(target);
    if (
      !['127.0.0.1', 'localhost'].includes(url.hostname) ||
      url.pathname !== '/teams_service_test'
    )
      throw new Error('A local teams_service_test database is required');
    db = new PrismaClient({ datasourceUrl: target });
    connection.client = db;
    admin = await createUser('ADMIN');
  });
  beforeEach(async () => {
    // This dedicated database belongs to this suite only; teams go first.
    await db.team.deleteMany();
    await db.game.deleteMany();
    valorant = await createGame('Valorant');
    league = await createGame('League of Legends');
    startedAt = new Date();
    await authenticate(admin);
  });
  afterAll(async () => {
    await db?.$disconnect();
    connection.client = null;
  });

  it('adds a team under its game and traces it with the game’s name', async () => {
    const response = await post(academy(valorant.id));
    expect(response.status).toBe(201);
    const created = (await body(response)).data;
    expect(created).toMatchObject({
      founded: { date: '2023-09-14', precision: 'DAY' },
      gameId: valorant.id,
      isActive: true,
      name: 'Noctambule Academy',
      version: 1,
    });
    const audit = await lastAudit('TEAM_CREATE');
    expect(audit).toMatchObject({
      category: 'TEAM',
      pageKey: 'games',
      poleKey: 'esport',
      userId: admin.id,
    });
    expect(audit.metadata).toMatchObject({
      after: {
        founded: '14 septembre 2023',
        game: 'Valorant',
        isActive: true,
        name: 'Noctambule Academy',
      },
      gameName: 'Valorant',
      teamId: created?.id,
      teamName: 'Noctambule Academy',
    });
    expect((await (await GET(new NextRequest(BASE))).json()).data).toHaveLength(
      1,
    );
  });

  it('keeps a name unique within its game only', async () => {
    expect((await post(academy(valorant.id))).status).toBe(201);
    const twin = await post({
      ...academy(valorant.id),
      name: 'NOCTAMBULE ACADÉMY',
    });
    expect(twin.status).toBe(409);
    expect((await body(twin)).error?.details?.name).toEqual([
      'Ce jeu a déjà une équipe de ce nom.',
    ]);
    // Each game may have its own « Noctambule Academy ».
    expect((await post(academy(league.id))).status).toBe(201);
    expect(await db.team.count()).toBe(2);
    expect(await audits('TEAM_CREATE')).toBe(2);
  });

  it('refuses a team under a game that does not exist, without a trace', async () => {
    const response = await post(academy('missing-game'));
    expect(response.status).toBe(404);
    expect(await db.team.count()).toBe(0);
    expect(await audits('TEAM_CREATE')).toBe(0);
  });

  it('edits under its version and traces only what changed', async () => {
    const created = (await body(await post(academy(valorant.id)))).data;
    if (!created) throw new Error('Missing team');
    // No game in an update: JSON drops the undefined key.
    const editable = { ...academy(valorant.id), gameId: undefined };
    const unchanged = await patch(created.id, {
      ...editable,
      expectedVersion: 1,
    });
    expect((await body(unchanged)).data?.version).toBe(1);
    expect(await audits('TEAM_UPDATE')).toBe(0);

    const edited = await patch(created.id, {
      ...editable,
      expectedVersion: 1,
      founded: { date: '2023-09-14', precision: 'YEAR' },
      isActive: false,
    });
    expect(edited.status).toBe(200);
    expect((await body(edited)).data).toMatchObject({
      founded: { date: '2023-01-01', precision: 'YEAR' },
      gameId: valorant.id,
      isActive: false,
      version: 2,
    });
    expect((await lastAudit('TEAM_UPDATE')).metadata).toMatchObject({
      after: { founded: '2023', isActive: false },
      before: { founded: '14 septembre 2023', isActive: true },
      changes: ['founded', 'isActive'],
      gameName: 'Valorant',
    });

    const stale = await patch(created.id, { ...editable, expectedVersion: 1 });
    expect(stale.status).toBe(409);
    expect(await audits('TEAM_UPDATE')).toBe(1);
  });

  it('keeps the game a team was created for, through the API and in the database', async () => {
    const created = (await body(await post(academy(valorant.id)))).data;
    if (!created) throw new Error('Missing team');
    const moved = await patch(created.id, {
      ...academy(league.id),
      expectedVersion: 1,
    });
    expect(moved.status).toBe(400);
    // Even a direct update is refused: the roster will use this game's functions.
    await expect(
      db.$executeRawUnsafe(
        'UPDATE "Team" SET "gameId" = $1 WHERE "id" = $2',
        league.id,
        created.id,
      ),
    ).rejects.toThrow(/Team_gameId_immutable/);
    expect(
      (await db.team.findUniqueOrThrow({ where: { id: created.id } })).gameId,
    ).toBe(valorant.id);
    expect(await audits('TEAM_UPDATE')).toBe(0);
  });

  it('deletes a team under its version and traces it', async () => {
    const created = (await body(await post(academy(valorant.id)))).data;
    if (!created) throw new Error('Missing team');
    expect((await remove(created.id, 2)).status).toBe(409);
    expect((await remove(created.id, 1)).status).toBe(200);
    expect(await db.team.count()).toBe(0);
    expect((await lastAudit('TEAM_DELETE')).metadata).toMatchObject({
      after: null,
      before: { game: 'Valorant', name: 'Noctambule Academy' },
    });
    expect((await remove(created.id, 1)).status).toBe(404);
  });

  it('never deletes a game that has a team, through the API or in the database', async () => {
    await post(academy(valorant.id));
    await post({ ...academy(valorant.id), name: 'Noctambule' });
    const refused = await removeGame(valorant);
    expect(refused.status).toBe(409);
    expect((await body(refused)).error?.message).toBe(
      'Ce jeu a 2 équipes : rendez-le inactif plutôt que de le supprimer.',
    );
    expect(await audits('GAME_DELETE')).toBe(0);
    // Even a direct deletion is refused: ON DELETE RESTRICT, never CASCADE.
    await expect(
      db.$executeRawUnsafe('DELETE FROM "Game" WHERE "id" = $1', valorant.id),
    ).rejects.toThrow(/Team_gameId_fkey/);
    expect(await db.team.count()).toBe(2);
    const listed = (await (
      await GET_GAMES(new NextRequest('http://localhost/api/jeux'))
    ).json()) as {
      data: { name: string; teamCount: number }[];
    };
    expect(
      listed.data.find((game) => game.name === 'Valorant')?.teamCount,
    ).toBe(2);

    await db.team.deleteMany();
    expect((await removeGame(valorant)).status).toBe(200);
  });

  it('reads a team with its game for its record', async () => {
    const created = (await body(await post(academy(valorant.id)))).data;
    if (!created) throw new Error('Missing team');
    const read = (id: string): ReturnType<typeof GET_TEAM> =>
      GET_TEAM(new NextRequest(`${BASE}/${id}`), {
        params: Promise.resolve({ id }),
      });
    const response = await read(created.id);
    expect(response.status).toBe(200);
    expect((await response.json()).data).toMatchObject({
      game: { id: valorant.id, isActive: true, name: 'Valorant' },
      id: created.id,
      name: 'Noctambule Academy',
    });
    expect((await read('missing-team')).status).toBe(404);
    await authenticate(
      await createUser('USER', { [PERMISSIONS.GAMES.VIEW]: true }),
    );
    expect((await read(created.id)).status).toBe(403);
  });

  it('lets a reader see the teams without changing them, and refuses anyone else', async () => {
    await post(academy(valorant.id));
    await authenticate(
      await createUser('USER', {
        [PERMISSIONS.GAMES.VIEW]: true,
        [PERMISSIONS.TEAMS.VIEW]: true,
      }),
    );
    expect((await GET(new NextRequest(BASE))).status).toBe(200);
    expect((await post(academy(league.id))).status).toBe(403);
    await authenticate(
      await createUser('USER', { [PERMISSIONS.GAMES.VIEW]: true }),
    );
    expect((await GET(new NextRequest(BASE))).status).toBe(403);
    expect(await db.team.count()).toBe(1);
  });

  it('keeps the order of a game’s active teams, the inactive ones below, traced once', async () => {
    const add = async (
      name: string,
      game: Game = valorant,
    ): Promise<string> => {
      const created = (await body(await post({ ...academy(game.id), name })))
        .data;
      if (!created) throw new Error('Missing team');

      return created.id;
    };
    const first = await add('Noctambule');
    const academyId = await add('Noctambule Academy');
    const ladies = await add('Noctambule Ladies');
    await add('Noctambule', league);
    await db.team.update({ data: { isActive: false }, where: { id: ladies } });
    const reorder = (
      game: Game,
      ids: readonly string[],
      active = true,
    ): ReturnType<typeof PUT_ORDER> =>
      PUT_ORDER(
        new NextRequest(`http://localhost/api/jeux/${game.id}/equipes/ordre`, {
          body: JSON.stringify({ active, ids }),
          method: 'PUT',
        }),
        { params: Promise.resolve({ id: game.id }) },
      );
    const names = async (game: Game): Promise<string[]> =>
      (
        (await (await GET(new NextRequest(BASE))).json()) as {
          data: { gameId: string; name: string }[];
        }
      ).data
        .filter((team) => team.gameId === game.id)
        .map(({ name }) => name);

    // Inactive, another game's, or under the wrong game: the list changed.
    expect((await reorder(valorant, [academyId, first, ladies])).status).toBe(
      409,
    );
    expect((await reorder(league, [academyId, first])).status).toBe(409);
    // The inactive teams rank among themselves: nothing blocks them.
    expect((await reorder(valorant, [ladies], false)).status).toBe(200);
    expect((await reorder(valorant, [first], false)).status).toBe(409);
    expect(await audits('TEAM_REORDER')).toBe(0);
    const response = await reorder(valorant, [academyId, first]);
    expect(response.status).toBe(200);
    expect(await names(valorant)).toEqual([
      'Noctambule Academy',
      'Noctambule',
      'Noctambule Ladies',
    ]);
    expect((await lastAudit('TEAM_REORDER')).metadata).toMatchObject({
      after: { order: 'Noctambule Academy, Noctambule' },
      before: { order: 'Noctambule, Noctambule Academy' },
      gameName: 'Valorant',
    });
    // A new team goes last of its game.
    await add('Noctambule Rising');
    expect((await names(valorant)).at(2)).toBe('Noctambule Rising');

    await authenticate(
      await createUser('USER', {
        [PERMISSIONS.GAMES.VIEW]: true,
        [PERMISSIONS.TEAMS.VIEW]: true,
      }),
    );
    expect((await reorder(valorant, [first, academyId])).status).toBe(403);
  });

  it('rolls the team back when its trace cannot be written', async () => {
    const name = 'teams_audit_failure_' + randomUUID().replaceAll('-', '');
    await db.$executeRawUnsafe(
      `CREATE FUNCTION "${name}"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Injected teams audit failure'; END; $$`,
    );
    try {
      await db.$executeRawUnsafe(
        `CREATE TRIGGER "${name}" BEFORE INSERT ON "AuditLog" FOR EACH ROW WHEN (NEW."category" = 'TEAM') EXECUTE FUNCTION "${name}"()`,
      );
      expect((await post(academy(valorant.id))).status).toBe(500);
    } finally {
      await db.$executeRawUnsafe(
        `DROP TRIGGER IF EXISTS "${name}" ON "AuditLog"`,
      );
      await db.$executeRawUnsafe(`DROP FUNCTION "${name}"()`);
    }
    expect(await db.team.count()).toBe(0);
  });

  it('keeps the database guards: no padded name, no invented day, no twin in a game', async () => {
    const insert = (
      name: string,
      date: string,
      precision: string,
    ): Promise<number> =>
      db.$executeRawUnsafe(
        `INSERT INTO "Team" ("id", "gameId", "name", "normalizedName", "foundedOn", "foundedPrecision", "updatedAt") VALUES ($1, $2, $3, $4, $5::date, $6::"DatePrecision", CURRENT_TIMESTAMP)`,
        randomUUID(),
        valorant.id,
        name,
        name.trim().toLowerCase(),
        date,
        precision,
      );
    await expect(insert(' Noctambule', '2023-01-01', 'YEAR')).rejects.toThrow(
      /Team_name_check/,
    );
    await expect(insert('Noctambule', '2023-03-15', 'YEAR')).rejects.toThrow(
      /Team_founded_precision_check/,
    );
    await expect(insert('Noctambule', '2023-03-15', 'MONTH')).rejects.toThrow(
      /Team_founded_precision_check/,
    );
    expect(await insert('Noctambule', '2023-03-01', 'MONTH')).toBe(1);
    await expect(insert('Noctambule', '2023-03-01', 'MONTH')).rejects.toThrow(
      // Unique violation; the localized message does not name the index.
      /23505/,
    );
  });
});
