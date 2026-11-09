import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { reorderGamesSchema } from '$features/games/schemas/game.schemas';
import { reorderGames } from '$features/games/server/game.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

/** The order of every game, active or not, as their managers dragged it. */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.GAMES.MANAGE);
  if (!permission.success) return permission.response;
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = reorderGamesSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Ordre des jeux invalide',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await reorderGames(parsed.data.ids, {
        actor: auth.user,
        session: auth.session,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'GAME_REORDER', request });
  }
}
