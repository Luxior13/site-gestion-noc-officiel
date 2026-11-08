import { getSearchTerms, includesSearchTerms } from '$utils/search-text.utils';

import {
  getRoadmapItem,
  ROADMAP_AREAS,
  ROADMAP_ITEMS,
} from './roadmap.constants';
import { ROADMAP_COVERAGE } from './roadmap-coverage.data';
import { ROADMAP_PLANNED_PAGES } from './roadmap-site-plan.data';
import type {
  RoadmapAreaId,
  RoadmapCoverageRow,
  RoadmapItem,
  RoadmapPlanPage,
} from './types/roadmap.types';

export const ROADMAP_SEARCH_MAX_LENGTH = 200;

export type RoadmapView = 'chantiers' | 'couverture' | 'ordre' | 'pages';
export const ROADMAP_DEFAULT_VIEW: RoadmapView = 'chantiers';
type RoadmapViewInfo = {
  empty: string;
  found: readonly [singular: string, plural: string];
  id: RoadmapView;
  label: string;
  noun: readonly [singular: string, plural: string];
};
const CHANTIER_VIEW = {
  empty: 'Aucun chantier ne correspond',
  found: ['trouvé', 'trouvés'],
  noun: ['chantier', 'chantiers'],
} as const;

/**
 * Chantiers by pole first (owner's decision, 7 November 2026): the steps only
 * suggest an order of construction, the owner picks the next chantier.
 */
export const ROADMAP_VIEWS: readonly [
  RoadmapViewInfo,
  RoadmapViewInfo,
  RoadmapViewInfo,
  RoadmapViewInfo,
] = [
  { ...CHANTIER_VIEW, id: 'chantiers', label: 'Chantiers' },
  {
    empty: 'Aucune page ne correspond',
    found: ['trouvée', 'trouvées'],
    id: 'pages',
    label: 'Pages et onglets',
    noun: ['page', 'pages'],
  },
  {
    empty: 'Aucun sujet ne correspond',
    found: ['trouvé', 'trouvés'],
    id: 'couverture',
    label: 'Couverture',
    noun: ['sujet', 'sujets'],
  },
  { ...CHANTIER_VIEW, id: 'ordre', label: 'Ordre suggéré' },
];

export type RoadmapFilters = {
  areaId: RoadmapAreaId | 'all';
  query: string;
  view: RoadmapView;
};

export function readRoadmapFilters(
  params: Pick<URLSearchParams, 'get'>,
): RoadmapFilters {
  return {
    areaId:
      ROADMAP_AREAS.find((area) => area.id === params.get('pole'))?.id ?? 'all',
    query: (params.get('q') ?? '').slice(0, ROADMAP_SEARCH_MAX_LENGTH),
    view:
      ROADMAP_VIEWS.find((view) => view.id === params.get('vue'))?.id ??
      ROADMAP_DEFAULT_VIEW,
  };
}

/**
 * Keep shared/reloaded URLs aligned with the filters actually displayed. The
 * former `phase` filter (before 7 November 2026) is dropped: the suggested
 * order view shows every phase in order.
 */
export function getRoadmapQueryCorrection(
  params: URLSearchParams,
): Record<string, string | null> | null {
  const { areaId, query, view } = readRoadmapFilters(params);
  const values = {
    phase: null,
    pole: areaId === 'all' ? null : areaId,
    q: query || null,
    vue: view === ROADMAP_DEFAULT_VIEW ? null : view,
  };
  const corrections = Object.fromEntries(
    Object.entries(values).filter(([key, value]) => {
      const entries = params.getAll(key);

      return value === null
        ? entries.length > 0
        : entries.length !== 1 || entries[0] !== value;
    }),
  );

  return Object.keys(corrections).length ? corrections : null;
}

type Scope = Omit<RoadmapFilters, 'view'>;

const areaLabel = (areaId: RoadmapAreaId): string | undefined =>
  ROADMAP_AREAS.find((area) => area.id === areaId)?.label;
const chantierTitle = (id: string | undefined): string | undefined =>
  id ? getRoadmapItem(id)?.title : undefined;

// Same words as the permission editor: any order, filler words ignored,
// singular and plural alike (audit RL-06, 31 October 2026).
const matches = (
  texts: readonly (string | undefined)[],
  terms: string[],
): boolean => !terms.length || includesSearchTerms(texts.join(' '), terms);

export function getVisibleRoadmapItems({
  areaId,
  query,
}: Scope): RoadmapItem[] {
  const terms = getSearchTerms(query);

  return ROADMAP_ITEMS.filter(
    (item) =>
      (areaId === 'all' || item.area === areaId) &&
      matches(
        [
          item.title,
          item.description,
          item.firstRelease,
          item.later,
          item.doneWhen,
          areaLabel(item.area),
        ],
        terms,
      ),
  );
}

export function getVisiblePlannedPages({
  areaId,
  query,
}: Scope): RoadmapPlanPage[] {
  const terms = getSearchTerms(query);

  return ROADMAP_PLANNED_PAGES.filter(
    (page) =>
      (areaId === 'all' || page.area === areaId) &&
      matches(
        [
          page.name,
          page.summary,
          chantierTitle(page.chantier),
          areaLabel(page.area),
          ...(page.tabs ?? []).flatMap((tab) => [
            tab.label,
            tab.summary,
            chantierTitle(tab.chantier),
          ]),
        ],
        terms,
      ),
  );
}

/** A subject belongs to the poles of the chantiers handling it. */
export function getVisibleCoverage({
  areaId,
  query,
}: Scope): RoadmapCoverageRow[] {
  const terms = getSearchTerms(query);

  return ROADMAP_COVERAGE.filter(
    (row) =>
      (areaId === 'all' ||
        row.chantiers.some((id) => getRoadmapItem(id)?.area === areaId)) &&
      matches(
        [row.subject, row.outside, ...row.chantiers.map(chantierTitle)],
        terms,
      ),
  );
}

/** Pages and tabs a chantier builds or completes, for its unfolded line. */
export function getChantierPlaces(
  id: string,
): { label: string; page: string }[] {
  return ROADMAP_PLANNED_PAGES.flatMap((page) =>
    page.chantier === id
      ? [{ label: page.name, page: page.name }]
      : (page.tabs ?? [])
          .filter((tab) => tab.chantier === id)
          .map((tab) => ({
            label: `${page.name} › ${tab.label}`,
            page: page.name,
          })),
  );
}
