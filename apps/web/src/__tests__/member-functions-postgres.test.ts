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

import { DELETE, PATCH } from '$app/api/jeux/[id]/fonctions/[functionId]/route';
import { POST as POST_COMMON } from '$app/api/jeux/[id]/fonctions/courantes/route';
import { PUT as PUT_ORDER } from '$app/api/jeux/[id]/fonctions/ordre/route';
import { GET, POST } from '$app/api/jeux/[id]/fonctions/route';
import {
  DELETE as DELETE_GAME,
  GET as GET_GAME,
} from '$app/api/jeux/[id]/route';
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
          throw new Error('Isolated functions database not initialized');
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

const target = process.env.MEMBER_FUNCTIONS_TEST_DATABASE_URL;

type FunctionData = {
  id: string;
  isActive: boolean;
  kind: string;
  name: string;
  position: number;
  version: number;
};
type Body<T> = {
  data?: T;
  error?: { code: string; details?: Record<string, string[]>; message: string };
};

describe.skipIf(!target)(
  'functions of a game on fully migrated PostgreSQL',
  () => {
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
          firstName: 'Functions fixture',
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
    const url = (game: Game, rest = ''): string =>
      `http://localhost/api/jeux/${game.id}/fonctions${rest}`;
    const params = (game: Game): { params: Promise<{ id: string }> } => ({
      params: Promise.resolve({ id: game.id }),
    });
    const itemParams = (
      game: Game,
      functionId: string,
    ): { params: Promise<{ functionId: string; id: string }> } => ({
      params: Promise.resolve({ functionId, id: game.id }),
    });
    const read = async <T>(response: Response): Promise<Body<T>> =>
      (await response.json()) as Body<T>;
    const list = (game: Game): ReturnType<typeof GET> =>
      GET(new NextRequest(url(game)), params(game));
    const post = (game: Game, payload: unknown): ReturnType<typeof POST> =>
      POST(
        new NextRequest(url(game), {
          body: JSON.stringify(payload),
          method: 'POST',
        }),
        params(game),
      );
    const addCommon = (game: Game): ReturnType<typeof POST_COMMON> =>
      POST_COMMON(
        new NextRequest(url(game, '/courantes'), {
          body: '{}',
          method: 'POST',
        }),
        params(game),
      );
    const patch = (
      game: Game,
      id: string,
      payload: unknown,
    ): ReturnType<typeof PATCH> =>
      PATCH(
        new NextRequest(url(game, `/${id}`), {
          body: JSON.stringify(payload),
          method: 'PATCH',
        }),
        itemParams(game, id),
      );
    const remove = (
      game: Game,
      id: string,
      expectedVersion: number,
    ): ReturnType<typeof DELETE> =>
      DELETE(
        new NextRequest(url(game, `/${id}`), {
          body: JSON.stringify({ expectedVersion }),
          method: 'DELETE',
        }),
        itemParams(game, id),
      );
    const reorder = (
      game: Game,
      kind: string,
      ids: readonly string[],
      active = true,
    ): ReturnType<typeof PUT_ORDER> =>
      PUT_ORDER(
        new NextRequest(url(game, '/ordre'), {
          body: JSON.stringify({ active, ids, kind }),
          method: 'PUT',
        }),
        params(game),
      );
    const names = async (game: Game): Promise<string[]> =>
      ((await read<FunctionData[]>(await list(game))).data ?? []).map(
        ({ name }) => name,
      );
    const removeGame = async (game: Game): ReturnType<typeof DELETE_GAME> =>
      DELETE_GAME(
        new NextRequest(`http://localhost/api/jeux/${game.id}`, {
          body: JSON.stringify({
            expectedVersion: (
              await db.game.findUniqueOrThrow({ where: { id: game.id } })
            ).version,
          }),
          method: 'DELETE',
        }),
        params(game),
      );
    const coach = { isActive: true, kind: 'STAFF', name: '  Coach ' };
    const created = async (
      game: Game,
      payload: unknown,
    ): Promise<FunctionData> => {
      const data = (await read<FunctionData>(await post(game, payload))).data;
      if (!data) throw new Error('Missing function');

      return data;
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
      if (!target) throw new Error('Missing isolated functions database');
      const parsed = new URL(target);
      if (
        !['127.0.0.1', 'localhost'].includes(parsed.hostname) ||
        parsed.pathname !== '/member_functions_service_test'
      )
        throw new Error(
          'A local member_functions_service_test database is required',
        );
      db = new PrismaClient({ datasourceUrl: target });
      connection.client = db;
      admin = await createUser('ADMIN');
    });
    beforeEach(async () => {
      // This dedicated database belongs to this suite only; children go first.
      await db.memberFunction.deleteMany();
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

    it('adds a function to its game and traces it with the game’s name', async () => {
      const response = await post(valorant, coach);
      expect(response.status).toBe(201);
      const item = (await read<FunctionData>(response)).data;
      expect(item).toMatchObject({
        isActive: true,
        kind: 'STAFF',
        name: 'Coach',
        version: 1,
      });
      const audit = await lastAudit('FUNCTION_CREATE');
      expect(audit).toMatchObject({
        category: 'FUNCTION',
        pageKey: 'games',
        poleKey: 'esport',
        userId: admin.id,
      });
      expect(audit.metadata).toMatchObject({
        after: {
          game: 'Valorant',
          isActive: true,
          kind: 'Encadrement',
          name: 'Coach',
        },
        functionId: item?.id,
        functionName: 'Coach',
        gameName: 'Valorant',
      });
      const listed = await read<FunctionData[]>(await list(valorant));
      expect(listed.data?.map(({ name }) => name)).toEqual(['Coach']);
      expect((await read<FunctionData[]>(await list(league))).data).toEqual([]);
      const game = await read<{ functionCount: number }>(
        await GET_GAME(
          new NextRequest(`http://localhost/api/jeux/${valorant.id}`),
          params(valorant),
        ),
      );
      expect(game.data?.functionCount).toBe(1);
    });

    it('keeps a name unique within its game only, whatever the case or the accents', async () => {
      await created(valorant, { ...coach, kind: 'PLAYER', name: 'Remplaçant' });
      const twin = await post(valorant, {
        ...coach,
        kind: 'PLAYER',
        name: 'REMPLACANT',
      });
      expect(twin.status).toBe(409);
      expect((await read(twin)).error?.details?.name).toEqual([
        'Ce jeu a déjà une fonction de ce nom.',
      ]);
      expect(
        (await post(league, { ...coach, kind: 'PLAYER', name: 'Remplaçant' }))
          .status,
      ).toBe(201);
      expect(await db.memberFunction.count()).toBe(2);
      expect(await audits('FUNCTION_CREATE')).toBe(2);
    });

    it('adds the common functions once, each traced, players first', async () => {
      const response = await addCommon(valorant);
      expect(response.status).toBe(201);
      expect(
        (await read<FunctionData[]>(response)).data?.map(
          ({ kind, name }) => `${name}:${kind}`,
        ),
      ).toEqual([
        'Joueur:PLAYER',
        'Remplaçant:PLAYER',
        'Coach:STAFF',
        'Manager:STAFF',
        'Analyste:STAFF',
      ]);
      expect(await audits('FUNCTION_CREATE')).toBe(5);
      const again = await addCommon(valorant);
      expect(again.status).toBe(409);
      expect(
        await db.memberFunction.count({ where: { gameId: valorant.id } }),
      ).toBe(5);
      expect(await audits('FUNCTION_CREATE')).toBe(5);
      // Only an empty list receives them.
      await created(league, coach);
      expect((await addCommon(league)).status).toBe(409);
    });

    it('keeps the order its managers drag, within each kind, traced once', async () => {
      const common = (await read<FunctionData[]>(await addCommon(valorant)))
        .data;
      const id = (name: string): string =>
        common?.find((item) => item.name === name)?.id ?? 'missing';
      const staff = ['Manager', 'Coach', 'Analyste'].map(id);
      const response = await reorder(valorant, 'STAFF', staff);
      expect(response.status).toBe(200);
      expect(
        (await read<FunctionData[]>(response)).data?.map(({ name }) => name),
      ).toEqual(['Joueur', 'Remplaçant', 'Manager', 'Coach', 'Analyste']);
      expect(await names(valorant)).toEqual([
        'Joueur',
        'Remplaçant',
        'Manager',
        'Coach',
        'Analyste',
      ]);
      const audit = await lastAudit('FUNCTION_REORDER');
      expect(audit).toMatchObject({ category: 'FUNCTION', pageKey: 'games' });
      expect(audit.metadata).toMatchObject({
        after: { order: 'Manager, Coach, Analyste' },
        before: { order: 'Coach, Manager, Analyste' },
        changes: ['order'],
        gameName: 'Valorant',
        kind: 'STAFF',
        kindLabel: 'Encadrement',
      });
      // The order is not part of a function's version: an open window stays valid.
      expect(
        (await db.memberFunction.findMany({ select: { version: true } })).every(
          ({ version }) => version === 1,
        ),
      ).toBe(true);
      // The same order again writes nothing.
      expect((await reorder(valorant, 'STAFF', staff)).status).toBe(200);
      expect(await audits('FUNCTION_REORDER')).toBe(1);

      // A new function goes last of its group; another kind, last of the new one.
      const strategist = await created(valorant, {
        ...coach,
        name: 'Stratège',
      });
      expect(strategist.position).toBe(3);
      const substitute = await patch(valorant, id('Remplaçant'), {
        expectedVersion: 1,
        isActive: true,
        kind: 'STAFF',
        name: 'Remplaçant',
      });
      expect((await read<FunctionData>(substitute)).data?.position).toBe(4);
      expect(await names(valorant)).toEqual([
        'Joueur',
        'Manager',
        'Coach',
        'Analyste',
        'Stratège',
        'Remplaçant',
      ]);
    });

    it('ranks only the active functions; an inactive one stays below its group', async () => {
      const common = (await read<FunctionData[]>(await addCommon(valorant)))
        .data;
      const id = (name: string): string =>
        common?.find((item) => item.name === name)?.id ?? 'missing';
      const coachRow = await db.memberFunction.findUniqueOrThrow({
        where: { id: id('Coach') },
      });
      expect(
        (
          await patch(valorant, coachRow.id, {
            expectedVersion: coachRow.version,
            isActive: false,
            kind: 'STAFF',
            name: 'Coach',
          })
        ).status,
      ).toBe(200);
      expect(await names(valorant)).toEqual([
        'Joueur',
        'Remplaçant',
        'Manager',
        'Analyste',
        'Coach',
      ]);
      expect(
        (
          await reorder(valorant, 'STAFF', [
            id('Analyste'),
            id('Manager'),
            id('Coach'),
          ])
        ).status,
      ).toBe(409);
      expect(
        (await reorder(valorant, 'STAFF', [id('Analyste'), id('Manager')]))
          .status,
      ).toBe(200);
      expect(await names(valorant)).toEqual([
        'Joueur',
        'Remplaçant',
        'Analyste',
        'Manager',
        'Coach',
      ]);
      // The inactive functions rank among themselves: nothing blocks them.
      expect(
        (await reorder(valorant, 'STAFF', [id('Coach')], false)).status,
      ).toBe(200);
      expect(
        (await reorder(valorant, 'STAFF', [id('Manager')], false)).status,
      ).toBe(409);
    });

    it('refuses an order whose group changed meanwhile, without a trace', async () => {
      const common = (await read<FunctionData[]>(await addCommon(valorant)))
        .data;
      const ids = (kind: string): string[] =>
        (common ?? [])
          .filter((item) => item.kind === kind)
          .map((item) => item.id);
      const [coachId = '', managerId = '', analystId = ''] = ids('STAFF');
      const refused = [
        // One missing (added by someone else meanwhile, for instance).
        await reorder(valorant, 'STAFF', [managerId, coachId]),
        // A player among the staff.
        await reorder(valorant, 'STAFF', [
          managerId,
          coachId,
          ids('PLAYER')[0] ?? '',
        ]),
        // The right functions under the wrong game.
        await reorder(league, 'STAFF', [managerId, coachId, analystId]),
      ];
      for (const response of refused) expect(response.status).toBe(409);
      expect((await read(refused[0] as Response)).error?.message).toBe(
        'La liste des fonctions a changé entre-temps. Elle est rechargée : recommencez le déplacement.',
      );
      expect(
        (await reorder(valorant, 'STAFF', [coachId, coachId])).status,
      ).toBe(400);
      expect(await audits('FUNCTION_REORDER')).toBe(0);
      expect(await names(valorant)).toEqual([
        'Joueur',
        'Remplaçant',
        'Coach',
        'Manager',
        'Analyste',
      ]);
      await authenticate(
        await createUser('USER', { [PERMISSIONS.GAMES.VIEW]: true }),
      );
      expect(
        (await reorder(valorant, 'STAFF', [managerId, coachId, analystId]))
          .status,
      ).toBe(403);
    });

    it('edits under its version and traces only what changed', async () => {
      const item = await created(valorant, coach);
      const unchanged = await patch(valorant, item.id, {
        ...coach,
        expectedVersion: 1,
      });
      expect((await read<FunctionData>(unchanged)).data?.version).toBe(1);
      expect(await audits('FUNCTION_UPDATE')).toBe(0);

      const edited = await patch(valorant, item.id, {
        expectedVersion: 1,
        isActive: false,
        kind: 'STAFF',
        name: 'Coach principal',
      });
      expect(edited.status).toBe(200);
      expect((await read<FunctionData>(edited)).data).toMatchObject({
        isActive: false,
        name: 'Coach principal',
        version: 2,
      });
      expect((await lastAudit('FUNCTION_UPDATE')).metadata).toMatchObject({
        after: { isActive: false, name: 'Coach principal' },
        before: { isActive: true, name: 'Coach' },
        changes: ['isActive', 'name'],
        gameName: 'Valorant',
      });
      const stale = await patch(valorant, item.id, {
        ...coach,
        expectedVersion: 1,
      });
      expect(stale.status).toBe(409);
      expect(await audits('FUNCTION_UPDATE')).toBe(1);
    });

    it('never reaches a function through another game', async () => {
      const item = await created(valorant, coach);
      expect(
        (await patch(league, item.id, { ...coach, expectedVersion: 1 })).status,
      ).toBe(404);
      expect((await remove(league, item.id, 1)).status).toBe(404);
      expect(await db.memberFunction.count()).toBe(1);
      expect(await audits('FUNCTION_UPDATE')).toBe(0);
      expect(await audits('FUNCTION_DELETE')).toBe(0);
    });

    it('deletes a function under its version and traces it', async () => {
      const item = await created(valorant, coach);
      expect((await remove(valorant, item.id, 2)).status).toBe(409);
      expect((await remove(valorant, item.id, 1)).status).toBe(200);
      expect(await db.memberFunction.count()).toBe(0);
      expect((await lastAudit('FUNCTION_DELETE')).metadata).toMatchObject({
        after: null,
        before: { game: 'Valorant', kind: 'Encadrement', name: 'Coach' },
      });
      expect((await remove(valorant, item.id, 1)).status).toBe(404);
    });

    it('removes the unused functions with a game deleted by mistake, and names them', async () => {
      expect((await addCommon(valorant)).status).toBe(201);
      expect((await removeGame(valorant)).status).toBe(200);
      expect(await db.memberFunction.count()).toBe(0);
      expect((await lastAudit('GAME_DELETE')).metadata).toMatchObject({
        before: {
          functions: 'Analyste, Coach, Joueur, Manager, Remplaçant',
          name: 'Valorant',
        },
      });
      expect(await audits('FUNCTION_DELETE')).toBe(0);
    });

    it('keeps the functions of a game that has a team, and the database refuses a direct deletion', async () => {
      await created(valorant, coach);
      await db.team.create({
        data: {
          foundedOn: new Date('2023-01-01T00:00:00Z'),
          foundedPrecision: 'YEAR',
          gameId: valorant.id,
          name: 'Noctambule',
          normalizedName: 'noctambule',
        },
      });
      expect((await removeGame(valorant)).status).toBe(409);
      expect(await db.memberFunction.count()).toBe(1);
      await db.team.deleteMany();
      // ON DELETE RESTRICT, never CASCADE: only the service removes them, traced.
      await expect(
        db.$executeRawUnsafe('DELETE FROM "Game" WHERE "id" = $1', valorant.id),
      ).rejects.toThrow(/MemberFunction_gameId_fkey/);
      expect(await db.memberFunction.count()).toBe(1);
    });

    it('lets a reader list the functions without changing them, and refuses anyone else', async () => {
      const item = await created(valorant, coach);
      await authenticate(
        await createUser('USER', { [PERMISSIONS.GAMES.VIEW]: true }),
      );
      expect((await list(valorant)).status).toBe(200);
      expect((await post(valorant, { ...coach, name: 'Manager' })).status).toBe(
        403,
      );
      expect((await addCommon(league)).status).toBe(403);
      expect(
        (await patch(valorant, item.id, { ...coach, expectedVersion: 1 }))
          .status,
      ).toBe(403);
      expect((await remove(valorant, item.id, 1)).status).toBe(403);
      await authenticate(await createUser('USER'));
      expect((await list(valorant)).status).toBe(403);
      expect(await db.memberFunction.count()).toBe(1);
    });

    it('answers « not found » for a game that does not exist, without a trace', async () => {
      const missing = { ...valorant, id: 'missing-game' };
      expect((await list(missing)).status).toBe(404);
      expect((await post(missing, coach)).status).toBe(404);
      expect((await addCommon(missing)).status).toBe(404);
      expect(await audits('FUNCTION_CREATE')).toBe(0);
    });

    it('rolls the function back when its trace cannot be written', async () => {
      const name =
        'functions_audit_failure_' + randomUUID().replaceAll('-', '');
      await db.$executeRawUnsafe(
        `CREATE FUNCTION "${name}"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Injected functions audit failure'; END; $$`,
      );
      try {
        await db.$executeRawUnsafe(
          `CREATE TRIGGER "${name}" BEFORE INSERT ON "AuditLog" FOR EACH ROW WHEN (NEW."category" = 'FUNCTION') EXECUTE FUNCTION "${name}"()`,
        );
        expect((await post(valorant, coach)).status).toBe(500);
        expect((await addCommon(valorant)).status).toBe(500);
      } finally {
        await db.$executeRawUnsafe(
          `DROP TRIGGER IF EXISTS "${name}" ON "AuditLog"`,
        );
        await db.$executeRawUnsafe(`DROP FUNCTION "${name}"()`);
      }
      expect(await db.memberFunction.count()).toBe(0);
    });

    it('keeps the database guards: no padded name, no twin in a game or in the structure', async () => {
      const insert = (
        gameId: string | null,
        name: string,
        normalizedName: string,
      ): Promise<number> =>
        db.$executeRawUnsafe(
          `INSERT INTO "MemberFunction" ("id", "gameId", "name", "normalizedName", "kind", "updatedAt") VALUES ($1, $2, $3, $4, 'STAFF', NOW())`,
          randomUUID(),
          gameId,
          name,
          normalizedName,
        );
      await expect(insert(valorant.id, ' Coach', 'coach')).rejects.toThrow(
        /MemberFunction_name_check/,
      );
      await expect(insert(valorant.id, 'x'.repeat(41), 'x')).rejects.toThrow();
      expect(await insert(valorant.id, 'Coach', 'coach')).toBe(1);
      await expect(insert(valorant.id, 'COACH', 'coach')).rejects.toThrow(
        // Unique violation; the localized message does not name the index.
        /23505/,
      );
      // The structure's functions (no game) are unique among themselves too.
      expect(await insert(null, 'Trésorier', 'tresorier')).toBe(1);
      await expect(insert(null, 'Trésorier', 'tresorier')).rejects.toThrow(
        /23505/,
      );
      await expect(insert('missing-game', 'Coach', 'coach')).rejects.toThrow(
        /MemberFunction_gameId_fkey/,
      );
      await expect(
        db.$executeRawUnsafe(
          'UPDATE "MemberFunction" SET "position" = -1 WHERE "gameId" = $1',
          valorant.id,
        ),
      ).rejects.toThrow(/MemberFunction_position_check/);
    });
  },
);
