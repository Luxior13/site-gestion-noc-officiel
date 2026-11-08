import type { DatePrecision } from '../game.constants';

/** A date known to the day, the month or the year (`date` is YYYY-MM-DD). */
export type ApproximateDate = Readonly<{
  date: string;
  precision: DatePrecision;
}>;

/** Browser-safe projection of a game (one section of the structure). */
export type GameItem = Readonly<{
  firstOpened: ApproximateDate;
  id: string;
  isActive: boolean;
  name: string;
  shortName: string | null;
  updatedAt: string;
  version: number;
}>;

export type GameInput = Readonly<{
  firstOpened: ApproximateDate;
  isActive: boolean;
  name: string;
  shortName: string | null;
}>;
