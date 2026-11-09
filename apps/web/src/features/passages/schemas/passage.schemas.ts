import { z } from 'zod';

import {
  type ApproximateDate,
  approximateDateEnd,
  approximateDateSchema,
} from '$utils/approximate-date.utils';

const idSchema = z.string().min(1).max(128);
const versionSchema = z.number().int().min(1);

const ORDER_MESSAGE = 'La fin ne peut pas précéder le début';

/** An end, at the end of its period, never before the start. */
const endsAfterStart = (
  value: Readonly<{ end: ApproximateDate | null; start: ApproximateDate }>,
  context: z.RefinementCtx,
): void => {
  if (value.end && approximateDateEnd(value.end) < value.start.date)
    context.addIssue({ code: 'custom', message: ORDER_MESSAGE, path: ['end'] });
};

const passageFields = {
  end: approximateDateSchema.nullable(),
  functionId: idSchema,
  start: approximateDateSchema,
};

export const createPassageSchema = z
  .object({ ...passageFields, personId: idSchema })
  .strict()
  .superRefine(endsAfterStart);

/** The person of a passage never changes: a wrong one is deleted. */
export const updatePassageSchema = z
  .object({ ...passageFields, expectedVersion: versionSchema })
  .strict()
  .superRefine(endsAfterStart);

export const deletePassageSchema = z
  .object({ expectedVersion: versionSchema })
  .strict();

/** « Changer de fonction »: the passage ends at `at`, another begins there. */
export const changePassageFunctionSchema = z
  .object({
    at: approximateDateSchema,
    expectedVersion: versionSchema,
    functionId: idSchema,
  })
  .strict();

export const passageIdSchema = idSchema;

/** A few letters of a pseudo or a name, for the person picker. */
export const passagePersonQuerySchema = z.string().trim().min(1).max(80);
