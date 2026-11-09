import { compareActiveThenRank } from '$utils/active-order.utils';

/** Limit shared by the form, the API and the database (CHECK constraint). */
export const MEMBER_FUNCTION_NAME_MAX_LENGTH = 40;

/**
 * What a function is about (9 November 2026): a fixed list, in the code. The
 * players come first wherever functions are listed.
 */
export const MEMBER_FUNCTION_KINDS = ['PLAYER', 'STAFF'] as const;
export type MemberFunctionKind = (typeof MEMBER_FUNCTION_KINDS)[number];

const KIND_LABELS: ReadonlyMap<MemberFunctionKind, string> = new Map([
  ['PLAYER', 'Joueur'],
  ['STAFF', 'Encadrement'],
]);

export const memberFunctionKindLabel = (kind: MemberFunctionKind): string =>
  KIND_LABELS.get(kind) ?? kind;

/**
 * Offered in one click while a game has no function yet, then edited like any
 * other (owner, 9 November 2026).
 */
export const COMMON_GAME_FUNCTIONS: readonly Readonly<{
  kind: MemberFunctionKind;
  name: string;
}>[] = [
  { kind: 'PLAYER', name: 'Joueur' },
  { kind: 'PLAYER', name: 'Remplaçant' },
  { kind: 'STAFF', name: 'Coach' },
  { kind: 'STAFF', name: 'Manager' },
  { kind: 'STAFF', name: 'Analyste' },
];

/** Limit of a reordered group, far above any real list of functions. */
export const MEMBER_FUNCTION_GROUP_MAX = 100;

/**
 * Order of the functions of a game: players first, then the staff; in each,
 * the active ones in the order their managers set by dragging, then the
 * inactive ones (owner, 9 November 2026), the same on every page.
 */
type Sortable = Readonly<{
  isActive: boolean;
  kind: MemberFunctionKind;
  name: string;
  position: number;
}>;

export const compareMemberFunctions = (
  left: Sortable,
  right: Sortable,
): number =>
  MEMBER_FUNCTION_KINDS.indexOf(left.kind) -
    MEMBER_FUNCTION_KINDS.indexOf(right.kind) ||
  compareActiveThenRank(left, right);

/** « Joueurs », « Encadrement »: the heading of each group of the list. */
const GROUP_LABELS: ReadonlyMap<MemberFunctionKind, string> = new Map([
  ['PLAYER', 'Joueurs'],
  ['STAFF', 'Encadrement'],
]);

export const memberFunctionGroupLabel = (kind: MemberFunctionKind): string =>
  GROUP_LABELS.get(kind) ?? kind;
