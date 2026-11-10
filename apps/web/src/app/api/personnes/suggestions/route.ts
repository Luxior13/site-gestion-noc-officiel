import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { passagePersonQuerySchema } from '$features/passages/schemas/passage.schemas';
import { searchPersonSuggestions } from '$features/persons/server/person-suggestions';
import { requireAuth, requirePermission } from '$server/api-auth';
import { apiErrors, apiSuccess } from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

/**
 * Records of the Répertoire to link as a legal representative, by pseudo or
 * name (10 November 2026): only who writes the coordinates searches here.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(
    auth.user,
    PERMISSIONS.PERSONS.UPDATE_CONTACT,
  );
  if (!permission.success) return permission.response;
  const query = passagePersonQuerySchema.safeParse(
    request.nextUrl.searchParams.get('q') ?? '',
  );
  if (!query.success) return apiErrors.validation('Recherche invalide');

  try {
    return apiSuccess(await searchPersonSuggestions(query.data));
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'PERSON_SUGGESTION_SEARCH',
      request,
    });
  }
}
