/**
 * Order of a list whose items are active or not and that offers no sort
 * choice: active ones first, then by name (owner, 8 November 2026; games,
 * then the teams under each game).
 */
export const compareActiveThenName = (
  left: Readonly<{ isActive: boolean; name: string }>,
  right: Readonly<{ isActive: boolean; name: string }>,
): number =>
  Number(right.isActive) - Number(left.isActive) ||
  left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' });
