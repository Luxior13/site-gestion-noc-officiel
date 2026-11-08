import { ArrowUpRight, Check, ChevronRight } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '$ui/button';
import { StatusBadge } from '$ui/status-badge';
import { cn } from '$utils/css.utils';

import { getRoadmapItem, ROADMAP_AREAS } from '../roadmap.constants';
import type {
  RoadmapItem,
  RoadmapPageEntry,
  RoadmapPageEntryTab,
} from '../types/roadmap.types';
import styles from './Roadmap.module.css';
import { RoadmapAreaIcon } from './RoadmapItemRow';

const pageId = (name: string): string =>
  `roadmap-page-${name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}`;

/**
 * The chantiers still working on the page: its own when something of it
 * remains, then those of its remaining tabs, once each.
 */
const getPageChantiers = (page: RoadmapPageEntry): RoadmapItem[] =>
  [
    ...new Set(
      [
        page.delivered && !page.upcoming ? undefined : page.chantier,
        ...(page.tabs ?? [])
          .filter((tab) => tab.phase !== null)
          .map((tab) => tab.chantier),
      ].filter((id) => id !== undefined),
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

/** What is already on the site (owner, 9 November 2026). */
const DoneIcon = (): React.ReactNode => (
  <Check aria-hidden="true" className={styles.doneIcon} />
);

/** « En place », « Étape 3 » or « En place · à compléter, étape 3 ». */
const PageState = ({ page }: { page: RoadmapPageEntry }): React.ReactNode =>
  page.phase === null ? (
    <StatusBadge className={styles.state} tone="success">
      En place
    </StatusBadge>
  ) : page.delivered ? (
    <span className={styles.state}>
      <StatusBadge tone="success">En place</StatusBadge>
      <span className={styles.statePlus}>+ étape {page.phase}</span>
    </span>
  ) : (
    <StatusBadge className={styles.state} tone="muted">
      Étape {page.phase}
    </StatusBadge>
  );

/** A tab's state in the unfolded line. */
const tabState = (tab: RoadmapPageEntryTab): string =>
  tab.delivered
    ? tab.phase === null
      ? ' · en place'
      : ` · en place, à compléter à l’étape ${tab.phase}`
    : ` · étape ${tab.phase}`;

function PageRow({
  onShowItem,
  onToggle,
  open,
  page,
}: {
  onShowItem: (id: string) => void;
  onToggle: () => void;
  open: boolean;
  page: RoadmapPageEntry;
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
              <span
                className={cn(styles.tab, tab.delivered && styles.tabDone)}
                key={tab.label}
              >
                {tab.delivered && (
                  <>
                    <DoneIcon />
                    <span className="sr-only">en place : </span>
                  </>
                )}
                {tab.label}
                {tab.managedIn && (
                  <>
                    <ManagedIcon />
                    <span className="sr-only">
                      , se modifie dans {tab.managedIn}
                    </span>
                  </>
                )}
                {tab.phase !== null && tab.phase !== page.phase && (
                  <span className={styles.tabPhase}>étape {tab.phase}</span>
                )}
              </span>
            ))}
          </span>
        ) : (
          <span className={styles.summary}>
            {page.upcoming ? `À venir : ${page.upcoming}` : page.summary}
          </span>
        )}
        <PageState page={page} />
        <ChevronRight aria-hidden="true" className={styles.chevron} />
      </Button>
      {open && (
        <div className={styles.details} id={detailsId}>
          {page.summary && <p className="text-xs">{page.summary}</p>}
          {page.upcoming && (
            <p className="text-xs">
              <span className={styles.upcomingLabel}>
                À venir, étape {page.phase} :
              </span>{' '}
              {page.upcoming}
            </p>
          )}
          {page.tabs && (
            <dl className={styles.facts}>
              {page.tabs.map((tab) => (
                <div key={tab.label}>
                  <dt className={cn(tab.delivered && styles.factDone)}>
                    {tab.delivered && <DoneIcon />}
                    {tab.label}
                    {tab.managedIn && <ManagedIcon />}
                    {tabState(tab)}
                  </dt>
                  <dd>
                    {tab.summary}
                    {tab.upcoming && (
                      <span className={styles.managedNote}>
                        À venir, étape {tab.phase} : {tab.upcoming}
                      </span>
                    )}
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
          {chantiers.length > 0 && (
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
          )}
        </div>
      )}
    </li>
  );
}

/**
 * Every page of the plan, by pole: what is already in place (a tick, « En
 * place ») told apart from what remains, at its suggested step (owner,
 * 9 November 2026).
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
  pages: readonly RoadmapPageEntry[];
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
    // Pages already on the site, as the header counts them.
    const inPlace = areaPages.filter((page) => page.delivered).length;

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
            {inPlace > 0 && ` · ${inPlace} en place`}
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
      <p className={styles.legend}>
        <DoneIcon />
        En place : déjà sur le site. « Étape N » : reste à faire, dans l’ordre
        suggéré ; « + étape N » : en place, un chantier le complétera.
      </p>
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
