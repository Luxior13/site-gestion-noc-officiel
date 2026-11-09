import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { passagePersonQuerySchema } from '$features/passages/schemas/passage.schemas';
import { searchPassagePersons } from '$features/passages/server/passage.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import { apiErrors, apiSuccess } from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

/**
 * Records of the Répertoire to pick for a passage, by pseudo or name: only
 * who manages the teams adds a passage, so only they search here.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.TEAMS.MANAGE);
  if (!permission.success) return permission.response;
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
