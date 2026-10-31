import { NextResponse } from 'next/server';

import { apiErrors, apiSuccess } from '$server/api-response';
import { deleteCurrentMfaChallenge } from '$server/mfa';
import type { ApiErrorResponse, ApiSuccessResponse } from '$types/api.types';

export async function DELETE(): Promise<
  NextResponse<ApiSuccessResponse<null> | ApiErrorResponse>
> {
  try {
    await deleteCurrentMfaChallenge();

    return apiSuccess(null);
  } catch (error) {
    return apiErrors.internal('MFA_CHALLENGE_DELETE', error);
  }
}
