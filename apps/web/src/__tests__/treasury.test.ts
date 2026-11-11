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
  entityFormLabel,
  entityPeriodLabel,
  entityStateOf,
} from '$features/entities/entity.ui';
import {
  createEntitySchema,
  updateEntitySchema,
} from '$features/entities/schemas/entity.schemas';
import { holdersOn } from '$features/financial-accounts/account-holders';
import {
  createFinancialAccountSchema,
  updateFinancialAccountSchema,
} from '$features/financial-accounts/schemas/financial-account.schemas';
import type { AccountHolder } from '$features/financial-accounts/types/financial-account.types';
import { centsToInput, formatEuros, parseEuroAmount } from '$utils/money.utils';

describe('amounts of the treasury (10 November 2026)', () => {
  it('reads what a person types, in cents', () => {
    expect(parseEuroAmount('1 234,56')).toBe(123_456);
    expect(parseEuroAmount('1\u202f234,5 €')).toBe(123_450);
    expect(parseEuroAmount('-50')).toBe(-5_000);
    expect(parseEuroAmount('\u221250,01')).toBe(-5_001);
    expect(parseEuroAmount('12.5')).toBe(1_250);
    for (const wrong of ['', '1,234', 'abc', '1,2,3', '123456789'])
      expect(parseEuroAmount(wrong)).toBeNull();
  });

  it('writes cents back as typed and as read', () => {
    expect(centsToInput(123_456)).toBe('1 234,56');
    expect(parseEuroAmount(centsToInput(123_456))).toBe(123_456);
    expect(centsToInput(-5_000)).toBe('-50');
    expect(centsToInput(5)).toBe('0,05');
    expect(formatEuros(125_000)).toBe('1\u202f250,00\u00a0€');
  });
});

describe('legal entities', () => {
  const association = {
    end: null,
    form: 'ASSOCIATION' as const,
    otherForm: null,
    start: { date: '2025-10-01', precision: 'MONTH' as const },
  };

  it('says the form, the period and the state, computed from the dates', () => {
    expect(entityFormLabel(association)).toBe('Association loi 1901');
    expect(entityFormLabel({ form: 'OTHER', otherForm: 'Fondation' })).toBe(
      'Fondation',
    );
    expect(entityPeriodLabel(association)).toBe('depuis octobre 2025');
    const before = {
      end: { date: '2025-09-01', precision: 'MONTH' as const },
      form: 'NONE' as const,
      otherForm: null,
      start: { date: '2014-01-01', precision: 'YEAR' as const },
    };
    expect(entityPeriodLabel(before)).toBe('2014\u00a0→ septembre 2025');
    expect(entityStateOf(before, '2026-11-10')).toEqual({
      label: 'Terminée',
      tone: 'former',
    });
    expect(entityStateOf(association, '2026-11-10').label).toBe('Active');
    expect(entityStateOf(association, '2025-09-30').label).toBe('À venir');
    // The last day of « septembre 2025 » still belongs to the period.
    expect(entityStateOf(before, '2025-09-30').label).toBe('En cours');
  });

  it('names « Autre », and keeps identifiers away from the period before', () => {
    expect(
      createEntitySchema.safeParse({
        ...association,
        form: 'OTHER',
        name: 'X',
      }).success,
    ).toBe(false);
    const parsed = createEntitySchema.parse({
      ...association,
      name: ' Noctambule ',
      otherForm: 'ignoré',
    });
    expect(parsed).toMatchObject({ name: 'Noctambule', otherForm: null });
    const none = {
      ...association,
      expectedVersion: 1,
      form: 'NONE',
      headOffice: null,
      isPrincipal: false,
      name: 'Avant l’association',
      rnaNumber: null,
      siretNumber: null,
    };
    expect(updateEntitySchema.safeParse(none).success).toBe(true);
    expect(
      updateEntitySchema.safeParse({ ...none, siretNumber: '12345678900012' })
        .success,
    ).toBe(false);
    expect(
      updateEntitySchema.safeParse({ ...none, isPrincipal: true }).success,
    ).toBe(false);
    expect(
      updateEntitySchema.safeParse({
        ...none,
        end: { date: '2013-01-01', precision: 'YEAR' },
        form: 'ASSOCIATION',
      }).success,
    ).toBe(false);
  });
});

