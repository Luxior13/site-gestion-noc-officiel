import 'server-only';

import { prisma } from '$server/prisma';

import { getPersonDisplayName } from '../person.ui';
import { normalizePersonSearchValue } from '../person.utils';
import type { PersonRef, PersonSuggestions } from '../types/person.types';

/** Suggestions shown under a person field (owner: « en afficher moins »). */
const SUGGESTION_LIMIT = 6;

/** The fields a record is named by. */
export const PERSON_REF_SELECT = {
  firstName: true,
  id: true,
  lastName: true,
  nickname: true,
} as const;

export const toPersonRef = (
  row: Readonly<{
    firstName: string | null;
    id: string;
    lastName: string | null;
    nickname: string | null;
  }>,
): PersonRef => ({
  displayName: getPersonDisplayName(row),
  firstName: row.firstName,
  id: row.id,
  lastName: row.lastName,
  nickname: row.nickname,
});

/**
 * Records of the Répertoire whose pseudo, first name or last name contain
 * every word typed: six at most, and whether more exist, so the field asks
 * for a closer search. The caller checks who may search: a passage's
 * managers, or who links a legal representative (10 November 2026).
 */
export const searchPersonSuggestions = async (
  query: string,
): Promise<PersonSuggestions> => {
  const terms = normalizePersonSearchValue(query).split(' ').filter(Boolean);
  if (terms.length === 0) return { more: false, persons: [] };
  const rows = await prisma.person.findMany({
    orderBy: [{ sortName: 'asc' }, { id: 'asc' }],
    select: PERSON_REF_SELECT,
    take: SUGGESTION_LIMIT + 1,
    where: {
      AND: terms.map((term) => ({
        OR: [
          { normalizedNickname: { contains: term } },
          { normalizedFirstName: { contains: term } },
          { normalizedLastName: { contains: term } },
        ],
      })),
    },
  });

  return {
    more: rows.length > SUGGESTION_LIMIT,
    persons: rows.slice(0, SUGGESTION_LIMIT).map(toPersonRef),
  };
};
