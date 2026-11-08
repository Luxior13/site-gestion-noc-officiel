import { z } from 'zod';

import { normalizeSearchText } from '$utils/search-text.utils';

import {
  DATE_PRECISIONS,
  GAME_FIRST_YEAR,
  GAME_LAST_YEAR,
  GAME_NAME_MAX_LENGTH,
  GAME_SHORT_NAME_MAX_LENGTH,
} from '../game.constants';
import { normalizeApproximateDate, parseDateOnly } from '../game-date.utils';

const approximateDateSchema = z
  .object({
    date: z.string(),
    precision: z.enum(DATE_PRECISIONS),
  })
  .strict()
  .superRefine((value, context) => {
    const parts = parseDateOnly(value.date);
    if (!parts) {
      context.addIssue({ code: 'custom', message: 'Date invalide' });

      return;
    }
    if (parts.year < GAME_FIRST_YEAR || parts.year > GAME_LAST_YEAR)
      context.addIssue({
        code: 'custom',
        message: `L’année doit être comprise entre ${GAME_FIRST_YEAR} et ${GAME_LAST_YEAR}`,
      });
  })
  .transform(normalizeApproximateDate);

const nameSchema = z
  .string()
  .max(GAME_NAME_MAX_LENGTH * 2)
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .min(1, 'Le nom est obligatoire')
      .max(
        GAME_NAME_MAX_LENGTH,
        `${GAME_NAME_MAX_LENGTH} caractères au maximum`,
      )
      .refine((value) => normalizeSearchText(value).length > 0, {
        message: 'Le nom doit contenir au moins une lettre ou un chiffre',
      }),
  );

const shortNameSchema = z
  .string()
  .max(GAME_SHORT_NAME_MAX_LENGTH * 2)
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
        GAME_SHORT_NAME_MAX_LENGTH,
        `${GAME_SHORT_NAME_MAX_LENGTH} caractères au maximum`,
      )
      .nullable(),
  );

const gameFields = {
  firstOpened: approximateDateSchema,
  isActive: z.boolean(),
  name: nameSchema,
  shortName: shortNameSchema,
};

export const createGameSchema = z.object(gameFields).strict();

export const updateGameSchema = z
  .object({ ...gameFields, expectedVersion: z.number().int().min(1) })
  .strict();

export const deleteGameSchema = z
  .object({ expectedVersion: z.number().int().min(1) })
  .strict();

export const gameIdSchema = z.string().min(1).max(128);
