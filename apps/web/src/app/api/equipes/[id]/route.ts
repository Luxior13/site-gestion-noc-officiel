import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import {
  deleteTeamSchema,
  teamIdSchema,
  updateTeamSchema,
} from '$features/teams/schemas/team.schemas';
import {
  deleteTeam,
  getTeam,
  updateTeam,
} from '$features/teams/server/team.service';
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
  const permission = requirePermission(auth.user, PERMISSIONS.TEAMS.VIEW);
  if (!permission.success) return permission.response;
  const id = teamIdSchema.safeParse((await params).id);
  if (!id.success) return apiErrors.notFound('Équipe introuvable');

  try {
    return apiSuccess(await getTeam(id.data));
  } catch (error) {
    return serviceErrorResponse(error, { action: 'TEAM_READ', request });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.TEAMS.MANAGE);
  if (!permission.success) return permission.response;
  const id = teamIdSchema.safeParse((await params).id);
  if (!id.success) return apiErrors.notFound('Équipe introuvable');
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = updateTeamSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Informations de l’équipe invalides',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await updateTeam(id.data, parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'TEAM_UPDATE', request });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.TEAMS.MANAGE);
  if (!permission.success) return permission.response;
  const id = teamIdSchema.safeParse((await params).id);
  if (!id.success) return apiErrors.notFound('Équipe introuvable');
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = deleteTeamSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation('Version de l’équipe invalide');
  }

  try {
    return apiSuccess(
      await deleteTeam(id.data, parsed.data.expectedVersion, {
        actor: auth.user,
        session: auth.session,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'TEAM_DELETE', request });
  }
}
