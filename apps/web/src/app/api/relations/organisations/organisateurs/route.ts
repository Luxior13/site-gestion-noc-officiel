import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { organizerSchema } from '$features/organizations/schemas/organization.schemas';
import { addOrganizer } from '$features/organizations/server/organization.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

/**
 * A tournament's organiser typed by its name (12 November 2026): the
 * organisation of that name becomes an Organisateur, or is added as one.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(
    auth.user,
    PERMISSIONS.ORGANIZATIONS.MANAGE,
  );
  if (!permission.success) return permission.response;
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = organizerSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Nom de l’organisateur invalide',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    const added = await addOrganizer(parsed.data.name, {
      actor: auth.user,
      session: auth.session,
    });

    return apiSuccess(added, added.outcome === 'created' ? 201 : 200);
  } catch (error) {
    return serviceErrorResponse(error, { action: 'ORGANIZER_ADD', request });
  }
}
