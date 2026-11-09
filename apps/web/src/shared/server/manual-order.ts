import 'server-only';

type Ranked = Readonly<{ id: string; name: string; position: number }>;

/** What a new order changes, and the journal's « before » and « after ». */
export type ManualOrderPlan = Readonly<{
  after: string;
  before: string;
  changed: boolean;
  moves: readonly Readonly<{ id: string; position: number }>[];
}>;

/**
 * Checks a new order of the active items of a list ranked by dragging (owner,
 * 9 November 2026): `ids` names each of `current` (in its shown order) once,
 * or the list changed meanwhile and null is answered. The moved items take
 * ranks 0 to n − 1; the inactive ones keep theirs and stay below.
 */
export const planManualOrder = (
  current: readonly Ranked[],
  ids: readonly string[],
): ManualOrderPlan | null => {
  const byId = new Map(current.map((item) => [item.id, item]));
  if (
    ids.length !== current.length ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !byId.has(id))
  )
    return null;

  return {
    after: ids.map((id) => byId.get(id)?.name ?? '').join(', '),
    before: current.map((item) => item.name).join(', '),
    changed: ids.some((id, index) => current.at(index)?.id !== id),
    moves: ids.flatMap((id, position) =>
      byId.get(id)?.position === position ? [] : [{ id, position }],
    ),
  };
};
