import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('$env', () => ({ env: { NODE_ENV: 'test' } }));
vi.mock('$server/prisma', () => ({ prisma: {} }));

import {
  createUserDetailDraft,
  receiveUserDetail,
  restoreUserDetailSection,
  savedEsportScope,
} from '$components/users/user-detail/user-detail-draft';
import {
  isEmptyEsportScope,
  normalizeEsportScope,
  sameEsportScope,
} from '$constants/esport-scope.constants';
import { PERMISSIONS } from '$constants/permissions.constants';
import {
  getReaderRights,
  type JournalRow,
  projectJournalEvent,
} from '$features/audit/server/audit-journal.projection';
import { updateUserSchema } from '$features/users/schemas/user-update.schema';
import {
  assertEsportScopeAuthority,
  resolveEsportScopeChange,
  storedEsportScope,
} from '$features/users/server/user-esport-scope';
import {
  assertCoversGame,
  assertIncludesTeam,
  coversGame,
  type EsportScope,
  gameScopeWhere,
  includesTeam,
  teamScopeWhere,
} from '$server/esport-scope';
import { type ServiceError, serviceErrors } from '$server/service-error';
import type { UserType } from '$types/auth.types';

const games = (...ids: string[]): EsportScope => ({
  ids: new Set(ids),
  kind: 'GAMES',
});
const teams = (...ids: string[]): EsportScope => ({
  ids: new Set(ids),
  kind: 'TEAMS',
});
const all: EsportScope = { ids: new Set(), kind: 'ALL' };
const academy = { gameId: 'valorant', id: 'academy' };
const missing = (): ServiceError => serviceErrors.notFound('Introuvable');

describe('the Esport scope of an account (10 November 2026)', () => {
  it('compares scopes by the ids their kind reads', () => {
    expect(
      normalizeEsportScope({
        gameIds: ['b', 'a', 'a'],
        kind: 'GAMES',
        teamIds: ['ignored'],
      }),
    ).toEqual({ gameIds: ['a', 'b'], kind: 'GAMES', teamIds: [] });
    expect(
      sameEsportScope(
        { gameIds: ['x'], kind: 'ALL', teamIds: [] },
        { gameIds: [], kind: 'ALL', teamIds: ['y'] },
      ),
    ).toBe(true);
    expect(
      isEmptyEsportScope({ gameIds: [], kind: 'TEAMS', teamIds: [] }),
    ).toBe(true);
    expect(isEmptyEsportScope({ gameIds: [], kind: 'ALL', teamIds: [] })).toBe(
      false,
    );
  });

  it('filters teams and games by the chosen games or teams', () => {
    expect(teamScopeWhere(all)).toEqual({});
    expect(teamScopeWhere(games('valorant'))).toEqual({
      gameId: { in: ['valorant'] },
    });
    expect(teamScopeWhere(teams('academy'))).toEqual({
      id: { in: ['academy'] },
    });
    // A scope of teams shows the games that hold them.
    expect(gameScopeWhere(teams('academy'))).toEqual({
      teams: { some: { id: { in: ['academy'] } } },
    });
    expect(includesTeam(games('valorant'), academy)).toBe(true);
    expect(includesTeam(teams('main'), academy)).toBe(false);
    // An empty restricted scope opens nothing, never everything.
    expect(includesTeam(games(), academy)).toBe(false);
    expect(teamScopeWhere(games())).toEqual({ gameId: { in: [] } });
  });

  it('keeps a whole game to who has it, and answers as missing otherwise', () => {
    expect(coversGame(all, 'valorant')).toBe(true);
    expect(coversGame(games('valorant'), 'valorant')).toBe(true);
    expect(coversGame(teams('academy'), 'valorant')).toBe(false);
    expect(() =>
      assertCoversGame(games('league'), 'valorant', missing),
    ).toThrow('Introuvable');
    // A scope of teams is refused the same way whatever the game.
    expect(() =>
      assertCoversGame(teams('academy'), 'valorant', missing),
    ).toThrow('Seul un compte qui voit tout ce jeu peut faire cette action.');
    expect(() => assertIncludesTeam(teams('main'), academy, missing)).toThrow(
      'Introuvable',
    );
  });

  it('accepts a restricted scope only with a choice', () => {
    const parse = (
      esportScope: unknown,
    ): ReturnType<typeof updateUserSchema.safeParse> =>
      updateUserSchema.safeParse({
        esportScope,
        expectedUpdatedAt: '2026-11-10T10:00:00.000Z',
      });
    expect(parse({ gameIds: [], kind: 'GAMES', teamIds: [] }).success).toBe(
      false,
    );
    const parsed = parse({
      gameIds: ['b', 'a'],
      kind: 'GAMES',
      teamIds: ['t'],
    });
    expect(parsed.success && parsed.data.esportScope).toEqual({
      gameIds: ['a', 'b'],
      kind: 'GAMES',
      teamIds: [],
    });
    expect(
      updateUserSchema.safeParse({
        esportScope: { gameIds: [], kind: 'ALL', teamIds: [] },
        expectedUpdatedAt: '2026-11-10T10:00:00.000Z',
        permissions: {},
        permissionScope: 'account',
      }).success,
    ).toBe(false);
  });

  it('keeps every administrator on every game', () => {
    const stored = {
      esportScope: 'GAMES' as const,
      esportScopeItems: [{ gameId: 'valorant', teamId: null }],
    };
    expect(storedEsportScope(stored)).toEqual({
      gameIds: ['valorant'],
      kind: 'GAMES',
      teamIds: [],
    });
    // A promotion resets it.
    expect(resolveEsportScopeChange(stored, undefined, 'ADMIN')).toEqual({
      after: { gameIds: [], kind: 'ALL', teamIds: [] },
      before: { gameIds: ['valorant'], kind: 'GAMES', teamIds: [] },
    });
    expect(() =>
      resolveEsportScopeChange(
        stored,
        { gameIds: ['valorant'], kind: 'GAMES', teamIds: [] },
        'ADMIN',
      ),
    ).toThrow('Un administrateur voit toujours tous les jeux');
    expect(
      resolveEsportScopeChange(
        stored,
        { gameIds: ['valorant'], kind: 'GAMES', teamIds: [] },
        'USER',
      ),
    ).toBeNull();
  });

  it('is changed by who grants and revokes and sees every game, never on oneself', () => {
    const actor = (
      permissions: Record<string, boolean>,
      esportScope: UserType['esportScope'] = 'ALL',
    ): UserType =>
      ({
        esportScope,
        id: 'actor',
        isProtected: false,
        permissions,
        role: 'USER',
      }) as UserType;
    // With their prerequisites, reading accounts and their access.
    const reading = {
      [PERMISSIONS.USERS.VIEW]: true,
      [PERMISSIONS.USERS.VIEW_ACCESS]: true,
    };
    const both = {
      ...reading,
      [PERMISSIONS.USERS.GRANT_ACCESS]: true,
      [PERMISSIONS.USERS.REVOKE_ACCESS]: true,
    };
    expect(() =>
      assertEsportScopeAuthority(actor(both), 'target'),
    ).not.toThrow();
    expect(() =>
      assertEsportScopeAuthority(
        actor({ ...reading, [PERMISSIONS.USERS.GRANT_ACCESS]: true }),
        'target',
      ),
    ).toThrow();
    expect(() =>
      assertEsportScopeAuthority(actor(both, 'TEAMS'), 'target'),
    ).toThrow('Seul un compte qui voit tous les jeux');
    expect(() => assertEsportScopeAuthority(actor(both), 'actor')).toThrow(
      'Vous ne pouvez pas modifier vos propres autorisations',
    );
  });
});

