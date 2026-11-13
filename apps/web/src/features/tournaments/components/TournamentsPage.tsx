'use client';

import { Plus, RotateCcw, Trophy } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import AuthenticatedLayout from '$components/AuthenticatedLayout';
import { ContentState } from '$components/layout/ContentState';
import { PageIdentityHero } from '$components/layout/PageIdentityHero';
import { AccessDeniedState } from '$components/layout/PageState';
import { FEATURES } from '$constants/feature-registry.constants';
import { tournamentDetailPath } from '$constants/routes.constants';
import { useUser } from '$context/UserContext';
import { Button } from '$ui/button';
import {
  DataTableDesktop,
  DataTableMobileList,
  DataTableSection,
} from '$ui/data-table-section';
import directoryStyles from '$ui/directory.module.css';
import { ListSearchField } from '$ui/list-search-field';
import { PageCanvas, PageShell } from '$ui/page-shell';
import { QuickFilter, QuickFilterGroup } from '$ui/quick-filter';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '$ui/select';
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
import { getSearchTerms, includesSearchTerms } from '$utils/search-text.utils';

import { fetchTournaments } from '../tournament.api';
import {
  TOURNAMENT_FORMAT_LABELS,
  TOURNAMENT_NAME_MAX_LENGTH,
  TOURNAMENT_STATE_FILTER_LABELS,
  TOURNAMENT_STATES,
  type TournamentState,
} from '../tournament.constants';
import { getTournamentCapabilities } from '../tournament.permissions';
import {
  listedEntries,
  placementLabel,
  tournamentDatesShortLabel,
  tournamentStateOn,
  tournamentTitle,
  tournamentYear,
} from '../tournament.ui';
import type { TournamentItem } from '../types/tournament.types';
import {
  TournamentAvatar,
  TournamentDates,
  TournamentStateBadge,
} from './TournamentParts';

// The window loads when it opens.
const TournamentDialog = dynamic(() =>
  import('./TournamentDialog').then((module) => module.TournamentDialog),
);

const TOURNAMENT_NOUN = ['tournoi', 'tournois'] as const;
const ALL = 'all';

/** One focus ring per line: the stretched name link lights its row. */
const LINE_FOCUS =
  'has-[a:focus-visible]:ring-ring relative has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-inset';
const NAME_LINK =
  'text-foreground hover:text-primary-emphasis block min-w-0 outline-none after:absolute after:inset-0 hover:underline hover:underline-offset-[3px]';

/** « Lyon e-Sport · LAN, Lyon » ; on a phone's card, the game first. */
const tournamentContext = (
  tournament: TournamentItem,
  withGame: boolean,
): string =>
  [
    withGame ? tournament.game.name : null,
    tournament.organizer?.name,
    tournament.format === 'LAN'
      ? tournament.location
        ? `LAN, ${tournament.location}`
        : 'LAN'
      : TOURNAMENT_FORMAT_LABELS.ONLINE,
  ]
    .filter(Boolean)
    .join(' · ');

/**
 * « Noctambule Valorant · 3e–4e », one line per engaged team, two at most
 * and « +1 » for the others (`listedEntries`).
 */
