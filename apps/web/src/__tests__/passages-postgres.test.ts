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

import { POST as CHANGE } from '$app/api/equipes/[id]/passages/[passageId]/changement/route';
import {
  DELETE,
  PATCH,
} from '$app/api/equipes/[id]/passages/[passageId]/route';
import { GET, POST } from '$app/api/equipes/[id]/passages/route';
import {
  DELETE as DELETE_TEAM,
  GET as GET_TEAM,
} from '$app/api/equipes/[id]/route';
import { DELETE as DELETE_FUNCTION } from '$app/api/jeux/[id]/fonctions/[functionId]/route';
import { GET as SEARCH } from '$app/api/passages/personnes/route';
import { GET as JOURNEY } from '$app/api/personnes/[id]/parcours/route';
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
          throw new Error('Isolated passages database not initialized');
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

const target = process.env.PASSAGES_TEST_DATABASE_URL;

type Day = { date: string; precision: 'DAY' | 'MONTH' | 'YEAR' };
type RosterData = {
  functions: { id: string; name: string }[];
  passages: {
    end: Day | null;
    function: { id: string; name: string };
    id: string;
    person: { displayName: string; id: string };
    start: Day;
    version: number;
  }[];
};
type Body<T> = {
  data?: T;
  error?: { code: string; details?: Record<string, string[]>; message: string };
};

