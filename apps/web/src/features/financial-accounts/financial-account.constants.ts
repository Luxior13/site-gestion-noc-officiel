/** A bank account, an online account (PayPal, HelloAsso…) or a cash box. */
export const FINANCIAL_ACCOUNT_KINDS = ['BANK', 'ONLINE', 'CASH'] as const;
export type FinancialAccountKind = (typeof FINANCIAL_ACCOUNT_KINDS)[number];

export const FINANCIAL_ACCOUNT_KIND_LABELS: Readonly<
  Record<FinancialAccountKind, string>
> = {
  BANK: 'Compte bancaire',
  CASH: 'Caisse',
  ONLINE: 'Compte en ligne',
};

export const ACCOUNT_NAME_MAX_LENGTH = 80;
export const INSTITUTION_MAX_LENGTH = 80;

/** Where the record page renders the save bar, outside the section. */
export const FINANCIAL_ACCOUNT_ACTION_BAR_SLOT =
  'financial-account-action-bar-slot';
