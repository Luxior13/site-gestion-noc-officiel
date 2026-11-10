import { DEFAULT_APPLICATION_TIME_ZONE } from '$constants/time.constants';
import { normalizeSearchText } from '$utils/search-text.utils';

const COMBINING_MARKS_PATTERN = /[\u0300-\u036f]/g;

/**
 * The ID of an account that never changes when its owner renames (owner,
 * 10 November 2026: « ok go »), for a platform that shows one: Discord (17 to
 * 20 digits) and Steam (its SteamID64). Kept as the profile link, so the
 * uniqueness per record and the duplicate warning on another record keep
 * working on it.
 */
export type AccountIdRule = Readonly<{
  /** When neither the name nor the ID is given. */
  emptyMessage: string;
  error: string;
  /** Where to find it, under the field. */
  hint: string;
  label: string;
  pattern: RegExp;
  placeholder: string;
  prefix: string;
}>;

const ACCOUNT_ID_RULES: ReadonlyMap<string, AccountIdRule> = new Map([
  [
    'discord',
    {
      emptyMessage: 'Renseignez le nom d’utilisateur ou l’ID du compte',
      error: 'L’ID d’un compte Discord compte 17 à 20 chiffres',
      hint: 'Renseignez au moins le nom d’utilisateur ou l’ID du compte. L’ID ne change jamais, même quand le nom change : dans Discord, Paramètres › Avancés › Mode développeur, puis clic droit sur le profil › Copier l’identifiant de l’utilisateur.',
      label: 'ID du compte',
      pattern: /^\d{17,20}$/,
      placeholder: 'Ex. 123456789012345678',
      prefix: 'https://discord.com/users/',
    },
  ],
  [
    'steam',
    {
      emptyMessage: 'Renseignez le nom du compte ou l’ID Steam',
      error: 'L’ID Steam compte 17 chiffres et commence par 7656119',
      hint: 'Renseignez au moins le nom du compte ou l’ID Steam. L’ID ne change jamais, même quand le nom change : dans Steam, menu du compte › Détails du compte, sous le nom.',
      label: 'ID Steam',
      pattern: /^7656119\d{10}$/,
      placeholder: 'Ex. 76561198000000000',
      prefix: 'https://steamcommunity.com/profiles/',
    },
  ],
]);

export const accountIdRule = (networkKey: string): AccountIdRule | null =>
  ACCOUNT_ID_RULES.get(networkKey) ?? null;

/** The ID of a stored profile link, or nothing for another link. */
export const accountIdFromUrl = (
  networkKey: string,
  url: string | null | undefined,
): string | null => {
  const rule = accountIdRule(networkKey);
  if (!rule || !url?.startsWith(rule.prefix)) return null;
  const id = url.slice(rule.prefix.length);

  return rule.pattern.test(id) ? id : null;
};

/** What the ID field shows for a stored link, even an unfinished one. */
export const accountIdInput = (networkKey: string, url: string): string => {
  const rule = accountIdRule(networkKey);

  return rule && url.startsWith(rule.prefix)
    ? url.slice(rule.prefix.length)
    : url;
};

/** The link to store for what was typed: an ID, or a pasted profile link. */
export const accountUrlFromInput = (
  networkKey: string,
  value: string,
): string => {
  const rule = accountIdRule(networkKey);
  const typed = value.replace(/\s+/g, '');
  if (!rule || !typed) return typed;

  return typed.startsWith(rule.prefix) ? typed : `${rule.prefix}${typed}`;
};

/** The profile links a bare ID may stand for, to find it in a search. */
export const accountUrlsForId = (value: string): string[] =>
  [...ACCOUNT_ID_RULES.values()]
    .filter((rule) => rule.pattern.test(value))
    .map((rule) => `${rule.prefix}${value}`);
const SPACE_PATTERN = /\s+/g;
const APPLICATION_CIVIL_TIME_ZONE = DEFAULT_APPLICATION_TIME_ZONE;

const APPLICATION_DATE_PARTS_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  day: 'numeric',
  month: 'numeric',
  timeZone: APPLICATION_CIVIL_TIME_ZONE,
  year: 'numeric',
});

export const getApplicationCivilDateParts = (
  now = new Date(),
): Readonly<{ day: number; month: number; year: number }> | null => {
  const parts = Object.fromEntries(
    APPLICATION_DATE_PARTS_FORMATTER.formatToParts(now)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
  const year = parts.year;
  const month = parts.month;
  const day = parts.day;

  return year && month && day ? { day, month, year } : null;
};

// Former form, kept for names made only of symbols (« -_- »): they stay
// non-empty and searchable as typed.
const foldPersonSymbols = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(COMBINING_MARKS_PATTERN, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
    .replace(SPACE_PATTERN, ' ');

/**
 * Search form of a name, stored in the normalized columns and applied to the
 * query: the site-wide rule (audit RL-03, 31 October 2026). Persisted columns
 * and incoming queries must always use the same algorithm; the migration
 * 20261031140000_shared_search_text recomputed the stored forms.
 */
export const normalizePersonSearchValue = (value: string): string =>
  normalizeSearchText(value) || foldPersonSymbols(value);

export const normalizePersonEmail = (value: string): string =>
  value.trim().toLocaleLowerCase('en-US');

export const normalizePersonSocialIdentifier = (value: string): string =>
  value.trim().toLocaleLowerCase('en-US');

export const normalizePersonSocialUrl = (value: string): string => {
  const url = new URL(value.trim());
  if (
    (url.protocol !== 'https:' && url.protocol !== 'http:') ||
    url.username ||
    url.password
  ) {
    throw new TypeError('Unsupported social profile URL');
  }
  url.hash = '';
  url.hostname = url.hostname.toLocaleLowerCase('en-US');
  url.protocol = url.protocol.toLocaleLowerCase('en-US');

  if (
    (url.protocol === 'https:' && url.port === '443') ||
    (url.protocol === 'http:' && url.port === '80')
  ) {
    url.port = '';
  }

  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '');

  const sortedParams = [...url.searchParams.entries()].sort(
    ([leftKey, left], [rightKey, right]) =>
      leftKey === rightKey
        ? left.localeCompare(right)
        : leftKey.localeCompare(rightKey),
  );
  url.search = '';
  for (const [key, item] of sortedParams) url.searchParams.append(key, item);

  return url.toString();
};

export const serializeCivilDate = (value: Date | null): string | null =>
  value ? value.toISOString().slice(0, 10) : null;

export const parseCivilDate = (value: string | null): Date | null =>
  value ? new Date(`${value}T00:00:00.000Z`) : null;

export const calculateCivilAge = (
  birthDate: string | null,
  now = new Date(),
): number | null => {
  if (!birthDate) return null;
  const [year, month, day] = birthDate.split('-').map(Number);
  if (!year || !month || !day) return null;

  const current = getApplicationCivilDateParts(now);
  if (!current) return null;

  let age = current.year - year;
  const birthdayHasPassed =
    current.month > month || (current.month === month && current.day >= day);
  if (!birthdayHasPassed) age -= 1;

  return age;
};
