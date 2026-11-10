import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import {
  deleteOtherNicknameSchema,
  updateOtherNicknameSchema,
} from '$features/persons/schemas/person-nickname.schemas';
import {
  deletePersonOtherNickname,
  updatePersonOtherNickname,
} from '$features/persons/server/person.service';
import { handlePersonApiError } from '$features/persons/server/person-api';
import { assertPersonFeatureReady } from '$features/persons/server/person-deletion';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';

type RouteContext = { params: Promise<{ id: string; nicknameId: string }> };

/** Corrects or removes another pseudo of a record. */
export async function PATCH(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(
    auth.user,
    PERMISSIONS.PERSONS.UPDATE_CONTACT,
  );
  if (!permission.success) return permission.response;
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = updateOtherNicknameSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Pseudo invalide',
      zodErrorDetails(parsed.error),
    );
  }
  const { id, nicknameId } = await context.params;

  try {
    await assertPersonFeatureReady();

    return apiSuccess({
      person: await updatePersonOtherNickname(id, nicknameId, parsed.data, {
        ...auth.user,
        session: auth.session,
      }),
    });
  } catch (error) {
    return handlePersonApiError('PERSON_OTHER_NICKNAME_UPDATE', error, request);
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(
    auth.user,
    PERMISSIONS.PERSONS.UPDATE_CONTACT,
  );
  if (!permission.success) return permission.response;
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = deleteOtherNicknameSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Suppression invalide',
      zodErrorDetails(parsed.error),
    );
  }
  const { id, nicknameId } = await context.params;

  try {
    await assertPersonFeatureReady();

    return apiSuccess({
      person: await deletePersonOtherNickname(id, nicknameId, parsed.data, {
        ...auth.user,
        session: auth.session,
      }),
    });
  } catch (error) {
    return handlePersonApiError('PERSON_OTHER_NICKNAME_DELETE', error, request);
  }
}
