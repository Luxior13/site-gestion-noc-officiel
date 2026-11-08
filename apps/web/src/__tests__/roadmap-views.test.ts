import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { RoadmapChantiersView } from '$features/roadmap/components/RoadmapChantiersView';
import { RoadmapCoverageView } from '$features/roadmap/components/RoadmapCoverageView';
import {
  type RoadmapGrouping,
  RoadmapItemRow,
} from '$features/roadmap/components/RoadmapItemRow';
import {
  getRoadmapItem,
  ROADMAP_AREAS,
  ROADMAP_ITEMS,
  ROADMAP_PHASES,
} from '$features/roadmap/roadmap.constants';
import { ROADMAP_COVERAGE } from '$features/roadmap/roadmap-coverage.data';
import type { RoadmapItem } from '$features/roadmap/types/roadmap.types';

const noop = (): void => undefined;
const renderRow = (
  id: string,
  open: boolean,
  grouping: RoadmapGrouping = 'area',
): string => {
  const item = getRoadmapItem(id);
  if (!item) throw new Error(`Chantier inconnu : ${id}`);

  return renderToStaticMarkup(
    createElement(RoadmapItemRow, {
      grouping,
      item,
      onShowItem: noop,
      onShowPage: noop,
      onToggle: noop,
      open,
    }),
  );
};
const renderView = (
  grouping: RoadmapGrouping,
  items: readonly RoadmapItem[] = ROADMAP_ITEMS,
): string =>
  renderToStaticMarkup(
    createElement(RoadmapChantiersView, {
      focusId: null,
      grouping,
      items,
      onFocusDone: noop,
      onShowItem: noop,
      onShowPage: noop,
    }),
  );
const positionsOf = (html: string, ids: readonly string[]): number[] =>
  ids.map((id) => html.indexOf(`id="${id}"`));
const isOrdered = (positions: number[]): boolean =>
  positions.every((position) => position > 0) &&
  [...positions].sort((a, b) => a - b).join() === positions.join();

// Owner's decision of 7 November 2026: by pole first, the steps only suggest.
describe('roadmap chantiers by pole', () => {
  it('lists every chantier once under its pole, in the suggested order of steps', () => {
    const html = renderView('area');
    for (const item of ROADMAP_ITEMS)
      expect(html.split(`id="roadmap-${item.id}"`)).toHaveLength(2);
    expect(
      isOrdered(
        positionsOf(
          html,
          ROADMAP_AREAS.map((area) => `roadmap-pole-${area.id}`),
        ),
      ),
    ).toBe(true);
    for (const area of ROADMAP_AREAS) {
      const items = ROADMAP_ITEMS.filter((item) => item.area === area.id);
      const ordered = [...items].sort((a, b) => a.phase - b.phase);
      expect(
        isOrdered(
          positionsOf(
            html,
            ordered.map((item) => `roadmap-${item.id}`),
          ),
        ),
      ).toBe(true);
    }
    expect(html).not.toContain('Aller à une étape');
    expect(html).not.toContain('Prochaine');
  });

  it('names the suggested step on each line, only under a pole', () => {
    const item = getRoadmapItem('sport-teams');
    expect(renderRow('sport-teams', false)).toContain(`Étape ${item?.phase}`);
    expect(renderRow('sport-teams', false, 'phase')).not.toContain('Étape ');
  });
});

describe('roadmap suggested order', () => {
  it('lists every chantier once under its step, in the order of the steps', () => {
    const html = renderView('phase');
    for (const item of ROADMAP_ITEMS)
      expect(html.split(`id="roadmap-${item.id}"`)).toHaveLength(2);
    expect(
      isOrdered(
        positionsOf(
          html,
          ROADMAP_PHASES.map((phase) => `roadmap-etape-${phase.id}`),
        ),
      ),
    ).toBe(true);
    expect(html).toContain('aria-label="Aller à une étape"');
    expect(html).not.toContain('Prochaine');
  });

  it('keeps an emptied step in the strip, without a link to a missing section', () => {
    const html = renderView(
      'phase',
      ROADMAP_ITEMS.filter((item) => item.phase === 1),
    );
    expect(html).toContain('href="#roadmap-etape-1"');
    expect(html).not.toContain('href="#roadmap-etape-2"');
    expect(html).not.toContain('id="roadmap-etape-2"');
    expect(html).toContain('aria-disabled="true"');
  });
});

describe('roadmap chantier line', () => {
  it('folds to one named command, then unfolds every fact in place', () => {
    const folded = renderRow('sport-teams', false);
    expect(folded).toContain('aria-expanded="false"');
    expect(folded).toContain('pôle');
    expect(folded).not.toContain('Critère de livraison');
    expect(folded).not.toContain('<a ');

    const open = renderRow('sport-teams', true);
    expect(open).toContain('aria-expanded="true"');
    expect(open).toContain('aria-controls="roadmap-details-sport-teams"');
    for (const label of [
      'Pourquoi',
      'Première version',
      'Critère de livraison',
      'Ensuite, si besoin',
      'Prérequis',
      'Pages et onglets',
    ])
      expect(open).toContain(label);
  });

  // Owner's decision of 8 November 2026: only what remains to build.
  it('never describes what already exists', () => {
    for (const item of ROADMAP_ITEMS) {
      const open = renderRow(item.id, true);
      expect(open).not.toContain('Déjà en place');
      expect(open).not.toContain('À compléter');
    }
  });

  it('names prerequisites with their step and says when there is none', () => {
    const withPrerequisites = ROADMAP_ITEMS.find(
      (item) => item.dependsOn.length,
    );
    const withoutPrerequisites = ROADMAP_ITEMS.find(
      (item) => !item.dependsOn.length,
    );
    if (!withPrerequisites || !withoutPrerequisites)
      throw new Error('Catalogue incomplet');
    const dependency = getRoadmapItem(withPrerequisites.dependsOn[0] ?? '');
    expect(renderRow(withPrerequisites.id, true)).toContain(
      `${dependency?.title.replace('&', '&amp;')} · étape ${dependency?.phase}`,
    );
    expect(renderRow(withoutPrerequisites.id, true)).toContain(
      'Aucun : il peut commencer à tout moment.',
    );
    expect(renderRow('business-search', true)).toContain(
      'Aucune page à lui : il complète l’existant.',
    );
  });
});

describe('roadmap coverage view', () => {
  it('shows each subject with its chantiers or the place handling it', () => {
    const html = renderToStaticMarkup(
      createElement(RoadmapCoverageView, {
        onShowItem: noop,
        rows: ROADMAP_COVERAGE,
      }),
    );
    for (const row of ROADMAP_COVERAGE) {
      expect(html).toContain(row.subject.replace('&', '&amp;'));
      if (row.outside)
        expect(html).toContain(`Hors de ce site : ${row.outside}`);
    }
  });
});
