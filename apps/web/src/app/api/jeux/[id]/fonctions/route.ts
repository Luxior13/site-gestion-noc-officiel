import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { gameIdSchema } from '$features/games/schemas/game.schemas';
import { gameFunctionSchemas } from '$features/member-functions/schemas/member-function.schemas';
import {
  createFunction,
  listFunctions,
} from '$features/member-functions/server/member-function.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.GAMES.VIEW);
  if (!permission.success) return permission.response;
  const gameId = gameIdSchema.safeParse((await params).id);
  if (!gameId.success) return apiErrors.notFound('Jeu introuvable');

  try {
    return apiSuccess(
      await listFunctions({ gameId: gameId.data, type: 'game' }),
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'FUNCTION_LIST', request });
  }
}

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
  const parsed = gameFunctionSchemas.create.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Informations de la fonction invalides',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await createFunction({ gameId: gameId.data, type: 'game' }, parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
      201,
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'FUNCTION_CREATE', request });
  }
}
