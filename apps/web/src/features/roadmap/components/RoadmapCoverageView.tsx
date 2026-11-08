import React from 'react';

import { Button } from '$ui/button';

import { getRoadmapItem } from '../roadmap.constants';
import type { RoadmapCoverageRow } from '../types/roadmap.types';
import styles from './Roadmap.module.css';

/** What a structure meets over the years, and where the site handles it. */
export function RoadmapCoverageView({
  onShowItem,
  rows,
}: {
  onShowItem: (id: string) => void;
  rows: readonly RoadmapCoverageRow[];
}): React.ReactNode {
  return (
    <ul aria-label="Sujets d’une structure esport" className={styles.list}>
      {rows.map((row) => (
        <li className={styles.coverageRow} key={row.subject}>
          <p className={styles.coverageSubject}>{row.subject}</p>
          {row.outside ? (
            <p className={styles.outside}>Hors de ce site : {row.outside}</p>
          ) : (
            <ul className={styles.links}>
              {row.chantiers.map((id) => {
                const chantier = getRoadmapItem(id);
                if (!chantier) return null;

                return (
                  <li key={id}>
                    <Button
                      onClick={() => onShowItem(id)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {chantier.title} · étape {chantier.phase}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
