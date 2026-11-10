import { randomUUID } from 'node:crypto';

import {
  type Game,
  type MemberFunction,
  type Person,
  PrismaClient,
  type Team,
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
  GET as GET_ROSTER,
  POST as POST_PASSAGE,
} from '$app/api/equipes/[id]/passages/route';
import {
  GET as GET_TEAM,
  PATCH as PATCH_TEAM,
} from '$app/api/equipes/[id]/route';
import { GET as GET_TEAMS, POST as POST_TEAM } from '$app/api/equipes/route';
import { PUT as PUT_TEAM_ORDER } from '$app/api/jeux/[id]/equipes/ordre/route';
import { GET as GET_FUNCTIONS } from '$app/api/jeux/[id]/fonctions/route';
import { GET as GET_GAME, PATCH as PATCH_GAME } from '$app/api/jeux/[id]/route';
import { PUT as PUT_GAME_ORDER } from '$app/api/jeux/ordre/route';
import { GET as GET_GAMES, POST as POST_GAME } from '$app/api/jeux/route';
import { GET as GET_JOURNEY } from '$app/api/personnes/[id]/parcours/route';
import { PATCH as PATCH_USER } from '$app/api/users/[id]/route';
import { GET as GET_OPTIONS } from '$app/api/users/esport-scope-options/route';
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
          throw new Error('Isolated Esport scope database not initialized');
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

const target = process.env.ESPORT_SCOPE_TEST_DATABASE_URL;

type Body = {
  data?: unknown;
  error?: { code: string; details?: Record<string, string[]>; message: string };
};

const ESPORT = {
  [PERMISSIONS.GAMES.MANAGE]: true,
  [PERMISSIONS.GAMES.VIEW]: true,
  [PERMISSIONS.TEAMS.MANAGE]: true,
  [PERMISSIONS.TEAMS.VIEW]: true,
};

/**
 * The Esport scope of an account (owner, 10 November 2026): its permissions
 * say what, its scope where. Abuse scenarios of the cadrage: another team's
 * address, a guessed id, the API called directly, a scope reduced during the
 * session, a new team of a chosen game, the totals of the lists.
 */
