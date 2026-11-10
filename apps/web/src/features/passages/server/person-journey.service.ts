import 'server-only';

import type { Prisma } from '@prisma/client';

import { type EsportScope, teamScopeWhere } from '$server/esport-scope';
import { prisma } from '$server/prisma';
import { serviceErrors } from '$server/service-error';
import { normalizeApproximateDate } from '$utils/approximate-date.utils';

import type { JourneyItem, PersonJourney } from '../types/passage.types';

const dateOnly = (value: Date): string => value.toISOString().slice(0, 10);

const JOURNEY_SELECT = {
  endOn: true,
  endPrecision: true,
  id: true,
  memberFunction: {
    select: {
      id: true,
      isActive: true,
      kind: true,
      name: true,
      position: true,
    },
  },
  startOn: true,
  startPrecision: true,
  team: {
    select: {
      game: { select: { id: true, name: true } },
      id: true,
      isActive: true,
      name: true,
    },
  },
} as const;

/**
 * Which lists the reader may see: the structure's, and the rosters of the
 * teams in their Esport scope (none without `teams:view`).
 */
export type JourneyReach = Readonly<{
  structure: boolean;
  teams: EsportScope | null;
}>;

/**
 * The journey of a person (owner, 9 November 2026: « l'onglet Parcours,
 * maintenant, par rapport au Roster »): every passage, read from the rosters
 * where it is kept, with its team and the team's game; the earliest start
 * first. A passage of the structure (Bureau & staff) has no team. Only the
 * lists the reader may see are read.
 */
export const getPersonJourney = async (
  personId: string,
  reach: JourneyReach,
): Promise<PersonJourney> => {
  const places: Prisma.PersonPassageWhereInput[] = [
    ...(reach.teams
      ? [{ team: teamScopeWhere(reach.teams), teamId: { not: null } }]
      : []),
    ...(reach.structure ? [{ teamId: null }] : []),
  ];
  const [person, rows] = await Promise.all([
    prisma.person.findUnique({ select: { id: true }, where: { id: personId } }),
    places.length === 0
      ? Promise.resolve([])
      : prisma.personPassage.findMany({
          orderBy: [{ startOn: 'asc' }, { id: 'asc' }],
          select: JOURNEY_SELECT,
          where: { OR: places, personId },
        }),
  ]);
  if (!person)
    throw serviceErrors.notFound(
      'Cette fiche n’existe plus dans le Répertoire.',
    );

  return {
    passages: rows.map((row): JourneyItem => ({
      // Both dates at the start of their period, as the Roster gives them.
      end:
        row.endOn && row.endPrecision
          ? normalizeApproximateDate({
              date: dateOnly(row.endOn),
              precision: row.endPrecision,
            })
          : null,
      function: row.memberFunction,
      id: row.id,
      start: { date: dateOnly(row.startOn), precision: row.startPrecision },
      team: row.team
        ? {
            game: row.team.game,
            id: row.team.id,
            isActive: row.team.isActive,
            name: row.team.name,
          }
        : null,
    })),
  };
};
