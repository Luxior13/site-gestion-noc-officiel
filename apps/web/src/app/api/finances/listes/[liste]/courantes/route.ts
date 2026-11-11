import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { addCommonTreasuryChoices } from '$features/treasury-lists/server/treasury-list.service';
import { treasuryListOfSlug } from '$features/treasury-lists/treasury-list.constants';
import { requireAuth, requirePermission } from '$server/api-auth';
import { apiErrors, apiSuccess } from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

type RouteParams = { params: Promise<{ liste: string }> };

/** Fills an empty list with its common values. */
export async function POST(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(
    auth.user,
    PERMISSIONS.FINANCIAL_ACCOUNTS.MANAGE,
  );
  if (!permission.success) return permission.response;
  const list = treasuryListOfSlug((await params).liste);
  if (!list) return apiErrors.notFound('Liste introuvable');

  try {
    return apiSuccess(
      await addCommonTreasuryChoices(list, {
        actor: auth.user,
        session: auth.session,
      }),
      201,
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'TREASURY_CHOICE_COMMON',
      request,
    });
  }
}
