import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import {
  deleteGameSchema,
  gameIdSchema,
  updateGameSchema,
} from '$features/games/schemas/game.schemas';
import {
  deleteGame,
  getGame,
  updateGame,
} from '$features/games/server/game.service';
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
  const id = gameIdSchema.safeParse((await params).id);
  if (!id.success) return apiErrors.notFound('Jeu introuvable');

  try {
    return apiSuccess(await getGame(id.data));
  } catch (error) {
    return serviceErrorResponse(error, { action: 'GAME_READ', request });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.GAMES.MANAGE);
  if (!permission.success) return permission.response;
  const id = gameIdSchema.safeParse((await params).id);
  if (!id.success) return apiErrors.notFound('Jeu introuvable');
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = updateGameSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Informations du jeu invalides',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await updateGame(id.data, parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'GAME_UPDATE', request });
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
  const id = gameIdSchema.safeParse((await params).id);
  if (!id.success) return apiErrors.notFound('Jeu introuvable');
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = deleteGameSchema.safeParse(body.data);
  if (!parsed.success) return apiErrors.validation('Version du jeu invalide');

  try {
    return apiSuccess(
      await deleteGame(id.data, parsed.data.expectedVersion, {
        actor: auth.user,
        session: auth.session,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'GAME_DELETE', request });
  }
}
