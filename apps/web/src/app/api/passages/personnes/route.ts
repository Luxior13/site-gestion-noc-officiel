import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { passagePersonQuerySchema } from '$features/passages/schemas/passage.schemas';
import { searchPassagePersons } from '$features/passages/server/passage.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import { apiErrors, apiSuccess } from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

/**
 * Records of the Répertoire to pick for a passage, by pseudo or name: only
 * who adds passages searches here, in a team's roster (`teams:manage`) or in
 * the structure's (`staff:manage`, 9 November 2026).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.TEAMS.MANAGE);
  if (
    !permission.success &&
    !requirePermission(auth.user, PERMISSIONS.STAFF.MANAGE).success
  )
    return permission.response;
  const query = passagePersonQuerySchema.safeParse(
    request.nextUrl.searchParams.get('q') ?? '',
  );
  if (!query.success) return apiErrors.validation('Recherche invalide');

  try {
    return apiSuccess(await searchPassagePersons(query.data));
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'PASSAGE_PERSON_SEARCH',
      request,
    });
  }
}
