import type { NextRequest, NextResponse } from 'next/server';

import { hasPermission, PERMISSIONS } from '$constants/permissions.constants';
import {
  organizationIdSchema,
  updateOrganizationSchema,
  versionSchema,
} from '$features/organizations/schemas/organization.schemas';
import {
  deleteOrganization,
  getOrganization,
  updateOrganization,
} from '$features/organizations/server/organization.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

type RouteParams = { params: Promise<{ id: string }> };

const NOT_FOUND = 'Organisation introuvable';

export async function GET(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(
    auth.user,
    PERMISSIONS.ORGANIZATIONS.VIEW,
  );
  if (!permission.success) return permission.response;
  const id = organizationIdSchema.safeParse((await params).id);
  if (!id.success) return apiErrors.notFound(NOT_FOUND);

  try {
    // A contact's record of the Répertoire stays with who may read it.
    return apiSuccess(
      await getOrganization(id.data, {
        canViewPersons:
          auth.user.isProtected ||
          hasPermission(
            auth.user.role,
            PERMISSIONS.PERSONS.VIEW,
            auth.user.permissions,
          ),
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'ORGANIZATION_READ',
      request,
    });
  }
}

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
  const id = organizationIdSchema.safeParse((await params).id);
  if (!id.success) return apiErrors.notFound(NOT_FOUND);
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = updateOrganizationSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Informations de l’organisation invalides',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await updateOrganization(id.data, parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'ORGANIZATION_UPDATE',
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
  const id = organizationIdSchema.safeParse((await params).id);
  if (!id.success) return apiErrors.notFound(NOT_FOUND);
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = versionSchema.safeParse(body.data);
  if (!parsed.success)
    return apiErrors.validation('Version de l’organisation invalide');

  try {
    return apiSuccess(
      await deleteOrganization(id.data, parsed.data.expectedVersion, {
        actor: auth.user,
        session: auth.session,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'ORGANIZATION_DELETE',
      request,
    });
  }
}
