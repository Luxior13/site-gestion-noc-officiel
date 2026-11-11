import { z } from 'zod';

import {
  APPROXIMATE_DATE_FIRST_YEAR,
  APPROXIMATE_DATE_LAST_YEAR,
  parseDateOnly,
} from '$utils/approximate-date.utils';
import { MAX_AMOUNT_CENTS } from '$utils/money.utils';
import { requiredNameSchema } from '$utils/zod.utils';

import {
  ACCOUNT_NAME_MAX_LENGTH,
  FINANCIAL_ACCOUNT_KINDS,
  type FinancialAccountKind,
  INSTITUTION_MAX_LENGTH,
} from '../financial-account.constants';

/** A real day of the calendar: balances are known to the day. */
const daySchema = z.string().superRefine((value, context) => {
  const parts = parseDateOnly(value);
  if (!parts) {
    context.addIssue({ code: 'custom', message: 'Date invalide' });

    return;
  }
  if (
    parts.year < APPROXIMATE_DATE_FIRST_YEAR ||
    parts.year > APPROXIMATE_DATE_LAST_YEAR
  )
    context.addIssue({
      code: 'custom',
      message: `L’année doit être comprise entre ${APPROXIMATE_DATE_FIRST_YEAR} et ${APPROXIMATE_DATE_LAST_YEAR}`,
    });
});

const institutionSchema = z
  .string()
  .max(INSTITUTION_MAX_LENGTH * 2)
  .nullable()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim() ?? '';

    return trimmed.length > 0 ? trimmed : null;
  })
  .pipe(
    z
      .string()
      .max(
        INSTITUTION_MAX_LENGTH,
        `${INSTITUTION_MAX_LENGTH} caractères au maximum`,
      )
      .nullable(),
  );

const accountFields = {
  institution: institutionSchema,
  kind: z.enum(FINANCIAL_ACCOUNT_KINDS),
  name: requiredNameSchema(ACCOUNT_NAME_MAX_LENGTH),
  openingBalanceCents: z
    .number()
    .int('Le montant compte au plus deux décimales')
    .min(-MAX_AMOUNT_CENTS, 'Montant trop élevé')
    .max(MAX_AMOUNT_CENTS, 'Montant trop élevé'),
  openingOn: daySchema,
};

type AccountShape = Readonly<{
  institution: string | null;
  kind: FinancialAccountKind;
  openingBalanceCents: number;
}>;

/** A cash box has no bank behind it and is never below zero. */
const checkCash = (value: AccountShape, context: z.RefinementCtx): void => {
  if (value.kind === 'CASH' && value.openingBalanceCents < 0)
    context.addIssue({
      code: 'custom',
      message: 'Une caisse ne peut pas être en dessous de zéro',
      path: ['openingBalanceCents'],
    });
};

const withoutCashInstitution = <Value extends AccountShape>(
  value: Value,
): Value => (value.kind === 'CASH' ? { ...value, institution: null } : value);

export const createFinancialAccountSchema = z
  .object({
    ...accountFields,
    entityId: z.string().min(1).max(128).nullable(),
  })
  .strict()
  .superRefine(checkCash)
  .transform(withoutCashInstitution);

export const updateFinancialAccountSchema = z
  .object({
    ...accountFields,
    closedOn: daySchema.nullable(),
    expectedVersion: z.number().int().min(1),
  })
  .strict()
  .superRefine((value, context) => {
    checkCash(value, context);
    if (value.closedOn && value.closedOn < value.openingOn)
      context.addIssue({
        code: 'custom',
        message: 'La clôture ne peut pas précéder le solde de départ',
        path: ['closedOn'],
      });
  })
  .transform(withoutCashInstitution);

export const deleteFinancialAccountSchema = z
  .object({ expectedVersion: z.number().int().min(1) })
  .strict();

export const financialAccountIdSchema = z.string().min(1).max(128);
