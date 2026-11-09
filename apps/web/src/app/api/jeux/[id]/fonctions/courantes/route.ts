import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { gameIdSchema } from '$features/games/schemas/game.schemas';
import { addCommonMemberFunctionsSchema } from '$features/member-functions/schemas/member-function.schemas';
import { addCommonFunctions } from '$features/member-functions/server/member-function.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import { apiErrors, apiSuccess, parseJsonBody } from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

type RouteParams = { params: Promise<{ id: string }> };

/** Joueur, Remplaçant, Coach, Manager and Analyste, for a game without any. */
export async function POST(
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
  if (!addCommonMemberFunctionsSchema.safeParse(body.data).success)
    return apiErrors.validation('Demande invalide');

  try {
    return apiSuccess(
      await addCommonFunctions(
        { gameId: gameId.data, type: 'game' },
        {
          actor: auth.user,
          session: auth.session,
        },
      ),
      201,
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'FUNCTION_CREATE', request });
  }
}
