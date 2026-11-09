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
 * (`persons:view`) and the lists it is read from, with no right of its own
 * (9 November 2026): the teams' rosters (`teams:view`), the structure's
 * Effectif (`staff:view`); at least one, and only those passages.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const record = requirePermission(auth.user, PERMISSIONS.PERSONS.VIEW);
  if (!record.success) return record.response;
  const teams = requirePermission(auth.user, PERMISSIONS.TEAMS.VIEW);
  const structure = requirePermission(auth.user, PERMISSIONS.STAFF.VIEW);
  if (!teams.success && !structure.success) return teams.response;
  const personId = passagePersonIdSchema.safeParse((await params).id);
  if (!personId.success) return apiErrors.notFound('Fiche introuvable');

  try {
    return apiSuccess(
      await getPersonJourney(personId.data, {
        structure: structure.success,
        teams: teams.success,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'PERSON_JOURNEY', request });
  }
}
