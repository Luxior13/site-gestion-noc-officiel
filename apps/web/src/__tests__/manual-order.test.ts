import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { planManualOrder } from '$server/manual-order';

const active = [
  { id: 'a', name: 'Valorant', position: 0 },
  { id: 'b', name: 'League of Legends', position: 1 },
  { id: 'c', name: 'Rocket League', position: 4 },
];

describe('a new manual order (9 November 2026)', () => {
  it('moves only the items whose rank changes, ranks from 0', () => {
    expect(planManualOrder(active, ['b', 'a', 'c'])).toEqual({
      after: 'League of Legends, Valorant, Rocket League',
      before: 'Valorant, League of Legends, Rocket League',
      changed: true,
      moves: [
        { id: 'b', position: 0 },
        { id: 'a', position: 1 },
        { id: 'c', position: 2 },
      ],
    });
  });

  it('writes nothing for the same order', () => {
    expect(planManualOrder(active, ['a', 'b', 'c'])?.changed).toBe(false);
  });

  it('refuses a list that changed meanwhile: missing, extra or twice', () => {
    for (const ids of [
      ['a', 'b'],
      ['a', 'b', 'c', 'd'],
      ['a', 'b', 'b'],
      ['a', 'b', 'x'],
    ])
      expect(planManualOrder(active, ids)).toBeNull();
  });
});
