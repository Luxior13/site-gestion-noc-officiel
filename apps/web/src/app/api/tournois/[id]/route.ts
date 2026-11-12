import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import {
  tournamentIdSchema,
  tournamentVersionSchema,
  updateTournamentSchema,
} from '$features/tournaments/schemas/tournament.schemas';
import {
  deleteTournament,
  updateTournament,
} from '$features/tournaments/server/tournament.service';
import { getTournament } from '$features/tournaments/server/tournament-read';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { readActorEsportScope } from '$server/esport-scope';
import { serviceErrorResponse } from '$server/service-error';

type RouteParams = { params: Promise<{ id: string }> };

const NOT_FOUND = 'Tournoi introuvable';

export async function GET(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.TOURNAMENTS.VIEW);
  if (!permission.success) return permission.response;
  const id = tournamentIdSchema.safeParse((await params).id);
  if (!id.success) return apiErrors.notFound(NOT_FOUND);

  try {
    return apiSuccess(
      await getTournament(id.data, await readActorEsportScope(auth.user)),
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'TOURNAMENT_READ', request });
  }
}

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
  const id = tournamentIdSchema.safeParse((await params).id);
  if (!id.success) return apiErrors.notFound(NOT_FOUND);
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = updateTournamentSchema.safeParse(body.data);
  if (!parsed.success)
    return apiErrors.validation(
      'Informations du tournoi invalides',
      zodErrorDetails(parsed.error),
    );

  try {
    return apiSuccess(
      await updateTournament(id.data, parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'TOURNAMENT_UPDATE',
      request,
    });
  }
}

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
  const id = tournamentIdSchema.safeParse((await params).id);
  if (!id.success) return apiErrors.notFound(NOT_FOUND);
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = tournamentVersionSchema.safeParse(body.data);
  if (!parsed.success)
    return apiErrors.validation('Version du tournoi invalide');

  try {
    return apiSuccess(
      await deleteTournament(id.data, parsed.data.expectedVersion, {
        actor: auth.user,
        session: auth.session,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'TOURNAMENT_DELETE',
      request,
    });
  }
}
