import { ArrowUpRight, ChevronRight } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '$ui/button';
import { StatusBadge } from '$ui/status-badge';

import { getRoadmapItem, ROADMAP_AREAS } from '../roadmap.constants';
import type { RoadmapItem, RoadmapPlanPage } from '../types/roadmap.types';
import styles from './Roadmap.module.css';
import { RoadmapAreaIcon } from './RoadmapItemRow';

const pageId = (name: string): string =>
  `roadmap-page-${name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}`;

/** The page's own chantier first, then those of its tabs, once each. */
const getPageChantiers = (page: RoadmapPlanPage): RoadmapItem[] =>
  [
    ...new Set(
      [page.chantier, ...(page.tabs ?? []).map((tab) => tab.chantier)].filter(
        (id) => id !== undefined,
      ),
    ),
  ]
    .map((id) => getRoadmapItem(id))
    .filter((item) => item !== undefined);

/**
 * A tab that only reads content modified on another page keeps the tab look,
 * followed by an arrow (owner's rule, 8 November 2026).
 */
const ManagedIcon = (): React.ReactNode => (
  <ArrowUpRight aria-hidden="true" className={styles.managedIcon} />
);

function PageRow({
  onShowItem,
  onToggle,
  open,
  page,
}: {
  onShowItem: (id: string) => void;
  onToggle: () => void;
  open: boolean;
  page: RoadmapPlanPage;
}): React.ReactNode {
  const id = pageId(page.name);
  const detailsId = `${id}-details`;
  const chantiers = getPageChantiers(page);

  return (
    <li className={styles.item} id={id}>
      <Button
        aria-controls={open ? detailsId : undefined}
        aria-expanded={open}
        className={styles.row}
        onClick={onToggle}
        type="button"
        variant="ghost"
      >
        <RoadmapAreaIcon areaId={page.area} />
        <span className={styles.title}>{page.name}</span>
        {page.tabs ? (
          <span className={styles.tabs}>
            <span className="sr-only">Onglets : </span>
            {page.tabs.map((tab) => (
              <span className={styles.tab} key={tab.label}>
                {tab.label}
                {tab.managedIn && (
                  <>
                    <ManagedIcon />
                    <span className="sr-only">
                      , se modifie dans {tab.managedIn}
                    </span>
                  </>
                )}
                {tab.phase !== page.phase && (
                  <span className={styles.tabPhase}>étape {tab.phase}</span>
                )}
              </span>
            ))}
          </span>
        ) : (
          <span className={styles.summary}>{page.summary}</span>
        )}
        <StatusBadge className={styles.state} tone="muted">
          Étape {page.phase}
        </StatusBadge>
        <ChevronRight aria-hidden="true" className={styles.chevron} />
      </Button>
      {open && (
        <div className={styles.details} id={detailsId}>
          {page.summary && <p className="text-xs">{page.summary}</p>}
          {page.tabs && (
            <dl className={styles.facts}>
              {page.tabs.map((tab) => (
                <div key={tab.label}>
                  <dt>
                    {tab.label}
                    {tab.managedIn && <ManagedIcon />}
                    {tab.phase !== page.phase && ` · étape ${tab.phase}`}
                  </dt>
                  <dd>
                    {tab.summary}
                    {tab.managedIn && (
                      <span className={styles.managedNote}>
                        Lu ici, se modifie dans {tab.managedIn}.
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <div className={styles.related}>
            <p className={styles.relatedLabel}>
              {chantiers.length > 1 ? 'Chantiers' : 'Chantier'}
            </p>
            <ul className={styles.links}>
              {chantiers.map((chantier) => (
                <li key={chantier.id}>
                  <Button
                    onClick={() => onShowItem(chantier.id)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {chantier.title} · étape {chantier.phase}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
}

/**
 * Pages with work still to deliver, by pole: new pages, and the additions a
 * chantier still brings to a delivered page or tab.
 */
export function RoadmapPagesView({
  focusName,
  onFocusDone,
  onShowItem,
  pages,
}: {
  focusName: string | null;
  onFocusDone: () => void;
  onShowItem: (id: string) => void;
  pages: readonly RoadmapPlanPage[];
}): React.ReactNode {
  const [openName, setOpenName] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!focusName) return;
    setOpenName(focusName);
    setTarget(focusName);
    onFocusDone();
  }, [focusName, onFocusDone]);
  // Waits for the line when the filters hiding it are being cleared.
  useEffect(() => {
    if (!target) return;
    const line = document.getElementById(pageId(target));
    if (!line) return;
    line.scrollIntoView({ block: 'start' });
    line.querySelector('button')?.focus({ preventScroll: true });
    setTarget(null);
  }, [target, pages]);

  const hasManagedTab = pages.some((page) =>
    page.tabs?.some((tab) => tab.managedIn),
  );
  const groups = ROADMAP_AREAS.map((area) => {
    const areaPages = pages.filter((page) => page.area === area.id);
    if (!areaPages.length) return null;

    return (
      <section
        aria-labelledby={`roadmap-pages-${area.id}`}
        className={styles.group}
        key={area.id}
      >
        <div className={styles.groupHeader}>
          <h2 className={styles.groupTitle} id={`roadmap-pages-${area.id}`}>
            {area.label}
          </h2>
          <p className={styles.groupDescription}>{area.description}</p>
          <span className={styles.groupMeta}>
            {areaPages.length} page{areaPages.length > 1 ? 's' : ''}
          </span>
        </div>
        <ul className={styles.list}>
          {areaPages.map((page) => (
            <PageRow
              key={page.name}
              onShowItem={onShowItem}
              onToggle={() =>
                setOpenName(openName === page.name ? null : page.name)
              }
              open={openName === page.name}
              page={page}
            />
          ))}
        </ul>
      </section>
    );
  });

  return (
    <>
      {hasManagedTab && (
        <p className={styles.legend}>
          <ManagedIcon />
          Onglet en lecture : son contenu se modifie sur une autre page, vers
          laquelle il renvoie.
        </p>
      )}
      {groups}
    </>
  );
}
