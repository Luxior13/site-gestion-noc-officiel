import 'server-only';

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
 * The journey of a person (owner, 9 November 2026: « l'onglet Parcours,
 * maintenant, par rapport au Roster »): every passage, read from the rosters
 * where it is kept, with its team and the team's game; the earliest start
 * first. A passage of the structure (Bureau & staff, to come) has no team.
 */
export const getPersonJourney = async (
  personId: string,
): Promise<PersonJourney> => {
  const [person, rows] = await Promise.all([
    prisma.person.findUnique({ select: { id: true }, where: { id: personId } }),
    prisma.personPassage.findMany({
      orderBy: [{ startOn: 'asc' }, { id: 'asc' }],
      select: JOURNEY_SELECT,
      where: { personId },
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
