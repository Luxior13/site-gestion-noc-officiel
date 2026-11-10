import { existsSync } from 'node:fs';

import { getCountries } from 'libphonenumber-js';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { COUNTRY_OPTIONS } from '$constants/countries.constants';
import { CountryFlag } from '$ui/country-flag';
import { SearchSelect } from '$ui/search-select';

/*
 * Flags before the countries (owner, 10 November 2026: « possible d'avoir
 * les drapeaux à l'intérieur ? »): images of the site, never emoji, which
 * show as two letters on Windows.
 */

const flagFile = (code: string): URL =>
  new URL(`../../public/assets/flags/${code}.svg`, import.meta.url);

describe('country flags', () => {
  it('has a flag for every nationality and every phone country', () => {
    const codes = new Set([
      ...COUNTRY_OPTIONS.map((option) => option.value),
      ...getCountries(),
    ]);
    // Paths built from the two closed lists above.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const missing = [...codes].filter((code) => !existsSync(flagFile(code)));
    expect(missing).toEqual([]);
    expect(
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      existsSync(
        new URL('../../public/assets/flags/LICENSE.txt', import.meta.url),
      ),
    ).toBe(true);
  });

  it('is a decorative image of the site, loaded when shown', () => {
    const html = renderToStaticMarkup(
      React.createElement(CountryFlag, { code: 'FR' }),
    );
    expect(html).toContain('src="/assets/flags/FR.svg"');
    expect(html).toContain('alt=""');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('loading="lazy"');
  });

  it('shows the flag of the chosen country in the field', () => {
    const html = renderToStaticMarkup(
      React.createElement(SearchSelect, {
        emptyText: 'Aucun pays trouvé',
        groups: [
          {
            options: COUNTRY_OPTIONS.slice(0, 3).map((option) => ({
              ...option,
              icon: React.createElement(CountryFlag, { code: option.value }),
            })),
          },
        ],
        id: 'nationality',
        labelId: 'nationality-label',
        onValueChange: () => undefined,
        placeholder: 'Non renseignée',
        searchLabel: 'Rechercher un pays',
        value: 'FR',
      }),
    );
    expect(html).toContain('src="/assets/flags/FR.svg"');
    expect(html.indexOf('FR.svg')).toBeLessThan(html.indexOf('>France<'));
  });
});
