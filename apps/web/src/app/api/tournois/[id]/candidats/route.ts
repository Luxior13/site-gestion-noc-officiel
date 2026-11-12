import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import {
  tournamentCandidatesQuerySchema,
  tournamentIdSchema,
} from '$features/tournaments/schemas/tournament.schemas';
import { getLineupCandidates } from '$features/tournaments/server/tournament-read';
import { requireAuth, requirePermission } from '$server/api-auth';
import { apiErrors, apiSuccess } from '$server/api-response';
import { readActorEsportScope } from '$server/esport-scope';
import { serviceErrorResponse } from '$server/service-error';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * The members of a team's Roster at the tournament's dates (11 November
 * 2026), to choose its line-up: who holds the tournaments.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(
    auth.user,
    PERMISSIONS.TOURNAMENTS.MANAGE,
  );
  if (!permission.success) return permission.response;
  const id = tournamentIdSchema.safeParse((await params).id);
  if (!id.success) return apiErrors.notFound('Tournoi introuvable');
  const query = tournamentCandidatesQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!query.success) return apiErrors.validation('Équipe invalide');

  try {
    return apiSuccess(
      await getLineupCandidates(
        id.data,
        query.data.equipe,
        await readActorEsportScope(auth.user),
      ),
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'TOURNAMENT_LINEUP_CANDIDATES',
      request,
    });
  }
}
