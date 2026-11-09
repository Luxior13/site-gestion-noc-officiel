import type { MemberFunctionKind } from '../member-function.constants';

/** Browser-safe projection of a function, listed in its game's record. */
export type MemberFunctionItem = Readonly<{
  id: string;
  isActive: boolean;
  kind: MemberFunctionKind;
  name: string;
  /** Rank within its game and kind, set by dragging. */
  position: number;
  updatedAt: string;
  version: number;
}>;

export type MemberFunctionInput = Readonly<{
  isActive: boolean;
  kind: MemberFunctionKind;
  name: string;
}>;
