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

import { GET as GET_PERSON_SEARCH } from '$app/api/passages/personnes/route';
import { GET as JOURNEY } from '$app/api/personnes/[id]/parcours/route';
import { POST as CHANGE } from '$app/api/structure/effectif/[passageId]/changement/route';
import {
  DELETE as DELETE_PASSAGE,
  PATCH as PATCH_PASSAGE,
} from '$app/api/structure/effectif/[passageId]/route';
import {
  GET as GET_EFFECTIF,
  POST as POST_PASSAGE,
} from '$app/api/structure/effectif/route';
import {
  DELETE as DELETE_FUNCTION,
  PATCH as PATCH_FUNCTION,
} from '$app/api/structure/fonctions/[functionId]/route';
import { POST as POST_COMMON } from '$app/api/structure/fonctions/courantes/route';
import { PUT as PUT_ORDER } from '$app/api/structure/fonctions/ordre/route';
import {
  GET as GET_FUNCTIONS,
  POST as POST_FUNCTION,
} from '$app/api/structure/fonctions/route';
import { GET as GET_SUMMARY } from '$app/api/structure/route';
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
          throw new Error('Isolated staff database not initialized');
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

const target = process.env.STAFF_TEST_DATABASE_URL;

type Day = { date: string; precision: 'DAY' | 'MONTH' | 'YEAR' };
type FunctionData = {
  id: string;
  isActive: boolean;
  kind: string;
  name: string;
  passageCount: number;
  version: number;
};
type RosterData = {
  functions: { id: string; kind: string; name: string }[];
  passages: {
    end: Day | null;
    function: { id: string; name: string };
    id: string;
    person: { id: string };
    start: Day;
    version: number;
  }[];
};
type Body<T> = {
  data?: T;
  error?: { code: string; details?: Record<string, string[]>; message: string };
};

/**
 * Bureau & staff (owner, 9 November 2026: « ok go »): the structure keeps
 * its own roster and its own functions, of two kinds, with rights of their
 * own; the person's journey reads it with the teams' rosters.
 */
