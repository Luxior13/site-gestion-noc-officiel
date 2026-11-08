import { getRoadmapItem } from './roadmap.constants';
import { MANAGEMENT_SITE_PLAN } from './roadmap-site-plan-management.data';
import { MEMBERS_SITE_PLAN } from './roadmap-site-plan-members.data';
import type {
  RoadmapPhaseId,
  RoadmapPlannedPage,
  RoadmapPlanPage,
  RoadmapPlanTab,
} from './types/roadmap.types';

/**
 * Every page of the target site, with its planned tabs. `phase: null` means
 * already delivered. docs/propositions/feuille-de-route.md prints the same plan.
 */
export const ROADMAP_SITE_PLAN: readonly RoadmapPlannedPage[] = [
  ...MEMBERS_SITE_PLAN,
  ...MANAGEMENT_SITE_PLAN,
];

type PlanLink = {
  chantier?: string;
  phase: RoadmapPhaseId | null;
  upcoming?: string;
};

/** A new page or tab keeps its step; a delivered one, its chantier's. */
const getRemainingStep = (link: PlanLink): RoadmapPhaseId | null =>
  link.phase ??
  (link.upcoming && link.chantier
    ? (getRoadmapItem(link.chantier)?.phase ?? null)
    : null);

/**
 * What the roadmap shows of the plan (owner's decision, 8 November 2026):
 * only what remains to deliver. A delivered page or tab leaves it, unless a
 * chantier still completes it; it then shows that addition alone.
 */
export const ROADMAP_PLANNED_PAGES: readonly RoadmapPlanPage[] =
  ROADMAP_SITE_PLAN.flatMap((page) => {
    const tabs = (page.tabs ?? []).flatMap((tab): RoadmapPlanTab[] => {
      const phase = getRemainingStep(tab);

      return phase === null
        ? []
        : [
            {
              ...(tab.chantier ? { chantier: tab.chantier } : {}),
              label: tab.label,
              ...(tab.managedIn ? { managedIn: tab.managedIn } : {}),
              phase,
              summary: tab.upcoming ?? tab.summary,
            },
          ];
    });
    const own = getRemainingStep(page);
    const phase = tabs.reduce<RoadmapPhaseId | null>(
      (earliest, tab) =>
        earliest === null || tab.phase < earliest ? tab.phase : earliest,
      own,
    );
    if (phase === null) return [];
    const summary = page.phase === null ? page.upcoming : page.summary;

    return [
      {
        area: page.area,
        ...(own !== null && page.chantier ? { chantier: page.chantier } : {}),
        name: page.name,
        phase,
        ...(summary ? { summary } : {}),
        ...(tabs.length ? { tabs } : {}),
      },
    ];
  });
