import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { reorderTreasuryChoicesSchema } from '$features/treasury-lists/schemas/treasury-list.schemas';
import { reorderTreasuryChoices } from '$features/treasury-lists/server/treasury-list.service';
import { treasuryListOfSlug } from '$features/treasury-lists/treasury-list.constants';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

type RouteParams = { params: Promise<{ liste: string }> };

/** A new order of one block of a list, as its managers dragged it. */
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
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = reorderTreasuryChoicesSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Ordre invalide',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await reorderTreasuryChoices(list, parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'TREASURY_CHOICE_REORDER',
      request,
    });
  }
}
