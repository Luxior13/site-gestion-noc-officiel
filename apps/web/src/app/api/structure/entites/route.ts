import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import { createEntitySchema } from '$features/entities/schemas/entity.schemas';
import {
  createEntity,
  listEntities,
} from '$features/entities/server/entity.service';
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
  const permission = requirePermission(auth.user, PERMISSIONS.ENTITIES.VIEW);
  if (!permission.success) return permission.response;

  try {
    return apiSuccess(await listEntities());
  } catch (error) {
    return serviceErrorResponse(error, { action: 'ENTITY_LIST', request });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.ENTITIES.MANAGE);
  if (!permission.success) return permission.response;
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = createEntitySchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Informations de l’entité invalides',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await createEntity(parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
      201,
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'ENTITY_CREATE', request });
  }
}
