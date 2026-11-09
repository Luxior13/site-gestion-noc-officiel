import { apiFetchJson } from '$utils/api.utils';

import type { StaffSummary } from './types/staff.types';

export const fetchStaffSummary = (
  signal?: AbortSignal,
): Promise<StaffSummary> =>
  apiFetchJson<StaffSummary>('/api/structure', { cache: 'no-store', signal });
