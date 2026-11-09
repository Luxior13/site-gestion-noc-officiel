import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { SortableList } from '$ui/sortable-list';

const items = [
  { id: 'f1', name: 'Manager' },
  { id: 'f2', name: 'Coach' },
  { id: 'f3', name: 'Analyste' },
];

const render = (canReorder: boolean, frozen = false): string =>
  renderToStaticMarkup(
    createElement(SortableList<(typeof items)[number]>, {
      'aria-labelledby': 'staff-heading',
      canReorder,
      frozen,
      items,
      labelOf: (item) => item.name,
      onReorder: () => undefined,
      renderItem: (item, handle): ReactNode =>
        createElement('div', null, handle, item.name),
    }),
  );

describe('list ordered by dragging (9 November 2026)', () => {
  it('gives each row a named handle, announced in French', () => {
    const html = render(true);
    expect(html).toContain('aria-labelledby="staff-heading"');
    for (const name of ['Manager', 'Coach', 'Analyste'])
      expect(html).toContain(`aria-label="Déplacer ${name}"`);
    expect(html).toContain('aria-roledescription="élément déplaçable"');
    // The rows keep the order they were given.
    expect(html.indexOf('Manager')).toBeLessThan(html.indexOf('Analyste'));
  });

  it('shows a reader the same rows without any handle', () => {
    const html = render(false);
    expect(html).not.toContain('Déplacer');
    expect(html.match(/<li/g)).toHaveLength(3);
  });

  it('keeps the handles focusable but inert while an order is saved', () => {
    const html = render(true, true);
    expect(html.match(/aria-disabled="true"/g)).toHaveLength(3);
    expect(html).not.toContain(' disabled=""');
  });
});
