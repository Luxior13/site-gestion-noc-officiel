import { compareRank } from '$utils/active-order.utils';

/** Limit shared by the form, the API and the database (CHECK constraint). */
export const MEMBER_FUNCTION_NAME_MAX_LENGTH = 40;

/**
 * What a function is about (9 November 2026): a fixed list, in the code. The
 * board comes first in the structure, the players first in a game; the staff
 * last in both.
 */
const MEMBER_FUNCTION_KINDS = ['BOARD', 'PLAYER', 'STAFF'] as const;
export type MemberFunctionKind = (typeof MEMBER_FUNCTION_KINDS)[number];

/**
 * Where a function belongs: a game (its teams' rosters) or the structure
 * itself (Bureau & staff, 9 November 2026), each with its own list.
 */
export type FunctionScope =
  Readonly<{ gameId: string; type: 'game' }> | Readonly<{ type: 'structure' }>;
export type FunctionScopeType = FunctionScope['type'];

export const STRUCTURE_SCOPE: FunctionScope = { type: 'structure' };

/**
 * The kinds of each list (owner, 9 November 2026: « ok go »): players and
 * their staff in a game; the board, elected, and the staff in the structure,
 * so the président never drowns among the graphistes. The base refuses the
 * others (`MemberFunction_kind_scope_check`).
 */
const GAME_KINDS: readonly MemberFunctionKind[] = ['PLAYER', 'STAFF'];
const STRUCTURE_KINDS: readonly MemberFunctionKind[] = ['BOARD', 'STAFF'];

export const functionKindsOf = (
  scope: FunctionScopeType,
): readonly MemberFunctionKind[] =>
  scope === 'game' ? GAME_KINDS : STRUCTURE_KINDS;

type KindTexts = Readonly<{ empty: string; group: string; label: string }>;

/** « Encadrement » in a team, « Staff » in the structure: one kind, two words. */
const KIND_TEXTS: ReadonlyMap<
  FunctionScopeType,
  ReadonlyMap<MemberFunctionKind, KindTexts>
> = new Map([
  [
    'game',
    new Map<MemberFunctionKind, KindTexts>([
      [
        'PLAYER',
        {
          empty: 'Aucune fonction de joueur',
          group: 'Joueurs',
          label: 'Joueur',
        },
      ],
      [
        'STAFF',
        {
          empty: 'Aucune fonction d’encadrement',
          group: 'Encadrement',
          label: 'Encadrement',
        },
      ],
    ]),
  ],
  [
    'structure',
    new Map<MemberFunctionKind, KindTexts>([
      [
        'BOARD',
        {
          empty: 'Aucune fonction du bureau',
          group: 'Bureau',
          label: 'Bureau',
        },
      ],
      [
        'STAFF',
        { empty: 'Aucune fonction de staff', group: 'Staff', label: 'Staff' },
      ],
    ]),
  ],
]);

const kindTexts = (
  kind: MemberFunctionKind,
  scope: FunctionScopeType,
): KindTexts =>
  KIND_TEXTS.get(scope)?.get(kind) ?? { empty: kind, group: kind, label: kind };

/** The kind as a choice and in the journal: « Joueur », « Bureau ». */
export const memberFunctionKindLabel = (
  kind: MemberFunctionKind,
  scope: FunctionScopeType,
): string => kindTexts(kind, scope).label;

/** « Joueurs », « Encadrement », « Bureau », « Staff »: a group's heading. */
export const memberFunctionGroupLabel = (
  kind: MemberFunctionKind,
  scope: FunctionScopeType,
): string => kindTexts(kind, scope).group;

/** « Aucune fonction d’encadrement » under an empty group. */
export const memberFunctionEmptyGroupLabel = (
  kind: MemberFunctionKind,
  scope: FunctionScopeType,
): string => kindTexts(kind, scope).empty;

type CommonFunction = Readonly<{ kind: MemberFunctionKind; name: string }>;

/**
 * Offered in one click while a list has no function yet, then edited like any
 * other (owner, 9 November 2026).
 */
const COMMON_GAME_FUNCTIONS: readonly CommonFunction[] = [
  { kind: 'PLAYER', name: 'Joueur' },
  { kind: 'PLAYER', name: 'Remplaçant' },
  { kind: 'STAFF', name: 'Coach' },
  { kind: 'STAFF', name: 'Manager' },
  { kind: 'STAFF', name: 'Analyste' },
];

const COMMON_STRUCTURE_FUNCTIONS: readonly CommonFunction[] = [
  { kind: 'BOARD', name: 'Président' },
  { kind: 'BOARD', name: 'Vice-président' },
  { kind: 'BOARD', name: 'Trésorier' },
  { kind: 'BOARD', name: 'Secrétaire' },
  { kind: 'STAFF', name: 'Graphiste' },
  { kind: 'STAFF', name: 'Monteur' },
  { kind: 'STAFF', name: 'Community manager' },
  { kind: 'STAFF', name: 'Bénévole' },
];

export const commonFunctionsOf = (
  scope: FunctionScopeType,
): readonly CommonFunction[] =>
  scope === 'game' ? COMMON_GAME_FUNCTIONS : COMMON_STRUCTURE_FUNCTIONS;

/** Limit of a reordered group, far above any real list of functions. */
export const MEMBER_FUNCTION_GROUP_MAX = 100;

/**
 * Order of the functions of a list: the board or the players first, then the
 * staff; in each, the order their managers set by dragging, active or not
 * (owner, 9 November 2026), the same on every page.
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
    MEMBER_FUNCTION_KINDS.indexOf(right.kind) || compareRank(left, right);
