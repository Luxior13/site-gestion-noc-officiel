'use client';

import { Gamepad2, Plus } from 'lucide-react';
import React, { type FC, useMemo, useState } from 'react';

import { ContentState } from '$components/layout/ContentState';
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
import { getSearchTerms, includesSearchTerms } from '$utils/search-text.utils';

import {
  GAME_NAME_MAX_LENGTH,
  GAME_STATE_FILTER_LABELS,
  GAME_STATE_FILTERS,
  type GameStateFilter,
} from '../game.constants';
import { formatApproximateDate } from '../game-date.utils';
import type { GameItem } from '../types/game.types';
import { GameAvatar } from './GameAvatar';

const GAME_NOUN = ['jeu', 'jeux'] as const;

const matchesState = (game: GameItem, state: GameStateFilter): boolean =>
  state === 'all' || game.isActive === (state === 'active');

const GameState: FC<{ game: GameItem }> = ({ game }) =>
  game.isActive ? (
    <StatusBadge tone="success">Actif</StatusBadge>
  ) : (
    <StatusBadge tone="muted">Inactif</StatusBadge>
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
      className="text-foreground hover:text-primary-emphasis h-auto justify-start p-0 text-left font-normal whitespace-normal after:absolute after:inset-0 hover:underline hover:underline-offset-[3px] focus-visible:ring-0"
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

type Props = {
  canManage: boolean;
  games: GameItem[];
  onCreate: () => void;
  onOpen: (game: GameItem) => void;
};

/** The sections of the structure, searched and filtered in the page. */
export const GamesList: FC<Props> = ({
  canManage,
  games,
  onCreate,
  onOpen,
}) => {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<GameStateFilter>('all');
  const terms = useMemo(() => getSearchTerms(query), [query]);
  const searched = useMemo(
    () =>
      games.filter(
        (game) =>
          !terms.length ||
          includesSearchTerms(`${game.name} ${game.shortName ?? ''}`, terms),
      ),
    [games, terms],
  );
  const visible = searched.filter((game) => matchesState(game, state));
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
      title={isFiltered ? 'Aucun jeu trouvé' : 'Aucun jeu pour l’instant'}
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
          ariaLabel="Rechercher un jeu"
          maxLength={GAME_NAME_MAX_LENGTH}
          onClear={() => setQuery('')}
          onValueChange={setQuery}
          placeholder="Nom ou nom court…"
          value={query}
        />
      </form>
      <div className={directoryStyles.filterBar}>
        <div className={directoryStyles.quickFilterSets}>
          <QuickFilterGroup caption="État" label="Filtrer par état">
            {GAME_STATE_FILTERS.map((filter) => (
              <QuickFilter
                count={
                  searched.filter((game) => matchesState(game, filter)).length
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
        <Table aria-label="Liste des jeux" className={directoryStyles.table}>
          <TableCaption className="sr-only">
            Les jeux de la structure, leur première ouverture et leur état
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Jeu</TableHead>
              <TableHead className="w-[200px]">Première ouverture</TableHead>
              <TableHead className="w-[130px]">État</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell className="h-44 text-center" colSpan={3}>
                  {emptyState}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((game) => (
                <TableRow
                  className="has-[button:focus-visible]:ring-ring relative has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-inset"
                  key={game.id}
                >
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
              ))
            )}
          </TableBody>
        </Table>
      </DataTableDesktop>
      <DataTableMobileList className={directoryStyles.mobileList}>
        {visible.length === 0 ? (
          <div className="min-h-48 px-4 py-6">{emptyState}</div>
        ) : (
          visible.map((game) => (
            <div
              className="has-[button:focus-visible]:ring-ring relative px-4 py-3 hover:bg-[var(--surface-row-hover)] has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-inset"
              key={game.id}
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
          ))
        )}
      </DataTableMobileList>
    </DataTableSection>
  );
};
