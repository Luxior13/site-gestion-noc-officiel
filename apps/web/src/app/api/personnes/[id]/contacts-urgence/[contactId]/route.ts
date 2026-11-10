import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import {
  deletePersonRelativeSchema,
  updateEmergencyContactSchema,
} from '$features/persons/schemas/person-relatives.schemas';
import {
  deletePersonEmergencyContact,
  updatePersonEmergencyContact,
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

type RouteContext = { params: Promise<{ contactId: string; id: string }> };

/** Corrects or removes an emergency contact of a record. */
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
  const parsed = updateEmergencyContactSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Contact d’urgence invalide',
      zodErrorDetails(parsed.error),
    );
  }
  const { contactId, id } = await context.params;

  try {
    await assertPersonFeatureReady();

    return apiSuccess({
      person: await updatePersonEmergencyContact(id, contactId, parsed.data, {
        ...auth.user,
        session: auth.session,
      }),
    });
  } catch (error) {
    return handlePersonApiError(
      'PERSON_EMERGENCY_CONTACT_UPDATE',
      error,
      request,
    );
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
  const { contactId, id } = await context.params;

  try {
    await assertPersonFeatureReady();

    return apiSuccess({
      person: await deletePersonEmergencyContact(id, contactId, parsed.data, {
        ...auth.user,
        session: auth.session,
      }),
    });
  } catch (error) {
    return handlePersonApiError(
      'PERSON_EMERGENCY_CONTACT_DELETE',
      error,
      request,
    );
  }
}
