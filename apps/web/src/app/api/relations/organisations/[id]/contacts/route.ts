import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import {
  createContactSchema,
  organizationIdSchema,
} from '$features/organizations/schemas/organization.schemas';
import { createOrganizationContact } from '$features/organizations/server/organization-contact.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(
    auth.user,
    PERMISSIONS.ORGANIZATIONS.MANAGE,
  );
  if (!permission.success) return permission.response;
  const id = organizationIdSchema.safeParse((await params).id);
  if (!id.success) return apiErrors.notFound('Organisation introuvable');
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = createContactSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Informations du contact invalides',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await createOrganizationContact(id.data, parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
      201,
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'ORGANIZATION_CONTACT_CREATE',
      request,
    });
  }
}
