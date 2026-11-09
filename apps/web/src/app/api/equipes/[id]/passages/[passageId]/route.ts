import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import {
  deletePassageSchema,
  passageIdSchema,
  updatePassageSchema,
} from '$features/passages/schemas/passage.schemas';
import {
  deletePassage,
  updatePassage,
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

type RouteParams = { params: Promise<{ id: string; passageId: string }> };

const readIds = async (
  params: RouteParams['params'],
): Promise<{ passageId: string; teamId: string } | null> => {
  const { id, passageId } = await params;
  const teamId = teamIdSchema.safeParse(id);
  const parsedPassageId = passageIdSchema.safeParse(passageId);

  return teamId.success && parsedPassageId.success
    ? { passageId: parsedPassageId.data, teamId: teamId.data }
    : null;
};

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.TEAMS.MANAGE);
  if (!permission.success) return permission.response;
  const ids = await readIds(params);
  if (!ids) return apiErrors.notFound('Passage introuvable');
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = updatePassageSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Informations du passage invalides',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await updatePassage(
        { teamId: ids.teamId, type: 'team' },
        ids.passageId,
        parsed.data,
        { actor: auth.user, session: auth.session },
      ),
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'PASSAGE_UPDATE', request });
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
  const ids = await readIds(params);
  if (!ids) return apiErrors.notFound('Passage introuvable');
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = deletePassageSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation('Version du passage invalide');
  }

  try {
    return apiSuccess(
      await deletePassage(
        { teamId: ids.teamId, type: 'team' },
        ids.passageId,
        parsed.data.expectedVersion,
        { actor: auth.user, session: auth.session },
      ),
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'PASSAGE_DELETE', request });
  }
}
