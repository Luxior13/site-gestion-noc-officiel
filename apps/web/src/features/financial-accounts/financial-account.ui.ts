import { FINANCIAL_ACCOUNT_KIND_LABELS } from './financial-account.constants';
import type { FinancialAccountItem } from './types/financial-account.types';

/** « Compte bancaire · Crédit Agricole », « Caisse ». */
export const accountKindLine = (
  account: Pick<FinancialAccountItem, 'institution' | 'kind'>,
): string =>
  account.institution
    ? `${FINANCIAL_ACCOUNT_KIND_LABELS[account.kind]} · ${account.institution}`
    : FINANCIAL_ACCOUNT_KIND_LABELS[account.kind];
