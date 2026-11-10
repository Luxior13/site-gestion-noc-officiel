import type { MemberFunctionKind } from '$features/member-functions/member-function.constants';
import type { PersonRef } from '$features/persons/types/person.types';
import type { ApproximateDate } from '$utils/approximate-date.utils';

/** A function as a passage shows and chooses it. */
export type PassageFunction = Readonly<{
  id: string;
  isActive: boolean;
  kind: MemberFunctionKind;
  name: string;
  position: number;
}>;

/** A person of the Répertoire, by the name the roster shows. */
export type PassagePerson = PersonRef;

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

/**
 * Where passages are kept (9 November 2026): the Roster of a team, or the
 * Effectif of the structure, on Bureau & staff (no team).
 */
export type PassageScope =
  Readonly<{ teamId: string; type: 'team' }> | Readonly<{ type: 'structure' }>;

/** A passage as a person's journey shows it: in which team, of which game. */
export type JourneyItem = Readonly<{
  end: ApproximateDate | null;
  function: PassageFunction;
  id: string;
  start: ApproximateDate;
  /** Null for a function of the structure, kept in Bureau & staff. */
  team: Readonly<{
    game: Readonly<{ id: string; name: string }>;
    id: string;
    isActive: boolean;
    name: string;
  }> | null;
}>;

/** Every passage of a person, the earliest start first. */
export type PersonJourney = Readonly<{ passages: readonly JourneyItem[] }>;

/**
 * The passages of a place, with its functions to choose from: a team's
 * roster and its game's functions, or the structure's and its own.
 */
export type PassageRoster = Readonly<{
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
