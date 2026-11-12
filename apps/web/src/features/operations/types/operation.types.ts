import type { PersonRef } from '$features/persons/types/person.types';

import type { OperationKind } from '../operation.constants';

type NamedRef = Readonly<{ id: string; name: string }>;

/** The team, or the whole game, an operation concerns. */
export type OperationAssignment = Readonly<{
  /** The game of a team; null for a whole game. */
  gameName: string | null;
  id: string;
  kind: 'game' | 'team';
  name: string;
}>;

/** Browser-safe projection of an operation (11 November 2026). */
export type OperationItem = Readonly<{
  account: NamedRef;
  /** Positive, in euro cents: the kind gives the sign. */
  amountCents: number;
  assignment: OperationAssignment | null;
  category: NamedRef | null;
  id: string;
  kind: OperationKind;
  /** Null for a transfer, said « Virement » with its two accounts. */
  label: string | null;
  note: string | null;
  /** « 2026-11-12 ». */
  occurredOn: string;
  organization: NamedRef | null;
  paymentMethod: NamedRef | null;
  /** The record that paid or was paid, for who may read the Répertoire. */
  person: PersonRef | null;
  /** Whether a record is linked, even when `person` is hidden. */
  personLinked: boolean;
  toAccount: NamedRef | null;
  /** The tournament it concerns (11 November 2026). */
  tournament: NamedRef | null;
  updatedAt: string;
  version: number;
}>;

type OperationCounts = Readonly<Record<'ALL' | OperationKind, number>>;

/** Money received and paid under the fixed filters, search aside. */
export type OperationTotals = Readonly<{
  expenseCents: number;
  incomeCents: number;
}>;

export type OperationsPage = Readonly<{
  /** Per kind, under the other filters: the numbers of the quick filters. */
  counts: OperationCounts;
  items: readonly OperationItem[];
  page: number;
  total: number;
  totalPages: number;
  /** What a team, a game or a person received and paid (11 November). */
  totals: OperationTotals;
}>;

/** A game's money, team by team, then the game itself (11 November 2026). */
export type GameFinanceRow = Readonly<{
  expenseCents: number;
  incomeCents: number;
  isActive: boolean;
  /** Null for the operations of the whole game. */
  teamId: string | null;
  teamName: string | null;
}>;

export type OperationFilters = Readonly<{
  accountId?: string;
  /** A game's operations, its teams' included. */
  gameId?: string;
  kind?: OperationKind;
  organizationId?: string;
  page: number;
  personId?: string;
  q?: string;
  teamId?: string;
  tournamentId?: string;
}>;

/** What a window or a record sends. */
export type OperationInput = Readonly<{
  accountId: string;
  amountCents: number;
  categoryId: string | null;
  gameId: string | null;
  kind: OperationKind;
  label: string | null;
  note: string | null;
  occurredOn: string;
  organizationId: string | null;
  paymentMethodId: string | null;
  /** Left out, an edit keeps the link: who cannot read the Répertoire. */
  personId?: string | null;
  teamId: string | null;
  toAccountId: string | null;
  /** Of the team's or game's, when one is chosen. */
  tournamentId?: string | null;
}>;

/** An account an operation may use. */
type OperationAccountChoice = Readonly<{
  closedOn: string | null;
  entityId: string;
  id: string;
  name: string;
  openingOn: string;
}>;

type ListChoice = Readonly<{
  id: string;
  isActive: boolean;
  name: string;
  position: number;
}>;

/** What the window of an operation offers, read once. */
export type OperationChoices = Readonly<{
  accounts: readonly OperationAccountChoice[];
  expenseCategories: readonly ListChoice[];
  games: readonly (ListChoice & Readonly<{ teams: readonly ListChoice[] }>)[];
  incomeCategories: readonly ListChoice[];
  organizations: readonly NamedRef[];
  paymentMethods: readonly ListChoice[];
  /** Undated, then the latest first, with their game and dates. */
  tournaments: readonly (NamedRef &
    Readonly<{ datesLabel: string; gameId: string; gameName: string }>)[];
}>;
