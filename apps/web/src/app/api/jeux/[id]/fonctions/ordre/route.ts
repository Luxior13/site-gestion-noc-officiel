import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { gameIdSchema } from '$features/games/schemas/game.schemas';
import { reorderMemberFunctionsSchema } from '$features/member-functions/schemas/member-function.schemas';
import { reorderGameFunctions } from '$features/member-functions/server/member-function.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

type RouteParams = { params: Promise<{ id: string }> };

/** The order of one group (players or staff), as its managers dragged it. */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.GAMES.MANAGE);
  if (!permission.success) return permission.response;
  const gameId = gameIdSchema.safeParse((await params).id);
  if (!gameId.success) return apiErrors.notFound('Jeu introuvable');
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = reorderMemberFunctionsSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Ordre des fonctions invalide',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await reorderGameFunctions(gameId.data, parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'FUNCTION_REORDER',
      request,
    });
  }
}
