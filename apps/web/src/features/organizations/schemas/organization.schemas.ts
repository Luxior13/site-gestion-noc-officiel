import {
  type CountryCode,
  isSupportedCountry,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';
import { z } from 'zod';

import { optionalEmailSchema, requiredNameSchema } from '$utils/zod.utils';

import {
  CONTACT_NAME_MAX_LENGTH,
  CONTACT_ROLE_MAX_LENGTH,
  ORGANIZATION_ADDRESS_MAX_LENGTH,
  ORGANIZATION_KINDS,
  ORGANIZATION_NAME_MAX_LENGTH,
  ORGANIZATION_WEBSITE_MAX_LENGTH,
  type OrganizationKind,
} from '../organization.constants';

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

/** Spaces typed in a SIRET (« 123 456 789 00012 ») are dropped. */
const siretSchema: z.ZodType<string | null, string | null | undefined> = z
  .string()
  .max(40)
  .nullable()
  .optional()
  .transform((value) => {
    const compact = (value ?? '').replace(/\s+/gu, '');

    return compact.length > 0 ? compact : null;
  })
  .pipe(
    z
      .string()
      .regex(/^\d{14}$/u, 'Le SIRET compte 14 chiffres')
      .nullable(),
  );

const INVALID_WEBSITE = 'Adresse de site invalide, par exemple noctambule.gg';

/**
 * « noctambule.gg » is read as « https://noctambule.gg »: a site is typed
 * as it is said, its scheme added.
 */
const websiteSchema: z.ZodType<string | null, string | null | undefined> = z
  .string()
  .max(ORGANIZATION_WEBSITE_MAX_LENGTH * 2)
  .nullable()
  .optional()
  .transform((value, context) => {
    const trimmed = value?.trim() ?? '';
    if (!trimmed) return null;
    const typed = /^https?:\/\//iu.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    try {
      const url = new URL(typed);
      if (/\s/u.test(trimmed) || !url.hostname.includes('.'))
        throw new TypeError(INVALID_WEBSITE);

      return url.href.replace(/\/$/u, '');
    } catch {
      context.addIssue({ code: 'custom', message: INVALID_WEBSITE });

      return z.NEVER;
    }
  })
  .pipe(
    z
      .string()
      .max(
        ORGANIZATION_WEBSITE_MAX_LENGTH,
        `${ORGANIZATION_WEBSITE_MAX_LENGTH} caractères au maximum`,
      )
      .nullable(),
  );

/** Each kind once, in the order of the list. */
const kindsSchema: z.ZodType<OrganizationKind[], string[]> = z
  .array(z.enum(ORGANIZATION_KINDS))
  .min(1, 'Choisissez au moins un type')
  .max(ORGANIZATION_KINDS.length * 2)
  .transform((kinds) =>
    ORGANIZATION_KINDS.filter((kind) => kinds.includes(kind)),
  );

const organizationFields = {
  kinds: kindsSchema,
  name: requiredNameSchema(ORGANIZATION_NAME_MAX_LENGTH),
};

export const createOrganizationSchema = z.object(organizationFields).strict();

export const updateOrganizationSchema = z
  .object({
    ...organizationFields,
    address: optionalText(ORGANIZATION_ADDRESS_MAX_LENGTH),
    expectedVersion: z.number().int().min(1),
    siretNumber: siretSchema,
    website: websiteSchema,
  })
  .strict();

export const versionSchema = z
  .object({ expectedVersion: z.number().int().min(1) })
  .strict();

export const organizationIdSchema = z.string().min(1).max(128);

const INVALID_PHONE = 'Numéro de téléphone invalide';

/**
 * A contact: a name, or the record of the Répertoire that gives it; the
 * number is stored in its international form, read with its country.
 */
const contactFields = {
  email: optionalEmailSchema.transform((value) => value ?? null),
  name: optionalText(CONTACT_NAME_MAX_LENGTH),
  personId: z.string().min(1).max(128).nullable().optional(),
  phone: optionalText(40),
  phoneCountry: z
    .string()
    .trim()
    .length(2, 'Pays invalide')
    .transform((value) => value.toUpperCase())
    .refine(
      (value) => isSupportedCountry(value as CountryCode),
      'Pays invalide',
    )
    .default('FR'),
  role: optionalText(CONTACT_ROLE_MAX_LENGTH),
};

type ContactFields = Readonly<{ phone: string | null; phoneCountry: string }>;

/** The typed number becomes « +33612345678 », or an error on its field. */
const normalizePhone = <Value extends ContactFields>(
  value: Value,
  context: z.RefinementCtx,
): Value => {
  if (!value.phone) return value;
  const parsed = parsePhoneNumberFromString(
    value.phone,
    value.phoneCountry as CountryCode,
  );
  if (!parsed?.isValid()) {
    context.addIssue({
      code: 'custom',
      message: INVALID_PHONE,
      path: ['phone'],
    });

    return z.NEVER;
  }

  return { ...value, phone: parsed.number };
};

export const createContactSchema = z
  .object(contactFields)
  .strict()
  .transform(normalizePhone);

export const updateContactSchema = z
  .object({ ...contactFields, expectedVersion: z.number().int().min(1) })
  .strict()
  .transform(normalizePhone);
