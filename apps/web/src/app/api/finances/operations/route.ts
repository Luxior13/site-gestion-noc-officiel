import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { getOperationCapabilities } from '$features/operations/operation.permissions';
import {
  operationQuerySchema,
  operationSchema,
} from '$features/operations/schemas/operation.schemas';
import {
  createOperation,
  listOperations,
} from '$features/operations/server/operation.service';
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
  const permission = requirePermission(auth.user, PERMISSIONS.OPERATIONS.VIEW);
  if (!permission.success) return permission.response;
  const query = operationQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!query.success) return apiErrors.validation('Recherche invalide');

  try {
    return apiSuccess(
      await listOperations(query.data, {
        canViewPersons: getOperationCapabilities(auth.user).canViewPersons,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'OPERATION_LIST', request });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(
    auth.user,
    PERMISSIONS.OPERATIONS.MANAGE,
  );
  if (!permission.success) return permission.response;
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = operationSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Informations de l’opération invalides',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await createOperation(parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
      201,
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'OPERATION_CREATE',
      request,
    });
  }
}
