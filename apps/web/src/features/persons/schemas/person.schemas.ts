import {
  type CountryCode,
  isSupportedCountry,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';
import { z } from 'zod';

import { PAGINATION } from '$constants/pagination.constants';

import {
  isKnownPersonSocialNetwork,
  isSelectablePersonSocialNetwork,
  PERSON_LIMITS,
  PERSON_LIST_SORTS,
  PERSON_STRUCTURE_STATUSES,
} from '../person.constants';
import {
  normalizePersonEmail,
  normalizePersonSocialIdentifier,
  normalizePersonSocialUrl,
} from '../person.utils';
import {
  identityShape,
  optionalTrimmed,
  withMinimumIdentity,
} from './person-identity.schemas';

const requiredLabel = z
  .string()
  .trim()
  .min(1, 'Libellé requis')
  .max(40, 'Le libellé ne peut pas dépasser 40 caractères');

const personEmailInputSchema = z
  .object({
    email: z
      .string()
      .trim()
      .max(320, 'L’email ne peut pas dépasser 320 caractères')
      .email('Email invalide'),
    isPrimary: z.boolean().optional().default(false),
    label: requiredLabel,
  })
  .strict();

const countryCodeSchema = z
  .string()
  .trim()
  .length(2, 'Pays invalide')
  .transform((value) => value.toUpperCase())
  .refine((value) => isSupportedCountry(value as CountryCode), 'Pays invalide');

const personPhoneShape = {
  countryCode: countryCodeSchema.default('FR'),
  isPrimary: z.boolean().optional().default(false),
  label: requiredLabel,
  phone: z
    .string()
    .trim()
    .min(1, 'Numéro requis')
    .max(40, 'Le numéro ne peut pas dépasser 40 caractères'),
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Preserve transformed Zod input/output types.
const buildPersonPhoneSchema = <T extends z.ZodRawShape>(extraShape: T) =>
  z
    .object({ ...personPhoneShape, ...extraShape })
    .strict()
    .transform((value, context) => {
      const phoneValue = value as typeof value & {
        countryCode: string;
        phone: string;
      };
      const parsed = parsePhoneNumberFromString(
        phoneValue.phone,
        phoneValue.countryCode as CountryCode,
      );
      if (!parsed?.isValid()) {
        context.addIssue({
          code: 'custom',
          message: 'Numéro de téléphone invalide',
          path: ['phone'],
        });

        return z.NEVER;
      }

      return { ...phoneValue, normalizedPhone: parsed.number };
    });

const personPhoneInputSchema = buildPersonPhoneSchema({});

const optionalUrl = z
  .string()
  .max(2_048, 'L’URL ne peut pas dépasser 2 048 caractères')
  .nullable()
  .optional()
  .transform((value) => value?.trim() || null)
  .superRefine((value, context) => {
    if (!value) return;
    try {
      const parsed = new URL(value);
      if (
        (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') ||
        parsed.username ||
        parsed.password
      ) {
        throw new Error('Unsupported protocol');
      }
    } catch {
      context.addIssue({ code: 'custom', message: 'URL de profil invalide' });
    }
  });

const personSocialProfileShape = {
  identifier: optionalTrimmed(
    100,
    'L’identifiant ne peut pas dépasser 100 caractères',
  ),
  isPrimary: z.boolean().optional().default(false),
  label: requiredLabel,
  networkKey: z
    .string()
    .trim()
    .toLowerCase()
    .refine(isKnownPersonSocialNetwork, 'Réseau social inconnu'),
  profileUrl: optionalUrl,
};

// The generic Zod builder deliberately leaves the concrete inferred output to
// each caller; spelling it out here would erase the additional shape `T`.
/* eslint-disable @typescript-eslint/explicit-function-return-type */
const buildPersonSocialProfileSchema = <T extends z.ZodRawShape>(
  extraShape: T,
) =>
  z
    .object({ ...personSocialProfileShape, ...extraShape })
    .strict()
    .superRefine((value, context) => {
      const profileValue = value as typeof value & {
        identifier: string | null;
        profileUrl: string | null;
      };
      if (!profileValue.identifier && !profileValue.profileUrl) {
        context.addIssue({
          code: 'custom',
          message: 'Renseignez un identifiant ou une URL de profil',
          path: ['identifier'],
        });
      }
      if (
        profileValue.identifier &&
        normalizePersonSocialIdentifier(profileValue.identifier).length > 100
      ) {
        context.addIssue({
          code: 'custom',
          message: 'L’identifiant normalisé est trop long',
          path: ['identifier'],
        });
      }
      if (profileValue.profileUrl) {
        try {
          if (
            normalizePersonSocialUrl(profileValue.profileUrl).length > 2_048
          ) {
            context.addIssue({
              code: 'custom',
              message: 'L’URL normalisée dépasse 2 048 caractères',
              path: ['profileUrl'],
            });
          }
        } catch {
          // The dedicated URL schema reports the stable field error.
        }
      }
    });
/* eslint-enable @typescript-eslint/explicit-function-return-type */

export const personSocialProfileInputSchema = buildPersonSocialProfileSchema(
  {},
).superRefine((value, context) => {
  if (isSelectablePersonSocialNetwork(value.networkKey)) return;
  context.addIssue({
    code: 'custom',
    message: 'Ce réseau n’accepte plus de nouveaux profils',
    path: ['networkKey'],
  });
});

export const createPersonSchema = withMinimumIdentity({
  ...identityShape,
  emails: z.array(personEmailInputSchema).max(PERSON_LIMITS.emails).default([]),
  phones: z.array(personPhoneInputSchema).max(PERSON_LIMITS.phones).default([]),
  socialProfiles: z
    .array(personSocialProfileInputSchema)
    .max(PERSON_LIMITS.socialProfiles)
    .default([]),
}).superRefine((value, context) => {
  const validateSinglePrimary = (
    items: readonly { isPrimary: boolean }[],
    path: 'emails' | 'phones',
  ): void => {
    let primarySeen = false;
    items.forEach((item, index) => {
      if (!item.isPrimary) return;
      if (primarySeen) {
        context.addIssue({
          code: 'custom',
          message: 'Un seul élément peut être principal',
          path: [path, index, 'isPrimary'],
        });
      }
      primarySeen = true;
    });
  };

  validateSinglePrimary(value.emails, 'emails');
  validateSinglePrimary(value.phones, 'phones');

  const primaryNetworks = new Set<string>();
  value.socialProfiles.forEach((profile, index) => {
    if (!profile.isPrimary) return;
    if (primaryNetworks.has(profile.networkKey)) {
      context.addIssue({
        code: 'custom',
        message: 'Un seul profil peut être principal pour ce réseau',
        path: ['socialProfiles', index, 'isPrimary'],
      });
    }
    primaryNetworks.add(profile.networkKey);
  });

  const emailValues = new Set<string>();
  value.emails.forEach((email, index) => {
    const normalizedEmail = normalizePersonEmail(email.email);
    if (emailValues.has(normalizedEmail)) {
      context.addIssue({
        code: 'custom',
        message: 'Cet email est déjà présent sur la fiche',
        path: ['emails', index, 'email'],
      });
    }
    emailValues.add(normalizedEmail);
  });

  const phoneValues = new Set<string>();
  value.phones.forEach((phone, index) => {
    if (phoneValues.has(phone.normalizedPhone)) {
      context.addIssue({
        code: 'custom',
        message: 'Ce numéro est déjà présent sur la fiche',
        path: ['phones', index, 'phone'],
      });
    }
    phoneValues.add(phone.normalizedPhone);
  });

  const socialIdentifiers = new Set<string>();
  const socialUrls = new Set<string>();
  value.socialProfiles.forEach((profile, index) => {
    if (profile.identifier) {
      const identifierKey = `${profile.networkKey}:${profile.identifier.toLocaleLowerCase('en-US')}`;
      if (socialIdentifiers.has(identifierKey)) {
        context.addIssue({
          code: 'custom',
          message: 'Cet identifiant est déjà présent pour ce réseau',
          path: ['socialProfiles', index, 'identifier'],
        });
      }
      socialIdentifiers.add(identifierKey);
    }
    if (profile.profileUrl) {
      let normalizedProfileUrl: string;
      try {
        normalizedProfileUrl = normalizePersonSocialUrl(profile.profileUrl);
      } catch {
        return;
      }
      const urlKey = `${profile.networkKey}:${normalizedProfileUrl}`;
      if (socialUrls.has(urlKey)) {
        context.addIssue({
          code: 'custom',
          message: 'Cette URL est déjà présente pour ce réseau',
          path: ['socialProfiles', index, 'profileUrl'],
        });
      }
      socialUrls.add(urlKey);
    }
  });
});

export const createPersonEmailSchema = personEmailInputSchema.extend({
  personVersion: z.number().int().positive(),
});

export const updatePersonEmailSchema = personEmailInputSchema.extend({
  personVersion: z.number().int().positive(),
  version: z.number().int().positive(),
});

export const createPersonPhoneSchema = buildPersonPhoneSchema({
  personVersion: z.number().int().positive(),
});

export const updatePersonPhoneSchema = buildPersonPhoneSchema({
  personVersion: z.number().int().positive(),
  version: z.number().int().positive(),
});

export const createPersonSocialProfileSchema = buildPersonSocialProfileSchema({
  personVersion: z.number().int().positive(),
}).superRefine((value, context) => {
  if (isSelectablePersonSocialNetwork(value.networkKey)) return;
  context.addIssue({
    code: 'custom',
    message: 'Ce réseau n’accepte plus de nouveaux profils',
    path: ['networkKey'],
  });
});

export const updatePersonSocialProfileSchema = buildPersonSocialProfileSchema({
  personVersion: z.number().int().positive(),
  version: z.number().int().positive(),
});

export const deletePersonChildSchema = z
  .object({
    personVersion: z.number().int().positive(),
    replacementPrimaryId: z.string().cuid().nullable().optional(),
    version: z.number().int().positive(),
  })
  .strict();

export const deletePersonSchema = z
  .object({ version: z.number().int().positive() })
  .strict();

export const personsListQuerySchema = z
  .object({
    contacts: z.enum(['missing']).optional(),
    cursor: z.string().max(2_048).optional(),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(PAGINATION.DEFAULT_LIMIT),
    q: z.string().trim().max(100).default(''),
    sort: z.enum(PERSON_LIST_SORTS).default('name'),
    structureStatus: z.enum(PERSON_STRUCTURE_STATUSES).optional(),
  })
  .strict();

export type CreatePersonInput = z.infer<typeof createPersonSchema>;
export type CreatePersonEmailInput = z.infer<typeof createPersonEmailSchema>;
export type UpdatePersonEmailInput = z.infer<typeof updatePersonEmailSchema>;
export type CreatePersonPhoneInput = z.infer<typeof createPersonPhoneSchema>;
export type UpdatePersonPhoneInput = z.infer<typeof updatePersonPhoneSchema>;
export type CreatePersonSocialProfileInput = z.infer<
  typeof createPersonSocialProfileSchema
>;
export type UpdatePersonSocialProfileInput = z.infer<
  typeof updatePersonSocialProfileSchema
>;
export type DeletePersonChildInput = z.infer<typeof deletePersonChildSchema>;
