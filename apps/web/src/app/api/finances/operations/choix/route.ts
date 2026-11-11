import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { getOperationChoices } from '$features/operations/server/operation-choices.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import { apiSuccess } from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

/**
 * What the window of an operation offers (11 November 2026): who enters
 * operations reads the accounts, the lists, the games and teams and the
 * organisations by name.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(
    auth.user,
    PERMISSIONS.OPERATIONS.MANAGE,
  );
  if (!permission.success) return permission.response;

  try {
    return apiSuccess(await getOperationChoices());
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'OPERATION_CHOICES',
      request,
    });
  }
}
