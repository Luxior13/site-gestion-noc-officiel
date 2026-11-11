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
  newOperationDraft,
  operationInputOf,
} from '$features/operations/components/OperationFields';
import {
  counterpartyLabel,
  operationTitle,
  signedAmount,
} from '$features/operations/operation.ui';
import {
  operationQuerySchema,
  operationSchema,
} from '$features/operations/schemas/operation.schemas';
import type {
  OperationChoices,
  OperationItem,
} from '$features/operations/types/operation.types';
import {
  compareTreasuryChoices,
  treasuryListOfSlug,
} from '$features/treasury-lists/treasury-list.constants';

const reader = (
  permissions: Record<string, boolean>,
): ReturnType<typeof getReaderRights> =>
  getReaderRights({
    id: 'reader',
    isProtected: false,
    permissions,
    role: 'USER',
  });

const base = {
  accountId: 'account-1',
  amountCents: 5_000,
  categoryId: 'category-1',
  gameId: null,
  kind: 'EXPENSE',
  label: 'Inscription Lyon e-Sport 2027',
  note: null,
  occurredOn: '2026-11-10',
  organizationId: 'organization-1',
  paymentMethodId: null,
  teamId: 'team-1',
  toAccountId: null,
};

const item = (changes: Partial<OperationItem> = {}): OperationItem => ({
  account: { id: 'account-1', name: 'Compte courant' },
  amountCents: 5_000,
  assignment: null,
  category: null,
  id: 'operation-1',
  kind: 'EXPENSE',
  label: 'Maillots',
  note: null,
  occurredOn: '2026-11-10',
  organization: null,
  paymentMethod: null,
  person: null,
  personLinked: false,
  toAccount: null,
  updatedAt: '2026-11-10T12:00:00.000Z',
  version: 1,
  ...changes,
});

