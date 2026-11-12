import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { passagePersonQuerySchema } from '$features/passages/schemas/passage.schemas';
import { searchPersonSuggestions } from '$features/persons/server/person-suggestions';
import { requireAuth, requirePermission } from '$server/api-auth';
import { apiErrors, apiSuccess } from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

/**
 * Records of the Répertoire to add to a line-up as a stand-in (11 November
 * 2026), by pseudo or name, as for a Roster: who holds the tournaments.
 * Other pseudos stay with the coordinates' right.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(
    auth.user,
    PERMISSIONS.TOURNAMENTS.MANAGE,
  );
  if (!permission.success) return permission.response;
  const query = passagePersonQuerySchema.safeParse(
    request.nextUrl.searchParams.get('q') ?? '',
  );
  if (!query.success) return apiErrors.validation('Recherche invalide');

  try {
    return apiSuccess(
      await searchPersonSuggestions(query.data, {
        otherNicknames: requirePermission(
          auth.user,
          PERMISSIONS.PERSONS.VIEW_CONTACT,
        ).success,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'TOURNAMENT_PERSON_SEARCH',
      request,
    });
  }
}
