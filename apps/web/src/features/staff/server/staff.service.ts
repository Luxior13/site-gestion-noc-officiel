import 'server-only';

import { countPlacePeople } from '$features/passages/server/passage-counts';
import { prisma } from '$server/prisma';

import type { StaffSummary } from '../types/staff.types';

/**
 * What the tabs of Bureau & staff count, read with the page: each person
 * once, and the functions of the structure (those without game).
 */
export const getStaffSummary = async (): Promise<StaffSummary> => {
  const [people, functionCount] = await Promise.all([
    countPlacePeople(prisma, null),
    prisma.memberFunction.count({ where: { gameId: null } }),
  ]);

  return { ...people, functionCount };
};
