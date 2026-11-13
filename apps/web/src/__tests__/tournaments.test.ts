import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('$env', () => ({ env: { NODE_ENV: 'test' } }));
vi.mock('$server/prisma', () => ({ prisma: {} }));

import { PERMISSIONS } from '$constants/permissions.constants';
import {
  getReaderRights,
  type JournalRow,
  projectJournalEvent,
} from '$features/audit/server/audit-journal.projection';
import {
  tournamentCreateSchema,
  tournamentEntryCreateSchema,
  tournamentEntryUpdateSchema,
  tournamentSchema,
} from '$features/tournaments/schemas/tournament.schemas';
import { getTournamentCapabilities } from '$features/tournaments/tournament.permissions';
import {
  entryFeeLabel,
  listedEntries,
  placementLabel,
  tournamentDatesCell,
  tournamentDatesLabel,
  tournamentDatesShortLabel,
  tournamentStateOn,
  tournamentTitle,
} from '$features/tournaments/tournament.ui';
import { formatEuros } from '$utils/money.utils';

const details = {
  datePrecision: 'DAY' as const,
  edition: null,
  endOn: '2027-03-17',
  entryFeeCents: null,
  format: 'ONLINE',
  isCancelled: false,
  linkUrl: null,
  location: null,
  name: 'Lyon e-Sport 2027',
  organizerId: null,
  registrationDeadlineOn: null,
  startOn: '2027-03-15',
};

const issues = (result: {
  error?: { issues: { path: PropertyKey[] }[] };
  success: boolean;
}): string[] =>
  result.success
    ? []
    : [
        ...new Set(
          (result.error?.issues ?? []).map((issue) => String(issue.path[0])),
        ),
      ];

