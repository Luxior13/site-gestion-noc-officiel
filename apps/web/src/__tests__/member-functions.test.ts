import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('$env', () => ({ env: { NODE_ENV: 'test' } }));

import {
  getReaderRights,
  type JournalRow,
  projectJournalEvent,
} from '$features/audit/server/audit-journal.projection';
import {
  COMMON_GAME_FUNCTIONS,
  compareMemberFunctions,
  memberFunctionKindLabel,
} from '$features/member-functions/member-function.constants';
import {
  addCommonMemberFunctionsSchema,
  createMemberFunctionSchema,
  reorderMemberFunctionsSchema,
  updateMemberFunctionSchema,
} from '$features/member-functions/schemas/member-function.schemas';

const coach = { isActive: true, kind: 'STAFF', name: '  Coach ' };

describe('function form contract (9 November 2026)', () => {
  it('trims the name and keeps the kind and the state', () => {
    expect(createMemberFunctionSchema.parse(coach)).toEqual({
      isActive: true,
      kind: 'STAFF',
      name: 'Coach',
    });
  });

  it('requires a name made of letters or digits, 40 characters at most', () => {
    for (const name of ['', '   ', '—', 'x'.repeat(41)])
      expect(
        createMemberFunctionSchema.safeParse({ ...coach, name }).success,
      ).toBe(false);
    expect(
      createMemberFunctionSchema.safeParse({ ...coach, name: 'x'.repeat(40) })
        .success,
    ).toBe(true);
  });

  it('accepts only the two kinds of the code, with a French message', () => {
    const wrong = createMemberFunctionSchema.safeParse({
      ...coach,
      kind: 'POSITION',
    });
    expect(wrong.success).toBe(false);
    expect(wrong.error?.issues[0]?.message).toBe('Choisissez un type');
    expect(
      createMemberFunctionSchema.safeParse({ ...coach, kind: 'PLAYER' })
        .success,
    ).toBe(true);
  });

  it('refuses unknown keys, an update without its version, and a game in the body', () => {
    expect(
      createMemberFunctionSchema.safeParse({ ...coach, gameId: 'game-1' })
        .success,
    ).toBe(false);
    expect(updateMemberFunctionSchema.safeParse(coach).success).toBe(false);
    expect(
      updateMemberFunctionSchema.safeParse({ ...coach, expectedVersion: 2 })
        .success,
    ).toBe(true);
    expect(addCommonMemberFunctionsSchema.safeParse({}).success).toBe(true);
    expect(
      addCommonMemberFunctionsSchema.safeParse({ names: ['Joueur'] }).success,
    ).toBe(false);
  });
});

describe('a new order of a group', () => {
  it('names one group and each of its functions once', () => {
    expect(
      reorderMemberFunctionsSchema.parse({
        active: false,
        ids: ['f2', 'f1'],
        kind: 'STAFF',
      }),
    ).toEqual({ active: false, ids: ['f2', 'f1'], kind: 'STAFF' });
    for (const body of [
      { active: true, ids: [], kind: 'STAFF' },
      { active: true, ids: ['f1', 'f1'], kind: 'STAFF' },
      { active: true, ids: ['f1'], kind: 'POSITION' },
      { active: true, ids: ['f1'] },
      // Which group: the active functions, or the inactive ones.
      { ids: ['f1'], kind: 'STAFF' },
      { active: true, gameId: 'game-1', ids: ['f1'], kind: 'PLAYER' },
    ])
      expect(reorderMemberFunctionsSchema.safeParse(body).success).toBe(false);
  });
});

describe('order and common functions of a game', () => {
  it('lists the players, then the staff, each active ones in their dragged order, inactive ones below', () => {
    const functions = [
      { isActive: true, kind: 'STAFF', name: 'Manager', position: 0 },
      // Inactive: below its group, whatever its former rank.
      { isActive: false, kind: 'PLAYER', name: 'Capitaine', position: 0 },
      { isActive: true, kind: 'PLAYER', name: 'Remplaçant', position: 1 },
      { isActive: true, kind: 'STAFF', name: 'Analyste', position: 2 },
      { isActive: true, kind: 'PLAYER', name: 'Joueur', position: 0 },
      { isActive: true, kind: 'STAFF', name: 'Coach', position: 1 },
      // A tie (two additions at once) falls back on the name.
      { isActive: true, kind: 'STAFF', name: 'Coach adjoint', position: 1 },
    ] as const;
    expect(
      [...functions].sort(compareMemberFunctions).map(({ name }) => name),
    ).toEqual([
      'Joueur',
      'Remplaçant',
      'Capitaine',
      'Manager',
      'Coach',
      'Coach adjoint',
      'Analyste',
    ]);
  });

  it('offers Joueur, Remplaçant, Coach, Manager and Analyste', () => {
    expect(
      COMMON_GAME_FUNCTIONS.map(
        ({ kind, name }) => `${name} (${memberFunctionKindLabel(kind)})`,
      ),
    ).toEqual([
      'Joueur (Joueur)',
      'Remplaçant (Joueur)',
      'Coach (Encadrement)',
      'Manager (Encadrement)',
      'Analyste (Encadrement)',
    ]);
  });
});

