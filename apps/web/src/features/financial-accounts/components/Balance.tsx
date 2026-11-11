import React, { type FC } from 'react';

import { cn } from '$utils/css.utils';
import { formatEuros } from '$utils/money.utils';

/**
 * A balance in euros, red when it is negative: an overdraft asks for
 * attention (owner, 11 November 2026). The minus sign says it without the
 * colour; a positive balance keeps the colour of the text around it.
 */
export const Balance: FC<{ cents: number }> = ({ cents }) => (
  <span className={cn('tabular-nums', cents < 0 && 'text-destructive')}>
    {formatEuros(cents)}
  </span>
);
