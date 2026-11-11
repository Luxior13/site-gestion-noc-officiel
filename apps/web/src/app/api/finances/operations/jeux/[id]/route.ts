import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { operationIdSchema } from '$features/operations/schemas/operation.schemas';
import { getGameFinances } from '$features/operations/server/operation.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import { apiErrors, apiSuccess } from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * A game's money, team by team, then the game itself (11 November 2026):
 * the Finances tab of its record, for who may read the operations.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.OPERATIONS.VIEW);
  if (!permission.success) return permission.response;
  const id = operationIdSchema.safeParse((await params).id);
  if (!id.success) return apiErrors.notFound('Jeu introuvable');

  try {
    return apiSuccess(await getGameFinances(id.data));
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'OPERATION_GAME_FINANCES',
      request,
    });
  }
}
