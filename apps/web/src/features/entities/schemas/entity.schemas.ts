import { z } from 'zod';

import {
  type ApproximateDate,
  approximateDateEnd,
  approximateDateSchema,
} from '$utils/approximate-date.utils';
import { requiredNameSchema } from '$utils/zod.utils';

import {
  ENTITY_NAME_MAX_LENGTH,
  HEAD_OFFICE_MAX_LENGTH,
  LEGAL_FORMS,
  type LegalForm,
  OTHER_FORM_MAX_LENGTH,
} from '../entity.constants';

/** A trimmed optional text: blank means none. */
const optionalText = (
  max: number,
  message: string,
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
    .pipe(z.string().max(max, message).nullable());

/** Spaces typed in a number (« W751 234 567 ») are dropped. */
const identifier = (
  pattern: RegExp,
  message: string,
): z.ZodType<string | null, string | null | undefined> =>
  z
    .string()
    .max(40)
    .nullable()
    .optional()
    .transform((value) => {
      const compact = (value ?? '').replace(/\s+/gu, '').toUpperCase();

      return compact.length > 0 ? compact : null;
    })
    .pipe(z.string().regex(pattern, message).nullable());

const rnaSchema = identifier(
  /^W\d{9}$/u,
  'Le numéro RNA s’écrit W suivi de 9 chiffres',
);
const siretSchema = identifier(/^\d{14}$/u, 'Le SIRET compte 14 chiffres');

type DatedForm = Readonly<{
  end: ApproximateDate | null;
  form: LegalForm;
  otherForm: string | null;
  start: ApproximateDate;
}>;

const OTHER_FORM_REQUIRED = 'Précisez la forme juridique';

/** « Autre » names its form; an end never precedes the start. */
const checkFormAndDates = (
  value: DatedForm,
  context: z.RefinementCtx,
): void => {
  if (value.form === 'OTHER' && !value.otherForm)
    context.addIssue({
      code: 'custom',
      message: OTHER_FORM_REQUIRED,
      path: ['otherForm'],
    });
  if (value.end && approximateDateEnd(value.end) < value.start.date)
    context.addIssue({
      code: 'custom',
      message: 'La fin ne peut pas précéder le début',
      path: ['end'],
    });
};

const NO_IDENTIFIER =
  'La période sans forme juridique n’a ni identifiant ni siège';

const entityFields = {
  end: approximateDateSchema.nullable(),
  form: z.enum(LEGAL_FORMS),
  name: requiredNameSchema(ENTITY_NAME_MAX_LENGTH),
  otherForm: optionalText(
    OTHER_FORM_MAX_LENGTH,
    `${OTHER_FORM_MAX_LENGTH} caractères au maximum`,
  ),
  start: approximateDateSchema,
};

/** Only « Autre » keeps the name of its form. */
const withoutStrayOtherForm = <Value extends DatedForm>(value: Value): Value =>
  value.form === 'OTHER' ? value : { ...value, otherForm: null };

export const createEntitySchema = z
  .object(entityFields)
  .strict()
  .superRefine(checkFormAndDates)
  .transform(withoutStrayOtherForm);

export const updateEntitySchema = z
  .object({
    ...entityFields,
    expectedVersion: z.number().int().min(1),
    headOffice: optionalText(
      HEAD_OFFICE_MAX_LENGTH,
      `${HEAD_OFFICE_MAX_LENGTH} caractères au maximum`,
    ),
    isPrincipal: z.boolean(),
    rnaNumber: rnaSchema,
    siretNumber: siretSchema,
  })
  .strict()
  .superRefine((value, context) => {
    checkFormAndDates(value, context);
    if (value.form !== 'NONE') return;
    for (const key of ['rnaNumber', 'siretNumber', 'headOffice'] as const)
      // Keys come from the closed list above.
      // eslint-disable-next-line security/detect-object-injection
      if (value[key])
        context.addIssue({
          code: 'custom',
          message: NO_IDENTIFIER,
          path: [key],
        });
    if (value.isPrincipal)
      context.addIssue({
        code: 'custom',
        message: 'La période sans forme juridique n’est jamais principale',
        path: ['isPrincipal'],
      });
  })
  .transform(withoutStrayOtherForm);

export const deleteEntitySchema = z
  .object({ expectedVersion: z.number().int().min(1) })
  .strict();

export const entityIdSchema = z.string().min(1).max(128);
