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

/**
 * Money received less money paid (11 November 2026): « + » in green as an
 * entry, « − » in red as a negative balance, nothing on zero.
 */
export const ResultAmount: FC<{ cents: number; className?: string }> = ({
  cents,
  className,
}) => (
  <span
    className={cn(
      'whitespace-nowrap tabular-nums',
      cents > 0 && 'text-success',
      cents < 0 && 'text-destructive',
      className,
    )}
  >
    {cents > 0 ? '+ ' : cents < 0 ? '− ' : ''}
    {formatEuros(Math.abs(cents))}
  </span>
);