describe.skipIf(!target)('Bureau & staff on fully migrated PostgreSQL', () => {
  let db: PrismaClient;
  let admin: User;
  let valorant: Game;
  let team: Team;
  let player: MemberFunction;
  let treasurer: MemberFunction;
  let designer: MemberFunction;
  let kaiz: Person;
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
        firstName: 'Staff fixture',
        loginName: 'test.' + randomUUID().replaceAll('-', '').slice(0, 20),
        passwordHash: '!fictive',
        permissions: permissions ?? undefined,
        role,
      },
    });
  const structureFunction = (
    name: string,
    kind: 'BOARD' | 'STAFF',
    position: number,
  ): Promise<MemberFunction> =>
    db.memberFunction.create({
      data: { kind, name, normalizedName: name.toLowerCase(), position },
    });
  const read = async <T>(response: Response): Promise<Body<T>> =>
    (await response.json()) as Body<T>;
  const send = (path: string, method: string, payload?: unknown): NextRequest =>
    new NextRequest(`http://localhost/api/structure${path}`, {
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
      method,
    });
  const passageParams = (
    passageId: string,
  ): { params: Promise<{ passageId: string }> } => ({
    params: Promise.resolve({ passageId }),
  });
  const functionParams = (
    functionId: string,
  ): { params: Promise<{ functionId: string }> } => ({
    params: Promise.resolve({ functionId }),
  });
  const effectif = async (): Promise<RosterData> => {
    const data = (
      await read<RosterData>(await GET_EFFECTIF(send('/effectif', 'GET')))
    ).data;
    if (!data) throw new Error('Missing Effectif');

    return data;
  };
  const addPassage = async (
    person: Person,
    memberFunction: MemberFunction,
    start: Day,
    end: Day | null = null,
  ): Promise<RosterData['passages'][number]> => {
    const response = await POST_PASSAGE(
      send('/effectif', 'POST', {
        end,
        functionId: memberFunction.id,
        personId: person.id,
        start,
      }),
    );
    expect(response.status).toBe(201);
    const found = (await read<RosterData>(response)).data?.passages.find(
      (entry) => entry.function.id === memberFunction.id,
    );
    if (!found) throw new Error('Missing passage');

    return found;
  };
  const auditWhere = (
    action: string,
  ): { action: never; createdAt: { gte: Date } } => ({
    action: action as never,
    createdAt: { gte: startedAt },
  });
  const lastAudit = (
    action: string,
  ): ReturnType<PrismaClient['auditLog']['findFirstOrThrow']> =>
    db.auditLog.findFirstOrThrow({
      orderBy: { createdAt: 'desc' },
      where: auditWhere(action),
    });

  beforeAll(async () => {
    if (!target) throw new Error('Missing isolated staff database');
    const parsed = new URL(target);
    if (
      !['127.0.0.1', 'localhost'].includes(parsed.hostname) ||
      parsed.pathname !== '/staff_service_test'
    )
      throw new Error('A local staff_service_test database is required');
    db = new PrismaClient({ datasourceUrl: target });
    connection.client = db;
    admin = await createUser('ADMIN');
  });
  beforeEach(async () => {
    // This dedicated database belongs to this suite only; children go first.
    await db.personPassage.deleteMany();
    await db.person.deleteMany();
    await db.memberFunction.deleteMany();
    await db.team.deleteMany();
    await db.game.deleteMany();
    valorant = await db.game.create({
      data: {
        firstOpenedOn: new Date('2021-01-01T00:00:00Z'),
        firstOpenedPrecision: 'YEAR',
        name: 'Valorant',
        normalizedName: 'valorant',
      },
    });
    team = await db.team.create({
      data: {
        foundedOn: new Date('2023-01-01T00:00:00Z'),
        foundedPrecision: 'YEAR',
        gameId: valorant.id,
        name: 'Noctambule',
        normalizedName: 'noctambule',
      },
    });
    player = await db.memberFunction.create({
      data: {
        gameId: valorant.id,
        kind: 'PLAYER',
        name: 'Joueur',
        normalizedName: 'joueur',
      },
    });
    treasurer = await structureFunction('Trésorier', 'BOARD', 0);
    designer = await structureFunction('Graphiste', 'STAFF', 0);
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
    await authenticate(admin);
  });
  afterAll(async () => {
    await db?.$disconnect();
    connection.client = null;
  });

  it('adds a board function, traced under Bureau & staff, unique in the structure only', async () => {
    const response = await POST_FUNCTION(
      send('/fonctions', 'POST', {
        isActive: true,
        kind: 'BOARD',
        name: '  Président ',
      }),
    );
    expect(response.status).toBe(201);
    expect((await read<FunctionData>(response)).data).toMatchObject({
      kind: 'BOARD',
      name: 'Président',
      passageCount: 0,
    });
    const trace = await lastAudit('FUNCTION_CREATE');
    expect(trace).toMatchObject({
      category: 'FUNCTION',
      description: 'Fonction ajoutée : Président (Bureau & staff)',
      pageKey: 'staff',
      poleKey: 'structure',
    });
    expect(trace.metadata).toMatchObject({
      after: { isActive: true, kind: 'Bureau', name: 'Président' },
      scopeName: 'Bureau & staff',
    });
    expect(trace.metadata).not.toHaveProperty('gameName');
    // A twin of the structure is refused; a game may hold the same name.
    const twin = await POST_FUNCTION(
      send('/fonctions', 'POST', {
        isActive: true,
        kind: 'STAFF',
        name: 'PRÉSIDENT',
      }),
    );
    expect(twin.status).toBe(409);
    expect((await read(twin)).error?.message).toBe(
      'La structure a déjà une fonction de ce nom.',
    );
    // The list holds the structure's functions only, the board first.
    const list = await read<FunctionData[]>(
      await GET_FUNCTIONS(send('/fonctions', 'GET')),
    );
    expect(list.data?.map(({ name }) => name)).toEqual([
      'Trésorier',
      'Président',
      'Graphiste',
    ]);
  });

  it('refuses the players in the structure, and the board in a game, down to the database', async () => {
    const response = await POST_FUNCTION(
      send('/fonctions', 'POST', {
        isActive: true,
        kind: 'PLAYER',
        name: 'Joueur',
      }),
    );
    expect(response.status).toBe(400);
    await expect(
      db.memberFunction.create({
        data: {
          kind: 'PLAYER',
          name: 'Capitaine',
          normalizedName: 'capitaine',
        },
      }),
    ).rejects.toThrow(/MemberFunction_kind_scope_check/u);
    await expect(
      db.memberFunction.create({
        data: {
          gameId: valorant.id,
          kind: 'BOARD',
          name: 'Président',
          normalizedName: 'president',
        },
      }),
    ).rejects.toThrow(/MemberFunction_kind_scope_check/u);
  });

  it('never reaches a game’s function through the structure, nor the reverse', async () => {
    const response = await PATCH_FUNCTION(
      send(`/fonctions/${player.id}`, 'PATCH', {
        expectedVersion: 1,
        isActive: true,
        kind: 'STAFF',
        name: 'Joueur',
      }),
      functionParams(player.id),
    );
    expect(response.status).toBe(404);
  });

  it('adds the usual board and staff once, then orders a group', async () => {
    await db.memberFunction.deleteMany();
    const response = await POST_COMMON(
      send('/fonctions/courantes', 'POST', {}),
    );
    expect(response.status).toBe(201);
    const items = (await read<FunctionData[]>(response)).data ?? [];
    expect(items.map(({ name }) => name)).toEqual([
      'Président',
      'Vice-président',
      'Trésorier',
      'Secrétaire',
      'Graphiste',
      'Monteur',
      'Community manager',
      'Bénévole',
    ]);
    expect(
      (await POST_COMMON(send('/fonctions/courantes', 'POST', {}))).status,
    ).toBe(409);
    const board = items.filter(({ kind }) => kind === 'BOARD');
    const order = [board[2], board[0], board[1], board[3]].map(
      (item) => item?.id ?? '',
    );
    const reordered = await PUT_ORDER(
      send('/fonctions/ordre', 'PUT', { ids: order, kind: 'BOARD' }),
    );
    expect(reordered.status).toBe(200);
    expect(
      (await read<FunctionData[]>(reordered)).data
        ?.filter(({ kind }) => kind === 'BOARD')
        .map(({ name }) => name),
    ).toEqual(['Trésorier', 'Président', 'Vice-président', 'Secrétaire']);
    expect((await lastAudit('FUNCTION_REORDER')).description).toBe(
      'Ordre des fonctions modifié : Bureau (Bureau & staff)',
    );
  });

  it('keeps a passage in the Effectif, apart from the teams, traced on the record', async () => {
    await db.personPassage.create({
      data: {
        functionId: player.id,
        personId: kaiz.id,
        startOn: new Date('2024-01-01T00:00:00Z'),
        startPrecision: 'YEAR',
        teamId: team.id,
      },
    });
    const passage = await addPassage(kaiz, treasurer, {
      date: '2025-10-01',
      precision: 'MONTH',
    });
    const data = await effectif();
    // The structure's functions and passages only, never a team's.
    expect(data.functions.map(({ name }) => name)).toEqual([
      'Trésorier',
      'Graphiste',
    ]);
    expect(data.passages.map(({ id }) => id)).toEqual([passage.id]);
    const trace = await lastAudit('PASSAGE_CREATE');
    expect(trace).toMatchObject({
      category: 'PASSAGE',
      description: 'Passage ajouté : Trésorier, Bureau & staff',
      entityId: kaiz.id,
      entityType: 'PERSON',
      pageKey: 'staff',
      poleKey: 'structure',
    });
    expect(trace.metadata).toMatchObject({
      after: { end: 'En cours', function: 'Trésorier', start: 'octobre 2025' },
      scopeName: 'Bureau & staff',
    });
    expect(trace.metadata).not.toHaveProperty('teamName');
    expect(JSON.stringify(trace.metadata)).not.toContain('Kaiz');
    // A game's function is refused here, by the service and the database.
    const wrong = await POST_PASSAGE(
      send('/effectif', 'POST', {
        end: null,
        functionId: player.id,
        personId: kaiz.id,
        start: { date: '2025-01-01', precision: 'YEAR' },
      }),
    );
    expect(wrong.status).toBe(400);
    expect((await read(wrong)).error?.details?.functionId).toEqual([
      'Choisissez une fonction de la structure.',
    ]);
    await expect(
      db.personPassage.create({
        data: {
          functionId: player.id,
          personId: kaiz.id,
          startOn: new Date('2020-01-01T00:00:00Z'),
        },
      }),
    ).rejects.toThrow(/PersonPassage_function_scope/u);
    // The same function twice at once is refused, in the Effectif's words.
    const twin = await POST_PASSAGE(
      send('/effectif', 'POST', {
        end: null,
        functionId: treasurer.id,
        personId: kaiz.id,
        start: { date: '2026-01-01', precision: 'YEAR' },
      }),
    );
    expect(twin.status).toBe(409);
    expect((await read(twin)).error?.details?.start).toEqual([
      'Cette personne a déjà cette fonction dans la structure sur cette période.',
    ]);
  });

  it('corrects, changes the function of, and deletes a passage under its version', async () => {
    const passage = await addPassage(kaiz, designer, {
      date: '2022-01-01',
      precision: 'YEAR',
    });
    const corrected = await PATCH_PASSAGE(
      send(`/effectif/${passage.id}`, 'PATCH', {
        end: { date: '2024-06-01', precision: 'MONTH' },
        expectedVersion: passage.version,
        functionId: designer.id,
        start: passage.start,
      }),
      passageParams(passage.id),
    );
    expect(corrected.status).toBe(200);
    expect((await lastAudit('PASSAGE_UPDATE')).metadata).toMatchObject({
      after: { end: 'juin 2024' },
      before: { end: 'En cours' },
      changes: ['end'],
    });
    const stale = await PATCH_PASSAGE(
      send(`/effectif/${passage.id}`, 'PATCH', {
        end: null,
        expectedVersion: passage.version,
        functionId: designer.id,
        start: passage.start,
      }),
      passageParams(passage.id),
    );
    expect(stale.status).toBe(409);
    expect((await read(stale)).error?.message).toBe(
      'Ce passage a été modifié entre-temps. Rechargez l’Effectif avant de recommencer.',
    );
    const current = (await effectif()).passages[0];
    if (!current) throw new Error('Missing passage');
    const changed = await CHANGE(
      send(`/effectif/${current.id}/changement`, 'POST', {
        at: { date: '2023-01-01', precision: 'YEAR' },
        expectedVersion: current.version,
        functionId: treasurer.id,
      }),
      passageParams(current.id),
    );
    expect(changed.status).toBe(200);
    const after = (await read<RosterData>(changed)).data?.passages ?? [];
    expect(after.map(({ function: held }) => held.name).sort()).toEqual([
      'Graphiste',
      'Trésorier',
    ]);
    const added = after.find(({ function: held }) => held.id === treasurer.id);
    if (!added) throw new Error('Missing new passage');
    const removed = await DELETE_PASSAGE(
      send(`/effectif/${added.id}`, 'DELETE', {
        expectedVersion: added.version,
      }),
      passageParams(added.id),
    );
    expect(removed.status).toBe(200);
    expect((await lastAudit('PASSAGE_DELETE')).description).toBe(
      'Passage supprimé : Trésorier, Bureau & staff',
    );
    // A used function stays: it is made inactive instead.
    const refused = await DELETE_FUNCTION(
      send(`/fonctions/${designer.id}`, 'DELETE', { expectedVersion: 1 }),
      functionParams(designer.id),
    );
    expect(refused.status).toBe(409);
  });

  it('counts the tabs: people there today, people gone, functions', async () => {
    await addPassage(kaiz, treasurer, {
      date: '2025-01-01',
      precision: 'YEAR',
    });
    await addPassage(
      kaiz,
      designer,
      { date: '2019-01-01', precision: 'YEAR' },
      { date: '2021-01-01', precision: 'YEAR' },
    );
    const summary = await read<{
      formerCount: number;
      functionCount: number;
      memberCount: number;
    }>(await GET_SUMMARY(send('', 'GET')));
    expect(summary.data).toEqual({
      formerCount: 1,
      functionCount: 2,
      memberCount: 1,
    });
  });

  it('follows its own rights: neither the teams’ nor the persons’ open it', async () => {
    const teamsManager = await createUser('USER', {
      [PERMISSIONS.GAMES.VIEW]: true,
      [PERMISSIONS.PERSONS.VIEW]: true,
      [PERMISSIONS.TEAMS.MANAGE]: true,
      [PERMISSIONS.TEAMS.VIEW]: true,
    });
    await authenticate(teamsManager);
    expect((await GET_EFFECTIF(send('/effectif', 'GET'))).status).toBe(403);
    expect((await GET_FUNCTIONS(send('/fonctions', 'GET'))).status).toBe(403);
    expect((await GET_SUMMARY(send('', 'GET'))).status).toBe(403);
    // A reader sees, never changes.
    const reader = await createUser('USER', {
      [PERMISSIONS.STAFF.VIEW]: true,
    });
    await authenticate(reader);
    expect((await GET_EFFECTIF(send('/effectif', 'GET'))).status).toBe(200);
    expect((await GET_FUNCTIONS(send('/fonctions', 'GET'))).status).toBe(200);
    const write = await POST_PASSAGE(
      send('/effectif', 'POST', {
        end: null,
        functionId: treasurer.id,
        personId: kaiz.id,
        start: { date: '2025-01-01', precision: 'YEAR' },
      }),
    );
    expect(write.status).toBe(403);
    expect(
      (
        await POST_FUNCTION(
          send('/fonctions', 'POST', {
            isActive: true,
            kind: 'STAFF',
            name: 'Monteur',
          }),
        )
      ).status,
    ).toBe(403);
    // Who manages Bureau & staff searches the Répertoire for a passage.
    await authenticate(
      await createUser('USER', {
        [PERMISSIONS.STAFF.MANAGE]: true,
        [PERMISSIONS.STAFF.VIEW]: true,
      }),
    );
    const search = await GET_PERSON_SEARCH(
      new NextRequest('http://localhost/api/passages/personnes?q=kaiz'),
    );
    expect(search.status).toBe(200);
    await authenticate(reader);
    expect(
      (
        await GET_PERSON_SEARCH(
          new NextRequest('http://localhost/api/passages/personnes?q=kaiz'),
        )
      ).status,
    ).toBe(403);
    expect(await db.personPassage.count()).toBe(0);
  });

  it('shows on the journey only the lists the reader may see', async () => {
    await db.personPassage.create({
      data: {
        functionId: player.id,
        personId: kaiz.id,
        startOn: new Date('2024-01-01T00:00:00Z'),
        startPrecision: 'YEAR',
        teamId: team.id,
      },
    });
    await addPassage(kaiz, treasurer, {
      date: '2025-01-01',
      precision: 'YEAR',
    });
    const journey = async (): Promise<
      { function: { name: string }; team: { name: string } | null }[] | null
    > => {
      const response = await JOURNEY(
        new NextRequest(`http://localhost/api/personnes/${kaiz.id}/parcours`),
        { params: Promise.resolve({ id: kaiz.id }) },
      );
      if (response.status !== 200) return null;

      return (
        (
          await read<{
            passages: {
              function: { name: string };
              team: { name: string } | null;
            }[];
          }>(response)
        ).data?.passages ?? []
      );
    };
    expect(
      (await journey())?.map((entry) => [entry.function.name, entry.team]),
    ).toEqual([
      ['Joueur', expect.objectContaining({ name: 'Noctambule' })],
      ['Trésorier', null],
    ]);
    await authenticate(
      await createUser('USER', {
        [PERMISSIONS.PERSONS.VIEW]: true,
        [PERMISSIONS.STAFF.VIEW]: true,
      }),
    );
    expect((await journey())?.map((entry) => entry.function.name)).toEqual([
      'Trésorier',
    ]);
    await authenticate(
      await createUser('USER', {
        [PERMISSIONS.GAMES.VIEW]: true,
        [PERMISSIONS.PERSONS.VIEW]: true,
        [PERMISSIONS.TEAMS.VIEW]: true,
      }),
    );
    expect((await journey())?.map((entry) => entry.function.name)).toEqual([
      'Joueur',
    ]);
    // The structure's list alone, without the record, is not enough.
    await authenticate(
      await createUser('USER', { [PERMISSIONS.STAFF.VIEW]: true }),
    );
    expect(await journey()).toBeNull();
  });
});
