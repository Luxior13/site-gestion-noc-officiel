import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { createFinancialAccountSchema } from '$features/financial-accounts/schemas/financial-account.schemas';
import {
  createFinancialAccount,
  getFinancialAccountsOverview,
} from '$features/financial-accounts/server/financial-account.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(
    auth.user,
    PERMISSIONS.FINANCIAL_ACCOUNTS.VIEW,
  );
  if (!permission.success) return permission.response;

  try {
    return apiSuccess(await getFinancialAccountsOverview());
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'FINANCIAL_ACCOUNT_LIST',
      request,
    });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(
    auth.user,
    PERMISSIONS.FINANCIAL_ACCOUNTS.MANAGE,
  );
  if (!permission.success) return permission.response;
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = createFinancialAccountSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Informations du compte invalides',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await createFinancialAccount(parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
      201,
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'FINANCIAL_ACCOUNT_CREATE',
      request,
    });
  }
}
