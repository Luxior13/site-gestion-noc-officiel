/**
 * One comparison rule for every search of the site (audit RL, 31 October
 * 2026): accents, case, letters such as « œ » or « ø », apostrophes, dashes
 * and other punctuation. The SQL function `public.search_text` applies the
 * same rule to stored names (users, activity journal); the activity journal
 * PostgreSQL suite compares both character by character, so any change here
 * needs a migration that redefines that function.
 */

// Diacritics left by the NFKD decomposition (Latin, Greek, Cyrillic), each
// removed on its own.
const COMBINING_MARKS =
  // eslint-disable-next-line no-misleading-character-class
  /[\u0300-\u036f\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff\ufe00-\ufe0f\ufe20-\ufe2f]/gu;

// Letters the decomposition keeps whole, read as their usual Latin spelling.
const LETTERS: Readonly<Record<string, string>> = {
  ß: 'ss',
  æ: 'ae',
  ð: 'd',
  ø: 'o',
  þ: 'th',
  đ: 'd',
  ħ: 'h',
  ı: 'i',
  ł: 'l',
  œ: 'oe',
  ŧ: 't',
  // Greek final sigma: « ΟΔΟΣ » and « οδος » stay the same word.
  ς: 'σ',
};
// The keys of LETTERS.
const LETTER_PATTERN = /[ßæðøþđħıłœŧς]/gu;

// Punctuation, symbols and spaces, read as word breaks. Letters and digits of
// every script are kept, including « 々 » in Japanese names.
const SEPARATORS =
  // A single character class, matched in linear time.
  // eslint-disable-next-line security/detect-unsafe-regex
  /[\t\n\v\f\r\u0020-\u002f\u003a-\u0040\u005b-\u0060\u007b-\u00bf\u00d7\u00f7\u02b9-\u02bf\u1680\u2000-\u2bff\u3000-\u3004\u3008-\u3020\ufeff\u{1f000}-\u{1faff}]/gu;

export const normalizeSearchText = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLocaleLowerCase('fr-FR')
    // The pattern only matches the keys of LETTERS.
    // eslint-disable-next-line security/detect-object-injection
    .replace(LETTER_PATTERN, (letter) => LETTERS[letter] ?? letter)
    .replace(SEPARATORS, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();

/** Distinct words of a search, each to be found in any order. */
export const getSearchWords = (value: string): string[] => [
  ...new Set(normalizeSearchText(value).split(' ').filter(Boolean)),
];

// Short French words that carry no meaning in a search (« mot de passe »).
const IGNORED_SEARCH_WORDS = new Set([
  'a',
  'au',
  'aux',
  'd',
  'de',
  'des',
  'du',
  'en',
  'et',
  'l',
  'la',
  'le',
  'les',
  'sa',
  'ses',
  'son',
  'un',
  'une',
]);

/** « utilisateurs » finds « utilisateur », and the reverse. */
const toSingular = (word: string): string =>
  word.length > 3 && /[sx]$/u.test(word) ? word.slice(0, -1) : word;

/**
 * Words of a search over a local catalog (permissions, roadmap): without
 * filler words and reduced to the singular (decision of 26 October 2026).
 * Empty when nothing meaningful was typed.
 */
export const getSearchTerms = (value: string): string[] =>
  getSearchWords(value)
    .filter((word) => !IGNORED_SEARCH_WORDS.has(word))
    .map(toSingular);

/** Every term appears in the text, in any order. */
export const includesSearchTerms = (
  text: string,
  terms: readonly string[],
): boolean => {
  const normalized = normalizeSearchText(text);

  return terms.every((term) => normalized.includes(term));
};
