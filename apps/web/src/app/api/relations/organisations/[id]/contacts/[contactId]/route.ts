import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import {
  organizationIdSchema,
  updateContactSchema,
  versionSchema,
} from '$features/organizations/schemas/organization.schemas';
import {
  deleteOrganizationContact,
  updateOrganizationContact,
} from '$features/organizations/server/organization-contact.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

type RouteParams = { params: Promise<{ contactId: string; id: string }> };

const NOT_FOUND = 'Contact introuvable';

export async function PATCH(
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
  const { contactId, id } = await params;
  const organization = organizationIdSchema.safeParse(id);
  const contact = organizationIdSchema.safeParse(contactId);
  if (!organization.success || !contact.success)
    return apiErrors.notFound(NOT_FOUND);
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = updateContactSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Informations du contact invalides',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await updateOrganizationContact(
        organization.data,
        contact.data,
        parsed.data,
        { actor: auth.user, session: auth.session },
      ),
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'ORGANIZATION_CONTACT_UPDATE',
      request,
    });
  }
}

export async function DELETE(
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
  const { contactId, id } = await params;
  const organization = organizationIdSchema.safeParse(id);
  const contact = organizationIdSchema.safeParse(contactId);
  if (!organization.success || !contact.success)
    return apiErrors.notFound(NOT_FOUND);
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = versionSchema.safeParse(body.data);
  if (!parsed.success)
    return apiErrors.validation('Version du contact invalide');

  try {
    return apiSuccess(
      await deleteOrganizationContact(
        organization.data,
        contact.data,
        parsed.data.expectedVersion,
        { actor: auth.user, session: auth.session },
      ),
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'ORGANIZATION_CONTACT_DELETE',
      request,
    });
  }
}
