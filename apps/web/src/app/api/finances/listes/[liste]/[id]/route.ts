import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import {
  treasuryChoiceIdSchema,
  treasuryChoiceVersionSchema,
  updateTreasuryChoiceSchema,
} from '$features/treasury-lists/schemas/treasury-list.schemas';
import {
  deleteTreasuryChoice,
  updateTreasuryChoice,
} from '$features/treasury-lists/server/treasury-list.service';
import { treasuryListOfSlug } from '$features/treasury-lists/treasury-list.constants';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { serviceErrorResponse } from '$server/service-error';

type RouteParams = { params: Promise<{ id: string; liste: string }> };

const NOT_FOUND = 'Valeur introuvable';

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(
    auth.user,
    PERMISSIONS.FINANCIAL_ACCOUNTS.MANAGE,
  );
  if (!permission.success) return permission.response;
  const { id, liste } = await params;
  const list = treasuryListOfSlug(liste);
  const choice = treasuryChoiceIdSchema.safeParse(id);
  if (!list || !choice.success) return apiErrors.notFound(NOT_FOUND);
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = updateTreasuryChoiceSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiErrors.validation(
      'Valeur invalide',
      zodErrorDetails(parsed.error),
    );
  }

  try {
    return apiSuccess(
      await updateTreasuryChoice(list, choice.data, parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'TREASURY_CHOICE_UPDATE',
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
    PERMISSIONS.FINANCIAL_ACCOUNTS.MANAGE,
  );
  if (!permission.success) return permission.response;
  const { id, liste } = await params;
  const list = treasuryListOfSlug(liste);
  const choice = treasuryChoiceIdSchema.safeParse(id);
  if (!list || !choice.success) return apiErrors.notFound(NOT_FOUND);
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = treasuryChoiceVersionSchema.safeParse(body.data);
  if (!parsed.success) return apiErrors.validation('Version invalide');

  try {
    return apiSuccess(
      await deleteTreasuryChoice(
        list,
        choice.data,
        parsed.data.expectedVersion,
        { actor: auth.user, session: auth.session },
      ),
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'TREASURY_CHOICE_DELETE',
      request,
    });
  }
}
