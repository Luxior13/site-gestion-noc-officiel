'use client';

import {
  ClipboardList,
  Layers,
  LayoutGrid,
  ListChecks,
  ListOrdered,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import AuthenticatedLayout from '$components/AuthenticatedLayout';
import { ContentState } from '$components/layout/ContentState';
import { PageIdentityHero } from '$components/layout/PageIdentityHero';
import {
  type PageSection,
  PageSectionNavigation,
} from '$components/layout/PageSectionNavigation';
import { PAGE_PATHS } from '$constants/routes.constants';
import { usePageQuery } from '$hooks/usePageQuery';
import { Badge } from '$ui/badge';
import { Button } from '$ui/button';
import { DataTableSection } from '$ui/data-table-section';
import directoryStyles from '$ui/directory.module.css';
import { ListSearchField } from '$ui/list-search-field';
import { PageCanvas, PageShell } from '$ui/page-shell';
import { QuickFilter, QuickFilterGroup } from '$ui/quick-filter';
import { cn } from '$utils/css.utils';

import { ROADMAP_AREAS, ROADMAP_ITEMS } from '../roadmap.constants';
import {
  getRoadmapQueryCorrection,
  getVisibleCoverage,
  getVisiblePlannedPages,
  getVisibleRoadmapItems,
  readRoadmapFilters,
  ROADMAP_DEFAULT_VIEW,
  ROADMAP_SEARCH_MAX_LENGTH,
  ROADMAP_VIEWS,
  type RoadmapView,
} from '../roadmap-search';
import { ROADMAP_PLANNED_PAGES } from '../roadmap-site-plan.data';
import type { RoadmapAreaId } from '../types/roadmap.types';
import { RoadmapChantiersView } from './RoadmapChantiersView';
import { RoadmapCoverageView } from './RoadmapCoverageView';
import { RoadmapPagesView } from './RoadmapPagesView';

const SEARCH_ID = 'roadmap-search';
const VIEW_ICONS: Record<RoadmapView, React.ReactNode> = {
  chantiers: <Layers aria-hidden="true" />,
  couverture: <ListChecks aria-hidden="true" />,
  ordre: <ListOrdered aria-hidden="true" />,
  pages: <LayoutGrid aria-hidden="true" />,
};
const VIEW_SECTIONS: readonly PageSection<RoadmapView>[] = ROADMAP_VIEWS.map(
  (view) => ({ icon: VIEW_ICONS[view.id], id: view.id, label: view.label }),
);

const countVisible = (
  view: RoadmapView,
  areaId: RoadmapAreaId | 'all',
  query: string,
): number => {
  const scope = { areaId, query };
  if (view === 'pages') return getVisiblePlannedPages(scope).length;
  if (view === 'couverture') return getVisibleCoverage(scope).length;

  return getVisibleRoadmapItems(scope).length;
};

type Focus = { id: string; kind: 'item' | 'page' };

/**
 * Read-only roadmap (7 November 2026): views of one plan, chantiers by pole
 * first, one search and pole filters shared by them, every line unfolded in
 * place. The steps only suggest an order: the owner picks the next chantier.
 * Only what remains to build is shown (8 November 2026).
 */
export function RoadmapPage(): React.ReactNode {
  const { searchParams, updateQuery } = usePageQuery();
  const [focus, setFocus] = useState<Focus | null>(null);
  const { areaId, query, view } = readRoadmapFilters(searchParams);
  const viewInfo =
    ROADMAP_VIEWS.find((candidate) => candidate.id === view) ??
    ROADMAP_VIEWS[0];
  const scope = { areaId, query };
  const total = countVisible(view, areaId, query);
  const filtered = areaId !== 'all' || query !== '';
  const clearFocus = useCallback(() => setFocus(null), []);

  useEffect(() => {
    // History writes are synchronous; normalize the current URL, never an old render.
    const correction = getRoadmapQueryCorrection(
      new URLSearchParams(window.location.search),
    );
    if (correction) updateQuery(correction, 'replace');
  }, [searchParams, updateQuery]);

  // A link to a chantier or a page clears the filters that could hide it;
  // a chantier stays in the chantier view already open.
  const showItem = (id: string): void => {
    updateQuery({ pole: null, q: null, vue: view === 'ordre' ? view : null });
    setFocus({ id, kind: 'item' });
  };
  const showPage = (name: string): void => {
    updateQuery({ pole: null, q: null, vue: 'pages' });
    setFocus({ id: name, kind: 'page' });
  };
  const resetFilters = (): void => {
    updateQuery({ pole: null, q: null });
    document.getElementById(SEARCH_ID)?.focus();
  };
  const getSectionHref = (id: RoadmapView): string => {
    const params = new URLSearchParams(searchParams.toString());
    if (id === ROADMAP_DEFAULT_VIEW) params.delete('vue');
    else params.set('vue', id);
    const search = params.toString();

    return `${PAGE_PATHS.roadmap}${search ? `?${search}` : ''}`;
  };
  const noun = total > 1 ? viewInfo.noun[1] : viewInfo.noun[0];
  const found = total > 1 ? viewInfo.found[1] : viewInfo.found[0];

  return (
    <AuthenticatedLayout
      breadcrumbs={[{ label: 'Système' }, { label: 'Feuille de route' }]}
    >
      <PageShell className="py-0">
        <PageCanvas
          contentClassName={cn(directoryStyles.directory, 'space-y-4')}
        >
          <PageIdentityHero
            description="Ce qui reste à construire pour la structure, pôle par pôle ; ce qui existe déjà n’y figure pas. Les étapes suggèrent un ordre, sans date promise ; le prochain chantier reste à choisir."
            icon={<ClipboardList aria-hidden="true" />}
            meta={
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {ROADMAP_ITEMS.length} chantiers
                </Badge>
                <Badge variant="outline">
                  {ROADMAP_PLANNED_PAGES.length} pages
                </Badge>
                <Badge variant="outline">{ROADMAP_AREAS.length} pôles</Badge>
              </div>
            }
            title="Feuille de route"
          />
          <PageSectionNavigation
            activeSection={view}
            ariaLabel="Vues de la feuille de route"
            getSectionHref={getSectionHref}
            // A view is a local filter: history only, no new server request.
            onSectionChange={(id) =>
              updateQuery({ vue: id === ROADMAP_DEFAULT_VIEW ? null : id })
            }
            sections={VIEW_SECTIONS}
          />
          <DataTableSection
            className="border-border-content bg-surface-content rounded-panel"
            headerClassName="bg-surface-content-header"
            toolbar={
              <div className="w-full">
                <form
                  aria-label="Rechercher dans la feuille de route"
                  autoComplete="off"
                  className={directoryStyles.filterForm}
                  onSubmit={(event) => event.preventDefault()}
                  role="search"
                >
                  <ListSearchField
                    ariaLabel="Rechercher dans la feuille de route"
                    id={SEARCH_ID}
                    maxLength={ROADMAP_SEARCH_MAX_LENGTH}
                    onClear={() => updateQuery({ q: null }, 'replace')}
                    onValueChange={(value) =>
                      updateQuery(
                        { q: value.slice(0, ROADMAP_SEARCH_MAX_LENGTH) },
                        'replace',
                      )
                    }
                    placeholder="Factures, tournois, parcours…"
                    value={query}
                  />
                </form>
                <div className={directoryStyles.filterBar}>
                  <div className={directoryStyles.quickFilterSets}>
                    <QuickFilterGroup caption="Pôle" label="Filtrer par pôle">
                      <QuickFilter
                        count={countVisible(view, 'all', query)}
                        label="Tous"
                        noun={viewInfo.noun}
                        onClick={() => updateQuery({ pole: null })}
                        pressed={areaId === 'all'}
                      />
                      {ROADMAP_AREAS.map((area) => (
                        <QuickFilter
                          count={countVisible(view, area.id, query)}
                          key={area.id}
                          label={area.label}
                          noun={viewInfo.noun}
                          onClick={() => {
                            if (area.id !== areaId)
                              updateQuery({ pole: area.id });
                          }}
                          pressed={area.id === areaId}
                        />
                      ))}
                    </QuickFilterGroup>
                  </div>
                  <div className={directoryStyles.listCaption}>
                    <p aria-live="polite" role="status">
                      {`${total.toLocaleString('fr-FR')} ${noun}${filtered ? ` ${found}` : ''}`}
                    </p>
                  </div>
                </div>
              </div>
            }
          >
            {total === 0 ? (
              <ContentState
                action={
                  <Button
                    onClick={resetFilters}
                    type="button"
                    variant="outline"
                  >
                    Réinitialiser les filtres
                  </Button>
                }
                description="Essayez un autre mot ou un autre pôle."
                title={viewInfo.empty}
              />
            ) : view === 'pages' ? (
              <RoadmapPagesView
                focusName={focus?.kind === 'page' ? focus.id : null}
                onFocusDone={clearFocus}
                onShowItem={showItem}
                pages={getVisiblePlannedPages(scope)}
              />
            ) : view === 'couverture' ? (
              <RoadmapCoverageView
                onShowItem={showItem}
                rows={getVisibleCoverage(scope)}
              />
            ) : (
              <RoadmapChantiersView
                focusId={focus?.kind === 'item' ? focus.id : null}
                grouping={view === 'ordre' ? 'phase' : 'area'}
                items={getVisibleRoadmapItems(scope)}
                onFocusDone={clearFocus}
                onShowItem={showItem}
                onShowPage={showPage}
              />
            )}
          </DataTableSection>
          {(view === 'chantiers' || view === 'ordre') && (
            <section
              aria-labelledby="roadmap-principes"
              className="text-muted-foreground space-y-2 text-sm"
            >
              <h2
                className="text-foreground text-sm font-semibold"
                id="roadmap-principes"
              >
                À savoir
              </h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Une personne garde la même identité ; ses adhésions, fonctions
                  et passages ont leur propre historique.
                </li>
                <li>
                  Association et société peuvent avoir des contrats et des
                  finances séparés ; les anciens dossiers gardent leur entité
                  d’origine.
                </li>
                <li>
                  Facture, paiement, budget et remboursement suivent des
                  parcours distincts.
                </li>
                <li>
                  Les étapes ne sont qu’un ordre suggéré : le prochain chantier
                  se choisit selon les besoins, une fois ses prérequis livrés.
                  Un chantier ne crée pas forcément une entrée de menu.
                </li>
              </ul>
            </section>
          )}
        </PageCanvas>
      </PageShell>
    </AuthenticatedLayout>
  );
}
