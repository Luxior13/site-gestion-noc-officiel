import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { passagePersonQuerySchema } from '$features/passages/schemas/passage.schemas';
import { searchPersonSuggestions } from '$features/persons/server/person-suggestions';
import { requireAuth, requirePermission } from '$server/api-auth';
import { apiErrors, apiSuccess } from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

/**
 * Records of the Répertoire to link to a contact of an organisation (11
 * November 2026): who manages the organisations and reads the Répertoire.
 * Other pseudos stay with the coordinates' right: names and pseudos only.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  for (const key of [
    PERMISSIONS.ORGANIZATIONS.MANAGE,
    PERMISSIONS.PERSONS.VIEW,
  ]) {
    const permission = requirePermission(auth.user, key);
    if (!permission.success) return permission.response;
  }
  const query = passagePersonQuerySchema.safeParse(
    request.nextUrl.searchParams.get('q') ?? '',
  );
  if (!query.success) return apiErrors.validation('Recherche invalide');

  try {
    return apiSuccess(
      await searchPersonSuggestions(query.data, { otherNicknames: false }),
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'ORGANIZATION_PERSON_SEARCH',
      request,
    });
  }
}
