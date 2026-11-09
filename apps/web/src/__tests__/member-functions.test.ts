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

describe('order and common functions of a game', () => {
  it('lists the players first, active ones first in each, then by name', () => {
    const functions = [
      { isActive: true, kind: 'STAFF', name: 'Manager' },
      { isActive: false, kind: 'PLAYER', name: 'Capitaine' },
      { isActive: true, kind: 'PLAYER', name: 'Remplaçant' },
      { isActive: true, kind: 'STAFF', name: 'Analyste' },
      { isActive: true, kind: 'PLAYER', name: 'Joueur' },
      { isActive: false, kind: 'STAFF', name: 'Coach adjoint' },
    ] as const;
    expect(
      [...functions].sort(compareMemberFunctions).map(({ name }) => name),
    ).toEqual([
      'Joueur',
      'Remplaçant',
      'Capitaine',
      'Analyste',
      'Manager',
      'Coach adjoint',
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
