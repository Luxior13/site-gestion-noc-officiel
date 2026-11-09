import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { gameIdSchema } from '$features/games/schemas/game.schemas';
import { reorderTeamsSchema } from '$features/teams/schemas/team.schemas';
import { reorderTeams } from '$features/teams/server/team.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

type RouteParams = { params: Promise<{ id: string }> };

/** The order of every team of a game, active or not. */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.TEAMS.MANAGE);
  if (!permission.success) return permission.response;
  const gameId = gameIdSchema.safeParse((await params).id);
  if (!gameId.success) return apiErrors.notFound('Jeu introuvable');
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = reorderTeamsSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Ordre des équipes invalide',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await reorderTeams(gameId.data, parsed.data.ids, {
        actor: auth.user,
        session: auth.session,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'TEAM_REORDER', request });
  }
}