const EngagedTeams: FC<{ className?: string; tournament: TournamentItem }> = ({
  className = 'space-y-0.5',
  tournament,
}) => {
  if (tournament.entries.length === 0)
    return <span className="text-muted-foreground">Aucune équipe</span>;
  const { hidden, shown } = listedEntries(tournament.entries);

  return (
    <ul className={className}>
      {shown.map((entry, index) => {
        const placement = placementLabel(entry);

        return (
          <li className="min-w-0 [overflow-wrap:anywhere]" key={entry.id}>
            {entry.team.name}
            {placement && (
              <span className="text-muted-foreground tabular-nums">
                {' · '}
                {placement}
              </span>
            )}
            {hidden > 0 && index === shown.length - 1 && (
              <span className="text-muted-foreground ml-1.5 font-medium tabular-nums">
                <span aria-hidden="true">+{hidden}</span>
                <span className="sr-only">
                  {hidden > 1
                    ? `et ${hidden} autres équipes`
                    : 'et 1 autre équipe'}
                </span>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
};

const TournamentName: FC<{
  tournament: TournamentItem;
  withGame?: boolean;
}> = ({ tournament, withGame = false }) => (
  <div className="min-w-0">
    <Link className={NAME_LINK} href={tournamentDetailPath(tournament.id)}>
      <span className="font-semibold [overflow-wrap:anywhere]">
        {tournamentTitle(tournament)}
      </span>
    </Link>
    <p className="text-muted-foreground mt-0.5 text-xs [overflow-wrap:anywhere]">
      {tournamentContext(tournament, withGame)}
    </p>
  </div>
);

const TournamentsList: FC<{
  tournaments: readonly TournamentItem[];
}> = ({ tournaments }) => {
  const today = getLocalToday();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<TournamentState | typeof ALL>(ALL);
  const [gameId, setGameId] = useState<string>(ALL);
  const [year, setYear] = useState<string>(ALL);
  const terms = useMemo(() => getSearchTerms(query), [query]);
  const games = useMemo(
    () =>
      [
        ...new Map(
          tournaments.map((tournament) => [
            tournament.game.id,
            tournament.game,
          ]),
        ).values(),
      ].sort((left, right) => left.name.localeCompare(right.name, 'fr')),
    [tournaments],
  );
  const years = useMemo(
    () =>
      [
        ...new Set(
          tournaments.flatMap((tournament) => {
            const value = tournamentYear(tournament);

            return value === null ? [] : [value];
          }),
        ),
      ].sort((left, right) => right - left),
    [tournaments],
  );
  // Search, game and year first: the quick filters count within them.
  const searched = useMemo(
    () =>
      tournaments.filter(
        (tournament) =>
          (year === ALL || String(tournamentYear(tournament)) === year) &&
          includesSearchTerms(
            [
              tournamentTitle(tournament),
              tournamentContext(tournament, true),
              ...tournament.entries.map((entry) => entry.team.name),
            ].join(' '),
            terms,
          ),
      ),
    [terms, tournaments, year],
  );
  const ofGame = (tournament: TournamentItem, id: string): boolean =>
    id === ALL || tournament.game.id === id;
  const ofState = (
    tournament: TournamentItem,
    filter: TournamentState | typeof ALL,
  ): boolean =>
    filter === ALL || tournamentStateOn(tournament, today) === filter;
  const visible = searched.filter(
    (tournament) => ofGame(tournament, gameId) && ofState(tournament, state),
  );
  const isFiltered =
    Boolean(query.trim()) || state !== ALL || gameId !== ALL || year !== ALL;
  const reset = (): void => {
    setQuery('');
    setState(ALL);
    setGameId(ALL);
    setYear(ALL);
  };

  const emptyState = (
    <ContentState
      action={
        isFiltered ? (
          <Button onClick={reset} size="sm" type="button" variant="link">
            Réinitialiser
          </Button>
        ) : undefined
      }
      className="min-h-0 border-0 bg-transparent p-0"
      description={
        isFiltered
          ? undefined
          : 'Chaque tournoi garde ses équipes engagées et leur classement.'
      }
      icon={<Trophy aria-hidden="true" className="size-5" />}
      layout="panel"
      title={
        isFiltered ? 'Aucun tournoi trouvé' : 'Aucun tournoi pour l’instant'
      }
    />
  );

  const toolbar = (
    <div className="w-full">
      <form
        aria-label="Rechercher et filtrer les tournois"
        autoComplete="off"
        className={directoryStyles.filterForm}
        onSubmit={(event) => event.preventDefault()}
        role="search"
      >
        <ListSearchField
          ariaLabel="Rechercher un tournoi"
          maxLength={TOURNAMENT_NAME_MAX_LENGTH}
          onClear={() => setQuery('')}
          onValueChange={setQuery}
          placeholder="Nom, organisateur, lieu ou équipe…"
          value={query}
        />
        <div className={directoryStyles.filterSelects}>
          <Button
            aria-hidden={!isFiltered || undefined}
            aria-label="Réinitialiser la recherche et les filtres"
            className={cn(
              directoryStyles.iconButton,
              !isFiltered && 'pointer-events-none invisible',
            )}
            onClick={reset}
            size="icon"
            tabIndex={isFiltered ? undefined : -1}
            type="button"
            variant="ghost"
          >
            <RotateCcw aria-hidden="true" />
          </Button>
          <Select onValueChange={setYear} value={year}>
            <SelectTrigger
              aria-label="Filtrer par année"
              className={directoryStyles.selectTrigger}
              variant="compact"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent variant="compact">
              <SelectItem value={ALL}>Toutes les années</SelectItem>
              {years.map((entry) => (
                <SelectItem key={entry} value={String(entry)}>
                  {entry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </form>
      <div className={directoryStyles.filterBar}>
        <div className={directoryStyles.quickFilterSets}>
          <QuickFilterGroup caption="État" label="Filtrer par état">
            {([ALL, ...TOURNAMENT_STATES] as const).map((filter) => (
              <QuickFilter
                count={
                  searched.filter(
                    (tournament) =>
                      ofGame(tournament, gameId) && ofState(tournament, filter),
                  ).length
                }
                key={filter}
                label={
                  filter === ALL
                    ? 'Tous'
                    : // A closed list of four states.
                      // eslint-disable-next-line security/detect-object-injection
                      TOURNAMENT_STATE_FILTER_LABELS[filter]
                }
                noun={TOURNAMENT_NOUN}
                onClick={() => setState(filter)}
                pressed={filter === state}
              />
            ))}
          </QuickFilterGroup>
          {games.length > 1 && (
            <QuickFilterGroup caption="Jeu" label="Filtrer par jeu">
              {[{ id: ALL, name: 'Tous' }, ...games].map((game) => (
                <QuickFilter
                  count={
                    searched.filter(
                      (tournament) =>
                        ofGame(tournament, game.id) &&
                        ofState(tournament, state),
                    ).length
                  }
                  key={game.id}
                  label={game.name}
                  noun={TOURNAMENT_NOUN}
                  onClick={() => setGameId(game.id)}
                  pressed={game.id === gameId}
                />
              ))}
            </QuickFilterGroup>
          )}
        </div>
        <div className={directoryStyles.listCaption}>
          <p aria-live="polite" role="status">
            {`${visible.length} ${visible.length > 1 ? 'tournois' : 'tournoi'}${isFiltered ? ` trouvé${visible.length > 1 ? 's' : ''}` : ''}`}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <DataTableSection
      className="border-border-content bg-surface-content rounded-panel"
      headerClassName="bg-surface-content-header"
      toolbar={toolbar}
    >
      <DataTableDesktop>
        <Table
          aria-label="Liste des tournois"
          className={directoryStyles.table}
        >
          <TableCaption className="sr-only">
            Les tournois de la structure, le plus récent en premier, avec nos
            équipes engagées et leur classement
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[170px]">Dates</TableHead>
              <TableHead>Tournoi</TableHead>
              <TableHead className="w-[140px]">Jeu</TableHead>
              <TableHead className="w-[230px]">Nos équipes</TableHead>
              <TableHead className="w-[110px]">État</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell className="h-44 text-center" colSpan={5}>
                  {emptyState}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((tournament) => (
                <TableRow className={LINE_FOCUS} key={tournament.id}>
                  <TableCell className="pointer-events-none">
                    <TournamentDates tournament={tournament} />
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <TournamentAvatar />
                      <TournamentName tournament={tournament} />
                    </div>
                  </TableCell>
                  <TableCell className="pointer-events-none">
                    {tournament.game.name}
                  </TableCell>
                  <TableCell className="pointer-events-none">
                    {/* Two teams within the height of the Dates cell's lines. */}
                    <EngagedTeams
                      className="space-y-0.5 leading-[1.0625rem]"
                      tournament={tournament}
                    />
                  </TableCell>
                  <TableCell className="pointer-events-none">
                    <TournamentStateBadge
                      state={tournamentStateOn(tournament, today)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DataTableDesktop>
      <DataTableMobileList className={directoryStyles.mobileList}>
        {visible.length === 0 ? (
          <div className="min-h-48 px-4 py-6">{emptyState}</div>
        ) : (
          visible.map((tournament) => (
            <div
              className={cn(
                LINE_FOCUS,
                'px-4 py-3 hover:bg-[var(--surface-row-hover)]',
              )}
              key={tournament.id}
            >
              <div className="flex items-start gap-3">
                <TournamentAvatar />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm">
                    <TournamentName tournament={tournament} withGame />
                  </h2>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {tournamentDatesShortLabel(tournament)}
                  </p>
                  <div className="mt-1.5 text-xs">
                    <EngagedTeams tournament={tournament} />
                  </div>
                </div>
                <TournamentStateBadge
                  state={tournamentStateOn(tournament, today)}
                />
              </div>
            </div>
          ))
        )}
      </DataTableMobileList>
    </DataTableSection>
  );
};

const TournamentsContent: FC<{
  canAddOrganizers: boolean;
  canManage: boolean;
  mustChooseTeam: boolean;
}> = ({ canAddOrganizers, canManage, mustChooseTeam }) => {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<TournamentItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async (signal?: AbortSignal): Promise<void> => {
    setLoadError(null);
    try {
      setTournaments(await fetchTournaments({}, signal));
    } catch (error) {
      if (signal?.aborted) return;
      setLoadError(
        error instanceof Error ? error.message : 'Chargement impossible',
      );
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);

    return (): void => controller.abort();
  }, [load]);

  return (
    <div className={cn(directoryStyles.directory, 'space-y-[18px]')}>
      <PageIdentityHero
        actions={
          canManage ? (
            <Button
              className={directoryStyles.addButton}
              onClick={() => setDialogOpen(true)}
            >
              <Plus aria-hidden="true" />
              Ajouter un tournoi
            </Button>
          ) : undefined
        }
        description="Les tournois de la structure, le plus récent en premier : nos équipes engagées et leur classement."
        icon={<Trophy aria-hidden="true" />}
        title={FEATURES.tournaments.label}
      />
      {loadError ? (
        <ContentState
          action={
            <Button
              onClick={() => void load()}
              size="sm"
              type="button"
              variant="outline"
            >
              Réessayer
            </Button>
          }
          description={loadError}
          icon={<Trophy aria-hidden="true" className="size-5" />}
          kind="error"
          layout="panel"
          title="Chargement impossible"
        />
      ) : tournaments ? (
        <TournamentsList tournaments={tournaments} />
      ) : (
        <div aria-label="Chargement des tournois" role="status">
          <Skeleton className="rounded-panel h-48" />
        </div>
      )}
      {dialogOpen && (
        <TournamentDialog
          canAddOrganizers={canAddOrganizers}
          mustChooseTeam={mustChooseTeam}
          onClose={() => setDialogOpen(false)}
          onCreated={(created) => {
            setDialogOpen(false);
            // A new tournament opens on its record, where it is completed.
            router.push(tournamentDetailPath(created.id));
          }}
        />
      )}
    </div>
  );
};

/**
 * Tournois, second page of the Esport pole (11 November 2026): every
 * tournament of the account's scope, filtered by state, game and year.
 */
export const TournamentsPage: FC = () => {
  const { authorizationRevision, userData } = useUser();
  const { canAddOrganizers, canManage, canView, mustChooseTeam } =
    getTournamentCapabilities(userData);

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: FEATURES.tournaments.audit.poleLabel },
        { label: FEATURES.tournaments.label },
      ]}
    >
      {canView ? (
        <PageShell className="py-0">
          <PageCanvas contentClassName="py-6">
            <TournamentsContent
              canAddOrganizers={canAddOrganizers}
              canManage={canManage}
              key={`${userData?.id ?? ''}:${authorizationRevision}`}
              mustChooseTeam={mustChooseTeam}
            />
          </PageCanvas>
        </PageShell>
      ) : (
        <AccessDeniedState action="consulter les tournois" />
      )}
    </AuthenticatedLayout>
  );
};
