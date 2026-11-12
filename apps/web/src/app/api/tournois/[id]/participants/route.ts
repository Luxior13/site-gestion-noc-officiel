import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import {
  tournamentEntryCreateSchema,
  tournamentIdSchema,
} from '$features/tournaments/schemas/tournament.schemas';
import { createTournamentEntry } from '$features/tournaments/server/tournament-entry.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

type RouteParams = { params: Promise<{ id: string }> };

/** Engages one of our teams, with its line-up and placement if known. */
export async function POST(
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
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = tournamentEntryCreateSchema.safeParse(body.data);
  if (!parsed.success)
    return apiErrors.validation(
      'Participation invalide',
      zodErrorDetails(parsed.error),
    );

  try {
    return apiSuccess(
      await createTournamentEntry(id.data, parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
      201,
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'TOURNAMENT_ENTRY_CREATE',
      request,
    });
  }
}
