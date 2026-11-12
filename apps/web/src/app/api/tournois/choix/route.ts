import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { getTournamentChoices } from '$features/tournaments/server/tournament-read';
import { requireAuth, requirePermission } from '$server/api-auth';
import { apiSuccess } from '$server/api-response';
import { readActorEsportScope } from '$server/esport-scope';
import { serviceErrorResponse } from '$server/service-error';

/**
 * What the windows of the tournaments propose (11 November 2026): the games
 * and teams of the scope, and the organisations of kind Organisateur.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(
    auth.user,
    PERMISSIONS.TOURNAMENTS.MANAGE,
  );
  if (!permission.success) return permission.response;

  try {
    return apiSuccess(
      await getTournamentChoices(await readActorEsportScope(auth.user)),
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'TOURNAMENT_CHOICES',
      request,
    });
  }
}
