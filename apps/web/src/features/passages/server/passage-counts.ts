import 'server-only';

import type { Prisma } from '@prisma/client';

import type { TeamPeopleCounts } from '../passage.ui';

/** Today, in the calendar the dates of a passage are kept in. */
const todayDate = (): Date =>
  new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);

/**
 * The counts of a place's tabs, each person once whatever their functions:
 * there today (Roster or Effectif), with an ended passage (former members,
 * 9 November 2026). `teamId` null: the structure's passages.
 */
export const countPlacePeople = async (
  client: Prisma.TransactionClient,
  teamId: string | null,
): Promise<TeamPeopleCounts> => {
  const today = todayDate();
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
    formerCount: await people({ endOn: { lt: today } }),
    memberCount: await people({
      OR: [{ endOn: null }, { endOn: { gte: today } }],
      startOn: { lte: today },
    }),
  };
};
