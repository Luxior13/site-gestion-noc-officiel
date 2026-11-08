import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('$env', () => ({ env: { NODE_ENV: 'test' } }));

import { UserRole } from '@repo/shared';

import { PERMISSIONS } from '$constants/permissions.constants';
import {
  getReaderRights,
  type JournalRow,
  projectJournalEvent,
} from '$features/audit/server/audit-journal.projection';
import { getGameCapabilities } from '$features/games/game.permissions';
import {
  changeDatePrecision,
  formatApproximateDate,
  getLocalToday,
  normalizeApproximateDate,
} from '$features/games/game-date.utils';
import { compareGames } from '$features/games/game-order.utils';
import {
  createGameSchema,
  updateGameSchema,
} from '$features/games/schemas/game.schemas';

const validGame = {
  firstOpened: { date: '2021-03-15', precision: 'DAY' },
  isActive: true,
  name: 'Valorant',
  shortName: 'VAL',
};

describe('approximate dates of a game (8 November 2026)', () => {
  it('stores a year on 1 January and a month on its first day', () => {
    expect(
      normalizeApproximateDate({ date: '2019-07-23', precision: 'YEAR' }),
    ).toEqual({ date: '2019-01-01', precision: 'YEAR' });
    expect(
      normalizeApproximateDate({ date: '2021-03-15', precision: 'MONTH' }),
    ).toEqual({ date: '2021-03-01', precision: 'MONTH' });
    expect(
      changeDatePrecision({ date: '2021-03-15', precision: 'DAY' }, 'YEAR'),
    ).toEqual({ date: '2021-01-01', precision: 'YEAR' });
  });

  it('writes a date as precisely as it is known, in French', () => {
    expect(
      formatApproximateDate({ date: '2019-01-01', precision: 'YEAR' }),
    ).toBe('2019');
    expect(
      formatApproximateDate({ date: '2021-03-01', precision: 'MONTH' }),
    ).toBe('mars 2021');
    expect(
      formatApproximateDate({ date: '2021-03-01', precision: 'DAY' }),
    ).toBe('1er mars 2021');
    expect(
      formatApproximateDate({ date: '2021-03-15', precision: 'DAY' }),
    ).toBe('15 mars 2021');
  });

  it('prefills the first opening with the local day', () => {
    expect(getLocalToday(new Date(2026, 10, 8, 23, 30))).toBe('2026-11-08');
  });
});

describe('game form contract', () => {
  it('trims the names and turns an empty short name into none', () => {
    const parsed = createGameSchema.parse({
      ...validGame,
      name: '  League of Legends ',
      shortName: '   ',
    });
    expect(parsed.name).toBe('League of Legends');
    expect(parsed.shortName).toBeNull();
  });

  it('normalizes the date to its precision before it reaches the database', () => {
    expect(
      createGameSchema.parse({
        ...validGame,
        firstOpened: { date: '2016-09-30', precision: 'YEAR' },
      }).firstOpened,
    ).toEqual({ date: '2016-01-01', precision: 'YEAR' });
  });

  it.each([
    [{ name: '   ' }, 'name'],
    [{ name: '!!!' }, 'name'],
    [{ name: 'x'.repeat(61) }, 'name'],
    [{ shortName: 'x'.repeat(13) }, 'shortName'],
    [{ firstOpened: { date: '2021-02-30', precision: 'DAY' } }, 'firstOpened'],
    [{ firstOpened: { date: '1960-01-01', precision: 'YEAR' } }, 'firstOpened'],
    [{ firstOpened: { date: '2021-03-15', precision: 'WEEK' } }, 'firstOpened'],
  ])('refuses %j on its own field', (override, field) => {
    const parsed = createGameSchema.safeParse({ ...validGame, ...override });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.path[0]).toBe(field);
  });

  it('refuses unknown keys and an update without its version', () => {
    expect(
      createGameSchema.safeParse({ ...validGame, normalizedName: 'x' }).success,
    ).toBe(false);
    expect(updateGameSchema.safeParse(validGame).success).toBe(false);
    expect(
      updateGameSchema.safeParse({ ...validGame, expectedVersion: 2 }).success,
    ).toBe(true);
  });
});

