import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('$env', () => ({ env: { NODE_ENV: 'test' } }));

import {
  getReaderRights,
  type JournalRow,
  projectJournalEvent,
} from '$features/audit/server/audit-journal.projection';
import {
  countPeopleOn,
  formerLines,
  matchesRosterSearch,
  passageEndYear,
  passagePeriodLabel,
  passageStateBadge,
  passageStateOn,
  peopleCountsOf,
  rosterLines,
} from '$features/passages/passage.ui';
import {
  changePassageFunctionSchema,
  createPassageSchema,
  updatePassageSchema,
} from '$features/passages/schemas/passage.schemas';
import type { PassageItem } from '$features/passages/types/passage.types';
import {
  approximateDateEnd,
  formatApproximateDuration,
} from '$utils/approximate-date.utils';

const valid = {
  end: null,
  functionId: 'function-1',
  personId: 'person-1',
  start: { date: '2024-03-17', precision: 'MONTH' },
};

describe('passage form contract (9 November 2026)', () => {
  it('stores a start on the first day of its period, an end may be empty', () => {
    expect(createPassageSchema.parse(valid)).toEqual({
      end: null,
      functionId: 'function-1',
      personId: 'person-1',
      start: { date: '2024-03-01', precision: 'MONTH' },
    });
  });

  it('refuses an end before the start, counting the whole period of the end', () => {
    const before = createPassageSchema.safeParse({
      ...valid,
      end: { date: '2024-02-01', precision: 'MONTH' },
    });
    expect(before.success).toBe(false);
    expect(before.error?.issues[0]).toMatchObject({
      message: 'La fin ne peut pas précéder le début',
      path: ['end'],
    });
    // « 2024 » ends on 31 December: after a start in March 2024.
    expect(
      createPassageSchema.safeParse({
        ...valid,
        end: { date: '2024-01-01', precision: 'YEAR' },
      }).success,
    ).toBe(true);
  });

  it('never changes the person of a passage, and needs its version', () => {
    const editable = {
      end: valid.end,
      functionId: valid.functionId,
      start: valid.start,
    };
    expect(updatePassageSchema.safeParse(editable).success).toBe(false);
    expect(
      updatePassageSchema.safeParse({ ...editable, expectedVersion: 1 })
        .success,
    ).toBe(true);
    expect(
      updatePassageSchema.safeParse({ ...valid, expectedVersion: 1 }).success,
    ).toBe(false);
    expect(
      changePassageFunctionSchema.safeParse({
        at: { date: '2025-09-01', precision: 'DAY' },
        expectedVersion: 2,
        functionId: 'function-2',
      }).success,
    ).toBe(true);
  });

  it('knows the last day of a period', () => {
    expect(approximateDateEnd({ date: '2024-01-01', precision: 'YEAR' })).toBe(
      '2024-12-31',
    );
    expect(approximateDateEnd({ date: '2024-02-01', precision: 'MONTH' })).toBe(
      '2024-02-29',
    );
    expect(approximateDateEnd({ date: '2024-02-12', precision: 'DAY' })).toBe(
      '2024-02-12',
    );
  });
});

const passage = (
  id: string,
  personId: string,
  start: PassageItem['start'],
  end: PassageItem['end'] = null,
): PassageItem => ({
  end,
  function: {
    id: 'f',
    isActive: true,
    kind: 'PLAYER',
    name: 'Joueur',
    position: 0,
  },
  id,
  person: {
    displayName: personId,
    firstName: null,
    id: personId,
    lastName: null,
    nickname: personId,
  },
  start,
  updatedAt: '2026-11-09T00:00:00Z',
  version: 1,
});

