import { z } from 'zod';

import { requiredNameSchema } from '$utils/zod.utils';

import {
  MEMBER_FUNCTION_GROUP_MAX,
  MEMBER_FUNCTION_KINDS,
  MEMBER_FUNCTION_NAME_MAX_LENGTH,
} from '../member-function.constants';

const kindSchema = z.enum(MEMBER_FUNCTION_KINDS, {
  error: 'Choisissez un type',
});

const memberFunctionFields = {
  isActive: z.boolean(),
  kind: kindSchema,
  name: requiredNameSchema(MEMBER_FUNCTION_NAME_MAX_LENGTH),
};

export const createMemberFunctionSchema = z
  .object(memberFunctionFields)
  .strict();

export const updateMemberFunctionSchema = z
  .object({
    ...memberFunctionFields,
    expectedVersion: z.number().int().min(1),
  })
  .strict();

export const deleteMemberFunctionSchema = z
  .object({ expectedVersion: z.number().int().min(1) })
  .strict();

/** The common functions are added to a game that has none: nothing to send. */
export const addCommonMemberFunctionsSchema = z.object({}).strict();

export const memberFunctionIdSchema = z.string().min(1).max(128);

/**
 * The new order of one group (players or staff): every function of the group,
 * each once, from the first to the last.
 */
export const reorderMemberFunctionsSchema = z
  .object({
    ids: z
      .array(memberFunctionIdSchema)
      .min(1)
      .max(MEMBER_FUNCTION_GROUP_MAX)
      .refine((ids) => new Set(ids).size === ids.length, {
        message: 'Une fonction ne figure qu’une fois',
      }),
    kind: kindSchema,
  })
  .strict();
