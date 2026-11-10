import {
  type CountryCode,
  isSupportedCountry,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';
import { z } from 'zod';

import { LEGAL_GUARDIAN_RELATIONS } from '../person.constants';
import { optionalTrimmed } from './person-identity.schemas';

/*
 * Emergency contacts and legal representatives of a record (10 November
 * 2026), written with the coordinates' right.
 */

const versions = {
  personVersion: z.number().int().positive(),
  version: z.number().int().positive(),
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Preserve transformed Zod input/output types.
const buildEmergencyContactSchema = <T extends z.ZodRawShape>(extraShape: T) =>
  z
    .object({
      countryCode: z
        .string()
        .trim()
        .length(2, 'Pays invalide')
        .transform((value) => value.toUpperCase())
        .refine(
          (value) => isSupportedCountry(value as CountryCode),
          'Pays invalide',
        )
        .default('FR'),
      name: z
        .string()
        .trim()
        .min(1, 'Nom requis')
        .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
      phone: z
        .string()
        .trim()
        .min(1, 'Numéro requis')
        .max(40, 'Le numéro ne peut pas dépasser 40 caractères'),
      relation: optionalTrimmed(
        40,
        'Le lien ne peut pas dépasser 40 caractères',
      ),
      ...extraShape,
    })
    .strict()
    .transform((value, context) => {
      const contact = value as typeof value & {
        countryCode: string;
        phone: string;
      };
      const parsed = parsePhoneNumberFromString(
        contact.phone,
        contact.countryCode as CountryCode,
      );
      if (!parsed?.isValid()) {
        context.addIssue({
          code: 'custom',
          message: 'Numéro de téléphone invalide',
          path: ['phone'],
        });

        return z.NEVER;
      }

      return { ...contact, normalizedPhone: parsed.number };
    });

export const createEmergencyContactSchema = buildEmergencyContactSchema({
  personVersion: versions.personVersion,
});

export const updateEmergencyContactSchema =
  buildEmergencyContactSchema(versions);

const relationSchema = z.enum(LEGAL_GUARDIAN_RELATIONS, {
  error: 'Choisissez le lien avec la personne',
});

/** The representative is a record of the Répertoire, chosen once. */
export const createLegalGuardianSchema = z
  .object({
    guardianId: z
      .string()
      .cuid({ error: 'Choisissez une fiche du Répertoire' }),
    personVersion: versions.personVersion,
    relation: relationSchema,
  })
  .strict();

/** Only the relation changes; another representative is another link. */
export const updateLegalGuardianSchema = z
  .object({ ...versions, relation: relationSchema })
  .strict();

export const deletePersonRelativeSchema = z.object(versions).strict();

export type CreateEmergencyContactInput = z.infer<
  typeof createEmergencyContactSchema
>;
export type UpdateEmergencyContactInput = z.infer<
  typeof updateEmergencyContactSchema
>;
export type CreateLegalGuardianInput = z.infer<
  typeof createLegalGuardianSchema
>;
export type UpdateLegalGuardianInput = z.infer<
  typeof updateLegalGuardianSchema
>;
export type DeletePersonRelativeInput = z.infer<
  typeof deletePersonRelativeSchema
>;
