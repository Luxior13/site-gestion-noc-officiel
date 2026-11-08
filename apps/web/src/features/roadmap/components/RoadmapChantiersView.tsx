import React, { useEffect, useState } from 'react';

import { ROADMAP_AREAS, ROADMAP_PHASES } from '../roadmap.constants';
import type { RoadmapItem } from '../types/roadmap.types';
import styles from './Roadmap.module.css';
import { type RoadmapGrouping, RoadmapItemRow } from './RoadmapItemRow';

const countLabel = (count: number): string =>
  `${count} chantier${count > 1 ? 's' : ''}`;

type Group = {
  description: string;
  id: string;
  items: RoadmapItem[];
  /** Number of the suggested step, when the group is one. */
  step?: number;
  title: string;
};

/** Under a pole, chantiers follow the suggested steps, then the catalog. */
const getGroups = (
  grouping: RoadmapGrouping,
  items: readonly RoadmapItem[],
): Group[] =>
  grouping === 'area'
    ? ROADMAP_AREAS.map((area) => ({
        description: area.description,
        id: `roadmap-pole-${area.id}`,
        items: items
          .filter((item) => item.area === area.id)
          .sort((first, second) => first.phase - second.phase),
        title: area.label,
      }))
    : ROADMAP_PHASES.map((phase) => ({
        description: phase.description,
        id: `roadmap-etape-${phase.id}`,
        items: items.filter((item) => item.phase === phase.id),
        step: phase.id,
        title: phase.label,
      }));

/** Step strip of the suggested order: an emptied step stays, unlinked. */
function StepStrip({ groups }: { groups: Group[] }): React.ReactNode {
  return (
    <nav aria-label="Aller à une étape">
      <ol className={`${styles.steps} thin-scrollbar`}>
        {groups.map((group) => {
          const content = (
            <>
              <span className={styles.stepNumber}>{group.step}</span>
              <span className={styles.stepLabel}>{group.title}</span>
              <span className={styles.stepCount}>
                {countLabel(group.items.length)}
              </span>
            </>
          );

          return (
            <li key={group.id}>
              {group.items.length ? (
                <a className={styles.stepLink} href={`#${group.id}`}>
                  {content}
                </a>
              ) : (
                <span aria-disabled="true" className={styles.stepLink}>
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Chantiers by pole (default view) or in the suggested order of steps, each
 * on one line unfolded in place.
 */
export function RoadmapChantiersView({
  focusId,
  grouping,
  items,
  onFocusDone,
  onShowItem,
  onShowPage,
}: {
  focusId: string | null;
  grouping: RoadmapGrouping;
  items: readonly RoadmapItem[];
  onFocusDone: () => void;
  /** Clears the filters first: a prerequisite may be filtered out. */
  onShowItem: (id: string) => void;
  onShowPage: (name: string) => void;
}): React.ReactNode {
  const [openId, setOpenId] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);

  // A chantier shown from elsewhere (prerequisite, page, subject) opens in
  // place, comes into view and keeps the keyboard on its line.
  useEffect(() => {
    if (!focusId) return;
    setOpenId(focusId);
    setTarget(focusId);
    onFocusDone();
  }, [focusId, onFocusDone]);
  // Waits for the line when the filters hiding it are being cleared.
  useEffect(() => {
    if (!target) return;
    const line = document.getElementById(`roadmap-${target}`);
    if (!line) return;
    line.scrollIntoView({ block: 'start' });
    line.querySelector('button')?.focus({ preventScroll: true });
    setTarget(null);
  }, [target, items]);

  const groups = getGroups(grouping, items);

  return (
    <>
      {grouping === 'phase' && <StepStrip groups={groups} />}
      {groups
        .filter((group) => group.items.length)
        .map((group) => (
          <section
            aria-labelledby={`${group.id}-titre`}
            className={styles.group}
            id={group.id}
            key={group.id}
          >
            <div className={styles.groupHeader}>
              {group.step && (
                <p className={styles.groupEyebrow}>Étape {group.step}</p>
              )}
              <h2 className={styles.groupTitle} id={`${group.id}-titre`}>
                {group.title}
              </h2>
              <p className={styles.groupDescription}>{group.description}</p>
              <span className={styles.groupMeta}>
                {countLabel(group.items.length)}
              </span>
            </div>
            <ol className={styles.list}>
              {group.items.map((item) => (
                <RoadmapItemRow
                  grouping={grouping}
                  item={item}
                  key={item.id}
                  onShowItem={onShowItem}
                  onShowPage={onShowPage}
                  onToggle={() =>
                    setOpenId(openId === item.id ? null : item.id)
                  }
                  open={openId === item.id}
                />
              ))}
            </ol>
          </section>
        ))}
    </>
  );
}
