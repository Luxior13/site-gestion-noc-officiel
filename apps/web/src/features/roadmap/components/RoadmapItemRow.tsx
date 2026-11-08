import { ChevronRight } from 'lucide-react';
import React from 'react';

import { getNavigationIcon } from '$constants/navigation-icon.constants';
import { getNavigationSpaceToneClasses } from '$constants/navigation-theme.constants';
import { Button } from '$ui/button';
import { StatusBadge } from '$ui/status-badge';
import { cn } from '$utils/css.utils';

import { getRoadmapItem, ROADMAP_AREAS } from '../roadmap.constants';
import { getChantierPlaces } from '../roadmap-search';
import type { RoadmapAreaId, RoadmapItem } from '../types/roadmap.types';
import styles from './Roadmap.module.css';

/** Pole icon in the pole's colour, decorative: the line names its pole. */
export function RoadmapAreaIcon({
  areaId,
}: {
  areaId: RoadmapAreaId;
}): React.ReactNode {
  const area = ROADMAP_AREAS.find((candidate) => candidate.id === areaId);
  if (!area) return null;
  const Icon = getNavigationIcon(area.icon);

  return (
    <span
      aria-hidden="true"
      className={cn(styles.icon, getNavigationSpaceToneClasses(area.tone).icon)}
    >
      <Icon />
    </span>
  );
}

export type RoadmapGrouping = 'area' | 'phase';

export function RoadmapItemRow({
  grouping,
  item,
  onShowItem,
  onShowPage,
  onToggle,
  open,
}: {
  /** Under a pole, the line names its suggested step; under a step, not. */
  grouping: RoadmapGrouping;
  item: RoadmapItem;
  onShowItem: (id: string) => void;
  onShowPage: (name: string) => void;
  onToggle: () => void;
  open: boolean;
}): React.ReactNode {
  const area = ROADMAP_AREAS.find((candidate) => candidate.id === item.area);
  const detailsId = `roadmap-details-${item.id}`;
  const prerequisites = item.dependsOn
    .map((id) => getRoadmapItem(id))
    .filter((dependency) => dependency !== undefined);
  const places = getChantierPlaces(item.id);

  return (
    <li className={styles.item} id={`roadmap-${item.id}`}>
      <Button
        aria-controls={open ? detailsId : undefined}
        aria-expanded={open}
        className={styles.row}
        onClick={onToggle}
        type="button"
        variant="ghost"
      >
        <RoadmapAreaIcon areaId={item.area} />
        <span className={styles.title}>
          {item.title}
          <span className="sr-only">, pôle {area?.label}</span>
        </span>
        <span className={styles.summary}>{item.firstRelease}</span>
        {grouping === 'area' && (
          <StatusBadge className={styles.state} tone="muted">
            Étape {item.phase}
          </StatusBadge>
        )}
        <ChevronRight aria-hidden="true" className={styles.chevron} />
      </Button>
      {open && (
        <div className={styles.details} id={detailsId}>
          <dl className={styles.facts}>
            <div>
              <dt>Pourquoi</dt>
              <dd>{item.description}</dd>
            </div>
            <div>
              <dt>Première version</dt>
              <dd>{item.firstRelease}</dd>
            </div>
            <div>
              <dt>Critère de livraison</dt>
              <dd>{item.doneWhen}</dd>
            </div>
            <div>
              <dt>Ensuite, si besoin</dt>
              <dd>{item.later}</dd>
            </div>
          </dl>
          <div className={styles.related}>
            <p className={styles.relatedLabel}>Prérequis</p>
            {prerequisites.length ? (
              <ul className={styles.links}>
                {prerequisites.map((dependency) => (
                  <li key={dependency.id}>
                    <Button
                      onClick={() => onShowItem(dependency.id)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {dependency.title} · étape {dependency.phase}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Aucun : il peut commencer à tout moment.</p>
            )}
          </div>
          <div className={styles.related}>
            <p className={styles.relatedLabel}>Pages et onglets</p>
            {places.length ? (
              <ul className={styles.links}>
                {places.map((place) => (
                  <li key={place.label}>
                    <Button
                      onClick={() => onShowPage(place.page)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {place.label}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Aucune page à lui : il complète l’existant.</p>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
