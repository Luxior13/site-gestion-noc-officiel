import { z } from 'zod';

import { orderedIdsSchema, requiredNameSchema } from '$utils/zod.utils';

import {
  TREASURY_CHOICE_KINDS,
  TREASURY_CHOICE_NAME_MAX_LENGTH,
} from '../treasury-list.constants';

const fields = {
  isActive: z.boolean(),
  kind: z.enum(TREASURY_CHOICE_KINDS),
  name: requiredNameSchema(TREASURY_CHOICE_NAME_MAX_LENGTH),
};

export const createTreasuryChoiceSchema = z.object(fields).strict();

export const updateTreasuryChoiceSchema = z
  .object({ ...fields, expectedVersion: z.number().int().min(1) })
  .strict();

export const treasuryChoiceVersionSchema = z
  .object({ expectedVersion: z.number().int().min(1) })
  .strict();

/** A new order of one block, as its managers dragged it. */
export const reorderTreasuryChoicesSchema = z
  .object({ ids: orderedIdsSchema(200), kind: z.enum(TREASURY_CHOICE_KINDS) })
  .strict();

export const treasuryChoiceIdSchema = z.string().min(1).max(128);
