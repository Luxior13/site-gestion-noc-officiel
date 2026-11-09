import type { ApproximateDate } from '$utils/approximate-date.utils';

/** Browser-safe projection of a game (one section of the structure). */
export type GameItem = Readonly<{
  firstOpened: ApproximateDate;
  /** Functions of the game (Joueur, Coach…), managed in its record. */
  functionCount: number;
  id: string;
  isActive: boolean;
  name: string;
  shortName: string | null;
  /** Teams attached to the game: a game that has some is not deleted. */
  teamCount: number;
  updatedAt: string;
  version: number;
}>;

export type GameInput = Readonly<{
  firstOpened: ApproximateDate;
  isActive: boolean;
  name: string;
  shortName: string | null;
}>;
