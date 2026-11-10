import 'server-only';

import { Prisma } from '@prisma/client';

import { accountUrlsForId } from '../person.utils';
import {
  hashPersonNormalizedUrl,
  normalizePersonEmail,
  normalizePersonSearchValue,
  normalizePersonSocialIdentifier,
  normalizePersonSocialUrl,
} from './person-normalization';

const escapeLikePattern = (value: string): string =>
  value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');

export type PersonSearchFragments = {
  contactSearchClause: Prisma.Sql;
  /**
   * The other pseudo that matched, when the name itself did not (10 November
   * 2026): the list says « Autre pseudo : X » under the name.
   */
  matchedOtherNicknameSelect: Prisma.Sql;
  normalizedQuery: string;
  searchClause: Prisma.Sql;
};

export const buildPersonSearchFragments = (
  rawQuery: string,
  includeContacts = true,
): PersonSearchFragments => {
  const normalizedQuery = normalizePersonSearchValue(rawQuery);
  const normalizedEmailQuery = normalizePersonEmail(rawQuery);
  const normalizedIdentifierQuery = normalizePersonSocialIdentifier(rawQuery);
  const normalizedPhoneQuery = rawQuery.trim().replace(/[^\d+]/g, '');
  const profileUrls: string[] = [];
  try {
    const candidateProfileUrl = normalizePersonSocialUrl(rawQuery);
    const protocol = new URL(candidateProfileUrl).protocol;
    if (protocol === 'http:' || protocol === 'https:') {
      profileUrls.push(candidateProfileUrl);
    }
  } catch {
    // Most terms are not URLs. Valid absolute HTTP(S) URLs alone use the
    // exact hash lookup; they still participate in identity search.
  }
  // An account ID alone (Discord, Steam) finds the profile it identifies.
  if (profileUrls.length === 0) {
    profileUrls.push(
      ...accountUrlsForId(rawQuery.trim()).map(normalizePersonSocialUrl),
    );
  }

  const escapedQuery = escapeLikePattern(normalizedQuery);
  const identityPrefixPattern = `${escapedQuery}%`;
  const identityTrigramPattern = `%${escapedQuery}%`;
  const emailPrefixPattern = `${escapeLikePattern(normalizedEmailQuery)}%`;
  const identifierPrefixPattern = `${escapeLikePattern(normalizedIdentifierQuery)}%`;
  const phonePrefixPattern = `${escapeLikePattern(normalizedPhoneQuery)}%`;
  const identityTrigramClause =
    normalizedQuery.length >= 3
      ? Prisma.sql`
          OR p."normalizedNickname" LIKE ${identityTrigramPattern} ESCAPE '\\'
          OR p."normalizedFirstName" LIKE ${identityTrigramPattern} ESCAPE '\\'
          OR p."normalizedLastName" LIKE ${identityTrigramPattern} ESCAPE '\\'
        `
      : Prisma.empty;
  const phoneSearchClause = normalizedPhoneQuery
    ? Prisma.sql`OR EXISTS (
          SELECT 1 FROM "PersonPhone" phone
          WHERE phone."personId" = p."id"
            AND (
              phone."normalizedPhone" = ${normalizedPhoneQuery}
              OR phone."normalizedPhone" LIKE ${phonePrefixPattern} ESCAPE '\\'
            )
        )`
    : Prisma.empty;
  const profileUrlSearchClause =
    profileUrls.length > 0
      ? Prisma.sql`OR EXISTS (
          SELECT 1 FROM "PersonSocialProfile" social_url
          WHERE social_url."personId" = p."id"
            AND (${Prisma.join(
              profileUrls.map(
                (url) => Prisma.sql`(
              social_url."normalizedProfileUrlHash" = ${hashPersonNormalizedUrl(url)}
              AND social_url."normalizedProfileUrl" = ${url}
            )`,
              ),
              ' OR ',
            )})
        )`
      : Prisma.empty;
  const contactSearchClause = includeContacts
    ? Prisma.sql`
        EXISTS (
          SELECT 1 FROM "PersonEmail" email
          WHERE email."personId" = p."id"
            AND (
              email."normalizedEmail" = ${normalizedEmailQuery}
              OR email."normalizedEmail" LIKE ${emailPrefixPattern} ESCAPE '\\'
            )
        )
        ${phoneSearchClause}
        OR EXISTS (
          SELECT 1 FROM "PersonSocialProfile" social
          WHERE social."personId" = p."id"
            AND (
              social."normalizedIdentifier" = ${normalizedIdentifierQuery}
              OR social."normalizedIdentifier" LIKE ${identifierPrefixPattern} ESCAPE '\\'
            )
        )
        ${profileUrlSearchClause}
  `
    : Prisma.sql`FALSE`;
  // Every identity word must match this person; contact queries stay intact.
  const words = [...new Set(normalizedQuery.split(/\s+/u).filter(Boolean))];
  const multiwordIdentityClause =
    words.length > 1
      ? Prisma.sql`OR (${Prisma.join(
          words.map((word) => {
            const prefix = `${escapeLikePattern(word)}%`;
            const contains = `%${escapeLikePattern(word)}%`;

            return Prisma.sql`(
          p."normalizedNickname" LIKE ${prefix} ESCAPE '\\'
          OR p."normalizedFirstName" LIKE ${prefix} ESCAPE '\\'
          OR p."normalizedLastName" LIKE ${prefix} ESCAPE '\\'
          ${
            word.length >= 3
              ? Prisma.sql`
            OR p."normalizedNickname" LIKE ${contains} ESCAPE '\\'
            OR p."normalizedFirstName" LIKE ${contains} ESCAPE '\\'
            OR p."normalizedLastName" LIKE ${contains} ESCAPE '\\'
          `
              : Prisma.empty
          }
        )`;
          }),
          ' AND ',
        )})`
      : Prisma.empty;
  const identityClause = Prisma.sql`(
        p."normalizedNickname" = ${normalizedQuery}
        OR p."normalizedFirstName" = ${normalizedQuery}
        OR p."normalizedLastName" = ${normalizedQuery}
        OR p."normalizedNickname" LIKE ${identityPrefixPattern} ESCAPE '\\'
        OR p."normalizedFirstName" LIKE ${identityPrefixPattern} ESCAPE '\\'
        OR p."normalizedLastName" LIKE ${identityPrefixPattern} ESCAPE '\\'
        ${identityTrigramClause}
        ${multiwordIdentityClause}
      )`;
  // Another pseudo, as the main one: exact, prefix, or inside from 3 letters.
  const otherNicknameMatch = Prisma.sql`other."personId" = p."id"
          AND (
            other."normalizedNickname" = ${normalizedQuery}
            OR other."normalizedNickname" LIKE ${identityPrefixPattern} ESCAPE '\\'
            ${
              normalizedQuery.length >= 3
                ? Prisma.sql`OR other."normalizedNickname" LIKE ${identityTrigramPattern} ESCAPE '\\'`
                : Prisma.empty
            }
          )`;
  // With the coordinates' right only, as the En ligne tab (10 November 2026).
  const otherNicknameClause = includeContacts
    ? Prisma.sql`OR EXISTS (
          SELECT 1 FROM "PersonOtherNickname" other
          WHERE ${otherNicknameMatch}
        )`
    : Prisma.empty;
  const searchClause = normalizedQuery
    ? Prisma.sql`AND (
        ${identityClause}
        ${otherNicknameClause}
        OR ${contactSearchClause}
      )`
    : Prisma.empty;
  const matchedOtherNicknameSelect =
    normalizedQuery && includeContacts
      ? Prisma.sql`CASE WHEN ${identityClause} THEN NULL ELSE (
        SELECT other."nickname" FROM "PersonOtherNickname" other
        WHERE ${otherNicknameMatch}
        ORDER BY other."normalizedNickname" ASC, other."id" ASC
        LIMIT 1
      ) END`
      : Prisma.sql`NULL`;

  return {
    contactSearchClause,
    matchedOtherNicknameSelect,
    normalizedQuery,
    searchClause,
  };
};
