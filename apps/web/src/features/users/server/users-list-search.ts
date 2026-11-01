import { Prisma } from '@prisma/client';

import { matchesProtectedUserPublicIdentity } from '$constants/protected-user.constants';
import { getSearchWords, normalizeSearchText } from '$utils/search-text.utils';

// The site-wide search form (`public.search_text`, mirror of
// normalizeSearchText). These exact expressions back the trigram indexes of
// the 20261031140000_shared_search_text migration: change both together.
const IDENTITY_SEARCH_TEXT = Prisma.sql`search_text(COALESCE("loginName", '') || ' ' || COALESCE("firstName", '') || ' ' || COALESCE("lastName", ''))`;
const CONTACT_SEARCH_TEXT = Prisma.sql`search_text("contactEmail")`;

const escapeUserSearchLikePattern = (value: string): string =>
  value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');

const contains = (expression: Prisma.Sql, value: string): Prisma.Sql =>
  Prisma.sql`${expression} LIKE ${'%' + escapeUserSearchLikePattern(value) + '%'} ESCAPE '\\'`;

export const buildUserSearchPredicate = (
  search: string,
  options: { canViewContact: boolean; isProtected: boolean },
): Prisma.Sql => {
  const query = search.trim().slice(0, 100);
  const words = getSearchWords(query);
  // Every identity word, in any order, in the login name or the names. The
  // contact address is matched on the whole query, so fragments cannot be
  // combined with a hidden address. Punctuation alone filters nothing.
  const fields =
    words.length === 0
      ? Prisma.sql`TRUE`
      : Prisma.sql`((${Prisma.join(
          words.map((word) => contains(IDENTITY_SEARCH_TEXT, word)),
          ' AND ',
        )})${options.canViewContact ? Prisma.sql` OR ${contains(CONTACT_SEARCH_TEXT, normalizeSearchText(query))}` : Prisma.empty})`;
  const includeProtected =
    !options.isProtected && matchesProtectedUserPublicIdentity(search);
  const visible = options.isProtected
    ? fields
    : Prisma.sql`(("isProtected" = false AND ${fields})${includeProtected ? Prisma.sql` OR "isProtected" = true` : Prisma.empty})`;

  return visible;
};

export const buildUserSearchQuery = (
  search: string,
  options: { canViewContact: boolean; isProtected: boolean },
): Prisma.Sql =>
  Prisma.sql`SELECT "id" FROM "User" WHERE "deletedAt" IS NULL AND ${buildUserSearchPredicate(search, options)}`;
