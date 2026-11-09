import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  filterSearchSelectGroups,
  SEARCH_SELECT_SEARCH_FROM,
  SearchSelect,
  type SearchSelectGroup,
} from '$ui/search-select';

const groups: readonly SearchSelectGroup[] = [
  {
    label: 'Bureau',
    options: [
      { label: 'Président', value: 'b1' },
      { label: 'Trésorier', value: 'b2' },
    ],
  },
  {
    label: 'Staff',
    options: [
      { label: 'Community manager', note: 'inactive', value: 's1' },
      { label: 'Graphiste', value: 's2' },
    ],
  },
];

const labels = (shown: readonly SearchSelectGroup[]): string[][] =>
  shown.map((group) => [
    group.label ?? '',
    ...group.options.map((option) => option.label),
  ]);

// Owner, 9 November 2026: « dans les menus comme ça, la barre de recherche
// si beaucoup de fonctions ».
describe('a choice among the values of a list kept on the site', () => {
  it('keeps every group under its heading when nothing is typed', () => {
    expect(labels(filterSearchSelectGroups(groups, ''))).toEqual([
      ['Bureau', 'Président', 'Trésorier'],
      ['Staff', 'Community manager', 'Graphiste'],
    ]);
  });

  it('searches by the site’s rule: accents, case, every word', () => {
    expect(labels(filterSearchSelectGroups(groups, 'TRES'))).toEqual([
      ['Bureau', 'Trésorier'],
    ]);
    expect(labels(filterSearchSelectGroups(groups, 'manager comm'))).toEqual([
      ['Staff', 'Community manager'],
    ]);
    expect(filterSearchSelectGroups(groups, 'coach')).toEqual([]);
  });

  it('opens on a search from eight choices', () => {
    expect(SEARCH_SELECT_SEARCH_FROM).toBe(8);
  });

  it('is a field named by its label, then by its value', () => {
    const render = (value: string): string =>
      renderToStaticMarkup(
        React.createElement(SearchSelect, {
          'aria-invalid': value === '',
          emptyText: 'Aucune fonction trouvée',
          groups,
          id: 'function',
          labelId: 'function-label',
          onValueChange: () => undefined,
          placeholder: 'Choisir une fonction',
          searchLabel: 'Rechercher une fonction',
          value,
        }),
      );
    const empty = render('');
    expect(empty).toContain('role="combobox"');
    expect(empty).toContain('aria-expanded="false"');
    expect(empty).toContain('aria-haspopup="listbox"');
    expect(empty).toContain('aria-invalid="true"');
    expect(empty).toMatch(/aria-labelledby="function-label [^"]+"/u);
    expect(empty).toContain('Choisir une fonction');
    const chosen = render('s1');
    expect(chosen).toContain('Community manager');
    expect(chosen).toContain('(inactive)');
    expect(chosen).not.toContain('Choisir une fonction');
  });
});