describe('tournaments (11 November 2026)', () => {
  it('asks only a name and a game, dates to the day or the month if known', () => {
    const base = {
      gameId: 'game-1',
      name: '  Lyon e-Sport 2027 ',
      organizerId: null,
      teamId: null,
    };
    // No date yet (12 November 2026).
    expect(tournamentCreateSchema.parse(base)).toMatchObject({
      datePrecision: 'DAY',
      endOn: null,
      name: 'Lyon e-Sport 2027',
      startOn: null,
    });
    // Known to the month: kept on its first day, without a last day.
    expect(
      tournamentCreateSchema.parse({
        ...base,
        datePrecision: 'MONTH',
        startOn: '2027-03-15',
      }),
    ).toMatchObject({ endOn: null, startOn: '2027-03-01' });
    expect(
      issues(
        tournamentCreateSchema.safeParse({
          ...base,
          datePrecision: 'MONTH',
          endOn: '2027-03-17',
          startOn: '2027-03-01',
        }),
      ),
    ).toEqual(['endOn']);
    expect(
      issues(
        tournamentCreateSchema.safeParse({
          ...base,
          endOn: '2027-03-14',
          startOn: '2027-03-15',
        }),
      ),
    ).toEqual(['endOn']);
    expect(
      issues(
        tournamentCreateSchema.safeParse({ ...base, endOn: '2027-03-14' }),
      ),
    ).toEqual(['startOn']);
    expect(
      issues(tournamentCreateSchema.safeParse({ ...base, name: ' ' })),
    ).toEqual(['name']);
  });

  it('keeps a place for a LAN and the deadlines before the end', () => {
    expect(
      issues(
        tournamentSchema.safeParse({ ...details, location: 'Lyon, Eurexpo' }),
      ),
    ).toEqual(['location']);
    expect(
      tournamentSchema.parse({
        ...details,
        format: 'LAN',
        location: ' Lyon, Eurexpo ',
      }).location,
    ).toBe('Lyon, Eurexpo');
    expect(
      issues(
        tournamentSchema.safeParse({
          ...details,
          registrationDeadlineOn: '2027-03-18',
        }),
      ),
    ).toEqual(['registrationDeadlineOn']);
    // Known to the month, the registration may close until its end.
    expect(
      tournamentSchema.safeParse({
        ...details,
        datePrecision: 'MONTH',
        endOn: null,
        registrationDeadlineOn: '2027-03-20',
        startOn: '2027-03-01',
      }).success,
    ).toBe(true);
    // A link is read as it is said, its scheme added.
    expect(
      tournamentSchema.parse({ ...details, linkUrl: 'lyon-esport.fr/regles' })
        .linkUrl,
    ).toBe('https://lyon-esport.fr/regles');
    expect(
      issues(
        tournamentSchema.safeParse({ ...details, linkUrl: 'pas un lien' }),
      ),
    ).toEqual(['linkUrl']);
    expect(
      issues(tournamentSchema.safeParse({ ...details, entryFeeCents: -100 })),
    ).toEqual(['entryFeeCents']);
  });

  it('takes one place or a shared range, and no line-up', () => {
    const entry = { teamId: 'team-1' };
    expect(
      tournamentEntryCreateSchema.safeParse({
        ...entry,
        placementFrom: 3,
        placementTo: 4,
      }).success,
    ).toBe(true);
    expect(
      issues(
        tournamentEntryCreateSchema.safeParse({
          ...entry,
          placementFrom: 4,
          placementTo: 3,
        }),
      ),
    ).toEqual(['placementTo']);
    expect(
      issues(
        tournamentEntryCreateSchema.safeParse({
          ...entry,
          placementFrom: null,
          placementTo: 3,
        }),
      ),
    ).toEqual(['placementFrom']);
    // Who played is not kept (13 November 2026): a line-up is refused.
    expect(
      tournamentEntryUpdateSchema.safeParse({
        expectedVersion: 1,
        lineup: ['person-1'],
        placementFrom: null,
        placementTo: null,
      }).success,
    ).toBe(false);
  });

  it('says a placement, a fee, the dates and the state as read', () => {
    expect(placementLabel({ placementFrom: 1, placementTo: 1 })).toBe('1er');
    expect(placementLabel({ placementFrom: 3, placementTo: 4 })).toBe('3e–4e');
    expect(placementLabel({ placementFrom: 5, placementTo: 8 })).toBe('5e–8e');
    expect(placementLabel({ placementFrom: null, placementTo: null })).toBe(
      null,
    );
    // A list's line (13 November 2026): two teams, the best placed first,
    // the others counted.
    const team = (
      id: string,
      placementFrom: number | null,
    ): { id: string; placementFrom: number | null } => ({ id, placementFrom });
    expect(
      listedEntries([
        team('principale', 4),
        team('secondaire', null),
        team('academy', 8),
        team('rookies', 2),
      ]),
    ).toEqual({
      hidden: 2,
      shown: [team('rookies', 2), team('principale', 4)],
    });
    expect(
      listedEntries([team('principale', null), team('academy', null)]),
    ).toEqual({
      hidden: 0,
      shown: [team('principale', null), team('academy', null)],
    });
    // Two tournaments of a name, told apart by their edition.
    expect(tournamentTitle({ edition: 'Saison 2', name: 'Lyon e-Sport' })).toBe(
      'Lyon e-Sport · Saison 2',
    );
    expect(tournamentTitle({ edition: null, name: 'Lyon e-Sport' })).toBe(
      'Lyon e-Sport',
    );
    expect(entryFeeLabel(0)).toBe('Gratuit');
    expect(entryFeeLabel(5_000)).toBe(`${formatEuros(5_000)} par équipe`);
    expect(entryFeeLabel(null)).toBe(null);
    expect(tournamentDatesLabel(details)).toBe('15\u00a0→ 17 mars 2027');
    expect(
      tournamentDatesLabel({ ...details, endOn: null, startOn: '2027-03-15' }),
    ).toBe('15 mars 2027');
    expect(
      tournamentDatesLabel({
        datePrecision: 'MONTH',
        endOn: null,
        startOn: '2027-03-01',
      }),
    ).toBe('mars 2027');
    expect(
      tournamentDatesLabel({ ...details, endOn: null, startOn: null }),
    ).toBe('Date à fixer');
    // A list's column (13 November 2026): the days, then the year and the
    // length, never the year left alone on a line.
    const cell = (
      startOn: string | null,
      endOn: string | null,
    ): ReturnType<typeof tournamentDatesCell> =>
      tournamentDatesCell({ datePrecision: 'DAY', endOn, startOn });
    expect(cell('2026-10-29', '2026-11-06')).toEqual({
      days: '29 oct. → 6 nov.',
      detail: '2026 · 9 jours',
    });
    expect(cell('2027-03-15', '2027-03-17')).toEqual({
      days: '15 → 17 mars',
      detail: '2027 · 3 jours',
    });
    expect(cell('2026-12-28', '2027-01-03')).toEqual({
      days: '28 déc. → 3 janv.',
      detail: '2026 → 2027 · 7 jours',
    });
    expect(cell('2027-02-01', '2027-04-02')).toEqual({
      days: '1er févr. → 2 avr.',
      detail: '2027 · 2 mois',
    });
    expect(cell('2027-03-15', null)).toEqual({
      days: '15 mars',
      detail: '2027',
    });
    expect(
      tournamentDatesCell({
        datePrecision: 'MONTH',
        endOn: null,
        startOn: '2027-09-01',
      }),
    ).toEqual({ days: 'Septembre', detail: '2027 · jours à fixer' });
    expect(cell(null, null)).toEqual({ days: 'Date à fixer', detail: null });
    // A phone's card: one line, the year kept with its day.
    const short = (startOn: string | null, endOn: string | null): string =>
      tournamentDatesShortLabel({ datePrecision: 'DAY', endOn, startOn });
    expect(short('2026-10-29', '2026-11-06')).toBe('29 oct. → 6 nov. 2026');
    expect(short('2026-12-28', '2027-01-03')).toBe(
      '28 déc. 2026 → 3 janv. 2027',
    );
    expect(short('2027-03-15', null)).toBe('15 mars 2027');
    expect(
      tournamentDatesShortLabel({
        datePrecision: 'MONTH',
        endOn: null,
        startOn: '2027-09-01',
      }),
    ).toBe('septembre 2027');
    expect(short(null, null)).toBe('Date à fixer');
    const tournament = { ...details, isCancelled: false };
    expect(tournamentStateOn(tournament, '2027-03-14')).toBe('upcoming');
    expect(tournamentStateOn(tournament, '2027-03-15')).toBe('ongoing');
    expect(tournamentStateOn(tournament, '2027-03-17')).toBe('ongoing');
    expect(tournamentStateOn(tournament, '2027-03-18')).toBe('finished');
    expect(
      tournamentStateOn({ ...tournament, isCancelled: true }, '2027-03-16'),
    ).toBe('cancelled');
    expect(
      tournamentStateOn(
        { ...tournament, endOn: null, startOn: null },
        '2027-03-16',
      ),
    ).toBe('unscheduled');
    // Known to the month: to come until that month ends.
    const march = {
      ...tournament,
      datePrecision: 'MONTH' as const,
      endOn: null,
      startOn: '2027-03-01',
    };
    expect(tournamentStateOn(march, '2027-03-20')).toBe('upcoming');
    expect(tournamentStateOn(march, '2027-04-01')).toBe('finished');
  });

  it('asks a team at the creation of who only sees chosen teams', () => {
    const user = (
      permissions: Record<string, boolean>,
      esportScope: 'ALL' | 'GAMES' | 'TEAMS' = 'ALL',
    ): Parameters<typeof getTournamentCapabilities>[0] => ({
      esportScope,
      isProtected: false,
      permissions,
      role: 'USER',
    });
    const manager = user(
      {
        [PERMISSIONS.TOURNAMENTS.MANAGE]: true,
        [PERMISSIONS.TOURNAMENTS.VIEW]: true,
      },
      'TEAMS',
    );
    expect(getTournamentCapabilities(manager)).toMatchObject({
      canAddOrganizers: false,
      canManage: true,
      canView: true,
      canViewOperations: false,
      mustChooseTeam: true,
    });
    // A typed organiser is added by who manages the organisations too, who
    // can correct its record (12 November 2026).
    const tournamentsAndOrganizations = {
      [PERMISSIONS.ORGANIZATIONS.MANAGE]: true,
      [PERMISSIONS.ORGANIZATIONS.VIEW]: true,
      [PERMISSIONS.TOURNAMENTS.MANAGE]: true,
      [PERMISSIONS.TOURNAMENTS.VIEW]: true,
    };
    expect(
      getTournamentCapabilities(user(tournamentsAndOrganizations))
        .canAddOrganizers,
    ).toBe(true);
    expect(
      getTournamentCapabilities(
        user({
          ...tournamentsAndOrganizations,
          [PERMISSIONS.TOURNAMENTS.MANAGE]: false,
        }),
      ).canAddOrganizers,
    ).toBe(false);
    // Managing without reading opens nothing.
    expect(
      getTournamentCapabilities(
        user({ [PERMISSIONS.TOURNAMENTS.MANAGE]: true }),
      ).canManage,
    ).toBe(false);
  });

  it('keeps the names of a line-up to who reads the tournaments or the Répertoire', () => {
    const row = {
      action: 'TOURNAMENT_ENTRY_UPDATE',
      actorDisplayNameSnapshot: 'Camille Exemple',
      actorLoginNameSnapshot: 'camille.exemple',
      actorRoleSnapshot: 'USER',
      category: 'TOURNAMENT',
      createdAt: new Date('2026-11-11T12:00:00Z'),
      description: 'Participation modifiée : Noctambule Valorant, Lyon',
      entityId: null,
      entityType: null,
      eventKind: 'ACTIVITY',
      eventVersion: 1,
      fieldChanges: [],
      id: 'event-entry',
      ipAddress: null,
      metadata: {
        after: { lineup: 'Kaiz, Nova', placement: '3e–4e' },
        before: { lineup: 'Kaiz', placement: null },
        changes: ['lineup', 'placement'],
        gameName: 'Valorant',
        teamName: 'Noctambule Valorant',
        tournamentName: 'Lyon e-Sport 2027',
      },
      outcome: 'SUCCESS',
      pageKey: 'tournaments',
      poleKey: 'esport',
      requestId: null,
      targetUserId: null,
      userAgent: null,
      userId: 'manager',
    } as unknown as JournalRow;
    const reader = (
      permissions: Record<string, boolean>,
    ): ReturnType<typeof getReaderRights> =>
      getReaderRights({
        id: 'reader',
        isProtected: false,
        permissions,
        role: 'USER',
      });
    const allowed = projectJournalEvent(
      row,
      reader({ [PERMISSIONS.TOURNAMENTS.VIEW]: true }),
      new Map(),
    );
    expect(allowed.typeLabel).toBe('Tournois');
    expect(allowed.subject).toBe(
      'Participation : Noctambule Valorant, Lyon e-Sport 2027',
    );
    expect(allowed.changes).toEqual([
      { after: 'Kaiz, Nova', before: 'Kaiz', label: 'Line-up' },
      { after: '3e–4e', before: '—', label: 'Classement' },
    ]);
    const masked = projectJournalEvent(row, reader({}), new Map());
    expect(masked.changes[0]).toEqual({
      after: 'Valeur masquée',
      before: 'Valeur masquée',
      label: 'Line-up',
    });
    // The placement says nothing of a person.
    expect(masked.changes[1]?.after).toBe('3e–4e');
    const created = projectJournalEvent(
      {
        ...row,
        action: 'TOURNAMENT_CREATE',
        metadata: {
          after: { name: 'Lyon e-Sport 2027' },
          before: null,
          changes: ['name'],
          gameName: 'Valorant',
          tournamentName: 'Lyon e-Sport 2027',
        },
      } as unknown as JournalRow,
      reader({}),
      new Map(),
    );
    expect(created.subject).toBe('Tournoi : Lyon e-Sport 2027 (Valorant)');
    expect(created.label).toBe('Tournoi ajouté');
  });
});
