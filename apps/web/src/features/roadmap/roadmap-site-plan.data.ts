import { MANAGEMENT_SITE_PLAN } from './roadmap-site-plan-management.data';
import { MEMBERS_SITE_PLAN } from './roadmap-site-plan-members.data';
import type { RoadmapPlannedPage } from './types/roadmap.types';

/**
 * Every page of the target site, with its planned tabs. `phase: null` means
 * already delivered. docs/propositions/feuille-de-route.md prints the same plan.
 */
export const ROADMAP_SITE_PLAN: readonly RoadmapPlannedPage[] = [
  ...MEMBERS_SITE_PLAN,
  ...MANAGEMENT_SITE_PLAN,
];
