import { describe, expect, it } from 'vitest';

import { ROADMAP_ITEMS } from '$features/roadmap/roadmap.constants';
import { ROADMAP_COVERAGE } from '$features/roadmap/roadmap-coverage.data';
import {
  getRoadmapQueryCorrection,
  getVisibleCoverage,
  getVisiblePlannedPages,
  getVisibleRoadmapItems,
  readRoadmapFilters,
} from '$features/roadmap/roadmap-search';
import { ROADMAP_PLANNED_PAGES } from '$features/roadmap/roadmap-site-plan.data';

const search = (query: string): string[] =>
  getVisibleRoadmapItems({ areaId: 'all', query }).map((item) => item.id);

describe('roadmap local search and URL filters', () => {
  it('bounds external searches and rejects unknown filters as displayed', () => {
    const params = new URLSearchParams({
      pole: 'private',
      q: 'a'.repeat(250),
      vue: 'tableau',
    });
    expect(readRoadmapFilters(params)).toEqual({
      areaId: 'all',
      query: 'a'.repeat(200),
      view: 'chantiers',
    });
    expect(getRoadmapQueryCorrection(params)).toEqual({
      pole: null,
      q: 'a'.repeat(200),
      vue: null,
    });
  });

  // The phase filter left with the steps view (7 November 2026).
  it('drops the former phase filter and keeps the other parameters', () => {
    const params = new URLSearchParams(
      'phase=2&phase=3&pole=all&q=&q=planning&vue=pages&vue=ordre&keep=yes',
    );
    expect(readRoadmapFilters(params)).toEqual({
      areaId: 'all',
      query: '',
      view: 'pages',
    });
    const correction = getRoadmapQueryCorrection(params);
    expect(correction).toEqual({
      phase: null,
      pole: null,
      q: null,
      vue: 'pages',
    });
    for (const [key, value] of Object.entries(correction ?? {})) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    expect(params.toString()).toBe('vue=pages&keep=yes');
    expect(getRoadmapQueryCorrection(params)).toBeNull();
  });

  // Chantiers by pole are the default view since 7 November 2026.
  it('keeps the default view out of the URL', () => {
    expect(
      getRoadmapQueryCorrection(new URLSearchParams('vue=chantiers')),
    ).toEqual({ vue: null });
    expect(
      getRoadmapQueryCorrection(new URLSearchParams('vue=etapes')),
    ).toEqual({ vue: null });
    expect(getRoadmapQueryCorrection(new URLSearchParams())).toBeNull();
    expect(
      getRoadmapQueryCorrection(new URLSearchParams('vue=ordre')),
    ).toBeNull();
  });

  it('leaves valid input untouched while a user types spaces or accented words', () => {
    const params = new URLSearchParams({
      pole: 'people',
      q: '  Équipes ',
      vue: 'couverture',
    });
    expect(readRoadmapFilters(params).query).toBe('  Équipes ');
    expect(getRoadmapQueryCorrection(params)).toBeNull();
  });

  it('combines every word independently of accents, case, punctuation and order', () => {
    expect(search('PARCOURS, équipes')).toEqual(search('equipes parcours'));
    expect(search('PARCOURS, équipes')).toContain('sport-teams');
    expect(search('equipes parcours motabsentduchantier')).toEqual([]);
  });

  // Audit RL-06: the same words as the permission editor.
  it('reads plurals as singular and ignores filler words', () => {
    expect(search('réunions')).toEqual(search('reunion'));
    expect(search('équipes')).toEqual(search('equipe'));
    expect(search('les équipes')).toEqual(search('equipe'));
    expect(search('reunion').length).toBeGreaterThan(1);
  });

  it('searches the delivery criterion, even while the line is folded', () => {
    expect(search('corriger passage')).toContain('sport-teams');
    expect(search('nOuVeLLe identité')).toContain('person-relationships');
  });

  it('intersects the search and the target area rather than replacing a criterion', () => {
    expect(
      getVisibleRoadmapItems({
        areaId: 'people',
        query: 'corriger passage',
      }).map((item) => item.id),
    ).toEqual(['sport-teams']);
    expect(
      getVisibleRoadmapItems({
        areaId: 'structure',
        query: 'corriger passage',
      }),
    ).toEqual([]);
  });

  it('finds a page by one of its tabs or by the chantier building it', () => {
    const names = (query: string): string[] =>
      getVisiblePlannedPages({ areaId: 'all', query }).map((page) => page.name);
    expect(names('bans')).toEqual(
      expect.arrayContaining(['Fiche personne', 'Fiche tournoi']),
    );
    expect(names('Suivi')).toContain('Fiche personne');
    expect(
      getVisiblePlannedPages({ areaId: 'finance', query: 'recrutement' }),
    ).toEqual([]);
  });

  it('places a subject in the poles of its chantiers', () => {
    const outside = ROADMAP_COVERAGE.filter((row) => !row.chantiers.length);
    expect(outside.every((row) => row.outside)).toBe(true);
    for (const row of getVisibleCoverage({ areaId: 'finance', query: '' })) {
      expect(
        row.chantiers.some(
          (id) =>
            ROADMAP_ITEMS.find((item) => item.id === id)?.area === 'finance',
        ),
      ).toBe(true);
    }
    expect(getVisibleCoverage({ areaId: 'all', query: '' })).toEqual(
      ROADMAP_COVERAGE,
    );
  });

  it('returns the entire unchanged catalogue when neutral criteria are restored', () => {
    const before = ROADMAP_ITEMS.map((item) => item.id);
    expect(search('   , +   ')).toEqual(before);
    expect(
      getVisibleRoadmapItems(readRoadmapFilters(new URLSearchParams())),
    ).toEqual(ROADMAP_ITEMS);
    expect(
      getVisiblePlannedPages(readRoadmapFilters(new URLSearchParams())),
    ).toEqual(ROADMAP_PLANNED_PAGES);
    expect(ROADMAP_ITEMS.map((item) => item.id)).toEqual(before);
  });
});