describe.skipIf(!target)('Esport scope on fully migrated PostgreSQL', () => {
  let db: PrismaClient;
  let valorant: Game;
  let league: Game;
  let academy: Team;
  let main: Team;
  let leagueTeam: Team;
  let player: MemberFunction;
  let leaguePlayer: MemberFunction;
  let person: Person;
  let startedAt = new Date();

  const login = (): string =>
    'test.' + randomUUID().replaceAll('-', '').slice(0, 20);
  const createUser = async (
    permissions: Record<string, boolean> | null,
    scope: {
      gameIds?: string[];
      kind: 'ALL' | 'GAMES' | 'TEAMS';
      teamIds?: string[];
    } = {
      kind: 'ALL',
    },
  ): Promise<User> => {
    const user = await db.user.create({
      data: {
        esportScope: scope.kind,
        esportScopeItems: {
          create: [
            ...(scope.gameIds ?? []).map((gameId) => ({ gameId })),
            ...(scope.teamIds ?? []).map((teamId) => ({ teamId })),
          ],
        },
        firstName: 'Esport fixture',
        loginName: login(),
        passwordHash: '!fictive',
        permissions: permissions ?? undefined,
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
  const ids = (data: unknown): string[] =>
    (data as { id: string }[]).map(({ id }) => id).sort();
  const passage = (personId: string, functionId: string): unknown => ({
    end: null,
    functionId,
    personId,
    start: { date: '2024-01-01', precision: 'DAY' },
  });
  const teamInput = (gameId: string, name: string): unknown => ({
    founded: { date: '2024-01-01', precision: 'DAY' },
    gameId,
    isActive: true,
    name,
  });

  beforeAll(async () => {
    if (!target) throw new Error('Missing isolated Esport scope database');
    const url = new URL(target);
    if (
      !['127.0.0.1', 'localhost'].includes(url.hostname) ||
      url.pathname !== '/esport_scope_test'
    )
      throw new Error('A local esport_scope_test database is required');
    db = new PrismaClient({ datasourceUrl: target });
    connection.client = db;
  });
  beforeEach(async () => {
    // This dedicated database belongs to this suite only.
    await db.personPassage.deleteMany();
    await db.userEsportScopeItem.deleteMany();
    await db.memberFunction.deleteMany();
    await db.team.deleteMany();
    await db.game.deleteMany();
    const game = (name: string): Promise<Game> =>
      db.game.create({
        data: {
          firstOpenedOn: new Date('2020-01-01T00:00:00Z'),
          name,
          normalizedName: name.toLowerCase(),
        },
      });
    const team = (gameId: string, name: string): Promise<Team> =>
      db.team.create({
        data: {
          foundedOn: new Date('2020-01-01T00:00:00Z'),
          gameId,
          name,
          normalizedName: name.toLowerCase(),
        },
      });
    valorant = await game('Valorant');
    league = await game('League of Legends');
    academy = await team(valorant.id, 'Academy');
    main = await team(valorant.id, 'Main');
    leagueTeam = await team(league.id, 'Rift');
    player = await db.memberFunction.create({
      data: {
        gameId: valorant.id,
        kind: 'PLAYER',
        name: 'Joueur',
        normalizedName: 'joueur',
      },
    });
    leaguePlayer = await db.memberFunction.create({
      data: {
        gameId: league.id,
        kind: 'PLAYER',
        name: 'Joueur',
        normalizedName: 'joueur',
      },
    });
    person = await db.person.create({
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
  });
  afterAll(async () => {
    await db?.$disconnect();
    connection.client = null;
  });

  describe('chosen games', () => {
    it('lists only the chosen games and all their teams, a new one included', async () => {
      const manager = await createUser(ESPORT, {
        gameIds: [valorant.id],
        kind: 'GAMES',
      });
      await authenticate(manager);

      const games = await read(await GET_GAMES(request('/api/jeux')));
      expect(ids(games.data)).toEqual([valorant.id]);
      expect((games.data as { teamCount: number }[])[0]?.teamCount).toBe(2);
      expect(
        ids((await read(await GET_TEAMS(request('/api/equipes')))).data),
      ).toEqual([academy.id, main.id].sort());

      // A team created later in a chosen game is in the scope at once.
      const created = await POST_TEAM(
        request('/api/equipes', 'POST', teamInput(valorant.id, 'Rookies')),
      );
      expect(created.status).toBe(201);
      expect(
        (await read(await GET_TEAMS(request('/api/equipes')))).data,
      ).toHaveLength(3);
    });

    it('answers as missing for another game, its teams, roster and functions', async () => {
      const manager = await createUser(ESPORT, {
        gameIds: [valorant.id],
        kind: 'GAMES',
      });
      await authenticate(manager);

      const responses = [
        await GET_GAME(request(`/api/jeux/${league.id}`), params(league.id)),
        await GET_FUNCTIONS(
          request(`/api/jeux/${league.id}/fonctions`),
          params(league.id),
        ),
        await GET_TEAM(
          request(`/api/equipes/${leagueTeam.id}`),
          params(leagueTeam.id),
        ),
        await GET_ROSTER(
          request(`/api/equipes/${leagueTeam.id}/passages`),
          params(leagueTeam.id),
        ),
        await POST_PASSAGE(
          request(
            `/api/equipes/${leagueTeam.id}/passages`,
            'POST',
            passage(person.id, leaguePlayer.id),
          ),
          params(leagueTeam.id),
        ),
        await POST_TEAM(
          request('/api/equipes', 'POST', teamInput(league.id, 'Intrus')),
        ),
        // A guessed id and an existing one answer alike.
        await GET_GAME(
          request('/api/jeux/clnotagameidatall0000'),
          params('clnotagameidatall0000'),
        ),
      ];
      expect(responses.map(({ status }) => status)).toEqual([
        404, 404, 404, 404, 404, 404, 404,
      ]);
      expect(await db.personPassage.count()).toBe(0);
      expect(await db.team.count({ where: { gameId: league.id } })).toBe(1);
    });

    it('keeps adding and ordering games to who sees every game', async () => {
      const manager = await createUser(ESPORT, {
        gameIds: [valorant.id, league.id],
        kind: 'GAMES',
      });
      await authenticate(manager);

      const created = await POST_GAME(
        request('/api/jeux', 'POST', {
          firstOpened: { date: '2024-01-01', precision: 'DAY' },
          isActive: true,
          name: 'Rocket League',
          shortName: null,
        }),
      );
      const order = await PUT_GAME_ORDER(
        request('/api/jeux/ordre', 'PUT', { ids: [league.id, valorant.id] }),
      );
      expect([created.status, order.status]).toEqual([403, 403]);
      expect(await db.game.count()).toBe(2);
    });
  });

  describe('chosen teams', () => {
    it('shows the game of a chosen team with that team only', async () => {
      const manager = await createUser(ESPORT, {
        kind: 'TEAMS',
        teamIds: [academy.id],
      });
      await authenticate(manager);

      const games = await read(await GET_GAMES(request('/api/jeux')));
      expect(ids(games.data)).toEqual([valorant.id]);
      // The total counts the teams of the scope only.
      expect((games.data as { teamCount: number }[])[0]?.teamCount).toBe(1);
      const game = await read(
        await GET_GAME(
          request(`/api/jeux/${valorant.id}`),
          params(valorant.id),
        ),
      );
      expect((game.data as { teamCount: number }).teamCount).toBe(1);
      expect(
        ids((await read(await GET_TEAMS(request('/api/equipes')))).data),
      ).toEqual([academy.id]);
      expect(
        (await GET_TEAM(request(`/api/equipes/${main.id}`), params(main.id)))
          .status,
      ).toBe(404);
    });

    it('manages its team and its roster, never the whole game', async () => {
      const manager = await createUser(ESPORT, {
        kind: 'TEAMS',
        teamIds: [academy.id],
      });
      await authenticate(manager);

      const added = await POST_PASSAGE(
        request(
          `/api/equipes/${academy.id}/passages`,
          'POST',
          passage(person.id, player.id),
        ),
        params(academy.id),
      );
      expect(added.status).toBe(201);
      const renamed = await PATCH_TEAM(
        request(`/api/equipes/${academy.id}`, 'PATCH', {
          expectedVersion: academy.version,
          founded: { date: '2020-01-01', precision: 'DAY' },
          isActive: true,
          name: 'Academy 2',
        }),
        params(academy.id),
      );
      expect(renamed.status).toBe(200);

      // What concerns all the game's teams is refused, whatever the game.
      const refused = [
        await PATCH_GAME(
          request(`/api/jeux/${valorant.id}`, 'PATCH', {
            expectedVersion: valorant.version,
            firstOpened: { date: '2020-01-01', precision: 'DAY' },
            isActive: true,
            name: 'Valorant 2',
            shortName: null,
          }),
          params(valorant.id),
        ),
        await POST_TEAM(
          request('/api/equipes', 'POST', teamInput(valorant.id, 'Rookies')),
        ),
        await PUT_TEAM_ORDER(
          request(`/api/jeux/${valorant.id}/equipes/ordre`, 'PUT', {
            ids: [main.id, academy.id],
          }),
          params(valorant.id),
        ),
        await POST_PASSAGE(
          request(
            `/api/equipes/${main.id}/passages`,
            'POST',
            passage(person.id, player.id),
          ),
          params(main.id),
        ),
      ];
      expect(refused.map(({ status }) => status)).toEqual([403, 403, 403, 404]);
      expect(
        (await db.game.findUniqueOrThrow({ where: { id: valorant.id } })).name,
      ).toBe('Valorant');
      expect(await db.personPassage.count({ where: { teamId: main.id } })).toBe(
        0,
      );
    });

    it('reads in a journey only the passages of its teams', async () => {
      await db.personPassage.createMany({
        data: [
          {
            functionId: player.id,
            personId: person.id,
            startOn: new Date('2023-01-01'),
            teamId: academy.id,
          },
          {
            functionId: leaguePlayer.id,
            personId: person.id,
            startOn: new Date('2022-01-01'),
            teamId: leagueTeam.id,
          },
        ],
      });
      const manager = await createUser(
        { ...ESPORT, [PERMISSIONS.PERSONS.VIEW]: true },
        { kind: 'TEAMS', teamIds: [academy.id] },
      );
      await authenticate(manager);

      const journey = await read(
        await GET_JOURNEY(
          request(`/api/personnes/${person.id}/parcours`),
          params(person.id),
        ),
      );
      expect(
        (journey.data as { passages: { team: { id: string } }[] }).passages.map(
          ({ team }) => team.id,
        ),
      ).toEqual([academy.id]);
    });
  });

  it('applies a reduced scope at the next request, and an emptied one opens nothing', async () => {
    const manager = await createUser(ESPORT, {
      gameIds: [valorant.id, league.id],
      kind: 'GAMES',
    });
    await authenticate(manager);
    expect(
      (await read(await GET_GAMES(request('/api/jeux')))).data,
    ).toHaveLength(2);

    // Reduced by an administrator while the session stays open.
    await db.userEsportScopeItem.deleteMany({
      where: { gameId: league.id, userId: manager.id },
    });
    expect(
      (
        await GET_TEAM(
          request(`/api/equipes/${leagueTeam.id}`),
          params(leagueTeam.id),
        )
      ).status,
    ).toBe(404);

    // Its last game deleted: the scope keeps its kind and opens nothing.
    await db.personPassage.deleteMany();
    await db.team.deleteMany({ where: { gameId: valorant.id } });
    await db.memberFunction.deleteMany({ where: { gameId: valorant.id } });
    await db.game.delete({ where: { id: valorant.id } });
    expect(await db.userEsportScopeItem.count()).toBe(0);
    expect((await read(await GET_GAMES(request('/api/jeux')))).data).toEqual(
      [],
    );
    expect((await read(await GET_TEAMS(request('/api/equipes')))).data).toEqual(
      [],
    );
  });

  it('keeps every administrator on every game', async () => {
    await expect(
      db.user.create({
        data: {
          esportScope: 'GAMES',
          firstName: 'Admin fixture',
          loginName: login(),
          passwordHash: '!fictive',
          role: 'ADMIN',
        },
      }),
    ).rejects.toThrow(/User_esportScope_admin_check/);
    await expect(
      db.userEsportScopeItem.create({
        data: {
          gameId: valorant.id,
          teamId: academy.id,
          userId: (await createUser(null)).id,
        },
      }),
    ).rejects.toThrow(/UserEsportScopeItem_target_check/);
  });

  describe('in the authorizations of an account', () => {
    const delegate = {
      [PERMISSIONS.USERS.GRANT_ACCESS]: true,
      [PERMISSIONS.USERS.REVOKE_ACCESS]: true,
      [PERMISSIONS.USERS.VIEW]: true,
      [PERMISSIONS.USERS.VIEW_ACCESS]: true,
    };
    const setScope = async (
      actor: User,
      account: User,
      esportScope: unknown,
    ): Promise<Response> => {
      await authenticate(actor);
      const fresh = await db.user.findUniqueOrThrow({
        where: { id: account.id },
      });

      return PATCH_USER(
        request(`/api/users/${account.id}`, 'PATCH', {
          esportScope,
          expectedUpdatedAt: fresh.updatedAt.toISOString(),
        }),
        params(account.id),
      );
    };

    it('is chosen by who grants and revokes, sees every game, and is traced in words', async () => {
      const actor = await createUser(delegate);
      const manager = await createUser({
        [PERMISSIONS.GAMES.VIEW]: true,
        [PERMISSIONS.TEAMS.VIEW]: true,
      });

      const response = await setScope(actor, manager, {
        gameIds: [valorant.id],
        kind: 'GAMES',
        teamIds: [academy.id],
      });
      expect(response.status).toBe(200);
      const saved = (await read(response)).data as {
        user: { esportScope: string; esportScopeItems: unknown };
      };
      expect(saved.user.esportScope).toBe('GAMES');
      // Only the ids of its kind are kept.
      expect(saved.user.esportScopeItems).toEqual({
        gameIds: [valorant.id],
        teamIds: [],
      });
      expect(
        await db.userEsportScopeItem.findMany({
          select: { gameId: true, teamId: true },
          where: { userId: manager.id },
        }),
      ).toEqual([{ gameId: valorant.id, teamId: null }]);
      const trace = await db.auditLog.findFirstOrThrow({
        orderBy: { createdAt: 'desc' },
        where: {
          action: 'PERMISSION_UPDATE',
          createdAt: { gte: startedAt },
          targetUserId: manager.id,
        },
      });
      expect(trace.metadata).toMatchObject({
        after: { esportScope: 'Jeux : Valorant' },
        before: { esportScope: 'Tous les jeux' },
        changes: ['esportScope'],
      });

      // The same scope again writes nothing.
      const again = await setScope(actor, manager, {
        gameIds: [valorant.id],
        kind: 'GAMES',
        teamIds: [],
      });
      expect(again.status).toBe(200);
      expect(
        await db.auditLog.count({
          where: {
            action: 'PERMISSION_UPDATE',
            createdAt: { gte: startedAt },
            targetUserId: manager.id,
          },
        }),
      ).toBe(1);
    });

    it('refuses a narrower actor, a missing right, one’s own account and an empty or unknown choice', async () => {
      const manager = await createUser(null);
      const narrow = await createUser(delegate, {
        gameIds: [valorant.id],
        kind: 'GAMES',
      });
      const grantOnly = await createUser({
        [PERMISSIONS.USERS.GRANT_ACCESS]: true,
        [PERMISSIONS.USERS.VIEW]: true,
        [PERMISSIONS.USERS.VIEW_ACCESS]: true,
      });
      const actor = await createUser(delegate);
      const games = { gameIds: [league.id], kind: 'GAMES', teamIds: [] };

      expect((await setScope(narrow, manager, games)).status).toBe(403);
      expect((await setScope(grantOnly, manager, games)).status).toBe(403);
      expect((await setScope(actor, actor, games)).status).toBe(403);
      expect(
        (
          await setScope(actor, manager, {
            gameIds: [],
            kind: 'GAMES',
            teamIds: [],
          })
        ).status,
      ).toBe(400);
      expect(
        (
          await setScope(actor, manager, {
            gameIds: [],
            kind: 'TEAMS',
            teamIds: ['clnotateamidatall0000'],
          })
        ).status,
      ).toBe(400);
      expect(
        (await db.user.findUniqueOrThrow({ where: { id: manager.id } }))
          .esportScope,
      ).toBe('ALL');
    });

    it('lists every game and team to choose from, to who reads accounts’ access', async () => {
      const reader = await createUser(
        {
          [PERMISSIONS.USERS.VIEW]: true,
          [PERMISSIONS.USERS.VIEW_ACCESS]: true,
        },
        // Their own Esport scope does not narrow the choices.
        { kind: 'TEAMS', teamIds: [academy.id] },
      );
      await authenticate(reader);
      const options = (
        await read(
          await GET_OPTIONS(request('/api/users/esport-scope-options')),
        )
      ).data as { games: { id: string }[]; teams: { id: string }[] };
      expect(ids(options.games)).toEqual([valorant.id, league.id].sort());
      expect(ids(options.teams)).toHaveLength(3);

      await authenticate(await createUser(ESPORT));
      expect(
        (await GET_OPTIONS(request('/api/users/esport-scope-options'))).status,
      ).toBe(403);
    });
  });
});
