import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { FEATURES } from '$constants/feature-registry.constants';
import { RoadmapSitePlan } from '$features/roadmap/components/RoadmapSitePlan';
import { ROADMAP_AREAS } from '$features/roadmap/roadmap.constants';
import { ROADMAP_SITE_PLAN } from '$features/roadmap/roadmap-site-plan.data';

const getTabLabels = (name: string): string[] =>
  ROADMAP_SITE_PLAN.find((page) => page.name === name)?.tabs?.map(
    (tab) => tab.label,
  ) ?? [];

describe('planned pages and tabs', () => {
  it('names each page once and places it in a target area', () => {
    const names = ROADMAP_SITE_PLAN.map((page) => page.name);
    expect(new Set(names).size).toBe(names.length);
    for (const page of ROADMAP_SITE_PLAN) {
      expect(ROADMAP_AREAS.some((area) => area.id === page.area)).toBe(true);
      expect(page.summary || page.tabs?.length).toBeTruthy();
    }
  });

  it('lists every delivered feature of the registry', () => {
    const delivered = ROADMAP_SITE_PLAN.filter((page) => page.phase === null);
    for (const feature of Object.values(FEATURES)) {
      expect(delivered.map((page) => page.name)).toContain(feature.label);
    }
  });

  it('keeps tabs usable: distinct, at least two, at most eight', () => {
    for (const page of ROADMAP_SITE_PLAN) {
      if (!page.tabs) continue;
      const labels = page.tabs.map((tab) => tab.label);
      expect(new Set(labels).size).toBe(labels.length);
      expect(labels.length).toBeGreaterThanOrEqual(2);
      expect(labels.length).toBeLessThanOrEqual(8);
    }
  });

  it('never delivers a tab before its page', () => {
    for (const page of ROADMAP_SITE_PLAN) {
      for (const tab of page.tabs ?? []) {
        if (page.phase === null) continue;
        expect(tab.phase).not.toBeNull();
        expect(tab.phase ?? 0).toBeGreaterThanOrEqual(page.phase);
      }
    }
  });

  // Preference of 27 October 2026: same tabs, names and order on both.
  it('keeps the two account pages on the same tabs', () => {
    expect(getTabLabels('Mon compte')).toEqual(
      getTabLabels('Fiche utilisateur'),
    );
  });

  it('keeps one word per concept across the pages', () => {
    const tabs = ROADMAP_SITE_PLAN.flatMap((page) =>
      (page.tabs ?? []).map((tab) => tab.label),
    );
    // The journal is reached from the header, a list of pieces is « Documents »
    // or, on money, « Justificatifs ».
    for (const banned of ['Historique', 'Pièces', 'Fichiers', 'Paiements']) {
      expect(tabs).not.toContain(banned);
    }
    for (const page of ROADMAP_SITE_PLAN.filter(
      (candidate) => candidate.area === 'finance',
    )) {
      expect(page.tabs?.map((tab) => tab.label) ?? []).not.toContain(
        'Documents',
      );
    }
  });

  it('renders every page and tab with its state', () => {
    const html = renderToStaticMarkup(createElement(RoadmapSitePlan));
    for (const page of ROADMAP_SITE_PLAN) {
      expect(html).toContain(page.name.replace('&', '&amp;'));
      for (const tab of page.tabs ?? []) expect(html).toContain(tab.label);
    }
    expect(html).toContain('Parcours');
    expect(html).toContain('Étape 1');
  });
});
