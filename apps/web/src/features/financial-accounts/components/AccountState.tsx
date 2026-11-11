import React, { type FC } from 'react';

import { StatusBadge } from '$ui/status-badge';

import type { FinancialAccountItem } from '../types/financial-account.types';

/** Open, or closed on its closing day. */
export const AccountState: FC<{
  account: Pick<FinancialAccountItem, 'closedOn'>;
}> = ({ account }) =>
  account.closedOn ? (
    <StatusBadge tone="former">Clôturé</StatusBadge>
  ) : (
    <StatusBadge tone="success">Ouvert</StatusBadge>
  );