describe('the roster on a day', () => {
  const kaiz = passage('p1', 'kaiz', { date: '2023-01-01', precision: 'YEAR' });
  const nova = passage(
    'p2',
    'nova',
    { date: '2022-03-01', precision: 'MONTH' },
    { date: '2024-06-01', precision: 'MONTH' },
  );
  const tom = passage('p3', 'tom', { date: '2027-01-01', precision: 'YEAR' });
  const kaizCoach = passage('p4', 'kaiz', {
    date: '2025-01-01',
    precision: 'YEAR',
  });

  it('tells current, former and upcoming passages, ends counting their whole period', () => {
    expect(passageStateOn(nova, '2024-06-30')).toBe('current');
    expect(passageStateOn(nova, '2024-07-01')).toBe('former');
    expect(passageStateOn(tom, '2026-11-09')).toBe('upcoming');
    expect(passageStateOn(kaiz, '2023-01-01')).toBe('current');
    expect(passageStateBadge(passageStateOn(tom, '2026-11-09'))).toEqual({
      label: 'À venir',
      tone: 'info',
    });
    expect(passageStateBadge('former').label).toBe('Ancien');
  });

  it('searches every word in the name or the function, accents aside', () => {
    expect(matchesRosterSearch(kaiz, 'KAI')).toBe(true);
    expect(matchesRosterSearch(kaiz, 'joueur kaiz')).toBe(true);
    expect(matchesRosterSearch(kaiz, 'jouéur')).toBe(true);
    expect(matchesRosterSearch(kaiz, 'coach')).toBe(false);
    expect(matchesRosterSearch(kaiz, '   ')).toBe(true);
  });

  it('keeps the Roster to what is there and coming, never the former ones', () => {
    // « Je ne veux pas mélanger les anciens avec les en cours et à venir »
    // (9 November 2026): the current lines first, then those to come.
    expect(
      rosterLines([tom, nova, kaiz, kaizCoach], '2026-11-09').map(
        (line) => line.id,
      ),
    ).toEqual(['p1', 'p4', 'p3']);
  });

  it('files the former passages by the year they ended, the latest first', () => {
    const rift = passage(
      'p5',
      'rift',
      { date: '2021-01-01', precision: 'YEAR' },
      { date: '2023-06-01', precision: 'MONTH' },
    );
    const lines = formerLines([rift, kaiz, nova, tom], '2026-11-09');

    expect(lines.map((line) => line.id)).toEqual(['p2', 'p5']);
    expect(lines.map(passageEndYear)).toEqual([2024, 2023]);
  });

  it('counts each person once, whatever their functions', () => {
    const all = [kaiz, nova, tom, kaizCoach];

    expect(countPeopleOn(all, '2026-11-09', 'current')).toBe(1);
    expect(countPeopleOn([kaiz, nova], '2023-06-15', 'current')).toBe(2);
    expect(peopleCountsOf(all, '2026-11-09')).toEqual({
      formerCount: 1,
      memberCount: 1,
    });
  });

  it('says how long a passage lasted, never more precisely than its dates', () => {
    type Day = PassageItem['start'];
    const day = (date: string): Day => ({ date, precision: 'DAY' });
    const month = (date: string): Day => ({ date, precision: 'MONTH' });
    const year = (date: string): Day => ({ date, precision: 'YEAR' });
    const today = '2026-11-09';

    // Until today for a member, until the end for a former one.
    expect(formatApproximateDuration(day('2025-01-15'), null, today)).toBe(
      '1 an 9 mois',
    );
    expect(formatApproximateDuration(month('2024-03-01'), null, today)).toBe(
      '2 ans 8 mois',
    );
    expect(
      formatApproximateDuration(day('2024-09-28'), day('2025-11-30'), today),
    ).toBe('1 an 2 mois');
    // The last day counts.
    expect(
      formatApproximateDuration(day('2026-11-03'), day('2026-11-05'), today),
    ).toBe('3 jours');
    expect(
      formatApproximateDuration(
        month('2024-03-01'),
        month('2024-06-01'),
        today,
      ),
    ).toBe('4 mois');
    expect(formatApproximateDuration(month('2026-11-01'), null, today)).toBe(
      'moins d’un mois',
    );
    // A bound known to the year: years only, said as such.
    expect(formatApproximateDuration(year('2023-01-01'), null, today)).toBe(
      'environ 3 ans',
    );
    expect(
      formatApproximateDuration(year('2023-01-01'), month('2025-09-01'), today),
    ).toBe('environ 2 ans');
    expect(formatApproximateDuration(year('2026-01-01'), null, today)).toBe(
      'moins d’un an',
    );
    // Not begun: no duration.
    expect(formatApproximateDuration(year('2027-01-01'), null, today)).toBe(
      null,
    );
  });

  it('writes a period as precisely as it is known', () => {
    expect(passagePeriodLabel(kaiz, '2026-11-09')).toBe('depuis 2023');
    expect(passagePeriodLabel(nova, '2026-11-09')).toBe(
      'mars 2022\u00a0→ juin 2024',
    );
    expect(
      passagePeriodLabel(
        passage('p5', 'x', { date: '2025-03-15', precision: 'DAY' }),
        '2026-11-09',
      ),
    ).toBe('depuis le 15 mars 2025');
    expect(passagePeriodLabel(tom, '2026-11-09')).toBe('à partir de 2027');
  });

  it('says the year once when it repeats, never at the cost of clarity', () => {
    type Day = PassageItem['start'];
    const day = (date: string): Day => ({ date, precision: 'DAY' });
    const month = (date: string): Day => ({ date, precision: 'MONTH' });
    const year = (date: string): Day => ({ date, precision: 'YEAR' });
    const period = (
      start: PassageItem['start'],
      end: NonNullable<PassageItem['end']>,
    ): string =>
      passagePeriodLabel(passage('p6', 'x', start, end), '2026-11-09');

    expect(period(day('2026-11-03'), day('2026-11-05'))).toBe(
      '3\u00a0→ 5 novembre 2026',
    );
    expect(period(day('2026-11-01'), day('2026-11-05'))).toBe(
      '1er\u00a0→ 5 novembre 2026',
    );
    expect(period(day('2026-09-03'), day('2026-11-05'))).toBe(
      '3 septembre\u00a0→ 5 novembre 2026',
    );
    expect(period(month('2024-03-01'), month('2024-06-01'))).toBe(
      'mars\u00a0→ juin 2024',
    );
    expect(period(day('2024-03-15'), month('2024-03-01'))).toBe(
      '15 mars\u00a0→ mars 2024',
    );
    expect(period(month('2024-03-01'), month('2024-03-01'))).toBe('mars 2024');
    expect(period(year('2024-01-01'), year('2024-01-01'))).toBe('2024');
    // A bound known to the year, or two years: both dates stay whole.
    expect(period(year('2024-01-01'), month('2024-06-01'))).toBe(
      '2024\u00a0→ juin 2024',
    );
    expect(period(day('2025-09-28'), day('2026-11-30'))).toBe(
      '28 septembre 2025\u00a0→ 30 novembre 2026',
    );
  });
});

