'use client';

import { Gamepad2, Plus } from 'lucide-react';
import Link from 'next/link';
import React, { type FC, useMemo, useState } from 'react';

import { ContentState } from '$components/layout/ContentState';
import { gameDetailPath, teamDetailPath } from '$constants/routes.constants';
import { TeamAvatar } from '$features/teams/components/TeamAvatar';
import type { TeamItem } from '$features/teams/types/team.types';
import { Button } from '$ui/button';
import {
  DataTableDesktop,
  DataTableMobileList,
  DataTableSection,
} from '$ui/data-table-section';
import directoryStyles from '$ui/directory.module.css';
import { ListSearchField } from '$ui/list-search-field';
import { QuickFilter, QuickFilterGroup } from '$ui/quick-filter';
import { StatusBadge } from '$ui/status-badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '$ui/table';
import {
  type ApproximateDate,
  formatApproximateDate,
} from '$utils/approximate-date.utils';
import { cn } from '$utils/css.utils';
import { getSearchTerms, includesSearchTerms } from '$utils/search-text.utils';

import {
  GAME_NAME_MAX_LENGTH,
  GAME_STATE_FILTER_LABELS,
  GAME_STATE_FILTERS,
  type GameStateFilter,
} from '../game.constants';
import type { GameItem } from '../types/game.types';
import { GameAvatar } from './GameAvatar';

const GAME_NOUN = ['jeu', 'jeux'] as const;

/** One focus ring per line: the stretched name link lights its row. */
const LINE_FOCUS =
  'has-[a:focus-visible]:ring-ring relative has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-inset';

/** A name that opens its record, its link covering the whole line. */
const NAME_LINK =
  'text-foreground hover:text-primary-emphasis block min-w-0 outline-none after:absolute after:inset-0 hover:underline hover:underline-offset-[3px]';

type GameGroup = Readonly<{ game: GameItem; teams: readonly TeamItem[] }>;

const matchesState = (game: GameItem, state: GameStateFilter): boolean =>
  state === 'all' || game.isActive === (state === 'active');

/** « depuis 2023 », « depuis mars 2023 », « depuis le 15 mars 2023 ». */
const sinceLabel = (value: ApproximateDate): string =>
  `depuis ${value.precision === 'DAY' ? 'le ' : ''}${formatApproximateDate(value)}`;

const GameState: FC<{ game: GameItem }> = ({ game }) =>
  game.isActive ? (
    <StatusBadge tone="success">Actif</StatusBadge>
  ) : (
    <StatusBadge tone="muted">Inactif</StatusBadge>
  );

const TeamState: FC<{ className?: string; team: TeamItem }> = ({
  className,
  team,
}) =>
  team.isActive ? (
    <StatusBadge className={className} tone="success">
      Active
    </StatusBadge>
  ) : (
    <StatusBadge className={className} tone="muted">
      Inactive
    </StatusBadge>
  );

/**
 * A game's name opens its record (8 November 2026: a game will have tabs, so
 * a page rather than a window), for every reader.
 */
const GameName: FC<{ game: GameItem }> = ({ game }) => (
  <Link className={NAME_LINK} href={gameDetailPath(game.id)}>
    <span className="font-semibold [overflow-wrap:anywhere]">{game.name}</span>
    {game.shortName && (
      <span className="text-muted-foreground ml-2 text-xs whitespace-nowrap">
        {game.shortName}
      </span>
    )}
  </Link>
);

const teamLabel = (game: GameItem, team: TeamItem): string =>
  `${team.name}, équipe ${game.name}, ${team.isActive ? 'active' : 'inactive'}`;

/** Centre of a game's avatar from the line's left edge: 16 px + 36 / 2. */
const GUIDE = 'pointer-events-none absolute left-[34px] w-px bg-border-strong';

/**
 * The guide from a game's controller down to its teams, as in a tree: under
 * the avatar on the game's line, then through each team line with a tick to
 * its crest, cut at mid-height on the last one (8 November 2026).
 */
const TeamGuide: FC<{ last: boolean }> = ({ last }) => (
  <>
    <span
      aria-hidden="true"
      className={cn(GUIDE, 'top-0', last ? 'h-1/2' : 'bottom-0')}
    />
    <span
      aria-hidden="true"
      className="bg-border-strong pointer-events-none absolute top-1/2 left-[34px] h-px w-3"
    />
  </>
);

/**
 * A team's name opens its record (owner, 8 November 2026: « une page équipe
 * et non juste un modal »), for every reader; the link covers its whole line,
 * a target as large as a record's line in the Répertoire.
 */
