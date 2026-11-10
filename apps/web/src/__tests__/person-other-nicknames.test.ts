import { describe, expect, it } from 'vitest';

import {
  createOtherNicknameSchema,
  updateOtherNicknameSchema,
} from '$features/persons/schemas/person-nickname.schemas';

/*
 * The other pseudos of a record (owner, 10 November 2026: « ok go »): a
 * former one, a second account, a name in a game, found by the search.
 */

describe('another pseudo', () => {
  it('keeps the pseudo, an optional note and an optional end', () => {
    expect(
      createOtherNicknameSchema.parse({
        nickname: '  Shadow ',
        note: ' ',
      }),
    ).toEqual({ nickname: 'Shadow', note: null, until: null });
    // A date known to the year sits at the start of its year.
    expect(
      createOtherNicknameSchema.parse({
        nickname: 'Shadow',
        note: 'Ancien pseudo',
        until: { date: '2023-06-15', precision: 'YEAR' },
      }).until,
    ).toEqual({ date: '2023-01-01', precision: 'YEAR' });
  });

  it('refuses an empty pseudo, a long note and unknown fields', () => {
    const blank = createOtherNicknameSchema.safeParse({ nickname: '  ' });
    expect(blank.error?.issues[0]).toMatchObject({
      message: 'Renseignez le pseudo',
      path: ['nickname'],
    });
    expect(
      createOtherNicknameSchema.safeParse({
        nickname: 'Shadow',
        note: 'x'.repeat(41),
      }).success,
    ).toBe(false);
    expect(
      createOtherNicknameSchema.safeParse({
        nickname: 'Shadow',
        personVersion: 3,
      }).success,
    ).toBe(false);
    expect(
      updateOtherNicknameSchema.safeParse({ nickname: 'Shadow' }).success,
    ).toBe(false);
  });
});
