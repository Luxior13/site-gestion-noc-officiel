import 'server-only';

import type { Prisma } from '@prisma/client';

import { getApplicationCivilDateParts } from '$features/persons/person.utils';

const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * Today in the site's calendar (Europe/Paris), as the dates of a passage are
 * kept: a passage ended on a day still counts until that evening, wherever
 * the server runs.
 */
export const passageToday = (now: Date = new Date()): string => {
  const parts = getApplicationCivilDateParts(now);

  return parts
    ? `${String(parts.year)}-${pad(parts.month)}-${pad(parts.day)}`
    : now.toISOString().slice(0, 10);
};

/** A calendar day as the `DATE` columns of the passages are compared. */
export const asPassageDay = (day: string): Date =>
  new Date(`${day}T00:00:00.000Z`);

/**
 * A passage under way on a day: begun, and not ended, an end on that very
 * day still counting. Whether a person is in the structure is exactly this,
 * in a team or in the structure itself (9 November 2026).
 */
export const currentPassageWhere = (
  day: string,
): Prisma.PersonPassageWhereInput => ({
  OR: [{ endOn: null }, { endOn: { gte: asPassageDay(day) } }],
  startOn: { lte: asPassageDay(day) },
});
