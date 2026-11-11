import 'server-only';

import { prisma } from '$server/prisma';
import { compareRank } from '$utils/active-order.utils';

import type { OperationChoices } from '../types/operation.types';

const dateOnly = (value: Date): string => value.toISOString().slice(0, 10);

/**
 * What the window of an operation offers, read once when it opens: the
 * accounts with their period and entity, the lists of the treasury in their
 * dragged order, the games with their teams, and the organisations by name.
 */
export const getOperationChoices = async (): Promise<OperationChoices> => {
  const [accounts, choices, games, organizations] = await Promise.all([
    prisma.financialAccount.findMany({
      orderBy: [{ normalizedName: 'asc' }, { id: 'asc' }],
      select: {
        closedOn: true,
        entityId: true,
        id: true,
        name: true,
        openingOn: true,
      },
    }),
    prisma.treasuryChoice.findMany({
      select: {
        id: true,
        isActive: true,
        kind: true,
        name: true,
        position: true,
      },
    }),
    prisma.game.findMany({
      select: {
        id: true,
        isActive: true,
        name: true,
        position: true,
        teams: {
          select: { id: true, isActive: true, name: true, position: true },
        },
      },
    }),
    prisma.organization.findMany({
      orderBy: [{ normalizedName: 'asc' }, { id: 'asc' }],
      select: { id: true, name: true },
    }),
  ]);
  const ofKind = (
    kind: 'EXPENSE_CATEGORY' | 'INCOME_CATEGORY' | 'PAYMENT_METHOD',
  ): OperationChoices['paymentMethods'] =>
    choices
      .filter((choice) => choice.kind === kind)
      .sort(compareRank)
      .map(({ id, isActive, name, position }) => ({
        id,
        isActive,
        name,
        position,
      }));

  return {
    accounts: accounts.map((account) => ({
      closedOn: account.closedOn ? dateOnly(account.closedOn) : null,
      entityId: account.entityId,
      id: account.id,
      name: account.name,
      openingOn: dateOnly(account.openingOn),
    })),
    expenseCategories: ofKind('EXPENSE_CATEGORY'),
    games: [...games]
      .sort(compareRank)
      .map((game) => ({ ...game, teams: [...game.teams].sort(compareRank) })),
    incomeCategories: ofKind('INCOME_CATEGORY'),
    organizations,
    paymentMethods: ofKind('PAYMENT_METHOD'),
  };
};
