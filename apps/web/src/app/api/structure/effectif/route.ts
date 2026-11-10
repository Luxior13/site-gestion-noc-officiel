import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { STRUCTURE_PASSAGES } from '$features/passages/passage.constants';
import { createPassageSchema } from '$features/passages/schemas/passage.schemas';
import {
  createPassage,
  getRoster,
} from '$features/passages/server/passage.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { FULL_ESPORT_SCOPE } from '$server/esport-scope';
import { serviceErrorResponse } from '$server/service-error';

/**
 * The Effectif of the structure, on Bureau & staff (9 November 2026): every
 * passage without team, and the structure's functions.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.STAFF.VIEW);
  if (!permission.success) return permission.response;

  try {
    // The structure is outside the Esport pole and its scope.
    return apiSuccess(await getRoster(STRUCTURE_PASSAGES, FULL_ESPORT_SCOPE));
  } catch (error) {
    return serviceErrorResponse(error, { action: 'PASSAGE_LIST', request });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.STAFF.MANAGE);
  if (!permission.success) return permission.response;
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = createPassageSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Informations du passage invalides',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await createPassage(STRUCTURE_PASSAGES, parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
      201,
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'PASSAGE_CREATE', request });
  }
}
