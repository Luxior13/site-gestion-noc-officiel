import { getSearchWords, normalizeSearchText } from '$utils/search-text.utils';

// One visible name for the protected account (audit DRT-05, 25 October 2026).
export const PROTECTED_USER_PUBLIC_FIRST_NAME = 'Superadmin';
export const PROTECTED_USER_PUBLIC_LAST_NAME = '';
export const PROTECTED_USER_PUBLIC_DISPLAY_NAME = 'Superadmin';
export const PROTECTED_USER_MASKED_LOGIN_NAME = '••••••••';

const PROTECTED_USER_PUBLIC_SEARCH_TERMS = [
  PROTECTED_USER_PUBLIC_DISPLAY_NAME,
  // Former names, still typed by people looking for this account.
  'superadministrateur',
  'compte racine',
  'compte protege',
] as const;

export const matchesProtectedUserPublicIdentity = (search: string): boolean => {
  const words = getSearchWords(search);

  if (words.length === 0) return false;

  return PROTECTED_USER_PUBLIC_SEARCH_TERMS.some((term) => {
    const identity = normalizeSearchText(term);

    return words.every((word) => identity.includes(word));
  });
};
