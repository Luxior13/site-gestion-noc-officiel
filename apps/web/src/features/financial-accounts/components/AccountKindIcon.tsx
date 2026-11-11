import { Banknote, Landmark, Wallet } from 'lucide-react';
import React, { type FC } from 'react';

import type { FinancialAccountItem } from '../types/financial-account.types';

/**
 * The icon of an account by its kind, the same in the list and on its
 * record: a bank, a wallet for an online account, notes for a cash box.
 */
export const AccountKindIcon: FC<{
  className: string;
  kind: FinancialAccountItem['kind'];
}> = ({ className, kind }) =>
  kind === 'CASH' ? (
    <Banknote aria-hidden="true" className={className} />
  ) : kind === 'BANK' ? (
    <Landmark aria-hidden="true" className={className} />
  ) : (
    <Wallet aria-hidden="true" className={className} />
  );
