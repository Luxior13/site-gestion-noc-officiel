import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { createTreasuryChoiceSchema } from '$features/treasury-lists/schemas/treasury-list.schemas';
import {
  createTreasuryChoice,
  listTreasuryChoices,
} from '$features/treasury-lists/server/treasury-list.service';
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

const NOT_FOUND = 'Liste introuvable';

/** Read on the Comptes page, and by who enters operations. */
export async function GET(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const accounts = requirePermission(
    auth.user,
    PERMISSIONS.FINANCIAL_ACCOUNTS.VIEW,
  );
  if (!accounts.success) {
    const operations = requirePermission(
      auth.user,
      PERMISSIONS.OPERATIONS.VIEW,
    );
    if (!operations.success) return operations.response;
  }
  const list = treasuryListOfSlug((await params).liste);
  if (!list) return apiErrors.notFound(NOT_FOUND);

  try {
    return apiSuccess(await listTreasuryChoices(list));
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'TREASURY_CHOICE_LIST',
      request,
    });
  }
}

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
  if (!list) return apiErrors.notFound(NOT_FOUND);
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = createTreasuryChoiceSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Valeur invalide',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await createTreasuryChoice(list, parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
      201,
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'TREASURY_CHOICE_CREATE',
      request,
    });
  }
}
