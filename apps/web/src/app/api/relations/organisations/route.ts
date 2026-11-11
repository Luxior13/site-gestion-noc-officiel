import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { createOrganizationSchema } from '$features/organizations/schemas/organization.schemas';
import {
  createOrganization,
  listOrganizations,
} from '$features/organizations/server/organization.service';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(
    auth.user,
    PERMISSIONS.ORGANIZATIONS.VIEW,
  );
  if (!permission.success) return permission.response;

  try {
    return apiSuccess(await listOrganizations());
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'ORGANIZATION_LIST',
      request,
    });
  }
}

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
  const parsed = createOrganizationSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Informations de l’organisation invalides',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await createOrganization(parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
      201,
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'ORGANIZATION_CREATE',
      request,
    });
  }
}
