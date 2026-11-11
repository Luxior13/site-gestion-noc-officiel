/**
 * Amounts of the treasury (10 November 2026): euros only, stored as whole
 * cents so that no sum ever drifts. Ten million euros either way at most.
 */
export const MAX_AMOUNT_CENTS = 1_000_000_000;

const EUROS = new Intl.NumberFormat('fr-FR', {
  currency: 'EUR',
  style: 'currency',
});

/** « 1 234,56 € », « −50,00 € ». */
export const formatEuros = (cents: number): string => EUROS.format(cents / 100);

// Bounded: a sign, at most eight digits, then at most two decimals.
// eslint-disable-next-line security/detect-unsafe-regex
const AMOUNT = /^(-)?(\d{1,8})(?:[.,](\d{1,2}))?$/u;

/**
 * What a person types, « 1 234,56 », « -50 », « 12.5 € », as cents; null
 * when it is not an amount with at most two decimals. Spaces of any kind
 * (thousands, no-break) and the euro sign are ignored; « − » reads as « - ».
 */
export const parseEuroAmount = (text: string): number | null => {
  const match = AMOUNT.exec(
    text.replace(/[\s€]/gu, '').replace(/^\u2212/u, '-'),
  );
  if (!match) return null;
  const [, sign, euros = '0', decimals = ''] = match;
  const cents = Number(euros) * 100 + Number(decimals.padEnd(2, '0'));

  return sign ? -cents : cents;
};

const GROUPED = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

/**
 * Cents as they are typed back in a field, thousands spaced with a plain
 * space: « 1 234,56 », « -50 ».
 */
export const centsToInput = (cents: number): string => {
  const sign = cents < 0 ? '-' : '';
  const absolute = Math.abs(cents);
  const euros = GROUPED.format(Math.trunc(absolute / 100)).replace(/\s/gu, ' ');
  const rest = absolute % 100;

  return `${sign}${euros}${rest ? `,${String(rest).padStart(2, '0')}` : ''}`;
};
