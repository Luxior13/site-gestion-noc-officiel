import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { STRUCTURE_SCOPE } from '$features/member-functions/member-function.constants';
import {
  deleteMemberFunctionSchema,
  memberFunctionIdSchema,
  structureFunctionSchemas,
} from '$features/member-functions/schemas/member-function.schemas';
import {
  deleteFunction,
  updateFunction,
} from '$features/member-functions/server/member-function.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

type RouteParams = { params: Promise<{ functionId: string }> };

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.STAFF.MANAGE);
  if (!permission.success) return permission.response;
  const functionId = memberFunctionIdSchema.safeParse(
    (await params).functionId,
  );
  if (!functionId.success) return apiErrors.notFound('Fonction introuvable');
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = structureFunctionSchemas.update.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Informations de la fonction invalides',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await updateFunction(STRUCTURE_SCOPE, functionId.data, parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'FUNCTION_UPDATE', request });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.STAFF.MANAGE);
  if (!permission.success) return permission.response;
  const functionId = memberFunctionIdSchema.safeParse(
    (await params).functionId,
  );
  if (!functionId.success) return apiErrors.notFound('Fonction introuvable');
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = deleteMemberFunctionSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation('Version de la fonction invalide');
  }

  try {
    return apiSuccess(
      await deleteFunction(
        STRUCTURE_SCOPE,
        functionId.data,
        parsed.data.expectedVersion,
        { actor: auth.user, session: auth.session },
      ),
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'FUNCTION_DELETE', request });
  }
}
