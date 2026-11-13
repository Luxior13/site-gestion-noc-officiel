import { randomUUID } from 'node:crypto';

import {
  type Game,
  type Organization,
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

import { POST as POST_OPERATION } from '$app/api/finances/operations/route';
import { DELETE as DELETE_ORGANIZATION } from '$app/api/relations/organisations/[id]/route';
import {
  DELETE as DELETE_ENTRY,
  PATCH as PATCH_ENTRY,
} from '$app/api/tournois/[id]/participants/[entryId]/route';
import { POST as POST_ENTRY } from '$app/api/tournois/[id]/participants/route';
import {
  DELETE as DELETE_TOURNAMENT,
  GET as GET_TOURNAMENT,
  PATCH as PATCH_TOURNAMENT,
} from '$app/api/tournois/[id]/route';
import {
  GET as GET_TOURNAMENTS,
  POST as POST_TOURNAMENT,
} from '$app/api/tournois/route';
import { PERMISSIONS } from '$constants/permissions.constants';
import type {
  TournamentDetail,
  TournamentItem,
} from '$features/tournaments/types/tournament.types';
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
          throw new Error('Isolated tournaments database not initialized');
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

const target = process.env.TOURNAMENTS_TEST_DATABASE_URL;

type Body = {
  data?: unknown;
  error?: { code: string; details?: Record<string, string[]>; message: string };
};

const HOLDER = {
  [PERMISSIONS.TOURNAMENTS.MANAGE]: true,
  [PERMISSIONS.TOURNAMENTS.VIEW]: true,
};

/**
 * Tournois (owner, « ok go », 11 November 2026): a tournament of a game,
 * our teams engaged with their line-up taken from the Roster at its dates
 * and their placement; the account's Esport scope says which ones; what a
 * tournament names stays; every change in the journal, every refusal said
 * by the service and kept by the base.
 */
describe.skipIf(!target)('Tournaments on fully migrated PostgreSQL', () => {
  let db: PrismaClient;
  let valorant: Game;
  let league: Game;
  let main: Team;
  let academy: Team;
  let rift: Team;
  let lyon: Organization;
  let kaiz: Person;
  let nova: Person;
  let lead: Person;
  let guest: Person;
  let player: { id: string };
  let coach: { id: string };
  let analyst: { id: string };
  let startedAt = new Date();

  const login = (): string =>
    'test.' + randomUUID().replaceAll('-', '').slice(0, 20);
  const signIn = async (
    permissions: Record<string, boolean>,
    scope: { kind: 'ALL' | 'GAMES' | 'TEAMS'; teamIds?: string[] } = {
      kind: 'ALL',
    },
  ): Promise<User> => {
    const user = await db.user.create({
      data: {
        esportScope: scope.kind,
        esportScopeItems: {
          create: (scope.teamIds ?? []).map((teamId) => ({ teamId })),
        },
        firstName: 'Tournaments fixture',
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
  const idParams = (id: string): { params: Promise<{ id: string }> } => ({
    params: Promise.resolve({ id }),
  });
  const entryParams = (
    id: string,
    entryId: string,
  ): { params: Promise<{ entryId: string; id: string }> } => ({
    params: Promise.resolve({ entryId, id }),
  });

  const create = (
    payload: Record<string, unknown>,
  ): Promise<{ body: Body; status: number }> =>
    call(
      POST_TOURNAMENT(
        request('/api/tournois', 'POST', {
          endOn: '2027-03-17',
          gameId: valorant.id,
          name: 'Lyon e-Sport 2027',
          organizerId: null,
          startOn: '2027-03-15',
          teamId: null,
          ...payload,
        }),
      ),
    );
  const created = async (
    payload: Record<string, unknown> = {},
  ): Promise<TournamentDetail> => {
    const { body, status } = await create(payload);
    expect(status, JSON.stringify(body.error)).toBe(201);

    return body.data as TournamentDetail;
  };
  const engage = (
    id: string,
    payload: Record<string, unknown>,
  ): Promise<{ body: Body; status: number }> =>
    call(
      POST_ENTRY(
        request(`/api/tournois/${id}/participants`, 'POST', {
          placementFrom: null,
          placementTo: null,
          ...payload,
        }),
        idParams(id),
      ),
    );
  const list = async (query = ''): Promise<TournamentItem[]> =>
    (await call(GET_TOURNAMENTS(request(`/api/tournois${query}`)))).body
      .data as TournamentItem[];
  const journal = async (): Promise<
    { action: string; description: string; metadata: unknown }[]
  > =>
    db.auditLog.findMany({
      orderBy: { createdAt: 'asc' },
      select: { action: true, description: true, metadata: true },
      where: { category: 'TOURNAMENT', createdAt: { gte: startedAt } },
    });

  beforeAll(async () => {
    if (!target) throw new Error('Missing isolated tournaments database');
    const url = new URL(target);
    if (
      !['127.0.0.1', 'localhost'].includes(url.hostname) ||
      url.pathname !== '/tournaments_test'
    )
      throw new Error('A local tournaments_test database is required');
    db = new PrismaClient({ datasourceUrl: target });
    connection.client = db;
  });
  beforeEach(async () => {
    // This dedicated database belongs to this suite only.
    await db.financialOperation.deleteMany();
    await db.treasuryChoice.deleteMany();
    await db.financialAccount.deleteMany();
    await db.legalEntity.deleteMany();
    await db.tournament.deleteMany();
    await db.personPassage.deleteMany();
    await db.memberFunction.deleteMany();
    await db.userEsportScopeItem.deleteMany();
    await db.team.deleteMany();
    await db.game.deleteMany();
    await db.organization.deleteMany();
    await db.person.deleteMany();
    const game = (name: string): Promise<Game> =>
      db.game.create({
        data: {
          firstOpenedOn: new Date('2021-03-15T00:00:00Z'),
          name,
          normalizedName: name.toLowerCase(),
        },
      });
    valorant = await game('Valorant');
    league = await game('League of Legends');
    const team = (
      gameId: string,
      name: string,
      position: number,
    ): Promise<Team> =>
      db.team.create({
        data: {
          foundedOn: new Date('2021-03-15T00:00:00Z'),
          gameId,
          name,
          normalizedName: name.toLowerCase(),
          position,
        },
      });
    main = await team(valorant.id, 'Noctambule Valorant', 0);
    academy = await team(valorant.id, 'Noctambule Academy', 1);
    rift = await team(league.id, 'Noctambule Rift', 0);
    lyon = await db.organization.create({
      data: {
        kinds: ['ORGANIZER'],
        name: 'Lyon e-Sport',
        normalizedName: 'lyon e sport',
      },
    });
    const person = (nickname: string): Promise<Person> =>
      db.person.create({
        data: {
          nickname,
          normalizedNickname: nickname.toLowerCase(),
          sortName: nickname.toLowerCase(),
        },
      });
    kaiz = await person('Kaiz');
    nova = await person('Nova');
    lead = await person('Lead');
    guest = await person('Guest');
    const fn = (
      name: string,
      kind: 'PLAYER' | 'STAFF',
      position: number,
    ): Promise<{ id: string }> =>
      db.memberFunction.create({
        data: {
          gameId: valorant.id,
          kind,
          name,
          normalizedName: name.toLowerCase(),
          position,
        },
      });
    player = await fn('Joueur', 'PLAYER', 0);
    coach = await fn('Coach', 'STAFF', 0);
    analyst = await fn('Analyste', 'STAFF', 1);
    const passage = (
      personId: string,
      functionId: string,
      startOn: string,
      endOn: string | null = null,
    ): Promise<{ id: string }> =>
      db.personPassage.create({
        data: {
          endOn: endOn ? new Date(`${endOn}T00:00:00Z`) : null,
          endPrecision: endOn ? 'DAY' : null,
          functionId,
          personId,
          startOn: new Date(`${startOn}T00:00:00Z`),
          teamId: main.id,
        },
      });
    await passage(kaiz.id, player.id, '2026-01-01');
    // Gone before the tournament: not in its Roster then.
    await passage(nova.id, player.id, '2025-01-01', '2026-06-30');
    await passage(lead.id, coach.id, '2026-02-01');
    // Coach and analyst of the team at once.
    await passage(lead.id, analyst.id, '2026-02-01');
    startedAt = new Date();
    await signIn(HOLDER);
  });
  afterAll(async () => {
    await db?.$disconnect();
    connection.client = null;
  });

  it('adds a tournament, engages a team with its placement, and traces each step', async () => {
    const tournament = await created({
      organizerId: lyon.id,
      teamId: main.id,
    });
    expect(tournament).toMatchObject({
      entries: [{ placementFrom: null, team: { id: main.id } }],
      format: 'ONLINE',
      game: { name: 'Valorant' },
      organizer: { name: 'Lyon e-Sport' },
    });
    const entryId = tournament.entries[0]?.id ?? '';

    // Who played is not kept (13 November 2026): a line-up is refused.
    const entryPatch = (
      payload: Record<string, unknown>,
    ): Promise<{ body: Body; status: number }> =>
      call(
        PATCH_ENTRY(
          request(
            `/api/tournois/${tournament.id}/participants/${entryId}`,
            'PATCH',
            payload,
          ),
          entryParams(tournament.id, entryId),
        ),
      );
    expect(
      (
        await entryPatch({
          expectedVersion: 1,
          lineup: [kaiz.id],
          placementFrom: 3,
          placementTo: 4,
        })
      ).status,
    ).toBe(400);
    // A shared placement.
    const updated = await entryPatch({
      expectedVersion: 1,
      placementFrom: 3,
      placementTo: 4,
    });
    expect(updated.status, JSON.stringify(updated.body.error)).toBe(200);
    const entry = (updated.body.data as TournamentDetail).entries[0];
    expect(entry).toMatchObject({
      placementFrom: 3,
      placementTo: 4,
      version: 2,
    });
    // An old version is refused.
    expect(
      (
        await call(
          PATCH_ENTRY(
            request(
              `/api/tournois/${tournament.id}/participants/${entryId}`,
              'PATCH',
              {
                expectedVersion: 1,
                placementFrom: null,
                placementTo: null,
              },
            ),
            entryParams(tournament.id, entryId),
          ),
        )
      ).status,
    ).toBe(409);

    const edited = await call(
      PATCH_TOURNAMENT(
        request(`/api/tournois/${tournament.id}`, 'PATCH', {
          datePrecision: 'DAY',
          endOn: '2027-03-17',
          entryFeeCents: 5_000,
          expectedVersion: 1,
          format: 'LAN',
          isCancelled: false,
          linkUrl: 'lyon-esport.fr/regles',
          location: 'Lyon, Eurexpo',
          name: 'Lyon e-Sport 2027',
          organizerId: lyon.id,
          registrationDeadlineOn: '2027-03-01',
          startOn: '2027-03-15',
        }),
        idParams(tournament.id),
      ),
    );
    expect(edited.status, JSON.stringify(edited.body.error)).toBe(200);
    expect(edited.body.data).toMatchObject({
      entryFeeCents: 5_000,
      linkUrl: 'https://lyon-esport.fr/regles',
      location: 'Lyon, Eurexpo',
      version: 2,
    });

    // A team once per tournament, of its game only.
    expect((await engage(tournament.id, { teamId: main.id })).status).toBe(409);
    expect((await engage(tournament.id, { teamId: rift.id })).status).toBe(400);
    expect((await engage(tournament.id, { teamId: academy.id })).status).toBe(
      201,
    );

    // What a team played; a person's, those of the teams they were in at
    // the tournament's dates (13 November 2026).
    expect((await list(`?equipe=${main.id}`)).map(({ id }) => id)).toEqual([
      tournament.id,
    ]);
    // A person's tournaments stay with who reads the Répertoire.
    expect(
      (await GET_TOURNAMENTS(request(`/api/tournois?personne=${kaiz.id}`)))
        .status,
    ).toBe(403);
    await signIn({ ...HOLDER, [PERMISSIONS.PERSONS.VIEW]: true });
    const played = await list(`?personne=${kaiz.id}`);
    expect(
      played.map(({ entries }) => entries.map(({ team }) => team.id)),
    ).toEqual([[main.id]]);
    // Gone before the tournament, or never in a team: none.
    expect(await list(`?personne=${nova.id}`)).toEqual([]);
    expect(await list(`?personne=${guest.id}`)).toEqual([]);

    const events = await journal();
    expect(events.map(({ action }) => action)).toEqual([
      'TOURNAMENT_CREATE',
      'TOURNAMENT_ENTRY_CREATE',
      'TOURNAMENT_ENTRY_UPDATE',
      'TOURNAMENT_UPDATE',
      'TOURNAMENT_ENTRY_CREATE',
    ]);
    expect(events[2]?.metadata).toMatchObject({
      after: { placement: '3e–4e' },
      before: { placement: null },
      changes: ['placement'],
      teamName: 'Noctambule Valorant',
      tournamentName: 'Lyon e-Sport 2027',
    });
    expect(events[3]?.metadata).toMatchObject({
      after: { entryFee: expect.stringContaining('par équipe'), format: 'LAN' },
      before: { format: 'En ligne' },
    });

    // Withdrawn, traced.
    const withdrawn = await call(
      DELETE_ENTRY(
        request(
          `/api/tournois/${tournament.id}/participants/${entryId}`,
          'DELETE',
          { expectedVersion: 2 },
        ),
        entryParams(tournament.id, entryId),
      ),
    );
    expect(withdrawn.status).toBe(200);
    expect((await journal()).at(-1)?.action).toBe('TOURNAMENT_ENTRY_DELETE');
  });

  it('keeps what a tournament names, in the service and the base', async () => {
    const tournament = await created({ organizerId: lyon.id, teamId: main.id });
    const entryId = tournament.entries[0]?.id ?? '';
    // A team engaged, a game and an organiser stay.
    await expect(db.team.delete({ where: { id: main.id } })).rejects.toThrow();
    await expect(
      db.game.delete({ where: { id: valorant.id } }),
    ).rejects.toThrow();
    await signIn({
      [PERMISSIONS.ORGANIZATIONS.MANAGE]: true,
      [PERMISSIONS.ORGANIZATIONS.VIEW]: true,
    });
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
    // The base keeps a tournament's game, a team of its game, a place at a LAN.
    await expect(
      db.tournament.update({
        data: { gameId: league.id },
        where: { id: tournament.id },
      }),
    ).rejects.toThrow(/Tournament_gameId_immutable/);
    await expect(
      db.tournamentEntry.create({
        data: { teamId: rift.id, tournamentId: tournament.id },
      }),
    ).rejects.toThrow(/TournamentEntry_team_game/);
    await expect(
      db.tournament.update({
        data: { location: 'Lyon' },
        where: { id: tournament.id },
      }),
    ).rejects.toThrow(/Tournament_location_check/);
    // Known to the month: its first day, never a last day.
    await expect(
      db.tournament.update({
        data: { datePrecision: 'MONTH' },
        where: { id: tournament.id },
      }),
    ).rejects.toThrow(/Tournament_dates_check/);
    await expect(
      db.tournamentEntry.update({
        data: { placementFrom: 4, placementTo: 3 },
        where: { id: entryId },
      }),
    ).rejects.toThrow(/TournamentEntry_placement_check/);

    // An operation names a tournament of its team's game.
    const entity = await db.legalEntity.create({
      data: {
        form: 'ASSOCIATION',
        isPrincipal: true,
        name: 'Noctambule',
        normalizedName: 'noctambule',
        startOn: new Date('2025-10-01T00:00:00Z'),
        startPrecision: 'MONTH',
      },
    });
    const account = await db.financialAccount.create({
      data: {
        entityId: entity.id,
        kind: 'BANK',
        name: 'Compte courant',
        normalizedName: 'compte courant',
        openingBalanceCents: 0,
        openingOn: new Date('2026-10-01T00:00:00Z'),
      },
    });
    const category = await db.treasuryChoice.create({
      data: {
        kind: 'EXPENSE_CATEGORY',
        name: 'Inscriptions aux tournois',
        normalizedName: 'inscriptions aux tournois',
      },
    });
    await signIn({
      [PERMISSIONS.OPERATIONS.MANAGE]: true,
      [PERMISSIONS.OPERATIONS.VIEW]: true,
    });
    const operation = (
      teamId: string,
    ): Promise<{ body: Body; status: number }> =>
      call(
        POST_OPERATION(
          request('/api/finances/operations', 'POST', {
            accountId: account.id,
            amountCents: 5_000,
            categoryId: category.id,
            gameId: null,
            kind: 'EXPENSE',
            label: 'Inscription Lyon e-Sport 2027',
            note: null,
            occurredOn: '2026-11-02',
            organizationId: lyon.id,
            paymentMethodId: null,
            teamId,
            toAccountId: null,
            tournamentId: tournament.id,
          }),
        ),
      );
    const wrong = await operation(rift.id);
    expect(wrong.status).toBe(400);
    expect(wrong.body.error?.details?.tournamentId).toBeDefined();
    await expect(
      db.financialOperation.create({
        data: {
          accountId: account.id,
          amountCents: 100,
          categoryId: category.id,
          kind: 'EXPENSE',
          label: 'Erreur',
          occurredOn: new Date('2026-11-02T00:00:00Z'),
          teamId: rift.id,
          tournamentId: tournament.id,
        },
      }),
    ).rejects.toThrow(/FinancialOperation_tournament_game/);
    expect((await operation(main.id)).status).toBe(201);

    // A tournament with operations stays; without, it leaves with its teams.
    await signIn(HOLDER);
    expect(
      (
        await call(
          DELETE_TOURNAMENT(
            request(`/api/tournois/${tournament.id}`, 'DELETE', {
              expectedVersion: 1,
            }),
            idParams(tournament.id),
          ),
        )
      ).status,
    ).toBe(409);
    const mistake = await created({ name: 'Doublon', teamId: academy.id });
    const removed = await call(
      DELETE_TOURNAMENT(
        request(`/api/tournois/${mistake.id}`, 'DELETE', {
          expectedVersion: 1,
        }),
        idParams(mistake.id),
      ),
    );
    expect(removed.status).toBe(200);
    expect(
      await db.tournamentEntry.count({ where: { tournamentId: mistake.id } }),
    ).toBe(0);
    expect((await journal()).at(-1)).toMatchObject({
      action: 'TOURNAMENT_DELETE',
      description:
        'Tournoi supprimé : Doublon (Valorant), avec son équipe engagée',
    });
  });

  it('adds a tournament without a date, first in the list, then dated to the month', async () => {
    const dated = await created({ name: 'Daté' });
    const undated = await created({
      endOn: null,
      name: 'Sans date',
      startOn: null,
    });
    expect(undated).toMatchObject({
      datePrecision: 'DAY',
      endOn: null,
      startOn: null,
    });
    expect((await list()).map(({ id }) => id)).toEqual([undated.id, dated.id]);
    const month = await call(
      PATCH_TOURNAMENT(
        request(`/api/tournois/${undated.id}`, 'PATCH', {
          datePrecision: 'MONTH',
          endOn: null,
          entryFeeCents: null,
          expectedVersion: 1,
          format: 'ONLINE',
          isCancelled: false,
          linkUrl: null,
          location: null,
          name: 'Sans date',
          organizerId: null,
          registrationDeadlineOn: '2027-05-20',
          startOn: '2027-05-14',
        }),
        idParams(undated.id),
      ),
    );
    expect(month.status, JSON.stringify(month.body.error)).toBe(200);
    expect(month.body.data).toMatchObject({
      datePrecision: 'MONTH',
      startOn: '2027-05-01',
    });
    expect((await journal()).at(-1)?.metadata).toMatchObject({
      after: { dates: 'mai 2027', registrationDeadline: '20 mai 2027' },
      before: { dates: 'Date à fixer', registrationDeadline: null },
    });
  });

  it('tells apart two tournaments of a name by their edition', async () => {
    const first = await created({ name: 'Lyon e-Sport' });
    // The same name again, in the same game: an edition is asked.
    const again = await create({ name: 'lyon E-SPORT' });
    expect(again.status).toBe(409);
    expect(again.body.error?.details?.edition?.[0]).toContain(
      'précisez l’édition',
    );
    const second = await created({
      edition: 'Saison 2',
      name: 'Lyon e-Sport',
    });
    expect(second).toMatchObject({ edition: 'Saison 2', name: 'Lyon e-Sport' });
    // The pair once: accents and case ignored.
    expect(
      (await create({ edition: 'saison 2', name: 'Lyon e-Sport' })).status,
    ).toBe(409);
    // Another game may have its own.
    expect(
      (await create({ gameId: league.id, name: 'Lyon e-Sport' })).status,
    ).toBe(201);
    // Renaming into a taken pair is refused too.
    const renamed = await call(
      PATCH_TOURNAMENT(
        request(`/api/tournois/${second.id}`, 'PATCH', {
          datePrecision: 'DAY',
          edition: null,
          endOn: '2027-03-17',
          entryFeeCents: null,
          expectedVersion: 1,
          format: 'ONLINE',
          isCancelled: false,
          linkUrl: null,
          location: null,
          name: 'Lyon e-Sport',
          organizerId: null,
          registrationDeadlineOn: null,
          startOn: '2027-03-15',
        }),
        idParams(second.id),
      ),
    );
    expect(renamed.status).toBe(409);
    expect((await list(`?equipe=${main.id}`)).map(({ id }) => id)).toEqual([]);
    expect(
      (await journal())
        .filter(({ action }) => action === 'TOURNAMENT_CREATE')
        .map(({ description }) => description),
    ).toEqual([
      'Tournoi ajouté : Lyon e-Sport (Valorant)',
      'Tournoi ajouté : Lyon e-Sport · Saison 2 (Valorant)',
      'Tournoi ajouté : Lyon e-Sport (League of Legends)',
    ]);
    expect(first.id).not.toBe(second.id);
  });

  it('keeps a scope of teams to the tournaments of its teams', async () => {
    const both = await created({ name: 'Les deux', teamId: main.id });
    expect((await engage(both.id, { teamId: academy.id })).status).toBe(201);
    const other = await created({ name: 'Academy seule', teamId: academy.id });
    await created({ name: 'Sans équipe' });

    await signIn(HOLDER, { kind: 'TEAMS', teamIds: [main.id] });
    const seen = await list();
    expect(seen.map(({ name }) => name)).toEqual(['Les deux']);
    // Only its own team among the engaged ones.
    expect(seen[0]?.entries.map(({ team }) => team.id)).toEqual([main.id]);
    expect(
      (
        await call(
          GET_TOURNAMENT(
            request(`/api/tournois/${other.id}`),
            idParams(other.id),
          ),
        )
      ).status,
    ).toBe(404);
    // A tournament of its own: with one of its teams, never another.
    const missing = await create({ name: 'Sans mon équipe' });
    expect(missing.status).toBe(400);
    expect(missing.body.error?.details?.teamId).toBeDefined();
    expect((await create({ teamId: academy.id })).status).toBe(400);
    expect((await create({ name: 'Le mien', teamId: main.id })).status).toBe(
      201,
    );
    // Another team engaged: only who sees it deletes the tournament.
    expect(
      (
        await call(
          DELETE_TOURNAMENT(
            request(`/api/tournois/${both.id}`, 'DELETE', {
              expectedVersion: 1,
            }),
            idParams(both.id),
          ),
        )
      ).status,
    ).toBe(403);

    // Without the tournaments, nothing.
    await signIn({ [PERMISSIONS.GAMES.VIEW]: true });
    expect((await GET_TOURNAMENTS(request('/api/tournois'))).status).toBe(403);
  });
});
