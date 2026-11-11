import { approximateDateEnd } from '$utils/approximate-date.utils';

import type { AccountHolder } from './types/financial-account.types';

/** The entity existed on that day (YYYY-MM-DD), its dates as known. */
export const holdsOn = (holder: AccountHolder, day: string): boolean =>
  holder.start.date <= day &&
  (holder.end === null || day <= approximateDateEnd(holder.end));

/**
 * Who may hold an account opened on that day (cadrage, règle 3): one entity,
 * it applies by itself and nobody chooses; several, the principal one is
 * proposed first.
 */
export const holdersOn = (
  holders: readonly AccountHolder[],
  day: string,
): AccountHolder[] =>
  holders
    .filter((holder) => holdsOn(holder, day))
    .sort(
      (left, right) => Number(right.isPrincipal) - Number(left.isPrincipal),
    );
