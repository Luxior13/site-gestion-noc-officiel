import type { ApproximateDate } from '$utils/approximate-date.utils';

/** Browser-safe projection of a team, shown under its game. */
export type TeamItem = Readonly<{
  founded: ApproximateDate;
  gameId: string;
  id: string;
  isActive: boolean;
  name: string;
  /** Rank among the active teams of its game, set by dragging. */
  position: number;
  updatedAt: string;
  version: number;
}>;

/** A team with its game, as its record shows it. */
export type TeamDetail = TeamItem &
  Readonly<{
    formerCount: number;
    /** People with an ended passage: the former members tab's count. */
    game: Readonly<{ id: string; isActive: boolean; name: string }>;
    /** People in its roster today: the Roster tab's count. */
    memberCount: number;
    /** Passages of its roster, past ones too: a team that has some stays. */
    passageCount: number;
  }>;

export type TeamInput = Readonly<{
  founded: ApproximateDate;
  gameId: string;
  isActive: boolean;
  name: string;
}>;

/** What changes on a team: its game is set once, at creation. */
export type TeamUpdateInput = Omit<TeamInput, 'gameId'>;
