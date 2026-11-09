import { z } from 'zod';

import { requiredNameSchema } from '$utils/zod.utils';

import {
  MEMBER_FUNCTION_KINDS,
  MEMBER_FUNCTION_NAME_MAX_LENGTH,
} from '../member-function.constants';

const memberFunctionFields = {
  isActive: z.boolean(),
  kind: z.enum(MEMBER_FUNCTION_KINDS, { error: 'Choisissez un type' }),
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
