import type {
  OperationAssignment,
  OperationItem,
} from './types/operation.types';

/** « Cotisation 2026 Kaiz », or « Virement : Compte courant → PayPal ». */
export const operationTitle = (item: OperationItem): string =>
  item.label ??
  `Virement : ${item.account.name} → ${item.toAccount?.name ?? 'compte'}`;

/**
 * The title of a line, beside its account column: a transfer says only
 * « Virement » there, and its way from one account, « Virement vers
 * PayPal » or « Virement depuis Compte courant ».
 */
export const operationLineTitle = (
  item: OperationItem,
  accountId?: string,
): string => {
  if (item.kind !== 'TRANSFER') return item.label ?? '';
  if (!accountId) return 'Virement';

  return item.account.id === accountId
    ? `Virement vers ${item.toAccount?.name ?? 'un compte'}`
    : `Virement depuis ${item.account.name}`;
};

/** « Noctambule Academy (Valorant) », « Valorant (tout le jeu) ». */
export const assignmentLabel = (assignment: OperationAssignment): string =>
  assignment.kind === 'team'
    ? `${assignment.name} (${assignment.gameName ?? ''})`
    : `${assignment.name} (tout le jeu)`;

/** Who paid or was paid; a hidden record is said without its name. */
export const counterpartyLabel = (item: OperationItem): string | null =>
  item.organization?.name ??
  item.person?.displayName ??
  (item.personLinked ? 'Une fiche du Répertoire' : null);

/** « Matériel · LDLC · Noctambule Academy (Valorant) · Lyon e-Sport 2027 ». */
export const operationDetails = (item: OperationItem): string =>
  [
    item.category?.name,
    counterpartyLabel(item),
    item.assignment ? assignmentLabel(item.assignment) : null,
    item.tournament?.name,
  ]
    .filter(Boolean)
    .join(' · ');

export type SignedAmount = Readonly<{
  /** Green for money received only (owner, 11 November 2026). */
  income: boolean;
  sign: '' | '+' | '−';
}>;

/**
 * The sign of an amount, as the structure sees it: money received « + »,
 * paid « − ». Seen from one account, a transfer is « + » in and « − » out;
 * from the whole structure, it has no sign. The colour never says it alone.
 */
export const signedAmount = (
  item: Pick<OperationItem, 'account' | 'kind' | 'toAccount'>,
  accountId?: string,
): SignedAmount => {
  if (item.kind === 'INCOME') return { income: true, sign: '+' };
  if (item.kind === 'EXPENSE') return { income: false, sign: '−' };
  if (accountId && item.toAccount?.id === accountId)
    return { income: false, sign: '+' };
  if (accountId && item.account.id === accountId)
    return { income: false, sign: '−' };

  return { income: false, sign: '' };
};
