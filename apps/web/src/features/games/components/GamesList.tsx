'use client';

import { Gamepad2, Plus } from 'lucide-react';
import Link from 'next/link';
import React, { type FC, useMemo, useState } from 'react';

import { ContentState } from '$components/layout/ContentState';
import { teamDetailPath } from '$constants/routes.constants';
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

/** One focus ring per line: the stretched name button lights its row. */
const LINE_FOCUS =
  'has-[button:focus-visible]:ring-ring relative has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-inset';

/** The same for a team line, whose name is a link to its record. */
const TEAM_LINE_FOCUS =
  'has-[a:focus-visible]:ring-ring relative has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-inset';

/** A team line starts under its game's name: avatar (36 px) and gap (10 px). */
const TEAM_INDENT = 'pl-[46px]';

/**
 * A game's name, which opens its window, stretched over its line; as tall as
 * its text on a computer.
 */
const NAME_BUTTON =
  'text-foreground hover:text-primary-emphasis h-auto justify-start p-0 text-left font-normal whitespace-normal after:absolute after:inset-0 hover:underline hover:underline-offset-[3px] focus-visible:ring-0 lg:h-auto';

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

const GameName: FC<{
  canManage: boolean;
  game: GameItem;
  onOpen: (game: GameItem) => void;
}> = ({ canManage, game, onOpen }) => {
  const label = (
    <>
      <span className="font-semibold [overflow-wrap:anywhere]">
        {game.name}
      </span>
      {game.shortName && (
        <span className="text-muted-foreground ml-2 shrink-0 text-xs whitespace-nowrap">
          {game.shortName}
        </span>
      )}
    </>
  );

  return canManage ? (
    <Button
      aria-label={`Modifier le jeu ${game.name}`}
      className={NAME_BUTTON}
      onClick={() => onOpen(game)}
      type="button"
      variant="link"
    >
      {label}
    </Button>
  ) : (
    <span>{label}</span>
  );
};

/**
 * A team's name opens its record (owner, 8 November 2026: « une page équipe
 * et non juste un modal »), for every reader; the link covers its line.
 */
const TeamName: FC<{ game: GameItem; team: TeamItem }> = ({ game, team }) => (
  <Link
    aria-label={`${team.name}, équipe ${game.name}`}
    className="text-foreground hover:text-primary-emphasis block min-w-0 [overflow-wrap:anywhere] outline-none after:absolute after:inset-0 hover:underline hover:underline-offset-[3px]"
    href={teamDetailPath(team.id)}
  >
    {team.name}
  </Link>
);

const AddTeamButton: FC<{
  game: GameItem;
  onAdd: (game: GameItem) => void;
}> = ({ game, onAdd }) => (
  <Button
    aria-label={`Ajouter une équipe à ${game.name}`}
    className="h-auto gap-1.5 p-0 text-xs font-medium has-[>svg]:px-0 lg:h-auto"
    onClick={() => onAdd(game)}
    size="sm"
    type="button"
    variant="link"
  >
    <Plus aria-hidden="true" className="size-3.5" />
    Ajouter une équipe
  </Button>
);

type Props = {
  canManage: boolean;
  canManageTeams: boolean;
  games: GameItem[];
  onAddTeam: (game: GameItem) => void;
  onCreate: () => void;
  onOpen: (game: GameItem) => void;
  /** Null without the right to see teams: the list shows games only. */
  teams: TeamItem[] | null;
};

/**
 * The sections of the structure, each with its teams under it, searched and
 * filtered in the page (teams under each game, 8 November 2026).
 */
export const GamesList: FC<Props> = ({
  canManage,
  canManageTeams,
  games,
  onAddTeam,
  onCreate,
  onOpen,
  teams,
}) => {
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
  // No add line in search results, nor under an inactive game.
  const canAddTo = (game: GameItem): boolean =>
    canManageTeams && game.isActive && !query.trim();
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
            // One tbody per game: the game and its teams form one band.
            visible.map(({ game, teams: gameTeams }) => (
              <TableBody key={game.id}>
                <TableRow className={LINE_FOCUS}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <GameAvatar />
                      <GameName
                        canManage={canManage}
                        game={game}
                        onOpen={onOpen}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="pointer-events-none tabular-nums">
                    {formatApproximateDate(game.firstOpened)}
                  </TableCell>
                  <TableCell className="pointer-events-none">
                    <GameState game={game} />
                  </TableCell>
                </TableRow>
                {gameTeams.map((team) => (
                  <TableRow className={TEAM_LINE_FOCUS} key={team.id}>
                    <TableCell>
                      <div className={cn(TEAM_INDENT, 'text-sm')}>
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
                {canAddTo(game) && (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <div className={TEAM_INDENT}>
                        <AddTeamButton game={game} onAdd={onAddTeam} />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
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
                <div className="flex items-start gap-3">
                  {/* Centred on the name, whose button keeps its 44 px target. */}
                  <GameAvatar className="max-sm:mt-1" />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm">
                      <GameName
                        canManage={canManage}
                        game={game}
                        onOpen={onOpen}
                      />
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
              {(gameTeams.length > 0 || canAddTo(game)) && (
                <ul aria-label={`Équipes de ${game.name}`} className="pb-2">
                  {gameTeams.map((team) => (
                    // Indented under the game's name: 16 + 36 + 12 px. The
                    // whole line (44 px at least) is the name's target.
                    <li
                      className={cn(
                        TEAM_LINE_FOCUS,
                        'flex min-h-11 items-center gap-3 py-1.5 pr-4 pl-16 text-sm hover:bg-[var(--surface-row-hover)]',
                      )}
                      key={team.id}
                    >
                      <div className="min-w-0 flex-1">
                        <TeamName game={game} team={team} />
                        <p className="text-muted-foreground text-xs">
                          {sinceLabel(team.founded)}
                        </p>
                      </div>
                      <TeamState className="shrink-0" team={team} />
                    </li>
                  ))}
                  {canAddTo(game) && (
                    <li className="py-1 pr-4 pl-16">
                      <AddTeamButton game={game} onAdd={onAddTeam} />
                    </li>
                  )}
                </ul>
              )}
            </div>
          ))
        )}
      </DataTableMobileList>
    </DataTableSection>
  );
};
