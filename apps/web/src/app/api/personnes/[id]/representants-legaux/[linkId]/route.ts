import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import {
  deletePersonRelativeSchema,
  updateLegalGuardianSchema,
} from '$features/persons/schemas/person-relatives.schemas';
import {
  deletePersonLegalGuardian,
  updatePersonLegalGuardian,
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

type RouteContext = { params: Promise<{ id: string; linkId: string }> };

/** Changes the relation of a legal representative, or removes the link. */
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
  const parsed = updateLegalGuardianSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Représentant légal invalide',
      zodErrorDetails(parsed.error),
    );
  }
  const { id, linkId } = await context.params;

  try {
    await assertPersonFeatureReady();

    return apiSuccess({
      person: await updatePersonLegalGuardian(id, linkId, parsed.data, {
        ...auth.user,
        session: auth.session,
      }),
    });
  } catch (error) {
    return handlePersonApiError('PERSON_LEGAL_GUARDIAN_UPDATE', error, request);
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
  const parsed = deletePersonRelativeSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Suppression invalide',
      zodErrorDetails(parsed.error),
    );
  }
  const { id, linkId } = await context.params;

  try {
    await assertPersonFeatureReady();

    return apiSuccess({
      person: await deletePersonLegalGuardian(id, linkId, parsed.data, {
        ...auth.user,
        session: auth.session,
      }),
    });
  } catch (error) {
    return handlePersonApiError('PERSON_LEGAL_GUARDIAN_DELETE', error, request);
  }
}
