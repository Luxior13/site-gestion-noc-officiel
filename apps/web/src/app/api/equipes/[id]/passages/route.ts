import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { createPassageSchema } from '$features/passages/schemas/passage.schemas';
import {
  createPassage,
  getTeamRoster,
} from '$features/passages/server/passage.service';
import { teamIdSchema } from '$features/teams/schemas/team.schemas';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

type RouteParams = { params: Promise<{ id: string }> };

/** The roster of a team, every passage, and the functions of its game. */
export async function GET(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.TEAMS.VIEW);
  if (!permission.success) return permission.response;
  const teamId = teamIdSchema.safeParse((await params).id);
  if (!teamId.success) return apiErrors.notFound('Équipe introuvable');

  try {
    return apiSuccess(await getTeamRoster(teamId.data));
  } catch (error) {
    return serviceErrorResponse(error, { action: 'PASSAGE_LIST', request });
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.TEAMS.MANAGE);
  if (!permission.success) return permission.response;
  const teamId = teamIdSchema.safeParse((await params).id);
  if (!teamId.success) return apiErrors.notFound('Équipe introuvable');
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = createPassageSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Informations du passage invalides',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await createPassage(teamId.data, parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
      201,
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'PASSAGE_CREATE', request });
  }
}
