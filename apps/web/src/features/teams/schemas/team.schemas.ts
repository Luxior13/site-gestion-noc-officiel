import { z } from 'zod';

import { ORDER_GROUP_MAX } from '$features/games/game.constants';
import { approximateDateSchema } from '$utils/approximate-date.utils';
import { orderedIdsSchema, requiredNameSchema } from '$utils/zod.utils';

import { TEAM_NAME_MAX_LENGTH } from '../team.constants';

const teamFields = {
  founded: approximateDateSchema,
  isActive: z.boolean(),
  name: requiredNameSchema(TEAM_NAME_MAX_LENGTH),
};

export const createTeamSchema = z
  .object({
    ...teamFields,
    gameId: z.string().min(1, 'Choisissez un jeu').max(128),
  })
  .strict();

/** No game: a team keeps the one it was created for (8 November 2026). */
export const updateTeamSchema = z
  .object({ ...teamFields, expectedVersion: z.number().int().min(1) })
  .strict();

export const deleteTeamSchema = z
  .object({ expectedVersion: z.number().int().min(1) })
  .strict();

export const teamIdSchema = z.string().min(1).max(128);

/** The new order of every team of a game, active or not. */
export const reorderTeamsSchema = z
  .object({ ids: orderedIdsSchema(ORDER_GROUP_MAX) })
  .strict();
