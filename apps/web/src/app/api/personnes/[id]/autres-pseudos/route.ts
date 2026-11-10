import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { createOtherNicknameSchema } from '$features/persons/schemas/person-nickname.schemas';
import { addPersonOtherNickname } from '$features/persons/server/person.service';
import { handlePersonApiError } from '$features/persons/server/person-api';
import { assertPersonFeatureReady } from '$features/persons/server/person-deletion';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';

type RouteContext = { params: Promise<{ id: string }> };

/** Adds another pseudo to a record, with the identity's right. */
export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.PERSONS.UPDATE);
  if (!permission.success) return permission.response;
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = createOtherNicknameSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Pseudo invalide',
      zodErrorDetails(parsed.error),
    );
  }
  const { id } = await context.params;

  try {
    await assertPersonFeatureReady();

    return apiSuccess(
      {
        person: await addPersonOtherNickname(id, parsed.data, {
          ...auth.user,
          session: auth.session,
        }),
      },
      201,
    );
  } catch (error) {
    return handlePersonApiError('PERSON_OTHER_NICKNAME_CREATE', error, request);
  }
}
