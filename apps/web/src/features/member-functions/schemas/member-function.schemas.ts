import { z } from 'zod';

import { orderedIdsSchema, requiredNameSchema } from '$utils/zod.utils';

import {
  functionKindsOf,
  type FunctionScopeType,
  MEMBER_FUNCTION_GROUP_MAX,
  MEMBER_FUNCTION_NAME_MAX_LENGTH,
  type MemberFunctionKind,
} from '../member-function.constants';
import type { MemberFunctionInput } from '../types/member-function.types';

const versionSchema = z.number().int().min(1);

/** The kinds of a list only: no board in a game, no players in the structure. */
const kindSchemaOf = (
  scope: FunctionScopeType,
): z.ZodType<MemberFunctionKind> =>
  z.enum(
    functionKindsOf(scope) as [MemberFunctionKind, ...MemberFunctionKind[]],
    {
      error: 'Choisissez un type',
    },
  );

type FunctionSchemas = Readonly<{
  create: z.ZodType<MemberFunctionInput>;
  reorder: z.ZodType<{ ids: string[]; kind: MemberFunctionKind }>;
  update: z.ZodType<MemberFunctionInput & { expectedVersion: number }>;
}>;

const schemasOf = (scope: FunctionScopeType): FunctionSchemas => {
  const kind = kindSchemaOf(scope);
  const fields = {
    isActive: z.boolean(),
    kind,
    name: requiredNameSchema(MEMBER_FUNCTION_NAME_MAX_LENGTH),
  };

  return {
    create: z.object(fields).strict(),
    /**
     * The new order of one group: every function of the group, active or
     * not, each once, from the first to the last.
     */
    reorder: z
      .object({ ids: orderedIdsSchema(MEMBER_FUNCTION_GROUP_MAX), kind })
      .strict(),
    update: z.object({ ...fields, expectedVersion: versionSchema }).strict(),
  };
};

/** The functions of a game: Joueur or Encadrement. */
export const gameFunctionSchemas = schemasOf('game');

/** The functions of the structure (Bureau & staff): Bureau or Staff. */
export const structureFunctionSchemas = schemasOf('structure');

export const deleteMemberFunctionSchema = z
  .object({ expectedVersion: versionSchema })
  .strict();

/** The common functions are added to a list that has none: nothing to send. */
export const addCommonMemberFunctionsSchema = z.object({}).strict();

export const memberFunctionIdSchema = z.string().min(1).max(128);
