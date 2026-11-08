import type { NavigationIconName } from '$constants/navigation-icon.constants';
import type { NavigationSpaceTone } from '$constants/navigation-theme.constants';

export type RoadmapAreaId =
  | 'today'
  | 'people'
  | 'esport'
  | 'finance'
  | 'relations'
  | 'structure'
  | 'system';
export type RoadmapPhaseId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type RoadmapArea = {
  description: string;
  icon: NavigationIconName;
  id: RoadmapAreaId;
  label: string;
  tone: NavigationSpaceTone;
};
export type RoadmapPhase = {
  description: string;
  id: RoadmapPhaseId;
  label: string;
};
type RoadmapPlannedTab = {
  /** Chantier delivering (or completing) this tab, when not the page's own. */
  chantier?: string;
  label: string;
  /**
   * Where the tab's content is modified, when nothing is modified on the page
   * itself: the tab only reads it (owner, 8 November 2026). A mixed tab has none.
   */
  managedIn?: string;
  /** Null when the tab is already delivered. */
  phase: RoadmapPhaseId | null;
  summary: string;
  /** What a delivered tab still gains from its chantier. */
  upcoming?: string;
};
export type RoadmapPlannedPage = {
  area: RoadmapAreaId;
  /** Chantier delivering (or completing) the page. */
  chantier?: string;
  name: string;
  /** Null when the page is already delivered. */
  phase: RoadmapPhaseId | null;
  summary?: string;
  tabs?: readonly RoadmapPlannedTab[];
  /** What a delivered page still gains from its chantier. */
  upcoming?: string;
};
/** What remains of a page on the roadmap: only work still to deliver. */
export type RoadmapPlanTab = {
  chantier?: string;
  label: string;
  managedIn?: string;
  phase: RoadmapPhaseId;
  summary: string;
};
export type RoadmapPlanPage = {
  area: RoadmapAreaId;
  chantier?: string;
  name: string;
  /** Earliest suggested step of what remains on the page. */
  phase: RoadmapPhaseId;
  summary?: string;
  tabs?: readonly RoadmapPlanTab[];
};
export type RoadmapCoverageRow = {
  chantiers: readonly string[];
  /** Where the subject lives when this site does not handle it. */
  outside?: string;
  subject: string;
};
/** A chantier describes only what remains to build (owner, 8 November 2026). */
export type RoadmapItem = {
  area: RoadmapAreaId;
  dependsOn: readonly string[];
  description: string;
  doneWhen: string;
  firstRelease: string;
  id: string;
  later: string;
  /** Historical planning references, never links to operational pages. */
  legacyHrefs?: readonly string[];
  phase: RoadmapPhaseId;
  title: string;
};