describe('order of the games', () => {
  it('puts the active games first, then sorts by name whatever the accents', () => {
    const games = [
      { isActive: false, name: 'Counter-Strike: Global Offensive' },
      { isActive: true, name: 'Valorant' },
      { isActive: false, name: 'Apex Legends' },
      { isActive: true, name: 'échecs' },
      { isActive: true, name: 'League of Legends' },
    ];

    expect([...games].sort(compareGames).map((game) => game.name)).toEqual([
      'échecs',
      'League of Legends',
      'Valorant',
      'Apex Legends',
      'Counter-Strike: Global Offensive',
    ]);
  });
});

describe('game rights', () => {
  it('gives an administrator both rights and a user only what was granted', () => {
    expect(
      getGameCapabilities({
        isProtected: false,
        permissions: null,
        role: UserRole.ADMIN,
      }),
    ).toEqual({ canManage: true, canView: true });
    expect(
      getGameCapabilities({
        isProtected: false,
        permissions: { [PERMISSIONS.GAMES.VIEW]: true },
        role: UserRole.USER,
      }),
    ).toEqual({ canManage: false, canView: true });
    expect(getGameCapabilities(null)).toEqual({
      canManage: false,
      canView: false,
    });
  });
});

describe('a game in the activity journal', () => {
  const event = (overrides: Partial<JournalRow>): JournalRow => ({
    action: 'GAME_UPDATE',
    actorDisplayNameSnapshot: 'Camille Exemple',
    actorLoginNameSnapshot: 'camille.exemple',
    actorRoleSnapshot: 'ADMIN',
    category: 'GAME',
    createdAt: new Date('2026-11-08T12:00:00Z'),
    description: 'Jeu modifié : Valorant',
    entityId: null,
    entityType: null,
    eventKind: 'ACTIVITY',
    eventVersion: 1,
    fieldChanges: [],
    id: 'event-game',
    ipAddress: null,
    metadata: {
      after: { firstOpened: '2020', isActive: false, name: 'Valorant' },
      before: { firstOpened: 'mars 2021', isActive: true, name: 'Valorantt' },
      changes: ['name', 'firstOpened', 'isActive'],
      gameId: 'game-1',
      gameName: 'Valorant',
      pageKey: 'games',
      poleKey: 'esport',
    },
    outcome: 'SUCCESS',
    pageKey: 'games',
    poleKey: 'esport',
    requestId: null,
    searchText: null,
    severity: 'INFO',
    stream: 'SYSTEM',
    tabKey: null,
    targetDisplayNameSnapshot: null,
    targetLoginNameSnapshot: null,
    targetRoleSnapshot: null,
    targetUserId: null,
    userAgent: null,
    userId: 'camille',
    ...overrides,
  });
  const admin = {
    id: 'admin',
    isProtected: false,
    permissions: null,
    role: 'ADMIN' as const,
  };

  it('names the game, its type and every changed field in French', () => {
    const projected = projectJournalEvent(
      event({}),
      getReaderRights(admin),
      new Map(),
    );
    expect(projected.label).toBe('Jeu modifié');
    expect(projected.typeLabel).toBe('Jeux');
    expect(projected.subject).toBe('Jeu : Valorant');
    expect(projected.changes).toEqual([
      { after: 'Valorant', before: 'Valorantt', label: 'Nom' },
      { after: '2020', before: 'mars 2021', label: 'Première ouverture' },
      { after: 'Non', before: 'Oui', label: 'Actif' },
    ]);
  });

  it('labels the addition and the deletion of a game', () => {
    for (const [action, label] of [
      ['GAME_CREATE', 'Jeu ajouté'],
      ['GAME_DELETE', 'Jeu supprimé'],
    ] as const)
      expect(
        projectJournalEvent(
          event({ action }),
          getReaderRights(admin),
          new Map(),
        ).label,
      ).toBe(label);
  });
});
