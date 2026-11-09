import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { STRUCTURE_PASSAGES } from '$features/passages/passage.constants';
import {
  deletePassageSchema,
  passageIdSchema,
  updatePassageSchema,
} from '$features/passages/schemas/passage.schemas';
import {
  deletePassage,
  updatePassage,
} from '$features/passages/server/passage.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

type RouteParams = { params: Promise<{ passageId: string }> };

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.STAFF.MANAGE);
  if (!permission.success) return permission.response;
  const passageId = passageIdSchema.safeParse((await params).passageId);
  if (!passageId.success) return apiErrors.notFound('Passage introuvable');
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = updatePassageSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Informations du passage invalides',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await updatePassage(STRUCTURE_PASSAGES, passageId.data, parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'PASSAGE_UPDATE', request });
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
  const passageId = passageIdSchema.safeParse((await params).passageId);
  if (!passageId.success) return apiErrors.notFound('Passage introuvable');
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = deletePassageSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation('Version du passage invalide');
  }

  try {
    return apiSuccess(
      await deletePassage(
        STRUCTURE_PASSAGES,
        passageId.data,
        parsed.data.expectedVersion,
        { actor: auth.user, session: auth.session },
      ),
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'PASSAGE_DELETE', request });
  }
}