describe('the Esport scope in the user record draft', () => {
  const user = {
    esportScope: 'GAMES',
    esportScopeItems: { gameIds: ['valorant'], teamIds: [] },
    firstName: 'Camille',
    id: 'manager',
    isActive: true,
    lastName: 'Exemple',
    loginName: 'camille',
    permissions: null,
    role: 'USER',
    updatedAt: '2026-11-10T10:00:00.000Z',
  } as unknown as UserType;

  it('starts from the saved scope, or none when the reader may not see it', () => {
    expect(createUserDetailDraft(user).esportScope).toEqual({
      gameIds: ['valorant'],
      kind: 'GAMES',
      teamIds: [],
    });
    expect(savedEsportScope({ ...user, esportScope: undefined })).toBeNull();
  });

  it('keeps a scope edited meanwhile and takes the saved one otherwise', () => {
    const draft = createUserDetailDraft(user);
    draft.esportScope = { gameIds: [], kind: 'TEAMS', teamIds: ['academy'] };
    const later = {
      ...user,
      esportScopeItems: { gameIds: ['league'], teamIds: [] },
      updatedAt: '2026-11-10T10:05:00.000Z',
    } as UserType;
    // Another section saved: the local scope draft survives.
    expect(receiveUserDetail(draft, later).esportScope?.kind).toBe('TEAMS');
    // Its own section saved with this draft: the server's answer wins.
    expect(
      receiveUserDetail(draft, later, {
        esportScope: draft.esportScope,
        form: draft.form,
        permissions: null,
        section: 'access',
      }).esportScope,
    ).toEqual({ gameIds: ['league'], kind: 'GAMES', teamIds: [] });
    expect(restoreUserDetailSection(draft, 'access').esportScope).toEqual({
      gameIds: ['valorant'],
      kind: 'GAMES',
      teamIds: [],
    });
  });
});

describe('the Esport scope in the activity journal', () => {
  it('names the change in words', () => {
    const row = {
      action: 'PERMISSION_UPDATE',
      actorDisplayNameSnapshot: 'Camille Exemple',
      actorLoginNameSnapshot: 'camille.exemple',
      actorRoleSnapshot: 'ADMIN',
      category: 'PERMISSION',
      createdAt: new Date('2026-11-10T12:00:00Z'),
      description: 'Autorisations modifiées : manager',
      entityId: null,
      entityType: null,
      eventKind: 'ACTIVITY',
      eventVersion: 1,
      fieldChanges: [],
      id: 'event-scope',
      ipAddress: null,
      metadata: {
        after: { esportScope: 'Jeux : Valorant' },
        before: { esportScope: 'Tous les jeux' },
        changes: ['esportScope'],
        pageKey: 'users',
        poleKey: 'system',
        tabKey: 'access',
        tabLabel: 'Autorisations',
        targetName: 'Manager',
      },
      outcome: 'SUCCESS',
      pageKey: 'users',
      poleKey: 'system',
      requestId: null,
      targetUserId: 'manager',
      userAgent: null,
      userId: 'admin',
    } as unknown as JournalRow;
    const projected = projectJournalEvent(
      row,
      getReaderRights({
        id: 'admin',
        isProtected: true,
        permissions: null,
        role: 'ADMIN',
      }),
      new Map(),
    );
    expect(projected.changes).toContainEqual({
      after: 'Jeux : Valorant',
      before: 'Tous les jeux',
      label: 'Jeux et équipes visibles',
    });
  });
});
