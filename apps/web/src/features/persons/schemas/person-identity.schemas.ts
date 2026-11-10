import { z } from 'zod';

import { isKnownCountry } from '$constants/countries.constants';

import {
  getApplicationCivilDateParts,
  normalizePersonSearchValue,
} from '../person.utils';

/*
 * Identity of a Répertoire record, apart from the contact schemas: the forms
 * that only edit an identity (creation, Identité tab) stay free of the phone
 * number library (audit of 31 October 2026, AC-49).
 */

// These builders intentionally retain their precise inferred Zod pipeline
// types so `z.input` and `z.output` stay distinct after transforms.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const optionalTrimmed = (max: number, message: string) =>
  z
    .string()
    .max(max, message)
    .nullable()
    .optional()
    .transform((value) => {
      const trimmed = value?.trim() ?? '';

      return trimmed.length > 0 ? trimmed : null;
    });

const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de naissance invalide')
  .nullable()
  .optional()
  .transform((value) => value || null)
  .superRefine((value, context) => {
    if (!value) return;
    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== (month ?? 1) - 1 ||
      parsed.getUTCDate() !== day
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Date de naissance invalide',
      });

      return;
    }

    const current = getApplicationCivilDateParts();
    if (!current) {
      context.addIssue({
        code: 'custom',
        message: 'Date de naissance invalide',
      });

      return;
    }
    const today = new Date(
      Date.UTC(current.year, current.month - 1, current.day),
    );
    const oldest = new Date(today);
    oldest.setUTCFullYear(oldest.getUTCFullYear() - 120);
    if (parsed > today) {
      context.addIssue({
        code: 'custom',
        message: 'La date ne peut pas être future',
      });
    } else if (parsed < oldest) {
      context.addIssue({
        code: 'custom',
        message: 'La date ne peut pas remonter à plus de 120 ans',
      });
    }
  });

/** A country of the site's list, by its code (10 November 2026). */
const nationalitySchema = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((value) => value?.toUpperCase() || null)
  .refine(
    (value) => value === null || isKnownCountry(value),
    'Nationalité inconnue',
  );

export const identityShape = {
  birthDate: birthDateSchema,
  firstName: optionalTrimmed(
    100,
    'Le prénom ne peut pas dépasser 100 caractères',
  ),
  lastName: optionalTrimmed(100, 'Le nom ne peut pas dépasser 100 caractères'),
  nationality: nationalitySchema,
  nickname: optionalTrimmed(80, 'Le pseudo ne peut pas dépasser 80 caractères'),
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Preserve the generic Zod object shape.
export const withMinimumIdentity = <T extends z.ZodRawShape>(shape: T) =>
  z
    .object(shape)
    .strict()
    .superRefine((value, context) => {
      const identity = value as {
        firstName?: string | null;
        lastName?: string | null;
        nickname?: string | null;
      };
      if (!identity.nickname && !(identity.firstName && identity.lastName)) {
        context.addIssue({
          code: 'custom',
          message: 'Renseignez un pseudo, ou le prénom et le nom',
          path: ['nickname'],
        });
      }
      const normalizedLimits = [
        ['nickname', identity.nickname, 160],
        ['firstName', identity.firstName, 200],
        ['lastName', identity.lastName, 200],
      ] as const;
      for (const [field, fieldValue, max] of normalizedLimits) {
        const normalized = fieldValue
          ? normalizePersonSearchValue(fieldValue)
          : null;
        if (normalized === '') {
          context.addIssue({
            code: 'custom',
            message:
              'Renseignez au moins un caractère autre qu’un accent isolé',
            path: [field],
          });
        } else if (normalized && normalized.length > max) {
          context.addIssue({
            code: 'custom',
            message: 'Cette valeur contient trop de caractères normalisés',
            path: [field],
          });
        }
      }
    });

/** Identity alone, as the creation form checks it before sending. */
export const personIdentitySchema = withMinimumIdentity({ ...identityShape });

export const updatePersonSchema = withMinimumIdentity({
  ...identityShape,
  version: z.number().int().positive(),
});

export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;