describe.skipIf(!target)(
  'passages of a roster on fully migrated PostgreSQL',
  () => {
    let db: PrismaClient;
    let admin: User;
    let valorant: Game;
    let league: Game;
    let team: Team;
    let player: MemberFunction;
    let substitute: MemberFunction;
    let coach: MemberFunction;
    let leagueCoach: MemberFunction;
    let kaiz: Person;
    let nova: Person;
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
          firstName: 'Passages fixture',
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
    const createFunction = (
      game: Game,
      name: string,
      kind: 'PLAYER' | 'STAFF',
      position: number,
    ): Promise<MemberFunction> =>
      db.memberFunction.create({
        data: {
          gameId: game.id,
          kind,
          name,
          normalizedName: name.toLowerCase(),
          position,
        },
      });
    const createPerson = (
      nickname: string,
      firstName: string,
      lastName: string,
    ): Promise<Person> =>
      db.person.create({
        data: {
          firstName,
          lastName,
          nickname,
          normalizedFirstName: firstName.toLowerCase(),
          normalizedLastName: lastName.toLowerCase(),
          normalizedNickname: nickname.toLowerCase(),
          sortName: `${lastName} ${firstName}`.toLowerCase(),
        },
      });
    const url = (rest = ''): string =>
      `http://localhost/api/equipes/${team.id}/passages${rest}`;
    const teamParams = (): { params: Promise<{ id: string }> } => ({
      params: Promise.resolve({ id: team.id }),
    });
    const passageParams = (
      passageId: string,
    ): { params: Promise<{ id: string; passageId: string }> } => ({
      params: Promise.resolve({ id: team.id, passageId }),
    });
    const read = async <T>(response: Response): Promise<Body<T>> =>
      (await response.json()) as Body<T>;
    const roster = async (): Promise<RosterData> => {
      const data = (
        await read<RosterData>(await GET(new NextRequest(url()), teamParams()))
      ).data;
      if (!data) throw new Error('Missing roster');

      return data;
    };
    const post = (payload: unknown): ReturnType<typeof POST> =>
      POST(
        new NextRequest(url(), {
          body: JSON.stringify(payload),
          method: 'POST',
        }),
        teamParams(),
      );
    const patch = (id: string, payload: unknown): ReturnType<typeof PATCH> =>
      PATCH(
        new NextRequest(url(`/${id}`), {
          body: JSON.stringify(payload),
          method: 'PATCH',
        }),
        passageParams(id),
      );
    const change = (id: string, payload: unknown): ReturnType<typeof CHANGE> =>
      CHANGE(
        new NextRequest(url(`/${id}/changement`), {
          body: JSON.stringify(payload),
          method: 'POST',
        }),
        passageParams(id),
      );
    const remove = (
      id: string,
      expectedVersion: number,
    ): ReturnType<typeof DELETE> =>
      DELETE(
        new NextRequest(url(`/${id}`), {
          body: JSON.stringify({ expectedVersion }),
          method: 'DELETE',
        }),
        passageParams(id),
      );
    const member = (
      person: Person,
      memberFunction: MemberFunction,
      start: Day,
      end: Day | null = null,
    ): Record<string, unknown> => ({
      end,
      functionId: memberFunction.id,
      personId: person.id,
      start,
    });
    const added = async (payload: Record<string, unknown>): Promise<string> => {
      const response = await post(payload);
      expect(response.status).toBe(201);
      const passages = (await read<RosterData>(response)).data?.passages ?? [];
      const found = passages.find(
        (entry) =>
          entry.person.id === payload.personId &&
          entry.function.id === payload.functionId &&
          entry.start.date ===
            (payload.start as Day).date.slice(
              0,
              (payload.start as Day).precision === 'DAY' ? 10 : 8,
            ) +
              ((payload.start as Day).precision === 'DAY' ? '' : '01'),
      );
      if (!found) throw new Error('Missing passage');

      return found.id;
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
      if (!target) throw new Error('Missing isolated passages database');
      const parsed = new URL(target);
      if (
        !['127.0.0.1', 'localhost'].includes(parsed.hostname) ||
        parsed.pathname !== '/passages_service_test'
      )
        throw new Error('A local passages_service_test database is required');
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
      valorant = await createGame('Valorant');
      league = await createGame('League of Legends');
      team = await db.team.create({
        data: {
          foundedOn: new Date('2023-01-01T00:00:00Z'),
          foundedPrecision: 'YEAR',
          gameId: valorant.id,
          name: 'Noctambule',
          normalizedName: 'noctambule',
        },
      });
      player = await createFunction(valorant, 'Joueur', 'PLAYER', 0);
      substitute = await createFunction(valorant, 'Remplaçant', 'PLAYER', 1);
      coach = await createFunction(valorant, 'Coach', 'STAFF', 0);
      leagueCoach = await createFunction(league, 'Coach', 'STAFF', 0);
      kaiz = await createPerson('Kaiz', 'Camille', 'Exemple');
      nova = await createPerson('Nova', 'Alex', 'Fictif');
      startedAt = new Date();
      await authenticate(admin);
    });
    afterAll(async () => {
      await db?.$disconnect();
      connection.client = null;
    });

    it('adds a member, traced on the record without the person’s name', async () => {
      const id = await added(
        member(kaiz, player, { date: '2024-03-17', precision: 'MONTH' }),
      );
      const data = await roster();
      expect(data.functions.map(({ name }) => name)).toEqual([
        'Joueur',
        'Remplaçant',
        'Coach',
      ]);
      expect(data.passages).toEqual([
        expect.objectContaining({
          end: null,
          function: expect.objectContaining({ name: 'Joueur' }),
          id,
          // The name parts give the initials of the avatar.
          person: {
            displayName: 'Kaiz · Camille Exemple',
            firstName: 'Camille',
            id: kaiz.id,
            lastName: 'Exemple',
            nickname: 'Kaiz',
          },
          start: { date: '2024-03-01', precision: 'MONTH' },
          version: 1,
        }),
      ]);
      const audit = await lastAudit('PASSAGE_CREATE');
      expect(audit).toMatchObject({
        category: 'PASSAGE',
        entityId: kaiz.id,
        entityType: 'PERSON',
        pageKey: 'games',
      });
      expect(audit.metadata).toMatchObject({
        after: {
          end: 'En cours',
          function: 'Joueur',
          start: 'mars 2024',
          team: 'Noctambule (Valorant)',
        },
        functionName: 'Joueur',
        passageId: id,
        teamName: 'Noctambule',
      });
      expect(
        `${audit.description} ${JSON.stringify(audit.metadata)}`,
      ).not.toMatch(/Kaiz|Camille|Exemple/);
      // The record of the team counts its members today and its passages.
      const detail = await read<{
        formerCount: number;
        memberCount: number;
        passageCount: number;
      }>(
        await GET_TEAM(
          new NextRequest(`http://localhost/api/equipes/${team.id}`),
          teamParams(),
        ),
      );
      expect(detail.data).toMatchObject({
        formerCount: 0,
        memberCount: 1,
        passageCount: 1,
      });
    });

    it('stores an end on the last day of its period and answers it at its start', async () => {
      const id = await added(
        member(
          nova,
          substitute,
          { date: '2022-01-01', precision: 'YEAR' },
          { date: '2024-02-10', precision: 'MONTH' },
        ),
      );
      const row = await db.personPassage.findUniqueOrThrow({ where: { id } });
      expect(row.endOn?.toISOString().slice(0, 10)).toBe('2024-02-29');
      expect((await roster()).passages[0]?.end).toEqual({
        date: '2024-02-01',
        precision: 'MONTH',
      });
      // Ended: not a member today, a former one (their own tab).
      const detail = await read<{ formerCount: number; memberCount: number }>(
        await GET_TEAM(
          new NextRequest(`http://localhost/api/equipes/${team.id}`),
          teamParams(),
        ),
      );
      expect(detail.data).toMatchObject({ formerCount: 1, memberCount: 0 });
    });

    it('never has the same person twice with the same function at once', async () => {
      await added(
        member(
          kaiz,
          player,
          { date: '2023-01-01', precision: 'YEAR' },
          { date: '2024-06-01', precision: 'MONTH' },
        ),
      );
      const twin = await post(
        member(kaiz, player, { date: '2024-06-15', precision: 'DAY' }),
      );
      expect(twin.status).toBe(409);
      expect((await read(twin)).error?.details?.start).toEqual([
        'Cette personne a déjà cette fonction dans l’équipe sur cette période.',
      ]);
      // Another function at the same time, or the same one afterwards: fine.
      await added(
        member(kaiz, coach, { date: '2024-01-01', precision: 'YEAR' }),
      );
      await added(
        member(kaiz, player, { date: '2024-07-01', precision: 'DAY' }),
      );
      expect(await audits('PASSAGE_CREATE')).toBe(3);
    });

    it('refuses a function of another game, a missing record and an end before the start', async () => {
      const outside = await post(
        member(kaiz, leagueCoach, { date: '2024-01-01', precision: 'YEAR' }),
      );
      expect(outside.status).toBe(400);
      expect((await read(outside)).error?.details?.functionId).toEqual([
        'Choisissez une fonction du jeu de l’équipe.',
      ]);
      const missing = await post({
        ...member(kaiz, player, { date: '2024-01-01', precision: 'YEAR' }),
        personId: 'missing-person',
      });
      expect(missing.status).toBe(400);
      const reversed = await post(
        member(
          kaiz,
          player,
          { date: '2024-05-01', precision: 'MONTH' },
          { date: '2024-04-01', precision: 'MONTH' },
        ),
      );
      expect(reversed.status).toBe(400);
      expect(await db.personPassage.count()).toBe(0);
      expect(await audits('PASSAGE_CREATE')).toBe(0);
    });

    it('corrects a passage under its version and traces only what changed', async () => {
      const id = await added(
        member(kaiz, player, { date: '2024-03-01', precision: 'MONTH' }),
      );
      const unchanged = await patch(id, {
        end: null,
        expectedVersion: 1,
        functionId: player.id,
        start: { date: '2024-03-01', precision: 'MONTH' },
      });
      expect(unchanged.status).toBe(200);
      expect(await audits('PASSAGE_UPDATE')).toBe(0);
      const edited = await patch(id, {
        end: { date: '2025-06-01', precision: 'MONTH' },
        expectedVersion: 1,
        functionId: substitute.id,
        start: { date: '2024-03-01', precision: 'MONTH' },
      });
      expect(edited.status).toBe(200);
      expect((await roster()).passages[0]).toMatchObject({
        function: { name: 'Remplaçant' },
        version: 2,
      });
      expect((await lastAudit('PASSAGE_UPDATE')).metadata).toMatchObject({
        after: { end: 'juin 2025', function: 'Remplaçant' },
        before: { end: 'En cours', function: 'Joueur' },
        changes: ['end', 'function'],
      });
      const stale = await patch(id, {
        end: null,
        expectedVersion: 1,
        functionId: player.id,
        start: { date: '2024-03-01', precision: 'MONTH' },
      });
      expect(stale.status).toBe(409);
      // Its person never changes.
      expect(
        (
          await patch(id, {
            end: null,
            expectedVersion: 2,
            functionId: player.id,
            personId: nova.id,
            start: { date: '2024-03-01', precision: 'MONTH' },
          })
        ).status,
      ).toBe(400);
    });

    it('changes a function in one step: one passage ends, another begins, two traces', async () => {
      const id = await added(
        member(nova, substitute, { date: '2024-01-01', precision: 'YEAR' }),
      );
      expect(
        (
          await change(id, {
            at: { date: '2025-09-01', precision: 'MONTH' },
            expectedVersion: 1,
            functionId: substitute.id,
          })
        ).status,
      ).toBe(400);
      expect(
        (
          await change(id, {
            at: { date: '2023-09-01', precision: 'MONTH' },
            expectedVersion: 1,
            functionId: player.id,
          })
        ).status,
      ).toBe(400);
      const response = await change(id, {
        at: { date: '2025-09-12', precision: 'MONTH' },
        expectedVersion: 1,
        functionId: player.id,
      });
      expect(response.status).toBe(200);
      const passages = (await roster()).passages;
      expect(
        passages.map((entry) => [
          entry.function.name,
          entry.start.date,
          entry.end?.date ?? null,
        ]),
      ).toEqual([
        ['Joueur', '2025-09-01', null],
        ['Remplaçant', '2024-01-01', '2025-09-01'],
      ]);
      const ended = await db.personPassage.findUniqueOrThrow({ where: { id } });
      expect(ended.endOn?.toISOString().slice(0, 10)).toBe('2025-09-30');
      expect(await audits('PASSAGE_UPDATE')).toBe(1);
      expect(await audits('PASSAGE_CREATE')).toBe(2);
    });

    it('deletes a passage entered by mistake and traces it', async () => {
      const id = await added(
        member(kaiz, player, { date: '2024-01-01', precision: 'YEAR' }),
      );
      expect((await remove(id, 2)).status).toBe(409);
      expect((await remove(id, 1)).status).toBe(200);
      expect(await db.personPassage.count()).toBe(0);
      expect((await lastAudit('PASSAGE_DELETE')).metadata).toMatchObject({
        before: { function: 'Joueur', team: 'Noctambule (Valorant)' },
      });
      expect((await remove(id, 1)).status).toBe(404);
    });

    it('keeps a team, a function and a record that have passages', async () => {
      await added(
        member(kaiz, player, { date: '2024-01-01', precision: 'YEAR' }),
      );
      const teamRefused = await DELETE_TEAM(
        new NextRequest(`http://localhost/api/equipes/${team.id}`, {
          body: JSON.stringify({ expectedVersion: team.version }),
          method: 'DELETE',
        }),
        teamParams(),
      );
      expect(teamRefused.status).toBe(409);
      expect((await read(teamRefused)).error?.message).toBe(
        'Cette équipe a déjà servi : rendez-la inactive plutôt que de la supprimer.',
      );
      const functionRefused = await DELETE_FUNCTION(
        new NextRequest(
          `http://localhost/api/jeux/${valorant.id}/fonctions/${player.id}`,
          { body: JSON.stringify({ expectedVersion: 1 }), method: 'DELETE' },
        ),
        { params: Promise.resolve({ functionId: player.id, id: valorant.id }) },
      );
      expect(functionRefused.status).toBe(409);
      expect((await read(functionRefused)).error?.message).toBe(
        'Cette fonction a déjà servi : rendez-la inactive plutôt que de la supprimer.',
      );
      await expect(
        db.$executeRawUnsafe('DELETE FROM "Person" WHERE "id" = $1', kaiz.id),
      ).rejects.toThrow(/PersonPassage_personId_fkey/);
      expect(await db.team.count()).toBe(1);
    });

    it('lets a reader see the roster without changing it; only who manages searches the Répertoire', async () => {
      const id = await added(
        member(kaiz, player, { date: '2024-01-01', precision: 'YEAR' }),
      );
      const search = (query: string): ReturnType<typeof SEARCH> =>
        SEARCH(
          new NextRequest(
            `http://localhost/api/passages/personnes?${new URLSearchParams({ q: query })}`,
          ),
        );
      const found = await read<{
        more: boolean;
        persons: { displayName: string }[];
      }>(await search('camille exe'));
      expect(found.data).toEqual({
        more: false,
        persons: [
          expect.objectContaining({ displayName: 'Kaiz · Camille Exemple' }),
        ],
      });
      // Six suggestions at most, and whether more exist.
      for (const index of [1, 2, 3, 4, 5, 6, 7])
        await createPerson(`Joueur${index}`, 'Prénom', `Essai${index}`);
      const many = await read<{ more: boolean; persons: unknown[] }>(
        await search('essai'),
      );
      expect(many.data?.persons).toHaveLength(6);
      expect(many.data?.more).toBe(true);
      await authenticate(
        await createUser('USER', {
          [PERMISSIONS.GAMES.VIEW]: true,
          [PERMISSIONS.TEAMS.VIEW]: true,
        }),
      );
      expect((await roster()).passages).toHaveLength(1);
      expect(
        (
          await post(
            member(nova, coach, { date: '2024-01-01', precision: 'YEAR' }),
          )
        ).status,
      ).toBe(403);
      expect((await remove(id, 1)).status).toBe(403);
      expect((await search('nova')).status).toBe(403);
      await authenticate(
        await createUser('USER', { [PERMISSIONS.GAMES.VIEW]: true }),
      );
      expect((await GET(new NextRequest(url()), teamParams())).status).toBe(
        403,
      );
    });

    it('reads a person’s journey, team and game, for who sees the record and the rosters', async () => {
      await added(
        member(
          kaiz,
          player,
          { date: '2024-03-01', precision: 'MONTH' },
          { date: '2025-06-01', precision: 'MONTH' },
        ),
      );
      await added(
        member(kaiz, coach, { date: '2025-07-01', precision: 'MONTH' }),
      );
      const journey = (id: string): ReturnType<typeof JOURNEY> =>
        JOURNEY(
          new NextRequest(`http://localhost/api/personnes/${id}/parcours`),
          {
            params: Promise.resolve({ id }),
          },
        );
      const found = await read<{
        passages: {
          end: Day | null;
          function: { name: string };
          start: Day;
          team: { game: { name: string }; isActive: boolean; name: string };
        }[];
      }>(await journey(kaiz.id));
      // The earliest start first; both dates at the start of their period.
      expect(found.data?.passages).toEqual([
        expect.objectContaining({
          end: { date: '2025-06-01', precision: 'MONTH' },
          function: expect.objectContaining({ name: 'Joueur' }),
          start: { date: '2024-03-01', precision: 'MONTH' },
          team: {
            game: { id: valorant.id, name: 'Valorant' },
            id: team.id,
            isActive: true,
            name: 'Noctambule',
          },
        }),
        expect.objectContaining({
          end: null,
          function: expect.objectContaining({ name: 'Coach' }),
        }),
      ]);
      expect(
        (await read<{ passages: unknown[] }>(await journey(nova.id))).data,
      ).toEqual({ passages: [] });
      expect((await journey('fiche-absente')).status).toBe(404);
      // Read from the rosters: the record alone is not enough, nor the rosters.
      await authenticate(
        await createUser('USER', { [PERMISSIONS.PERSONS.VIEW]: true }),
      );
      expect((await journey(kaiz.id)).status).toBe(403);
      await authenticate(
        await createUser('USER', {
          [PERMISSIONS.GAMES.VIEW]: true,
          [PERMISSIONS.TEAMS.VIEW]: true,
        }),
      );
      expect((await journey(kaiz.id)).status).toBe(403);
      await authenticate(
        await createUser('USER', {
          [PERMISSIONS.GAMES.VIEW]: true,
          [PERMISSIONS.PERSONS.VIEW]: true,
          [PERMISSIONS.TEAMS.VIEW]: true,
        }),
      );
      expect((await journey(kaiz.id)).status).toBe(200);
    });

    it('rolls the passage back when its trace cannot be written', async () => {
      const name = 'passages_audit_failure_' + randomUUID().replaceAll('-', '');
      await db.$executeRawUnsafe(
        `CREATE FUNCTION "${name}"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Injected passages audit failure'; END; $$`,
      );
      try {
        await db.$executeRawUnsafe(
          `CREATE TRIGGER "${name}" BEFORE INSERT ON "AuditLog" FOR EACH ROW WHEN (NEW."category" = 'PASSAGE') EXECUTE FUNCTION "${name}"()`,
        );
        expect(
          (
            await post(
              member(kaiz, player, { date: '2024-01-01', precision: 'YEAR' }),
            )
          ).status,
        ).toBe(500);
      } finally {
        await db.$executeRawUnsafe(
          `DROP TRIGGER IF EXISTS "${name}" ON "AuditLog"`,
        );
        await db.$executeRawUnsafe(`DROP FUNCTION "${name}"()`);
      }
      expect(await db.personPassage.count()).toBe(0);
    });

    it('keeps the database guards: periods, order, game of the function, no overlap', async () => {
      const insert = (
        functionId: string,
        start: string,
        startPrecision: string,
        end: string | null,
        endPrecision: string | null,
      ): Promise<number> =>
        db.$executeRawUnsafe(
          `INSERT INTO "PersonPassage" ("id", "personId", "teamId", "functionId", "startOn", "startPrecision", "endOn", "endPrecision", "updatedAt") VALUES ($1, $2, $3, $4, $5::date, $6::"DatePrecision", $7::date, $8::"DatePrecision", NOW())`,
          randomUUID(),
          kaiz.id,
          team.id,
          functionId,
          start,
          startPrecision,
          end,
          endPrecision,
        );
      await expect(
        insert(player.id, '2024-03-15', 'MONTH', null, null),
      ).rejects.toThrow(/PersonPassage_start_precision_check/);
      await expect(
        insert(player.id, '2024-03-01', 'MONTH', '2024-06-15', 'MONTH'),
      ).rejects.toThrow(/PersonPassage_end_precision_check/);
      await expect(
        insert(player.id, '2024-03-01', 'MONTH', '2024-01-31', 'MONTH'),
      ).rejects.toThrow(/PersonPassage_order_check/);
      await expect(
        insert(player.id, '2024-03-01', 'MONTH', '2024-06-30', null),
      ).rejects.toThrow(/PersonPassage_end_check/);
      await expect(
        insert(leagueCoach.id, '2024-01-01', 'YEAR', null, null),
      ).rejects.toThrow(/PersonPassage_function_scope/);
      expect(
        await insert(player.id, '2024-01-01', 'YEAR', '2024-12-31', 'YEAR'),
      ).toBe(1);
      await expect(
        insert(player.id, '2024-12-31', 'DAY', null, null),
      ).rejects.toThrow(/PersonPassage_no_overlap|23P01/);
      expect(await insert(player.id, '2025-01-01', 'DAY', null, null)).toBe(1);
      await expect(
        db.$executeRawUnsafe(
          'UPDATE "MemberFunction" SET "gameId" = $1 WHERE "id" = $2',
          league.id,
          coach.id,
        ),
      ).rejects.toThrow(/MemberFunction_gameId_immutable/);
    });
  },
);
