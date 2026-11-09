import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { getStaffSummary } from '$features/staff/server/staff.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import { apiSuccess } from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

/** The counts of the tabs of Bureau & staff (9 November 2026). */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.STAFF.VIEW);
  if (!permission.success) return permission.response;

  try {
    return apiSuccess(await getStaffSummary());
  } catch (error) {
    return serviceErrorResponse(error, { action: 'STAFF_SUMMARY', request });
  }
}
