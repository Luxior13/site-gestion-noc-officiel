import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import {
  changePassageFunctionSchema,
  passageIdSchema,
} from '$features/passages/schemas/passage.schemas';
import { changePassageFunction } from '$features/passages/server/passage.service';
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

/** « Changer de fonction »: the passage ends, another begins at that date. */
export async function POST(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.TEAMS.MANAGE);
  if (!permission.success) return permission.response;
  const { id, passageId } = await params;
  const teamId = teamIdSchema.safeParse(id);
  const parsedPassageId = passageIdSchema.safeParse(passageId);
  if (!teamId.success || !parsedPassageId.success)
    return apiErrors.notFound('Passage introuvable');
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = changePassageFunctionSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Changement de fonction invalide',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await changePassageFunction(
        teamId.data,
        parsedPassageId.data,
        parsed.data,
        { actor: auth.user, session: auth.session },
      ),
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'PASSAGE_CHANGE', request });
  }
}
