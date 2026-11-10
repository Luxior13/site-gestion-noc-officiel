/**
 * Countries a nationality is chosen from (10 November 2026): the ISO 3166-1
 * alpha-2 codes, plus Kosovo (« XK », in common use), less the uninhabited
 * territories. Kept apart from the phone library, so the Identité tab and
 * the creation form stay light (audit of 31 October 2026, AC-49).
 */
// One string, split once: a list of 245 codes stays readable.
const COUNTRY_CODES: readonly string[] = [
  'AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH',
  'BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL',
  'CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES',
  'ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT',
  'GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP',
  'KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY',
  'MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY',
  'MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM',
  'PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK',
  'SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO',
  'TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT',
  'ZA ZM ZW',
]
  .join(' ')
  .split(' ');

const KNOWN_COUNTRIES: ReadonlySet<string> = new Set(COUNTRY_CODES);

const regionNames = new Intl.DisplayNames(['fr'], { type: 'region' });

export const isKnownCountry = (code: string): boolean =>
  KNOWN_COUNTRIES.has(code);

/** « France » for « FR »; an unknown code is shown as it is. */
export const countryName = (code: string): string =>
  (isKnownCountry(code) ? regionNames.of(code) : undefined) ?? code;

/** France first, as for a phone number, then by name. */
export const COUNTRY_OPTIONS: ReadonlyArray<
  Readonly<{ label: string; value: string }>
> = COUNTRY_CODES.map((code) => ({
  label: countryName(code),
  value: code,
})).sort((left, right) => {
  if (left.value === 'FR') return -1;
  if (right.value === 'FR') return 1;

  return left.label.localeCompare(right.label, 'fr');
});
