import { z } from 'zod';

import { approximateDateSchema } from '$utils/approximate-date.utils';
import { orderedIdsSchema, requiredNameSchema } from '$utils/zod.utils';

import {
  GAME_NAME_MAX_LENGTH,
  GAME_SHORT_NAME_MAX_LENGTH,
  ORDER_GROUP_MAX,
} from '../game.constants';

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
  name: requiredNameSchema(GAME_NAME_MAX_LENGTH),
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

/**
 * The new order of the active games, or of the inactive ones (`active`
 * false): an inactive game is ranked too, below (9 November 2026).
 */
export const reorderGamesSchema = z
  .object({ active: z.boolean(), ids: orderedIdsSchema(ORDER_GROUP_MAX) })
  .strict();
