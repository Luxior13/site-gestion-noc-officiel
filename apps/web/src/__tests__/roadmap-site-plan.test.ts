import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { FEATURES } from '$constants/feature-registry.constants';
import { RoadmapPagesView } from '$features/roadmap/components/RoadmapPagesView';
import {
  getRoadmapItem,
  ROADMAP_AREAS,
  ROADMAP_ITEMS,
} from '$features/roadmap/roadmap.constants';
import { ROADMAP_COVERAGE } from '$features/roadmap/roadmap-coverage.data';
import { getChantierPlaces } from '$features/roadmap/roadmap-search';
import {
  ROADMAP_PAGES,
  ROADMAP_PLANNED_PAGES,
  ROADMAP_SITE_PLAN,
} from '$features/roadmap/roadmap-site-plan.data';
import type { RoadmapPageEntry } from '$features/roadmap/types/roadmap.types';

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

  it('links pages and tabs only to known chantiers, delivered after them', () => {
    for (const page of ROADMAP_SITE_PLAN) {
      for (const link of [page, ...(page.tabs ?? [])]) {
        if (!link.chantier) continue;
        const chantier = getRoadmapItem(link.chantier);
        expect(chantier, `${page.name} → ${link.chantier}`).toBeDefined();
        if (link.phase !== null)
          expect(chantier?.phase).toBeLessThanOrEqual(link.phase);
      }
    }
  });

  it('gives every planned page a chantier, on the page or on one of its tabs', () => {
    const unbuilt = ROADMAP_SITE_PLAN.filter(
      (page) =>
        page.phase !== null &&
        !page.chantier &&
        !page.tabs?.some((tab) => tab.chantier),
    ).map((page) => page.name);
    expect(unbuilt).toEqual([]);
  });

  // A chantier without a page or a tab would be invisible from the pages view;
  // the three exceptions improve existing pages (reminders in Mon travail and
  // Paramètres, search, connections).
  it('gives every chantier a page or a tab to build', () => {
    const orphans = ROADMAP_ITEMS.filter(
      (item) => !getChantierPlaces(item.id).length,
    ).map((item) => item.id);
    expect(orphans.sort()).toEqual([
      'automations',
      'business-search',
      'integrations',
    ]);
  });

  // Owner's decision of 8 November 2026: a list lives next to what it
  // classifies, never in Système; « Suivi » keeps a single meaning.
  it('keeps each list of choices next to what it classifies', () => {
    const tabsOf = (name: string): string[] => getTabLabels(name);
    // Team functions go with the teams, the bureau's with the structure.
    // Each game has its own functions, in its fiche (8 November 2026).
    expect(tabsOf('Jeux')).toEqual([]);
    expect(tabsOf('Fiche jeu')).toContain('Fonctions');
    // Money read at each level, entered once in Finances (8 November 2026).
    expect(tabsOf('Fiche jeu')).toContain('Finances');
    expect(tabsOf('Fiche équipe')).toContain('Finances');
    expect(tabsOf('Fiche équipe')).toContain('Partenaires');
    expect(tabsOf('Bureau & staff')).toEqual([
      'Effectif',
      'Anciens membres',
      'Fonctions',
    ]);
    expect(tabsOf('Fiche entité')).not.toContain('Fonctions');
    // Tags were dropped (8 November 2026): the directory stays a single list.
    expect(tabsOf('Répertoire')).toEqual([]);
    expect(tabsOf('Comptes')).toEqual(
      expect.arrayContaining(['Catégories', 'Moyens de paiement']),
    );
    expect(tabsOf('Matériel & abonnements')).toContain('Types de matériel');
    expect(
      ROADMAP_SITE_PLAN.filter((page) => page.area === 'system').flatMap(
        (page) => page.tabs?.map((tab) => tab.label) ?? [],
      ),
    ).not.toContain('Jeux');
    const followUps = ROADMAP_SITE_PLAN.filter((page) =>
      page.tabs?.some((tab) => tab.label === 'Suivi'),
    ).map((page) => page.name);
    expect(followUps).toEqual(['Fiche personne', 'Fiche tournoi']);
  });

  // Owner's decision of 8 November 2026: a team has its roster, the structure
  // has its own, and the person's journey reads both.
  it('enters every passage in a roster and reads it on the person', () => {
    type PlannedTab = NonNullable<
      (typeof ROADMAP_SITE_PLAN)[number]['tabs']
    >[number];
    const tab = (page: string, label: string): PlannedTab | undefined =>
      ROADMAP_SITE_PLAN.find(
        (candidate) => candidate.name === page,
      )?.tabs?.find((candidate) => candidate.label === label);
    expect(tab('Fiche personne', 'Parcours')?.managedIn).toBeTruthy();
    // « Roster » for a team, the esport word ; « Effectif » for the structure.
    for (const [page, label] of [
      ['Fiche équipe', 'Roster'],
      ['Bureau & staff', 'Effectif'],
    ] as const) {
      expect(tab(page, label)).toBeDefined();
      expect(tab(page, label)?.managedIn).toBeUndefined();
    }
    // Both in place since 9 November 2026: the team's roster, then the structure's.
    expect(tab('Fiche équipe', 'Roster')?.phase).toBeNull();
    expect(tab('Bureau & staff', 'Effectif')?.phase).toBeNull();
    // The other pseudos are in place, in their En ligne tab (10 November
    // 2026); the games played next, in Identité.
    expect(tab('Fiche personne', 'En ligne')?.summary).toContain(
      'Autres pseudos',
    );
    expect(tab('Fiche personne', 'Identité')?.upcoming).toContain(
      'jeux pratiqués',
    );
  });

  it('gathers the sporting activity in the Esport pole', () => {
    const esport = ROADMAP_SITE_PLAN.filter(
      (page) => page.area === 'esport',
    ).map((page) => page.name);
    expect(esport).toEqual([
      'Jeux',
      'Fiche jeu',
      'Fiche équipe',
      'Tournois',
      'Fiche tournoi',
      'Déplacements',
      'Fiche déplacement',
    ]);
  });

  it('covers each subject with known chantiers or names where it lives', () => {
    const subjects = ROADMAP_COVERAGE.map((row) => row.subject);
    expect(new Set(subjects).size).toBe(subjects.length);
    for (const row of ROADMAP_COVERAGE) {
      expect(row.chantiers.length > 0 || Boolean(row.outside)).toBe(true);
      for (const id of row.chantiers) expect(getRoadmapItem(id)).toBeDefined();
    }
  });

  // Owner's decision of 8 November 2026: what exists leaves the roadmap.
  it('names what a delivered page or tab still gains, exactly when a chantier completes it', () => {
    for (const page of ROADMAP_SITE_PLAN) {
      for (const link of [page, ...(page.tabs ?? [])]) {
        const completed = link.phase === null && Boolean(link.chantier);
        expect(Boolean(link.upcoming), `${page.name} : à venir`).toBe(
          completed,
        );
      }
    }
  });

  it('keeps on the roadmap only what remains to deliver', () => {
    const names = ROADMAP_PLANNED_PAGES.map((page) => page.name);
    for (const delivered of ['Mon compte', 'Utilisateurs', 'Feuille de route'])
      expect(names).not.toContain(delivered);
    const person = ROADMAP_PLANNED_PAGES.find(
      (page) => page.name === 'Fiche personne',
    );
    expect(person?.phase).toBe(1);
    expect(person?.tabs?.find((tab) => tab.label === 'Identité')?.summary).toBe(
      ROADMAP_SITE_PLAN.find((page) => page.name === 'Fiche personne')
        ?.tabs?.[0]?.upcoming,
    );
    const user = ROADMAP_PLANNED_PAGES.find(
      (page) => page.name === 'Fiche utilisateur',
    );
    expect(user?.tabs?.map((tab) => tab.label)).toEqual(['Profil']);
    expect(user?.phase).toBe(getRoadmapItem('access-scopes')?.phase);
    const directory = ROADMAP_PLANNED_PAGES.find(
      (page) => page.name === 'Répertoire',
    );
    expect(directory?.summary).toBe(
      'Filtres par équipe, jeu et anciens membres.',
    );
  });

  // Owner's rule of 8 November 2026: a tab read here, modified elsewhere.
  it('names where a read-only tab is modified, on another page', () => {
    const managed = ROADMAP_SITE_PLAN.flatMap((page) =>
      (page.tabs ?? [])
        .filter((tab) => tab.managedIn)
        .map((tab) => ({ page: page.name, place: tab.managedIn ?? '' })),
    );
    expect(managed.length).toBeGreaterThan(0);
    for (const { page, place } of managed) {
      expect(place.trim()).not.toBe('');
      expect(place).not.toBe(page);
    }
    const person = ROADMAP_SITE_PLAN.find(
      (page) => page.name === 'Fiche personne',
    );
    const managedIn = (label: string): string | undefined =>
      person?.tabs?.find((tab) => tab.label === label)?.managedIn;
    // Adhésions and Finances read in one tab since En ligne opened
    // (10 November 2026): eight tabs at most.
    expect(managedIn('Adhésions')).toBeUndefined();
    expect(managedIn('Finances')).toBe('Adhésions et Finances');
    // Loans, shirts and documents live in their own modules (8 November 2026).
    expect(managedIn('Matériel')).toBe('Matériel & abonnements');
    expect(managedIn('Documents')).toBe('Documents et Contrats');
    // Edited on the fiche, or mixed: a normal tab.
    for (const label of ['Identité', 'Coordonnées', 'Suivi'])
      expect(managedIn(label)).toBeUndefined();
  });

  it('marks read-only tabs with an arrow and says where they are modified', () => {
    const person = ROADMAP_PAGES.filter(
      (page) => page.name === 'Fiche personne',
    );
    const folded = renderToStaticMarkup(
      createElement(RoadmapPagesView, {
        focusName: null,
        onFocusDone: () => undefined,
        onShowItem: () => undefined,
        pages: person,
      }),
    );
    expect(folded).toContain('Onglet en lecture');
    expect(folded).toContain(', se modifie dans Adhésions');
    expect(folded).not.toContain(', se modifie dans Parcours');
  });

  it('renders every page and tab, what is in place told apart from what remains', () => {
    const html = renderToStaticMarkup(
      createElement(RoadmapPagesView, {
        focusName: null,
        onFocusDone: () => undefined,
        onShowItem: () => undefined,
        pages: ROADMAP_PAGES,
      }),
    );
    for (const page of ROADMAP_PAGES) {
      expect(html).toContain(page.name.replace('&', '&amp;'));
      for (const tab of page.tabs ?? []) expect(html).toContain(tab.label);
    }
    expect(html).toContain('Étape 1');
    // Owner, 9 November 2026: what exists is shown, and marked.
    expect(html).toContain('En place');
    expect(html).toContain('en place : </span>Profil');
    expect(html).toContain('+ étape');
    expect(html).toContain('aria-expanded="false"');
  });

  it('marks a page entirely in place, one in place with more to come, and one to build', () => {
    const page = (name: string): RoadmapPageEntry | undefined =>
      ROADMAP_PAGES.find((entry) => entry.name === name);
    expect(page('Utilisateurs')).toMatchObject({
      delivered: true,
      phase: null,
    });
    expect(page('Jeux')).toMatchObject({ delivered: true });
    expect(page('Jeux')?.upcoming).toBeTruthy();
    expect(
      page('Fiche jeu')?.tabs?.find((tab) => tab.label === 'Informations'),
    ).toMatchObject({ delivered: true, phase: null });
    expect(page('Tournois')).toMatchObject({ delivered: false });
    expect(
      ROADMAP_PAGES.filter((entry) => entry.phase !== null).map(
        (entry) => entry.name,
      ),
    ).toEqual(ROADMAP_PLANNED_PAGES.map((entry) => entry.name));
  });
});
