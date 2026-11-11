import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { getOperationCapabilities } from '$features/operations/operation.permissions';
import {
  operationIdSchema,
  operationVersionSchema,
  updateOperationSchema,
} from '$features/operations/schemas/operation.schemas';
import {
  deleteOperation,
  getOperation,
  updateOperation,
} from '$features/operations/server/operation.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

type RouteParams = { params: Promise<{ id: string }> };

const NOT_FOUND = 'Opération introuvable';

export async function GET(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.OPERATIONS.VIEW);
  if (!permission.success) return permission.response;
  const id = operationIdSchema.safeParse((await params).id);
  if (!id.success) return apiErrors.notFound(NOT_FOUND);

  try {
    return apiSuccess(
      await getOperation(id.data, {
        canViewPersons: getOperationCapabilities(auth.user).canViewPersons,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'OPERATION_READ', request });
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
    PERMISSIONS.OPERATIONS.MANAGE,
  );
  if (!permission.success) return permission.response;
  const id = operationIdSchema.safeParse((await params).id);
  if (!id.success) return apiErrors.notFound(NOT_FOUND);
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = updateOperationSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Informations de l’opération invalides',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await updateOperation(id.data, parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'OPERATION_UPDATE',
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
    PERMISSIONS.OPERATIONS.MANAGE,
  );
  if (!permission.success) return permission.response;
  const id = operationIdSchema.safeParse((await params).id);
  if (!id.success) return apiErrors.notFound(NOT_FOUND);
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = operationVersionSchema.safeParse(body.data);
  if (!parsed.success)
    return apiErrors.validation('Version de l’opération invalide');

  try {
    return apiSuccess(
      await deleteOperation(id.data, parsed.data.expectedVersion, {
        actor: auth.user,
        session: auth.session,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'OPERATION_DELETE',
      request,
    });
  }
}
