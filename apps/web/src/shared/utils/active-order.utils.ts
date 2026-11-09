/**
 * Order of a list ranked by importance (owner, 9 November 2026, « pense long
 * terme »): the active items first, in the order their managers set by
 * dragging; the inactive ones below, in their last order; the name breaks a
 * tie. Games, the teams of each game, the functions of each kind.
 */
export const compareActiveThenRank = (
  left: Readonly<{ isActive: boolean; name: string; position: number }>,
  right: Readonly<{ isActive: boolean; name: string; position: number }>,
): number =>
  Number(right.isActive) - Number(left.isActive) ||
  left.position - right.position ||
  left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' });
