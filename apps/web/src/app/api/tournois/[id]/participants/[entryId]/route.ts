import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import {
  tournamentEntryUpdateSchema,
  tournamentIdSchema,
  tournamentVersionSchema,
} from '$features/tournaments/schemas/tournament.schemas';
import {
  deleteTournamentEntry,
  updateTournamentEntry,
} from '$features/tournaments/server/tournament-entry.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

type RouteParams = { params: Promise<{ entryId: string; id: string }> };

const NOT_FOUND = 'Participation introuvable';

/** An engaged team's line-up and placement. */
export async function PATCH(
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
  const { entryId, id } = await params;
  const tournament = tournamentIdSchema.safeParse(id);
  const entry = tournamentIdSchema.safeParse(entryId);
  if (!tournament.success || !entry.success)
    return apiErrors.notFound(NOT_FOUND);
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = tournamentEntryUpdateSchema.safeParse(body.data);
  if (!parsed.success)
    return apiErrors.validation(
      'Participation invalide',
      zodErrorDetails(parsed.error),
    );

  try {
    return apiSuccess(
      await updateTournamentEntry(tournament.data, entry.data, parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'TOURNAMENT_ENTRY_UPDATE',
      request,
    });
  }
}

/** Withdraws an engaged team; null when the tournament leaves the scope. */
export async function DELETE(
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
  const { entryId, id } = await params;
  const tournament = tournamentIdSchema.safeParse(id);
  const entry = tournamentIdSchema.safeParse(entryId);
  if (!tournament.success || !entry.success)
    return apiErrors.notFound(NOT_FOUND);
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = tournamentVersionSchema.safeParse(body.data);
  if (!parsed.success)
    return apiErrors.validation('Version de la participation invalide');

  try {
    return apiSuccess(
      await deleteTournamentEntry(
        tournament.data,
        entry.data,
        parsed.data.expectedVersion,
        { actor: auth.user, session: auth.session },
      ),
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'TOURNAMENT_ENTRY_DELETE',
      request,
    });
  }
}
