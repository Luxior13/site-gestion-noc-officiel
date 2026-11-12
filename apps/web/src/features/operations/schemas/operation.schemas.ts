import { z } from 'zod';

import { daySchema } from '$features/financial-accounts/schemas/financial-account.schemas';
import { MAX_AMOUNT_CENTS } from '$utils/money.utils';

import {
  OPERATION_KIND_SLUGS,
  OPERATION_KINDS,
  OPERATION_LABEL_MAX_LENGTH,
  OPERATION_NOTE_MAX_LENGTH,
  type OperationKind,
} from '../operation.constants';

/** A trimmed optional text: blank means none. */
const optionalText = (
  max: number,
): z.ZodType<string | null, string | null | undefined> =>
  z
    .string()
    .max(max * 2)
    .nullable()
    .optional()
    .transform((value) => {
      const trimmed = value?.trim() ?? '';

      return trimmed.length > 0 ? trimmed : null;
    })
    .pipe(z.string().max(max, `${max} caractères au maximum`).nullable());

const id = z.string().min(1).max(128);
const optionalId = id.nullable();

/** Tomorrow in UTC: no time zone of the site is ahead of it. */
const latestDay = (): string =>
  new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

const fields = {
  accountId: id,
  amountCents: z
    .number()
    .int('Le montant compte au plus deux décimales')
    .min(1, 'Le montant est supérieur à zéro')
    .max(MAX_AMOUNT_CENTS, 'Dix millions d’euros au plus'),
  categoryId: optionalId,
  gameId: optionalId,
  kind: z.enum(OPERATION_KINDS),
  label: optionalText(OPERATION_LABEL_MAX_LENGTH),
  note: optionalText(OPERATION_NOTE_MAX_LENGTH),
  occurredOn: daySchema,
  organizationId: optionalId,
  paymentMethodId: optionalId,
  personId: optionalId.optional(),
  teamId: optionalId,
  toAccountId: optionalId,
  tournamentId: optionalId.default(null),
};

type Shape = Readonly<{
  accountId: string;
  categoryId: string | null;
  gameId: string | null;
  kind: OperationKind;
  label: string | null;
  occurredOn: string;
  organizationId: string | null;
  personId?: string | null;
  teamId: string | null;
  toAccountId: string | null;
  tournamentId: string | null;
}>;

/**
 * Money received or paid has a label and a category; a transfer has a
 * second account. One payer or payee, one team or game, at most. An
 * operation is money already received or paid: never in the future.
 */
const checkOperation = (value: Shape, context: z.RefinementCtx): void => {
  const issue = (path: string, message: string): void =>
    context.addIssue({ code: 'custom', message, path: [path] });
  if (value.occurredOn > latestDay())
    issue(
      'occurredOn',
      'Une opération est de l’argent déjà reçu ou versé : pas de date à venir',
    );
  if (value.kind === 'TRANSFER') {
    if (!value.toAccountId)
      issue('toAccountId', 'Choisissez le compte d’arrivée');
    else if (value.toAccountId === value.accountId)
      issue('toAccountId', 'Le compte d’arrivée est un autre compte');

    return;
  }
  if (!value.label) issue('label', 'Le libellé est obligatoire');
  if (!value.categoryId) issue('categoryId', 'Choisissez une catégorie');
  if (value.organizationId && value.personId)
    issue(
      'organizationId',
      'Une organisation ou une fiche du Répertoire, pas les deux',
    );
  if (value.teamId && value.gameId)
    issue('assignment', 'Une équipe ou un jeu, pas les deux');
};

/** A transfer keeps only its accounts, its date, its amount and its note. */
const forKind = <Value extends Shape>(value: Value): Value =>
  value.kind === 'TRANSFER'
    ? {
        ...value,
        categoryId: null,
        gameId: null,
        label: null,
        organizationId: null,
        paymentMethodId: null,
        personId: null,
        teamId: null,
        tournamentId: null,
      }
    : { ...value, toAccountId: null };

export const operationSchema = z
  .object(fields)
  .strict()
  .superRefine(checkOperation)
  .transform(forKind);

export const updateOperationSchema = z
  .object({ ...fields, expectedVersion: z.number().int().min(1) })
  .strict()
  .superRefine(checkOperation)
  .transform(forKind);

export const operationVersionSchema = z
  .object({ expectedVersion: z.number().int().min(1) })
  .strict();

export const operationIdSchema = id;

const kindOfSlug = (slug: string | undefined): OperationKind | undefined =>
  // A closed list of three kinds.
  // eslint-disable-next-line security/detect-object-injection
  OPERATION_KINDS.find((kind) => OPERATION_KIND_SLUGS[kind] === slug);

/**
 * The list's query: page, kind, search, and what the operations name (an
 * account, an organisation, a team, a game or a person).
 */
export const operationQuerySchema = z
  .object({
    compte: id.optional(),
    equipe: id.optional(),
    jeu: id.optional(),
    organisation: id.optional(),
    page: z.coerce.number().int().min(1).max(10_000).default(1),
    personne: id.optional(),
    q: z.string().trim().max(120).optional(),
    sens: z.enum(['entrees', 'sorties', 'virements']).optional(),
    tournoi: id.optional(),
  })
  .transform((value) => ({
    accountId: value.compte,
    gameId: value.jeu,
    kind: kindOfSlug(value.sens),
    organizationId: value.organisation,
    page: value.page,
    personId: value.personne,
    q: value.q || undefined,
    teamId: value.equipe,
    tournamentId: value.tournoi,
  }));
