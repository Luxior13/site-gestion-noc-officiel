import type { MemberFunctionKind } from '$features/member-functions/member-function.constants';
import type { ApproximateDate } from '$utils/approximate-date.utils';

/** A function as a passage shows and chooses it. */
export type PassageFunction = Readonly<{
  id: string;
  isActive: boolean;
  kind: MemberFunctionKind;
  name: string;
  position: number;
}>;

/**
 * A person of the Répertoire, by the name the roster shows; the name parts
 * give the initials of its avatar.
 */
export type PassagePerson = Readonly<{
  /** « Kaiz · Prénom Nom », or the civil name alone. */
  displayName: string;
  firstName: string | null;
  id: string;
  lastName: string | null;
  nickname: string | null;
}>;

/** The suggestions of the person picker: six at most, and whether more exist. */
export type PassagePersonResults = Readonly<{
  more: boolean;
  persons: readonly PassagePerson[];
}>;

/**
 * Browser-safe projection of a passage (9 November 2026): who, with which
 * function, from when to when. Both dates are given at the start of their
 * period, as every approximate date of the site; `end` null: still there.
 */
export type PassageItem = Readonly<{
  end: ApproximateDate | null;
  function: PassageFunction;
  id: string;
  person: PassagePerson;
  start: ApproximateDate;
  updatedAt: string;
  version: number;
}>;

/** The roster of a team, with the functions of its game to choose from. */
export type TeamRoster = Readonly<{
  functions: readonly PassageFunction[];
  passages: readonly PassageItem[];
}>;

export type PassageInput = Readonly<{
  end: ApproximateDate | null;
  functionId: string;
  start: ApproximateDate;
}>;

export type PassageCreateInput = PassageInput & Readonly<{ personId: string }>;

/** A new function from a date: the passage ends there, another begins. */
export type PassageChangeInput = Readonly<{
  at: ApproximateDate;
  expectedVersion: number;
  functionId: string;
}>;
