import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { createGameSchema } from '$features/games/schemas/game.schemas';
import { createGame, listGames } from '$features/games/server/game.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.GAMES.VIEW);
  if (!permission.success) return permission.response;

  try {
    return apiSuccess(await listGames());
  } catch (error) {
    return serviceErrorResponse(error, { action: 'GAME_LIST', request });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.GAMES.MANAGE);
  if (!permission.success) return permission.response;
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = createGameSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Informations du jeu invalides',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await createGame(parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
      201,
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'GAME_CREATE', request });
  }
}