describe('financial accounts', () => {
  const holder = (
    id: string,
    start: string,
    end: string | null,
    isPrincipal = false,
  ): AccountHolder => ({
    end: end ? { date: end, precision: 'MONTH' } : null,
    id,
    isPrincipal,
    name: id,
    start: { date: start, precision: 'DAY' },
  });

  it('finds who may hold an account on its opening day, the principal first', () => {
    const holders = [
      holder('association', '2025-10-01', '2028-06-01', true),
      holder('company', '2028-01-01', null),
    ];
    expect(holdersOn(holders, '2026-01-01').map(({ id }) => id)).toEqual([
      'association',
    ]);
    // The end month counts to its last day.
    expect(holdersOn(holders, '2028-06-30').map(({ id }) => id)).toEqual([
      'association',
      'company',
    ]);
    expect(holdersOn(holders, '2025-01-01')).toEqual([]);
  });

  it('keeps a cash box at or above zero, without a bank, and a closing after its start', () => {
    const base = {
      entityId: null,
      institution: 'Banque',
      kind: 'CASH',
      name: 'Caisse',
      openingBalanceCents: 0,
      openingOn: '2026-01-01',
    };
    expect(createFinancialAccountSchema.parse(base).institution).toBeNull();
    expect(
      createFinancialAccountSchema.safeParse({
        ...base,
        openingBalanceCents: -1,
      }).success,
    ).toBe(false);
    expect(
      createFinancialAccountSchema.safeParse({
        ...base,
        openingBalanceCents: 1.5,
      }).success,
    ).toBe(false);
    expect(
      createFinancialAccountSchema.safeParse({
        ...base,
        openingOn: '2026-02-30',
      }).success,
    ).toBe(false);
    const update = {
      expectedVersion: 1,
      institution: null,
      kind: 'BANK',
      name: 'Compte courant',
      openingBalanceCents: 0,
      openingOn: '2026-01-01',
    };
    expect(
      updateFinancialAccountSchema.safeParse({ ...update, closedOn: null })
        .success,
    ).toBe(true);
    expect(
      updateFinancialAccountSchema.safeParse({
        ...update,
        closedOn: '2025-12-31',
        expectedVersion: 1,
      }).success,
    ).toBe(false);
  });

  it('keeps the amounts of an account in the journal to who may read the accounts', () => {
    const row = {
      action: 'FINANCIAL_ACCOUNT_UPDATE',
      actorDisplayNameSnapshot: 'Camille Exemple',
      actorLoginNameSnapshot: 'camille.exemple',
      actorRoleSnapshot: 'USER',
      category: 'FINANCIAL_ACCOUNT',
      createdAt: new Date('2026-11-10T12:00:00Z'),
      description: 'Compte modifié : Compte courant',
      entityId: null,
      entityType: null,
      eventKind: 'ACTIVITY',
      eventVersion: 1,
      fieldChanges: [],
      id: 'event-account',
      ipAddress: null,
      metadata: {
        accountName: 'Compte courant',
        after: { openingBalance: '42,50 €' },
        before: { openingBalance: '1 250,00 €' },
        changes: ['openingBalance'],
      },
      outcome: 'SUCCESS',
      pageKey: 'financial-accounts',
      poleKey: 'finance',
      requestId: null,
      targetUserId: null,
      userAgent: null,
      userId: 'treasurer',
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
      reader({ [PERMISSIONS.FINANCIAL_ACCOUNTS.VIEW]: true }),
      new Map(),
    );
    expect(allowed.subject).toBe('Compte : Compte courant');
    expect(allowed.typeLabel).toBe('Trésorerie');
    expect(allowed.changes).toEqual([
      {
        after: '42,50 €',
        before: '1 250,00 €',
        label: 'Solde de départ',
      },
    ]);
    const masked = projectJournalEvent(row, reader({}), new Map());
    expect(masked.subject).toBe('Compte financier');
    expect(masked.changes).toEqual([
      {
        after: 'Valeur masquée',
        before: 'Valeur masquée',
        label: 'Solde de départ',
      },
    ]);
  });
});