describe('a function in the activity journal', () => {
  const event = (overrides: Partial<JournalRow>): JournalRow => ({
    action: 'FUNCTION_UPDATE',
    actorDisplayNameSnapshot: 'Camille Exemple',
    actorLoginNameSnapshot: 'camille.exemple',
    actorRoleSnapshot: 'ADMIN',
    category: 'FUNCTION',
    createdAt: new Date('2026-11-09T12:00:00Z'),
    description: 'Fonction modifiée : Coach (Valorant)',
    entityId: null,
    entityType: null,
    eventKind: 'ACTIVITY',
    eventVersion: 1,
    fieldChanges: [],
    id: 'event-function',
    ipAddress: null,
    metadata: {
      after: { isActive: false, kind: 'Encadrement', name: 'Coach' },
      before: { isActive: true, kind: 'Joueur', name: 'Coatch' },
      changes: ['name', 'kind', 'isActive'],
      functionId: 'function-1',
      functionName: 'Coach',
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
  const project = (
    overrides: Partial<JournalRow> = {},
  ): ReturnType<typeof projectJournalEvent> =>
    projectJournalEvent(event(overrides), getReaderRights(admin), new Map());

  it('names the function with its game, its type and every changed field', () => {
    const projected = project();
    expect(projected.label).toBe('Fonction modifiée');
    expect(projected.typeLabel).toBe('Fonctions');
    expect(projected.subject).toBe('Fonction : Coach (Valorant)');
    expect(projected.changes).toEqual([
      { after: 'Coach', before: 'Coatch', label: 'Nom' },
      { after: 'Encadrement', before: 'Joueur', label: 'Type' },
      { after: 'Non', before: 'Oui', label: 'Active' },
    ]);
  });

  it('labels the addition and the deletion of a function', () => {
    for (const [action, label] of [
      ['FUNCTION_CREATE', 'Fonction ajoutée'],
      ['FUNCTION_DELETE', 'Fonction supprimée'],
    ] as const)
      expect(project({ action }).label).toBe(label);
  });

  it('tells a new order of the games and of the teams of a game', () => {
    const games = project({
      action: 'GAME_REORDER',
      category: 'GAME',
      metadata: {
        after: { order: 'League of Legends, Valorant' },
        before: { order: 'Valorant, League of Legends' },
        changes: ['order'],
      },
    });
    expect(games.label).toBe('Ordre des jeux modifié');
    expect(games.typeLabel).toBe('Jeux');
    expect(games.changes).toEqual([
      {
        after: 'League of Legends, Valorant',
        before: 'Valorant, League of Legends',
        label: 'Ordre',
      },
    ]);
    const teams = project({
      action: 'TEAM_REORDER',
      category: 'TEAM',
      metadata: {
        after: { order: 'Noctambule Academy, Noctambule' },
        before: { order: 'Noctambule, Noctambule Academy' },
        changes: ['order'],
        gameId: 'game-1',
        gameName: 'Valorant',
      },
    });
    expect(teams.label).toBe('Ordre des équipes modifié');
    expect(teams.subject).toBe('Équipes : Valorant');
    // The inactive teams, ranked too, say so.
    expect(
      project({
        action: 'TEAM_REORDER',
        category: 'TEAM',
        metadata: { active: false, gameName: 'Valorant' },
      }).subject,
    ).toBe('Équipes inactives : Valorant');
    expect(
      project({
        action: 'GAME_REORDER',
        category: 'GAME',
        metadata: { active: false },
      }).subject,
    ).toBe('Jeux inactifs');
    expect(teams.changes.map(({ label }) => label)).toEqual(['Ordre']);
  });

  it('tells a new order of a group, before and after', () => {
    const projected = project({
      action: 'FUNCTION_REORDER',
      metadata: {
        after: { order: 'Manager, Coach, Analyste' },
        before: { order: 'Coach, Manager, Analyste' },
        changes: ['order'],
        gameId: 'game-1',
        gameName: 'Valorant',
        kind: 'STAFF',
        kindLabel: 'Encadrement',
      },
    });
    expect(projected.label).toBe('Ordre des fonctions modifié');
    expect(projected.subject).toBe('Fonctions : Encadrement (Valorant)');
    expect(projected.changes).toEqual([
      {
        after: 'Manager, Coach, Analyste',
        before: 'Coach, Manager, Analyste',
        label: 'Ordre',
      },
    ]);
  });

  it('lists the functions removed with a game deleted by mistake', () => {
    const projected = project({
      action: 'GAME_DELETE',
      category: 'GAME',
      metadata: {
        after: null,
        before: {
          firstOpened: '2021',
          functions: 'Coach, Joueur',
          isActive: true,
          name: 'Valorant',
          shortName: null,
        },
        changes: ['firstOpened', 'isActive', 'name', 'shortName', 'functions'],
        gameId: 'game-1',
        gameName: 'Valorant',
      },
    });
    expect(projected.changes.at(-1)).toEqual({
      after: '—',
      before: 'Coach, Joueur',
      label: 'Fonctions',
    });
  });
});