describe('a passage in the activity journal', () => {
  const event = (overrides: Partial<JournalRow> = {}): JournalRow => ({
    action: 'PASSAGE_UPDATE',
    actorDisplayNameSnapshot: 'Camille Exemple',
    actorLoginNameSnapshot: 'camille.exemple',
    actorRoleSnapshot: 'ADMIN',
    category: 'PASSAGE',
    createdAt: new Date('2026-11-09T12:00:00Z'),
    description: 'Passage modifié : Joueur, Noctambule Academy (Valorant)',
    entityId: 'person-1',
    entityType: 'PERSON',
    eventKind: 'ACTIVITY',
    eventVersion: 1,
    fieldChanges: [],
    id: 'event-passage',
    ipAddress: null,
    metadata: {
      after: { end: 'juin 2025', function: 'Joueur' },
      before: { end: 'En cours', function: 'Remplaçant' },
      changes: ['function', 'end'],
      functionName: 'Joueur',
      gameName: 'Valorant',
      teamName: 'Noctambule Academy',
    },
    outcome: 'SUCCESS',
    pageKey: 'games',
    poleKey: 'esport',
    requestId: null,
    searchText: null,
    severity: 'INFO',
    stream: 'IDENTITY',
    tabKey: null,
    targetDisplayNameSnapshot: null,
    targetLoginNameSnapshot: null,
    targetRoleSnapshot: null,
    targetUserId: null,
    userAgent: null,
    userId: 'camille',
    ...overrides,
  });

  it('names the passage by its function and team, its record as the target', () => {
    const admin = {
      id: 'admin',
      isProtected: false,
      permissions: null,
      role: 'ADMIN' as const,
    };
    const projected = projectJournalEvent(
      event(),
      getReaderRights(admin),
      new Map([['person-1', 'Kaiz · Prénom Nom']]),
    );
    expect(projected.label).toBe('Passage modifié');
    expect(projected.typeLabel).toBe('Parcours');
    expect(projected.subject).toBe(
      'Passage : Joueur, Noctambule Academy (Valorant)',
    );
    expect(projected.target).toMatchObject({
      kind: 'person',
      name: 'Kaiz · Prénom Nom',
    });
    expect(projected.changes).toEqual([
      { after: 'Joueur', before: 'Remplaçant', label: 'Fonction' },
      { after: 'juin 2025', before: 'En cours', label: 'Fin' },
    ]);
  });

  it('never shows the person’s name to who may not read the Répertoire', () => {
    const reader = {
      id: 'reader',
      isProtected: false,
      permissions: { 'audit:view': true },
      role: 'USER' as const,
    };
    const projected = projectJournalEvent(
      event(),
      getReaderRights(reader),
      new Map([['person-1', 'Kaiz · Prénom Nom']]),
    );
    expect(projected.target?.name).toBe('Fiche du répertoire');
    expect(JSON.stringify(projected)).not.toContain('Kaiz');
  });

  it('labels the addition and the deletion of a passage', () => {
    const admin = {
      id: 'admin',
      isProtected: false,
      permissions: null,
      role: 'ADMIN' as const,
    };
    for (const [action, label] of [
      ['PASSAGE_CREATE', 'Passage ajouté'],
      ['PASSAGE_DELETE', 'Passage supprimé'],
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
