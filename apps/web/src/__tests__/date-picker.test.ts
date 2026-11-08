import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { DatePicker } from '$ui/date-picker';

const render = (
  props: Partial<React.ComponentProps<typeof DatePicker>> = {},
): string =>
  renderToStaticMarkup(
    React.createElement(DatePicker, {
      id: 'founded',
      labelId: 'founded-label',
      maxYear: 2100,
      minYear: 1970,
      onChange: () => {},
      value: null,
      ...props,
    }),
  );

describe('the site’s date field (9 November 2026)', () => {
  it('shows a date as precisely as it is known, never an invented day', () => {
    expect(
      render({ value: { date: '2021-03-15', precision: 'DAY' } }),
    ).toContain('15 mars 2021');
    expect(
      render({ value: { date: '2021-03-01', precision: 'MONTH' } }),
    ).toContain('mars 2021');
    expect(
      render({ value: { date: '2019-01-01', precision: 'YEAR' } }),
    ).toMatch(/>2019</);
  });

  it('is a button named by its label, then by its value, opening a calendar', () => {
    const markup = render({ placeholder: 'Non renseignée' });
    expect(markup).toContain('aria-labelledby="founded-label founded-value"');
    expect(markup).toContain('aria-haspopup="dialog"');
    expect(markup).toContain('Non renseignée');
    // Not the browser's date input any more.
    expect(markup).not.toContain('type="date"');
  });

  it('marks an invalid date for assistive technologies', () => {
    const markup = render({
      'aria-describedby': 'founded-error',
      'aria-invalid': true,
    });
    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain('aria-describedby="founded-error"');
  });
});
