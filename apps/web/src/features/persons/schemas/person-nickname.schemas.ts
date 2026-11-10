import { z } from 'zod';

import { approximateDateSchema } from '$utils/approximate-date.utils';

import { normalizePersonSearchValue } from '../person.utils';
import { optionalTrimmed } from './person-identity.schemas';

/*
 * Another pseudo of a record (10 November 2026): a former one, a second
 * account, a name in a game. Written with the identity's right; it carries
 * its own version and never moves the record's.
 */

const otherNicknameShape = {
  nickname: z
    .string()
    .trim()
    .min(1, 'Renseignez le pseudo')
    .max(80, 'Le pseudo ne peut pas dépasser 80 caractères')
    .refine(
      (value) => normalizePersonSearchValue(value) !== '',
      'Renseignez au moins un caractère autre qu’un accent isolé',
    ),
  note: optionalTrimmed(40, 'La précision ne peut pas dépasser 40 caractères'),
  /** Used until then, at the start of its period; null when unknown. */
  until: approximateDateSchema.nullable().default(null),
};

export const createOtherNicknameSchema = z.object(otherNicknameShape).strict();

export const updateOtherNicknameSchema = z
  .object({ ...otherNicknameShape, version: z.number().int().positive() })
  .strict();

export const deleteOtherNicknameSchema = z
  .object({ version: z.number().int().positive() })
  .strict();

export type CreateOtherNicknameInput = z.infer<
  typeof createOtherNicknameSchema
>;
export type UpdateOtherNicknameInput = z.infer<
  typeof updateOtherNicknameSchema
>;
export type DeleteOtherNicknameInput = z.infer<
  typeof deleteOtherNicknameSchema
>;
