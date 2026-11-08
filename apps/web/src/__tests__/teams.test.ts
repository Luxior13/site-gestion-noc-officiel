import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('$env', () => ({ env: { NODE_ENV: 'test' } }));

import { UserRole } from '@repo/shared';

import {
  getPermissionItem,
  PERMISSIONS,
} from '$constants/permissions.constants';
import {
  getReaderRights,
  type JournalRow,
  projectJournalEvent,
} from '$features/audit/server/audit-journal.projection';
import { getGameCapabilities } from '$features/games/game.permissions';
import {
  createTeamSchema,
  updateTeamSchema,
} from '$features/teams/schemas/team.schemas';

const validTeam = {
  founded: { date: '2023-09-14', precision: 'MONTH' },
  gameId: 'game-1',
  isActive: true,
  name: '  Noctambule Academy ',
};

describe('team form contract (8 November 2026)', () => {
  it('trims the name and stores a month on its first day', () => {
    expect(createTeamSchema.parse(validTeam)).toEqual({
      founded: { date: '2023-09-01', precision: 'MONTH' },
      gameId: 'game-1',
      isActive: true,
      name: 'Noctambule Academy',
    });
  });

  it('requires a game and a name made of letters or digits', () => {
    expect(
      createTeamSchema.safeParse({ ...validTeam, gameId: '' }).success,
    ).toBe(false);
    for (const name of ['', '   ', '—'])
      expect(createTeamSchema.safeParse({ ...validTeam, name }).success).toBe(
        false,
      );
    expect(
      createTeamSchema.safeParse({ ...validTeam, name: 'x'.repeat(61) })
        .success,
    ).toBe(false);
  });

  it('refuses unknown keys and an update without its version', () => {
    expect(
      createTeamSchema.safeParse({ ...validTeam, shortName: 'NA' }).success,
    ).toBe(false);
    const editable = {
      founded: validTeam.founded,
      isActive: validTeam.isActive,
      name: validTeam.name,
    };
    expect(updateTeamSchema.safeParse(editable).success).toBe(false);
    expect(
      updateTeamSchema.safeParse({ ...editable, expectedVersion: 3 }).success,
    ).toBe(true);
  });

  it('never takes a new game once the team exists', () => {
    expect(
      updateTeamSchema.safeParse({ ...validTeam, expectedVersion: 3 }).success,
    ).toBe(false);
  });
});

describe('team rights', () => {
  it('shows teams only to who also sees the games', () => {
    expect(
      getGameCapabilities({
        isProtected: false,
        permissions: { [PERMISSIONS.TEAMS.VIEW]: true },
        role: UserRole.USER,
      }),
    ).toMatchObject({ canView: false, canViewTeams: false });
    expect(
      getGameCapabilities({
        isProtected: false,
        permissions: {
          [PERMISSIONS.GAMES.VIEW]: true,
          [PERMISSIONS.TEAMS.MANAGE]: true,
          [PERMISSIONS.TEAMS.VIEW]: true,
        },
        role: UserRole.USER,
      }),
    ).toMatchObject({
      canManage: false,
      canManageTeams: true,
      canViewTeams: true,
    });
  });

  it('declares the team rights on the Jeux page, each after the one it needs', () => {
    expect(getPermissionItem(PERMISSIONS.TEAMS.VIEW)).toMatchObject({
      dependencies: [PERMISSIONS.GAMES.VIEW],
      label: 'Consulter les équipes',
      route: '/esport/jeux',
    });
    expect(getPermissionItem(PERMISSIONS.TEAMS.MANAGE)).toMatchObject({
      dependencies: [PERMISSIONS.TEAMS.VIEW],
      label: 'Gérer les équipes',
      risk: 'sensitive',
    });
  });
});

describe('a team in the activity journal', () => {
  const event = (overrides: Partial<JournalRow>): JournalRow => ({
    action: 'TEAM_UPDATE',
    actorDisplayNameSnapshot: 'Camille Exemple',
    actorLoginNameSnapshot: 'camille.exemple',
    actorRoleSnapshot: 'ADMIN',
    category: 'TEAM',
    createdAt: new Date('2026-11-08T12:00:00Z'),
    description: 'Équipe modifiée : Noctambule Academy (Valorant)',
    entityId: null,
    entityType: null,
    eventKind: 'ACTIVITY',
    eventVersion: 1,
    fieldChanges: [],
    id: 'event-team',
    ipAddress: null,
    metadata: {
      after: { game: 'Valorant', isActive: false, name: 'Noctambule Academy' },
      before: {
        game: 'League of Legends',
        isActive: true,
        name: 'Noctambule Acadmy',
      },
      changes: ['game', 'name', 'isActive'],
      gameId: 'game-1',
      gameName: 'Valorant',
      pageKey: 'games',
      poleKey: 'esport',
      teamId: 'team-1',
      teamName: 'Noctambule Academy',
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

  it('names the team with its game, its type and every changed field', () => {
    const projected = projectJournalEvent(
      event({}),
      getReaderRights(admin),
      new Map(),
    );
    expect(projected.label).toBe('Équipe modifiée');
    expect(projected.typeLabel).toBe('Équipes');
    expect(projected.subject).toBe('Équipe : Noctambule Academy (Valorant)');
    expect(projected.changes).toEqual([
      { after: 'Valorant', before: 'League of Legends', label: 'Jeu' },
      {
        after: 'Noctambule Academy',
        before: 'Noctambule Acadmy',
        label: 'Nom',
      },
      { after: 'Non', before: 'Oui', label: 'Active' },
    ]);
  });

  it('labels the addition and the deletion of a team', () => {
    for (const [action, label] of [
      ['TEAM_CREATE', 'Équipe ajoutée'],
      ['TEAM_DELETE', 'Équipe supprimée'],
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
