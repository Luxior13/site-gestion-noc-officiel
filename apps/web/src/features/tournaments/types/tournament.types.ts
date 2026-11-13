import type {
  TournamentDatePrecision,
  TournamentFormat,
} from '../tournament.constants';

type Named = Readonly<{ id: string; name: string }>;

export type TournamentTeamRef = Readonly<{
  id: string;
  isActive: boolean;
  name: string;
}>;

/** One of our teams engaged, as the list shows it. */
type TournamentEntrySummary = Readonly<{
  id: string;
  placementFrom: number | null;
  placementTo: number | null;
  team: TournamentTeamRef;
}>;

/**
 * A tournament of the list (11 November 2026); dates as YYYY-MM-DD, null
 * while unknown, a month stored on its first day (12 November 2026).
 */
export type TournamentItem = Readonly<{
  datePrecision: TournamentDatePrecision;
  /** « Saison 2 »: tells apart two tournaments of a name. */
  edition: string | null;
  /** Only with a first day known to the day. */
  endOn: string | null;
  /** Only the teams of the reader's Esport scope. */
  entries: readonly TournamentEntrySummary[];
  format: TournamentFormat;
  game: Named;
  id: string;
  isCancelled: boolean;
  location: string | null;
  name: string;
  organizer: Named | null;
  startOn: string | null;
}>;

/**
 * One of our teams engaged, with its placement (13 November 2026: who
 * played is not kept, the team's Roster tells it).
 */
export type TournamentEntryItem = TournamentEntrySummary &
  Readonly<{ version: number }>;

export type TournamentDetail = Omit<TournamentItem, 'entries'> &
  Readonly<{
    entries: readonly TournamentEntryItem[];
    /** Per team; null when unknown, 0 when free. */
    entryFeeCents: number | null;
    /** The operations naming it, for the Finances tab. */
    linkUrl: string | null;
    operationCount: number;
    registrationDeadlineOn: string | null;
    updatedAt: string;
    version: number;
  }>;

/** What the creation asks: what the tournament is; when, if known. */
export type TournamentCreateInput = Readonly<{
  datePrecision: TournamentDatePrecision;
  edition: string | null;
  endOn: string | null;
  gameId: string;
  name: string;
  organizerId: string | null;
  startOn: string | null;
  /** Engaged at once; required for a scope of teams. */
  teamId: string | null;
}>;

/** What the record edits in place; the game stays. */
export type TournamentInput = Readonly<{
  datePrecision: TournamentDatePrecision;
  edition: string | null;
  endOn: string | null;
  entryFeeCents: number | null;
  format: TournamentFormat;
  isCancelled: boolean;
  linkUrl: string | null;
  location: string | null;
  name: string;
  organizerId: string | null;
  registrationDeadlineOn: string | null;
  startOn: string | null;
}>;

/** An engaged team's placement. */
export type TournamentEntryInput = Readonly<{
  placementFrom: number | null;
  placementTo: number | null;
}>;

/** What the windows of the tournaments propose. */
export type TournamentChoices = Readonly<{
  games: readonly (Named & {
    isActive: boolean;
    teams: readonly TournamentTeamRef[];
  })[];
  /** The organisations of kind Organisateur, by name. */
  organizers: readonly Named[];
}>;
