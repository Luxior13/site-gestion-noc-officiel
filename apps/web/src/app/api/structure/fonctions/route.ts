import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { STRUCTURE_SCOPE } from '$features/member-functions/member-function.constants';
import { structureFunctionSchemas } from '$features/member-functions/schemas/member-function.schemas';
import {
  createFunction,
  listFunctions,
} from '$features/member-functions/server/member-function.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

/** The functions of the structure, tab of Bureau & staff (9 November 2026). */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.STAFF.VIEW);
  if (!permission.success) return permission.response;

  try {
    return apiSuccess(await listFunctions(STRUCTURE_SCOPE));
  } catch (error) {
    return serviceErrorResponse(error, { action: 'FUNCTION_LIST', request });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.STAFF.MANAGE);
  if (!permission.success) return permission.response;
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = structureFunctionSchemas.create.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Informations de la fonction invalides',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await createFunction(STRUCTURE_SCOPE, parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
      201,
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'FUNCTION_CREATE', request });
  }
}
