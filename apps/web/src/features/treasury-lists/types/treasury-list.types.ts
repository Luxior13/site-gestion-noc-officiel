import type { TreasuryChoiceKind } from '../treasury-list.constants';

/** A value of a list of the treasury, as the browser reads it. */
export type TreasuryChoiceItem = Readonly<{
  id: string;
  isActive: boolean;
  kind: TreasuryChoiceKind;
  name: string;
  position: number;
  updatedAt: string;
  /** The operations that name it: a used value stays, made inactive. */
  useCount: number;
  version: number;
}>;

export type TreasuryChoiceInput = Readonly<{
  isActive: boolean;
  kind: TreasuryChoiceKind;
  name: string;
}>;