describe('operations (11 November 2026)', () => {
  it('asks money received or paid for a label and a category, a transfer for a second account', () => {
    expect(operationSchema.safeParse(base).success).toBe(true);
    const missing = operationSchema.safeParse({
      ...base,
      categoryId: null,
      label: '  ',
    });
    expect(
      missing.error?.issues.map((issue) => issue.path.join('.')).sort(),
    ).toEqual(['categoryId', 'label']);
    // A transfer keeps only its accounts, its date, its amount and its note.
    expect(
      operationSchema.parse({
        ...base,
        kind: 'TRANSFER',
        note: ' Épargne ',
        personId: 'person-1',
        toAccountId: 'account-2',
      }),
    ).toMatchObject({
      categoryId: null,
      label: null,
      note: 'Épargne',
      organizationId: null,
      personId: null,
      teamId: null,
      toAccountId: 'account-2',
    });
    expect(
      operationSchema.safeParse({
        ...base,
        kind: 'TRANSFER',
        toAccountId: 'account-1',
      }).error?.issues[0]?.path,
    ).toEqual(['toAccountId']);
    // One payer or payee, one team or game, at most.
    expect(
      operationSchema
        .safeParse({ ...base, gameId: 'game-1', personId: 'person-1' })
        .error?.issues.map((issue) => issue.path.join('.'))
        .sort(),
    ).toEqual(['assignment', 'organizationId']);
  });

  it('refuses a day to come, a zero amount and more than two decimals', () => {
    expect(
      operationSchema.safeParse({ ...base, occurredOn: '2999-01-01' }).success,
    ).toBe(false);
    for (const amountCents of [0, -100, 12.5])
      expect(operationSchema.safeParse({ ...base, amountCents }).success).toBe(
        false,
      );
    expect(
      operationQuerySchema.parse({
        page: '2',
        q: ' maillot ',
        sens: 'sorties',
      }),
    ).toEqual({
      accountId: undefined,
      gameId: undefined,
      kind: 'EXPENSE',
      organizationId: undefined,
      page: 2,
      personId: undefined,
      q: 'maillot',
      teamId: undefined,
    });
    // The Finances tab of a team, a game or a record (11 November 2026).
    const id = '7f1c3f4e-2b1a-4c7e-9d2f-0a1b2c3d4e5f';
    expect(
      operationQuerySchema.parse({ equipe: id, jeu: id, personne: id }),
    ).toMatchObject({ gameId: id, personId: id, teamId: id });
    expect(
      operationQuerySchema.safeParse({ equipe: 'x'.repeat(129) }).success,
    ).toBe(false);
  });

  it('signs an amount as the structure, or one account, sees it', () => {
    expect(signedAmount(item({ kind: 'INCOME' }))).toEqual({
      income: true,
      sign: '+',
    });
    expect(signedAmount(item())).toEqual({ income: false, sign: '−' });
    const transfer = item({
      kind: 'TRANSFER',
      label: null,
      toAccount: { id: 'account-2', name: 'PayPal' },
    });
    expect(signedAmount(transfer)).toEqual({ income: false, sign: '' });
    expect(signedAmount(transfer, 'account-2').sign).toBe('+');
    expect(signedAmount(transfer, 'account-1').sign).toBe('−');
    expect(operationTitle(transfer)).toBe('Virement : Compte courant → PayPal');
    expect(counterpartyLabel(item({ personLinked: true }))).toBe(
      'Une fiche du Répertoire',
    );
  });

  it('reads the amount as typed and keeps the record of who cannot read the Répertoire', () => {
    const choices: OperationChoices = {
      accounts: [
        {
          closedOn: null,
          entityId: 'entity-1',
          id: 'account-1',
          name: 'Compte courant',
          openingOn: '2026-01-01',
        },
      ],
      expenseCategories: [],
      games: [],
      incomeCategories: [],
      organizations: [],
      paymentMethods: [],
    };
    const draft = newOperationDraft(choices, '2026-11-10');
    // The only open account is chosen by itself.
    expect(draft.accountId).toBe('account-1');
    expect(
      operationInputOf(
        {
          ...draft,
          amount: '1 234,5',
          assignment: 'team:team-1',
          categoryId: 'category-1',
          label: ' Maillots ',
        },
        false,
      ),
    ).toEqual({
      input: expect.objectContaining({
        amountCents: 123_450,
        gameId: null,
        label: 'Maillots',
        teamId: 'team-1',
      }),
    });
    const withoutRight = operationInputOf(
      { ...draft, amount: '10', categoryId: 'category-1', label: 'X' },
      false,
    );
    expect('input' in withoutRight && 'personId' in withoutRight.input).toBe(
      false,
    );
    expect(operationInputOf({ ...draft, amount: '0' }, true)).toEqual({
      errors: expect.objectContaining({
        amountCents: expect.any(String),
        categoryId: 'Choisissez une catégorie',
        label: 'Le libellé est obligatoire',
      }),
    });
  });

  it('ranks the lists of the treasury by block, then by hand', () => {
    expect(treasuryListOfSlug('moyens-de-paiement')).toBe('payment-methods');
    expect(treasuryListOfSlug('autre')).toBeNull();
    const sorted = [
      {
        isActive: true,
        kind: 'EXPENSE_CATEGORY',
        name: 'Matériel',
        position: 0,
      },
      { isActive: false, kind: 'INCOME_CATEGORY', name: 'Dons', position: 1 },
      {
        isActive: true,
        kind: 'INCOME_CATEGORY',
        name: 'Cotisations',
        position: 0,
      },
    ] as const;
    expect(
      [...sorted].sort(compareTreasuryChoices).map(({ name }) => name),
    ).toEqual(['Cotisations', 'Dons', 'Matériel']);
  });

  it('keeps an operation in the journal to who may read the operations', () => {
    const row = {
      action: 'FINANCIAL_OPERATION_UPDATE',
      actorDisplayNameSnapshot: 'Camille Exemple',
      actorLoginNameSnapshot: 'camille.exemple',
      actorRoleSnapshot: 'USER',
      category: 'FINANCIAL_OPERATION',
      createdAt: new Date('2026-11-11T12:00:00Z'),
      description: 'Opération modifiée : Maillots',
      entityId: null,
      entityType: null,
      eventKind: 'ACTIVITY',
      eventVersion: 1,
      fieldChanges: [],
      id: 'event-operation',
      ipAddress: null,
      metadata: {
        after: { amount: '120,00 €' },
        before: { amount: '100,00 €' },
        changes: ['amount'],
        operationLabel: 'Maillots',
      },
      outcome: 'SUCCESS',
      pageKey: 'operations',
      poleKey: 'finance',
      requestId: null,
      targetUserId: null,
      userAgent: null,
      userId: 'treasurer',
    } as unknown as JournalRow;
    const allowed = projectJournalEvent(
      row,
      reader({ [PERMISSIONS.OPERATIONS.VIEW]: true }),
      new Map(),
    );
    expect(allowed.subject).toBe('Opération : Maillots');
    expect(allowed.typeLabel).toBe('Trésorerie');
    expect(allowed.changes).toEqual([
      { after: '120,00 €', before: '100,00 €', label: 'Montant' },
    ]);
    const masked = projectJournalEvent(row, reader({}), new Map());
    expect(masked.subject).toBe('Opération');
    expect(masked.changes).toEqual([
      { after: 'Valeur masquée', before: 'Valeur masquée', label: 'Montant' },
    ]);
    // The lists are not masked: their names say nothing of the money.
    const list = projectJournalEvent(
      {
        ...row,
        action: 'TREASURY_CHOICE_CREATE',
        category: 'TREASURY_CHOICE',
        metadata: {
          after: { name: 'Matériel' },
          before: null,
          changes: ['name'],
          choiceName: 'Matériel',
          listLabel: 'Catégorie de sortie',
        },
      } as unknown as JournalRow,
      reader({}),
      new Map(),
    );
    expect(list.subject).toBe('Catégorie de sortie : Matériel');
    expect(list.typeLabel).toBe('Trésorerie');
  });
});
