import type { ApproximateDate } from '$utils/approximate-date.utils';

/** Browser-safe projection of a team, shown under its game. */
export type TeamItem = Readonly<{
  founded: ApproximateDate;
  gameId: string;
  id: string;
  isActive: boolean;
  name: string;
  updatedAt: string;
  version: number;
}>;

/** A team with its game, as its record shows it. */
export type TeamDetail = TeamItem &
  Readonly<{
    game: Readonly<{ id: string; isActive: boolean; name: string }>;
  }>;

export type TeamInput = Readonly<{
  founded: ApproximateDate;
  gameId: string;
  isActive: boolean;
  name: string;
}>;

/** What changes on a team: its game is set once, at creation. */
export type TeamUpdateInput = Omit<TeamInput, 'gameId'>;
