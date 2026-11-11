import React, { type FC } from 'react';

import { cn } from '$utils/css.utils';
import { formatEuros } from '$utils/money.utils';

import { signedAmount } from '../operation.ui';
import type { OperationItem } from '../types/operation.types';

/**
 * An operation's amount with its sign (owner, 11 November 2026): money
 * received in green with « + », money paid in the colour of the text with
 * « − », never red; a transfer signed only when seen from one account.
 */
export const OperationAmount: FC<{
  accountId?: string;
  className?: string;
  item: Pick<OperationItem, 'account' | 'amountCents' | 'kind' | 'toAccount'>;
}> = ({ accountId, className, item }) => {
  const { income, sign } = signedAmount(item, accountId);

  return (
    <span
      className={cn(
        'whitespace-nowrap tabular-nums',
        income && 'text-success',
        className,
      )}
    >
      {sign && `${sign} `}
      {formatEuros(item.amountCents)}
    </span>
  );
};
