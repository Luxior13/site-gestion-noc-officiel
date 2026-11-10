import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { listEsportScopeOptions } from '$features/users/server/user-esport-scope-options';
import { requireAuth, requirePermission } from '$server/api-auth';
import { apiSuccess } from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

/**
 * Every game and team, to choose an account's Esport scope in its
 * authorizations (10 November 2026): for who reads accounts' access, whatever
 * their own Esport rights.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(
    auth.user,
    PERMISSIONS.USERS.VIEW_ACCESS,
  );
  if (!permission.success) return permission.response;

  try {
    return apiSuccess(await listEsportScopeOptions());
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'ESPORT_SCOPE_OPTIONS',
      request,
    });
  }
}
