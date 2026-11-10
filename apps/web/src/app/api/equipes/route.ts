import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { createTeamSchema } from '$features/teams/schemas/team.schemas';
import { createTeam, listTeams } from '$features/teams/server/team.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { readActorEsportScope } from '$server/esport-scope';
import { serviceErrorResponse } from '$server/service-error';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.TEAMS.VIEW);
  if (!permission.success) return permission.response;

  try {
    return apiSuccess(await listTeams(await readActorEsportScope(auth.user)));
  } catch (error) {
    return serviceErrorResponse(error, { action: 'TEAM_LIST', request });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.TEAMS.MANAGE);
  if (!permission.success) return permission.response;
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = createTeamSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Informations de l’équipe invalides',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await createTeam(parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
      201,
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'TEAM_CREATE', request });
  }
}
