import { compareRank } from '$utils/active-order.utils';

/*
 * The lists of the treasury, kept on the site in the tabs of the Comptes
 * page (11 November 2026): the categories, money received and money paid in
 * a block each, and the payment methods. Ranked by hand within a block, as
 * the functions are; an inactive value stays choosable for an old operation.
 */

export const TREASURY_CHOICE_KINDS = [
  'INCOME_CATEGORY',
  'EXPENSE_CATEGORY',
  'PAYMENT_METHOD',
] as const;
export type TreasuryChoiceKind = (typeof TREASURY_CHOICE_KINDS)[number];

export type TreasuryList = 'categories' | 'payment-methods';

export const TREASURY_LIST_KINDS: Readonly<
  Record<TreasuryList, readonly TreasuryChoiceKind[]>
> = {
  categories: ['INCOME_CATEGORY', 'EXPENSE_CATEGORY'],
  'payment-methods': ['PAYMENT_METHOD'],
};

/** The address of a list in the API. */
export const TREASURY_LIST_SLUGS: Readonly<Record<TreasuryList, string>> = {
  categories: 'categories',
  'payment-methods': 'moyens-de-paiement',
};

export const treasuryListOfSlug = (slug: string): TreasuryList | null =>
  slug === 'categories'
    ? 'categories'
    : slug === 'moyens-de-paiement'
      ? 'payment-methods'
      : null;

/** The heading of a block of the list. */
export const TREASURY_CHOICE_GROUP_LABELS: Readonly<
  Record<TreasuryChoiceKind, string>
> = {
  EXPENSE_CATEGORY: 'Sorties',
  INCOME_CATEGORY: 'Entrées',
  PAYMENT_METHOD: 'Moyens de paiement',
};

/** What the journal calls a value of each kind. */
export const TREASURY_CHOICE_KIND_LABELS: Readonly<
  Record<TreasuryChoiceKind, string>
> = {
  EXPENSE_CATEGORY: 'Catégorie de sortie',
  INCOME_CATEGORY: 'Catégorie d’entrée',
  PAYMENT_METHOD: 'Moyen de paiement',
};

export const TREASURY_CHOICE_NAME_MAX_LENGTH = 60;

/**
 * Offered in one click while a list is empty, then kept or changed like the
 * others (owner, « ok go » on the example of 11 November 2026).
 */
export const COMMON_TREASURY_CHOICES: Readonly<
  Record<
    TreasuryList,
    readonly Readonly<{ kind: TreasuryChoiceKind; name: string }>[]
  >
> = {
  categories: [
    { kind: 'INCOME_CATEGORY', name: 'Cotisations' },
    { kind: 'INCOME_CATEGORY', name: 'Sponsoring' },
    { kind: 'INCOME_CATEGORY', name: 'Dons' },
    { kind: 'INCOME_CATEGORY', name: 'Subventions' },
    { kind: 'INCOME_CATEGORY', name: 'Gains de tournois' },
    { kind: 'INCOME_CATEGORY', name: 'Ventes' },
    { kind: 'EXPENSE_CATEGORY', name: 'Inscriptions aux tournois' },
    { kind: 'EXPENSE_CATEGORY', name: 'Matériel' },
    { kind: 'EXPENSE_CATEGORY', name: 'Déplacements' },
    { kind: 'EXPENSE_CATEGORY', name: 'Gains reversés aux joueurs' },
    { kind: 'EXPENSE_CATEGORY', name: 'Services et abonnements' },
    { kind: 'EXPENSE_CATEGORY', name: 'Frais bancaires' },
  ],
  'payment-methods': [
    { kind: 'PAYMENT_METHOD', name: 'Virement' },
    { kind: 'PAYMENT_METHOD', name: 'Carte' },
    { kind: 'PAYMENT_METHOD', name: 'Espèces' },
    { kind: 'PAYMENT_METHOD', name: 'Chèque' },
    { kind: 'PAYMENT_METHOD', name: 'PayPal' },
    { kind: 'PAYMENT_METHOD', name: 'Prélèvement' },
  ],
};

type Sortable = Readonly<{
  isActive: boolean;
  kind: TreasuryChoiceKind;
  name: string;
  position: number;
}>;

/** Money received first, then paid; each block in its dragged order. */
export const compareTreasuryChoices = (
  left: Sortable,
  right: Sortable,
): number =>
  TREASURY_CHOICE_KINDS.indexOf(left.kind) -
    TREASURY_CHOICE_KINDS.indexOf(right.kind) || compareRank(left, right);
