import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { createLegalGuardianSchema } from '$features/persons/schemas/person-relatives.schemas';
import { addPersonLegalGuardian } from '$features/persons/server/person.service';
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

/** Links another record as a legal representative (10 November 2026). */
export async function POST(
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
  const parsed = createLegalGuardianSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Représentant légal invalide',
      zodErrorDetails(parsed.error),
    );
  }
  const { id } = await context.params;

  try {
    await assertPersonFeatureReady();

    return apiSuccess(
      {
        person: await addPersonLegalGuardian(id, parsed.data, {
          ...auth.user,
          session: auth.session,
        }),
      },
      201,
    );
  } catch (error) {
    return handlePersonApiError('PERSON_LEGAL_GUARDIAN_CREATE', error, request);
  }
}
