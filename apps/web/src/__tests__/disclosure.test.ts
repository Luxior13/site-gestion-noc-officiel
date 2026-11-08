import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Disclosure } from '$components/layout/Disclosure';

describe('disclosure accessible name', () => {
  it('keeps the visible name unless a repeated command names its object', () => {
    const plain = renderToStaticMarkup(
      createElement(Disclosure, {
        children: 'Contenu',
        label: 'Détails de la session',
      }),
    );
    expect(plain).toContain('Détails de la session');
    expect(plain).toContain('aria-expanded="false"');
    expect(plain).not.toContain('aria-label=');

    const named = renderToStaticMarkup(
      createElement(Disclosure, {
        'aria-label': 'Détails de la session — Firefox',
        children: 'Contenu',
        label: 'Détails de la session',
      }),
    );
    expect(named).toContain('aria-label="Détails de la session — Firefox"');
  });
});
