import 'server-only';

import type { Prisma } from '@prisma/client';

import type { TeamPeopleCounts } from '../passage.ui';
import {
  asPassageDay,
  currentPassageWhere,
  passageToday,
} from './passage-today';

/**
 * The counts of a place's tabs, each person once whatever their functions:
 * there today (Roster or Effectif), with an ended passage (former members,
 * 9 November 2026). `teamId` null: the structure's passages.
 */
export const countPlacePeople = async (
  client: Prisma.TransactionClient,
  teamId: string | null,
): Promise<TeamPeopleCounts> => {
  const today = passageToday();
  const people = async (
    where: Prisma.PersonPassageWhereInput,
  ): Promise<number> =>
    (
      await client.personPassage.findMany({
        distinct: ['personId'],
        select: { personId: true },
        where: { ...where, teamId },
      })
    ).length;

  return {
    formerCount: await people({ endOn: { lt: asPassageDay(today) } }),
    memberCount: await people(currentPassageWhere(today)),
  };
};
