/*
 * The operations of the treasury (owner, « ok go », 11 November 2026):
 * money received, money paid, or moved between two accounts of one entity.
 * The amount is typed positive; the kind gives the sign.
 */

export const OPERATION_KINDS = ['INCOME', 'EXPENSE', 'TRANSFER'] as const;
export type OperationKind = (typeof OPERATION_KINDS)[number];

export const OPERATION_KIND_LABELS: Readonly<Record<OperationKind, string>> = {
  EXPENSE: 'Sortie',
  INCOME: 'Entrée',
  TRANSFER: 'Virement',
};

/** The quick filters of the list, in the plural. */
export const OPERATION_KIND_FILTER_LABELS: Readonly<
  Record<OperationKind, string>
> = {
  EXPENSE: 'Sorties',
  INCOME: 'Entrées',
  TRANSFER: 'Virements',
};

/** The kind in the list's address: `?sens=entrees`. */
export const OPERATION_KIND_SLUGS: Readonly<Record<OperationKind, string>> = {
  EXPENSE: 'sorties',
  INCOME: 'entrees',
  TRANSFER: 'virements',
};

export const OPERATION_LABEL_MAX_LENGTH = 120;
export const OPERATION_NOTE_MAX_LENGTH = 500;
export const OPERATIONS_PAGE_SIZE = 25;

/** Where the record page renders the save bar, outside the section. */
export const OPERATION_ACTION_BAR_SLOT = 'operation-action-bar-slot';