const TeamName: FC<{ game: GameItem; team: TeamItem }> = ({ game, team }) => (
  <Link
    aria-label={teamLabel(game, team)}
    className={cn(NAME_LINK, '[overflow-wrap:anywhere]')}
    href={teamDetailPath(team.id)}
  >
    {team.name}
  </Link>
);

type Props = {
  canManage: boolean;
  games: GameItem[];
  onCreate: () => void;
  /** Null without the right to see teams: the list shows games only. */
  teams: TeamItem[] | null;
};

/**
 * The sections of the structure, each with its teams on lines under it,
 * searched and filtered in the page; the colour alternates per game, as the
 * Répertoire alternates per record.
 */
export const GamesList: FC<Props> = ({ canManage, games, onCreate, teams }) => {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<GameStateFilter>('all');
  const terms = useMemo(() => getSearchTerms(query), [query]);
  const teamsByGame = useMemo(() => {
    const groups = new Map<string, TeamItem[]>();
    // Teams arrive active first, then by name: the order under each game.
    for (const team of teams ?? [])
      groups.set(team.gameId, [...(groups.get(team.gameId) ?? []), team]);

    return groups;
  }, [teams]);
  const searched = useMemo(
    (): GameGroup[] =>
      games.flatMap((game) => {
        const gameTeams = teamsByGame.get(game.id) ?? [];
        if (
          !terms.length ||
          includesSearchTerms(`${game.name} ${game.shortName ?? ''}`, terms)
        )
          return [{ game, teams: gameTeams }];
        // A team found by its name shows under its game, alone.
        const found = gameTeams.filter((team) =>
          includesSearchTerms(team.name, terms),
        );

        return found.length ? [{ game, teams: found }] : [];
      }),
    [games, teamsByGame, terms],
  );
  const visible = searched.filter(({ game }) => matchesState(game, state));
  const isFiltered = Boolean(query.trim()) || state !== 'all';
  const reset = (): void => {
    setQuery('');
    setState('all');
  };

  const emptyState = (
    <ContentState
      action={
        isFiltered ? (
          <Button onClick={reset} size="sm" type="button" variant="link">
            Réinitialiser
          </Button>
        ) : canManage ? (
          <Button onClick={onCreate} size="sm" type="button">
            <Plus className="size-4" />
            Ajouter un jeu
          </Button>
        ) : undefined
      }
      className="min-h-0 border-0 bg-transparent p-0"
      icon={<Gamepad2 aria-hidden="true" className="size-5" />}
      layout="panel"
      title={
        isFiltered
          ? teams
            ? 'Aucun jeu ni équipe trouvé'
            : 'Aucun jeu trouvé'
          : 'Aucun jeu pour l’instant'
      }
    />
  );

  const toolbar = (
    <div className="w-full">
      <form
        aria-label="Rechercher et filtrer les jeux"
        autoComplete="off"
        className={directoryStyles.filterForm}
        onSubmit={(event) => event.preventDefault()}
        role="search"
      >
        <ListSearchField
          ariaLabel={
            teams ? 'Rechercher un jeu ou une équipe' : 'Rechercher un jeu'
          }
          maxLength={GAME_NAME_MAX_LENGTH}
          onClear={() => setQuery('')}
          onValueChange={setQuery}
          placeholder={teams ? 'Jeu ou équipe…' : 'Nom ou nom court…'}
          value={query}
        />
      </form>
      <div className={directoryStyles.filterBar}>
        <div className={directoryStyles.quickFilterSets}>
          <QuickFilterGroup caption="État" label="Filtrer par état">
            {GAME_STATE_FILTERS.map((filter) => (
              <QuickFilter
                count={
                  searched.filter(({ game }) => matchesState(game, filter))
                    .length
                }
                key={filter}
                // A closed union of three values.
                // eslint-disable-next-line security/detect-object-injection
                label={GAME_STATE_FILTER_LABELS[filter]}
                noun={GAME_NOUN}
                onClick={() => setState(filter)}
                pressed={filter === state}
              />
            ))}
          </QuickFilterGroup>
        </div>
        <div className={directoryStyles.listCaption}>
          <p aria-live="polite" role="status">
            {`${visible.length} ${visible.length > 1 ? 'jeux' : 'jeu'}${isFiltered ? ` trouvé${visible.length > 1 ? 's' : ''}` : ''}`}
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
          aria-label="Liste des jeux"
          className={cn(directoryStyles.table, directoryStyles.groupedTable)}
        >
          <TableCaption className="sr-only">
            {teams
              ? 'Les jeux de la structure et leurs équipes, depuis quand et leur état'
              : 'Les jeux de la structure, leur première ouverture et leur état'}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>{teams ? 'Jeu et équipes' : 'Jeu'}</TableHead>
              <TableHead className="w-[200px]">
                {teams ? 'Depuis' : 'Première ouverture'}
              </TableHead>
              <TableHead className="w-[130px]">État</TableHead>
            </TableRow>
          </TableHeader>
          {visible.length === 0 ? (
            <TableBody>
              <TableRow>
                <TableCell className="h-44 text-center" colSpan={3}>
                  {emptyState}
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            // One tbody per game: a game and its teams share one band.
            visible.map(({ game, teams: gameTeams }) => (
              <TableBody key={game.id}>
                <TableRow className={LINE_FOCUS}>
                  <TableCell>
                    {gameTeams.length > 0 && (
                      <span
                        aria-hidden="true"
                        className={cn(GUIDE, 'top-[calc(50%+18px)] bottom-0')}
                      />
                    )}
                    <div className="flex min-w-0 items-center gap-2.5">
                      <GameAvatar />
                      <div className="min-w-0 flex-1">
                        <GameName game={game} />
                        {teams && gameTeams.length === 0 && (
                          <p className="text-muted-foreground text-xs">
                            Aucune équipe
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="pointer-events-none tabular-nums">
                    {formatApproximateDate(game.firstOpened)}
                  </TableCell>
                  <TableCell className="pointer-events-none">
                    <GameState game={game} />
                  </TableCell>
                </TableRow>
                {gameTeams.map((team, index) => (
                  <TableRow className={LINE_FOCUS} key={team.id}>
                    <TableCell>
                      <TeamGuide last={index === gameTeams.length - 1} />
                      {/* The crest starts after the tick: 34 + 12 + 2 px. */}
                      <div className="flex min-w-0 items-center gap-2 pl-8 text-sm">
                        <TeamAvatar className="rounded-tile size-7 shrink-0" />
                        <TeamName game={game} team={team} />
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground pointer-events-none tabular-nums">
                      {formatApproximateDate(team.founded)}
                    </TableCell>
                    <TableCell className="pointer-events-none">
                      <TeamState team={team} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            ))
          )}
        </Table>
      </DataTableDesktop>
      <DataTableMobileList className={directoryStyles.mobileList}>
        {visible.length === 0 ? (
          <div className="min-h-48 px-4 py-6">{emptyState}</div>
        ) : (
          visible.map(({ game, teams: gameTeams }) => (
            <div key={game.id}>
              <div
                className={cn(
                  LINE_FOCUS,
                  'px-4 py-3 hover:bg-[var(--surface-row-hover)]',
                )}
              >
                {gameTeams.length > 0 && (
                  // Below the avatar: 12 px of padding and 36 px.
                  <span
                    aria-hidden="true"
                    className={cn(GUIDE, 'top-[48px] bottom-0')}
                  />
                )}
                <div className="flex items-start gap-3">
                  <GameAvatar />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm">
                      <GameName game={game} />
                    </h2>
                    <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <GameState game={game} />
                      <span>
                        Première ouverture :{' '}
                        {formatApproximateDate(game.firstOpened)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {teams && gameTeams.length === 0 && (
                <p className="text-muted-foreground pr-4 pb-3 pl-16 text-xs">
                  Aucune équipe
                </p>
              )}
              {gameTeams.length > 0 && (
                <ul aria-label={`Équipes de ${game.name}`} className="pb-2">
                  {gameTeams.map((team, index) => (
                    // The crest after the guide's tick (48 px); the whole
                    // line (44 px at least) is the name's target.
                    <li
                      className={cn(
                        LINE_FOCUS,
                        'flex min-h-11 items-center gap-2 py-1.5 pr-4 pl-12 text-sm hover:bg-[var(--surface-row-hover)]',
                      )}
                      key={team.id}
                    >
                      <TeamGuide last={index === gameTeams.length - 1} />
                      <TeamAvatar className="rounded-tile size-7 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <TeamName game={game} team={team} />
                        <p className="text-muted-foreground text-xs">
                          {sinceLabel(team.founded)}
                        </p>
                      </div>
                      <TeamState className="shrink-0" team={team} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </DataTableMobileList>
    </DataTableSection>
  );
};
