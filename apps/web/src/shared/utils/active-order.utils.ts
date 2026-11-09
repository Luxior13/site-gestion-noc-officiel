type Ranked = Readonly<{ isActive: boolean; name: string; position: number }>;

/**
 * Order of a list ranked by importance (owner, 9 November 2026): one order,
 * set by dragging, active and inactive items mixed, since an inactive item
 * never blocks (« je n’arrive pas à échanger deux jeux »); the name breaks a
 * tie. Games, the teams of each game, the functions of each kind.
 */
export const compareRank = (left: Ranked, right: Ranked): number =>
  left.position - right.position ||
  left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' });

/**
 * Order of the same items in a choice (a drop-down list): the active ones
 * first, the inactive ones after them, marked « (inactif) », each in the
 * dragged order (PREF-Q10, 9 November 2026).
 */
export const compareActiveThenRank = (left: Ranked, right: Ranked): number =>
  Number(right.isActive) - Number(left.isActive) || compareRank(left, right);
