import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import {
  deleteFinancialAccountSchema,
  financialAccountIdSchema,
  updateFinancialAccountSchema,
} from '$features/financial-accounts/schemas/financial-account.schemas';
import {
  deleteFinancialAccount,
  getFinancialAccount,
  updateFinancialAccount,
} from '$features/financial-accounts/server/financial-account.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(
    auth.user,
    PERMISSIONS.FINANCIAL_ACCOUNTS.VIEW,
  );
  if (!permission.success) return permission.response;
  const id = financialAccountIdSchema.safeParse((await params).id);
  if (!id.success) return apiErrors.notFound('Compte introuvable');

  try {
    return apiSuccess(await getFinancialAccount(id.data));
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'FINANCIAL_ACCOUNT_READ',
      request,
    });
  }
}

export async function PATCH(
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
  const id = financialAccountIdSchema.safeParse((await params).id);
  if (!id.success) return apiErrors.notFound('Compte introuvable');
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = updateFinancialAccountSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Informations du compte invalides',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await updateFinancialAccount(id.data, parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'FINANCIAL_ACCOUNT_UPDATE',
      request,
    });
  }
}

export async function DELETE(
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
  const id = financialAccountIdSchema.safeParse((await params).id);
  if (!id.success) return apiErrors.notFound('Compte introuvable');
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = deleteFinancialAccountSchema.safeParse(body.data);
  if (!parsed.success)
    return apiErrors.validation('Version du compte invalide');

  try {
    return apiSuccess(
      await deleteFinancialAccount(id.data, parsed.data.expectedVersion, {
        actor: auth.user,
        session: auth.session,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'FINANCIAL_ACCOUNT_DELETE',
      request,
    });
  }
}
