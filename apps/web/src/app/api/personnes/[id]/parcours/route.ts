import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { passagePersonIdSchema } from '$features/passages/schemas/passage.schemas';
import { getPersonJourney } from '$features/passages/server/person-journey.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import { apiErrors, apiSuccess } from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * The journey of a person, for the Parcours tab of their record: the record
 * (`persons:view`) and the rosters it is read from (`teams:view`), with no
 * right of its own (9 November 2026).
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  for (const key of [PERMISSIONS.PERSONS.VIEW, PERMISSIONS.TEAMS.VIEW]) {
    const permission = requirePermission(auth.user, key);
    if (!permission.success) return permission.response;
  }
  const personId = passagePersonIdSchema.safeParse((await params).id);
  if (!personId.success) return apiErrors.notFound('Fiche introuvable');

  try {
    return apiSuccess(await getPersonJourney(personId.data));
  } catch (error) {
    return serviceErrorResponse(error, { action: 'PERSON_JOURNEY', request });
  }
}
