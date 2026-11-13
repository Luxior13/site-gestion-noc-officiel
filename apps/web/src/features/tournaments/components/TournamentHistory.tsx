'use client';

import { ArrowUpRight, RefreshCw, Trophy } from 'lucide-react';
import Link from 'next/link';
import React, { type FC, useCallback, useEffect, useState } from 'react';

import { ContentState } from '$components/layout/ContentState';
import { FEATURES } from '$constants/feature-registry.constants';
import { tournamentDetailPath } from '$constants/routes.constants';
import { Button } from '$ui/button';
import {
  DataTableDesktop,
  DataTableMobileList,
  DataTableSection,
} from '$ui/data-table-section';
import directoryStyles from '$ui/directory.module.css';
import { Skeleton } from '$ui/skeleton';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '$ui/table';
import { getLocalToday } from '$utils/approximate-date.utils';
import { cn } from '$utils/css.utils';

import { fetchTournaments } from '../tournament.api';
import {
  placementLabel,
  tournamentDatesLabel,
  tournamentStateOn,
  tournamentTitle,
} from '../tournament.ui';
import type { TournamentItem } from '../types/tournament.types';
import { TournamentAvatar, TournamentStateBadge } from './TournamentParts';

const LINE_FOCUS =
  'has-[a:focus-visible]:ring-ring relative has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-inset';
const NAME_LINK =
  'text-foreground hover:text-primary-emphasis block min-w-0 outline-none after:absolute after:inset-0 hover:underline hover:underline-offset-[3px]';

type Target = { teamId: string } | { personId: string };

/** The placement of the line concerned: the team's, or the person's team's. */
const lineOf = (
  tournament: TournamentItem,
): TournamentItem['entries'][number] | null => tournament.entries[0] ?? null;

/**
 * The tournaments a team played, or a person (11 November 2026), the
 * latest first, in read only: Tournois ↗ of a team's record, and the
 * tournaments of a person's Parcours, those of the teams they were in at
 * the time (13 November 2026). Each line opens the tournament.
 */
export const TournamentHistory: FC<{
  /** A notice line and « Ouvrir les tournois », for a tab of its own. */
  standalone: boolean;
  target: Target;
}> = ({ standalone, target }) => {
  const [tournaments, setTournaments] = useState<TournamentItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const today = getLocalToday();
  const showTeam = 'personId' in target;
  const filters =
    'personId' in target
      ? { personId: target.personId }
      : { teamId: target.teamId };
  const key = 'personId' in target ? target.personId : target.teamId;

  const load = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      setError(null);
      try {
        setTournaments(await fetchTournaments(filters, signal));
      } catch (caught) {
        if (!signal?.aborted)
          setError(
            caught instanceof Error ? caught.message : 'Chargement impossible',
          );
      }
    },
    // The filters follow the target's id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, showTeam],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);

    return (): void => controller.abort();
  }, [load]);

  if (error)
    return (
      <ContentState
        action={
          <Button
            onClick={() => void load()}
            size="sm"
            type="button"
            variant="outline"
          >
            <RefreshCw className="size-4" />
            Réessayer
          </Button>
        }
        description={error}
        icon={<Trophy aria-hidden="true" className="size-5" />}
        kind="error"
        layout="panel"
        title="Les tournois ne peuvent pas être chargés"
      />
    );
  if (!tournaments)
    return (
      <div aria-label="Chargement des tournois" role="status">
        <Skeleton className="rounded-panel h-32" />
      </div>
    );

  const empty = (
    <ContentState
      className="min-h-0 border-0 bg-transparent p-0"
      description={
        showTeam
          ? 'Les tournois de ses équipes, pendant qu’elle y était, s’affichent ici.'
          : 'Les tournois où l’équipe est engagée s’affichent ici.'
      }
      icon={<Trophy aria-hidden="true" className="size-5" />}
      layout="panel"
      title="Aucun tournoi pour l’instant"
    />
  );
  const name = (tournament: TournamentItem): React.ReactNode => (
    <div className="flex min-w-0 items-center gap-2.5">
      <TournamentAvatar />
      <div className="min-w-0">
        <Link className={NAME_LINK} href={tournamentDetailPath(tournament.id)}>
          <span className="font-semibold [overflow-wrap:anywhere]">
            {tournamentTitle(tournament)}
          </span>
        </Link>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {tournament.game.name}
          {tournament.organizer && ` · ${tournament.organizer.name}`}
        </p>
      </div>
    </div>
  );

  return (
    <div className={directoryStyles.directory}>
      <DataTableSection
        className="border-border-content bg-surface-content rounded-panel"
        headerClassName="bg-surface-content-header"
        title={standalone ? undefined : 'Tournois'}
        toolbar={
          standalone ? (
            <div className="flex w-full flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground text-xs">
                Les tournois se tiennent dans Esport › Tournois : chaque ligne
                ouvre son tournoi.
              </p>
              <Button asChild size="sm" variant="outline">
                <Link href={FEATURES.tournaments.href}>
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                  Ouvrir les tournois
                </Link>
              </Button>
            </div>
          ) : undefined
        }
      >
        <DataTableDesktop>
          <Table
            aria-label={showTeam ? 'Tournois joués' : 'Tournois de l’équipe'}
            className={directoryStyles.table}
          >
            <TableCaption className="sr-only">
              Les tournois, le plus récent en premier, avec le classement de
              l’équipe
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[190px]">Dates</TableHead>
                <TableHead>Tournoi</TableHead>
                {showTeam && (
                  <TableHead className="w-[200px]">Équipe</TableHead>
                )}
                <TableHead className="w-[120px]">Classement</TableHead>
                <TableHead className="w-[110px]">État</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournaments.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="h-36 text-center"
                    colSpan={showTeam ? 5 : 4}
                  >
                    {empty}
                  </TableCell>
                </TableRow>
              ) : (
                tournaments.map((tournament) => {
                  const line = lineOf(tournament);

                  return (
                    <TableRow className={LINE_FOCUS} key={tournament.id}>
                      <TableCell className="pointer-events-none">
                        {tournamentDatesLabel(tournament)}
                      </TableCell>
                      <TableCell>{name(tournament)}</TableCell>
                      {showTeam && (
                        <TableCell className="pointer-events-none">
                          {line?.team.name ?? '—'}
                        </TableCell>
                      )}
                      <TableCell className="pointer-events-none tabular-nums">
                        {(line && placementLabel(line)) ?? '—'}
                      </TableCell>
                      <TableCell className="pointer-events-none">
                        <TournamentStateBadge
                          state={tournamentStateOn(tournament, today)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </DataTableDesktop>
        <DataTableMobileList className={directoryStyles.mobileList}>
          {tournaments.length === 0 ? (
            <div className="px-4 py-6">{empty}</div>
          ) : (
            tournaments.map((tournament) => {
              const line = lineOf(tournament);
              const placement = line ? placementLabel(line) : null;

              return (
                <div
                  className={cn(
                    LINE_FOCUS,
                    'px-4 py-3 hover:bg-[var(--surface-row-hover)]',
                  )}
                  key={tournament.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    {name(tournament)}
                    <TournamentStateBadge
                      state={tournamentStateOn(tournament, today)}
                    />
                  </div>
                  <p className="text-muted-foreground mt-1.5 text-xs">
                    {[
                      tournamentDatesLabel(tournament),
                      showTeam ? line?.team.name : null,
                      placement,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              );
            })
          )}
        </DataTableMobileList>
      </DataTableSection>
    </div>
  );
};
