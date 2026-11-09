import { FEATURES } from '$constants/feature-registry.constants';

// Read by the person's record to name and show its Parcours tab: kept apart
// from the passages' helpers, which bring the date parsing along.

/**
 * Which lists a reader of the Parcours tab may see, and so open from a line:
 * the teams' rosters, the structure's Effectif (9 November 2026).
 */
export type JourneyReach = Readonly<{ structure: boolean; teams: boolean }>;

/** « le Roster de chaque équipe et l’Effectif de Bureau & staff ». */
export const journeySourcesOf = (reach: JourneyReach): string =>
  [
    reach.teams && 'le Roster de chaque équipe',
    reach.structure && `l’Effectif de ${FEATURES.staff.label}`,
  ]
    .filter(Boolean)
    .join(' et ');
