import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { gameIdSchema } from '$features/games/schemas/game.schemas';
import {
  deleteMemberFunctionSchema,
  memberFunctionIdSchema,
  updateMemberFunctionSchema,
} from '$features/member-functions/schemas/member-function.schemas';
import {
  deleteGameFunction,
  updateGameFunction,
} from '$features/member-functions/server/member-function.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

type RouteParams = { params: Promise<{ functionId: string; id: string }> };

const readIds = async (
  params: RouteParams['params'],
): Promise<{ functionId: string; gameId: string } | null> => {
  const { functionId, id } = await params;
  const gameId = gameIdSchema.safeParse(id);
  const parsedFunctionId = memberFunctionIdSchema.safeParse(functionId);

  return gameId.success && parsedFunctionId.success
    ? { functionId: parsedFunctionId.data, gameId: gameId.data }
    : null;
};

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.GAMES.MANAGE);
  if (!permission.success) return permission.response;
  const ids = await readIds(params);
  if (!ids) return apiErrors.notFound('Fonction introuvable');
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = updateMemberFunctionSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Informations de la fonction invalides',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await updateGameFunction(ids.gameId, ids.functionId, parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'FUNCTION_UPDATE', request });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.GAMES.MANAGE);
  if (!permission.success) return permission.response;
  const ids = await readIds(params);
  if (!ids) return apiErrors.notFound('Fonction introuvable');
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = deleteMemberFunctionSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation('Version de la fonction invalide');
  }

  try {
    return apiSuccess(
      await deleteGameFunction(
        ids.gameId,
        ids.functionId,
        parsed.data.expectedVersion,
        { actor: auth.user, session: auth.session },
      ),
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'FUNCTION_DELETE', request });
  }
}
