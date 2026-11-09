import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { STRUCTURE_SCOPE } from '$features/member-functions/member-function.constants';
import { addCommonMemberFunctionsSchema } from '$features/member-functions/schemas/member-function.schemas';
import { addCommonFunctions } from '$features/member-functions/server/member-function.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import { apiErrors, apiSuccess, parseJsonBody } from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

/** Président, Trésorier, Graphiste… for a structure without any function. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.STAFF.MANAGE);
  if (!permission.success) return permission.response;
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  if (!addCommonMemberFunctionsSchema.safeParse(body.data).success)
    return apiErrors.validation('Demande invalide');

  try {
    return apiSuccess(
      await addCommonFunctions(STRUCTURE_SCOPE, {
        actor: auth.user,
        session: auth.session,
      }),
      201,
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'FUNCTION_CREATE', request });
  }
}
