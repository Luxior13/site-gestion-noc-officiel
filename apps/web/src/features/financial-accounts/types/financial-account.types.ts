import type { ApproximateDate } from '$utils/approximate-date.utils';

import type { FinancialAccountKind } from '../financial-account.constants';

/** Browser-safe projection of a financial account (10 November 2026). */
export type FinancialAccountItem = Readonly<{
  /** The day it was closed; null while it is open. */
  closedOn: string | null;
  /** The entity that holds it, fixed at its opening (cadrage, règle 2). */
  entity: Readonly<{ id: string; name: string }>;
  id: string;
  institution: string | null;
  kind: FinancialAccountKind;
  name: string;
  /** The balance on `openingOn`, where the site's figures start, in cents. */
  openingBalanceCents: number;
  openingOn: string;
  updatedAt: string;
  version: number;
}>;

/** An entity with a legal form, which may hold accounts during its period. */
export type AccountHolder = Readonly<{
  end: ApproximateDate | null;
  id: string;
  isPrincipal: boolean;
  name: string;
  start: ApproximateDate;
}>;

export type FinancialAccountsOverview = Readonly<{
  accounts: FinancialAccountItem[];
  /** The entities that may hold an account, for the opening window. */
  holders: AccountHolder[];
}>;

export type FinancialAccountCreateInput = Readonly<{
  /** Asked only when several entities exist at the opening date. */
  entityId: string | null;
  institution: string | null;
  kind: FinancialAccountKind;
  name: string;
  openingBalanceCents: number;
  openingOn: string;
}>;

/** Its entity never changes: a wrong one means another account. */
export type FinancialAccountInput = Omit<
  FinancialAccountCreateInput,
  'entityId'
> &
  Readonly<{ closedOn: string | null }>;
