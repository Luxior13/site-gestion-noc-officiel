import React from 'react';

import { Badge } from '$ui/badge';

import { ROADMAP_AREAS } from '../roadmap.constants';
import { ROADMAP_SITE_PLAN } from '../roadmap-site-plan.data';
import type {
  RoadmapPhaseId,
  RoadmapPlannedPage,
  RoadmapPlannedTab,
} from '../types/roadmap.types';

const getPhaseLabel = (phase: RoadmapPhaseId | null): string =>
  phase === null ? 'Livré' : `Étape ${phase}`;

function PlannedTab({
  page,
  tab,
}: {
  page: RoadmapPlannedPage;
  tab: RoadmapPlannedTab;
}): React.ReactNode {
  return (
    <div>
      <dt className="text-xs font-semibold">
        {tab.label}
        {tab.phase !== page.phase && (
          <span className="text-muted-foreground font-normal">
            {' · '}
            {getPhaseLabel(tab.phase)}
          </span>
        )}
      </dt>
      <dd className="text-muted-foreground text-xs">{tab.summary}</dd>
    </div>
  );
}

function PlannedPage({ page }: { page: RoadmapPlannedPage }): React.ReactNode {
  return (
    <li className="bg-surface-row-alternate border-border-content rounded-control space-y-2 border p-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold">{page.name}</h3>
        <Badge
          className="shrink-0"
          variant={page.phase === null ? 'secondary' : 'outline'}
        >
          {page.phase === null ? 'Livrée' : `Étape ${page.phase}`}
        </Badge>
      </div>
      {page.summary && (
        <p className="text-muted-foreground text-xs">{page.summary}</p>
      )}
      {page.tabs && (
        <dl className="space-y-1.5">
          {page.tabs.map((tab) => (
            <PlannedTab key={tab.label} page={page} tab={tab} />
          ))}
        </dl>
      )}
    </li>
  );
}

/** Every target page with its tabs, by pole: the plan to check for coherence. */
export function RoadmapSitePlan(): React.ReactNode {
  return (
    <div className="space-y-5 pt-4">
      <p className="text-muted-foreground max-w-prose text-sm">
        Toutes les pages visées, avec leurs onglets et leur contenu. Un onglet
        n’apparaît qu’une fois livré et pour les comptes qui y ont droit.
      </p>
      {ROADMAP_AREAS.map((area) => {
        const pages = ROADMAP_SITE_PLAN.filter((page) => page.area === area.id);

        return (
          <section
            key={area.id}
            aria-labelledby={`roadmap-plan-${area.id}`}
            className="space-y-2"
          >
            <h2
              className="text-sm font-semibold"
              id={`roadmap-plan-${area.id}`}
            >
              {area.label}
            </h2>
            <ul className="grid items-start gap-2 @min-[40rem]/page:grid-cols-2">
              {pages.map((page) => (
                <PlannedPage key={page.name} page={page} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
