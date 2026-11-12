'use client';

import { ArrowUpRight, Layers, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import React, { type FC, useEffect, useState } from 'react';

import { RubricCard } from '$components/layout/RubricCard';
import { FEATURES } from '$constants/feature-registry.constants';
import { teamDetailPath } from '$constants/routes.constants';
import { Button } from '$ui/button';
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
import { cn } from '$utils/css.utils';
import { formatEuros } from '$utils/money.utils';

import { fetchGameFinances } from '../operation.api';
import type { GameFinanceRow } from '../types/operation.types';
import { ResultAmount } from './OperationAmount';
import { OperationsList } from './OperationsList';

type Target =
  /** Each team links to its record for who may open it. */
  | { gameId: string; linkTeams: boolean; type: 'game' }
  | { personId: string; type: 'person' }
  | { teamId: string; type: 'team' }
  | { tournamentId: string; type: 'tournament' };

const EMPTY_DESCRIPTIONS: Record<Target['type'], string> = {
  game: 'Les entrées et sorties d’argent affectées à ce jeu ou à l’une de ses équipes s’affichent ici.',
  person:
    'Les entrées et sorties d’argent qui nomment cette personne, payées par elle ou versées à elle, s’affichent ici.',
  team: 'Les entrées et sorties d’argent affectées à cette équipe s’affichent ici.',
  tournament:
    'Les entrées et sorties d’argent qui nomment ce tournoi (inscription, gains, déplacement) s’affichent ici.',
};

/** A row's name: a team, « Hors équipe » for the game's own money. */
const rowName = (row: GameFinanceRow): string => row.teamName ?? 'Hors équipe';

const hasMoney = (row: GameFinanceRow): boolean =>
  row.incomeCents > 0 || row.expenseCents > 0;

/** « + 600,00 € » in green, « − 150,00 € », and a plain, muted « 0,00 € ». */
const Figure: FC<{ cents: number; income?: boolean }> = ({ cents, income }) =>
  cents === 0 ? (
    <span className="text-muted-foreground tabular-nums">{formatEuros(0)}</span>
  ) : (
    <span
      className={cn('whitespace-nowrap tabular-nums', income && 'text-success')}
    >
      {income ? '+' : '−'} {formatEuros(cents)}
    </span>
  );

/**
 * A game's money team by team (11 November 2026): the active teams, an
 * inactive one or the game's own money only when there is some, then the
 * total. Nothing while the game has no operation.
 */
const GameFinancesCard: FC<{ gameId: string; linkTeams: boolean }> = ({
  gameId,
  linkTeams,
}) => {
  const [rows, setRows] = useState<GameFinanceRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setFailed(false);
    fetchGameFinances(gameId, controller.signal)
      .then(setRows)
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });

    return (): void => controller.abort();
  }, [attempt, gameId]);

  if (failed)
    return (
      <p className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
        Le détail par équipe n’a pas pu être chargé.
        <Button
          onClick={() => setAttempt((value) => value + 1)}
          size="sm"
          type="button"
          variant="outline"
        >
          <RefreshCw className="size-4" />
          Réessayer
        </Button>
      </p>
    );
  if (!rows) return <Skeleton className="h-32 w-full rounded-lg" />;
  if (!rows.some(hasMoney)) return null;

  const shown = rows.filter(
    (row) => hasMoney(row) || (row.teamId !== null && row.isActive),
  );
  const income = rows.reduce((sum, row) => sum + row.incomeCents, 0);
  const expense = rows.reduce((sum, row) => sum + row.expenseCents, 0);
  // Entrées and Sorties under the name on a phone, in columns from 40 rem.
  const line = (
    key: string,
    name: React.ReactNode,
    values: { expenseCents: number; incomeCents: number },
    total = false,
  ): React.ReactNode => (
    <TableRow
      key={key}
      className={cn(total && 'border-border border-t-2 font-semibold')}
    >
      <TableCell className="min-w-0 py-2.5 whitespace-normal">
        {name}
        <span className="text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 text-xs font-normal sm:hidden">
          <span>
            Entrées <Figure cents={values.incomeCents} income />
          </span>
          <span>
            Sorties <Figure cents={values.expenseCents} />
          </span>
        </span>
      </TableCell>
      <TableCell className="hidden text-right sm:table-cell">
        <Figure cents={values.incomeCents} income />
      </TableCell>
      <TableCell className="hidden text-right sm:table-cell">
        <Figure cents={values.expenseCents} />
      </TableCell>
      <TableCell className="text-right">
        <ResultAmount
          className="font-semibold"
          cents={values.incomeCents - values.expenseCents}
        />
      </TableCell>
    </TableRow>
  );

  return (
    <RubricCard
      contentClassName="p-0 sm:p-0"
      icon={<Layers />}
      id="game-finances-title"
      title="Par équipe"
    >
      <Table>
        <TableCaption className="sr-only">
          Entrées, sorties et résultat de chaque équipe du jeu
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Équipe</TableHead>
            <TableHead className="hidden text-right sm:table-cell">
              Entrées
            </TableHead>
            <TableHead className="hidden text-right sm:table-cell">
              Sorties
            </TableHead>
            <TableHead className="text-right">Résultat</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.map((row) =>
            line(
              row.teamId ?? 'game',
              row.teamId ? (
                <>
                  {linkTeams ? (
                    <Link
                      className="font-medium underline-offset-4 hover:underline"
                      href={`${teamDetailPath(row.teamId)}?section=finances`}
                    >
                      {rowName(row)}
                    </Link>
                  ) : (
                    <span className="font-medium">{rowName(row)}</span>
                  )}
                  {!row.isActive && (
                    <span className="text-muted-foreground ml-2 text-xs">
                      inactive
                    </span>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">{rowName(row)}</span>
              ),
              row,
            ),
          )}
          {line(
            'total',
            'Total',
            { expenseCents: expense, incomeCents: income },
            true,
          )}
        </TableBody>
      </Table>
    </RubricCard>
  );
};

/**
 * Finances ↗ of a team, a game, a tournament or a record of the Répertoire (11 November
 * 2026): the operations that name it, read here and entered in Finances ›
 * Opérations; what came in and went out above them, team by team for a game.
 */
export const FinancesTab: FC<{ target: Target }> = ({ target }) => (
  <section aria-label="Finances" className="space-y-4">
    <h2 className="sr-only">Finances</h2>
    {target.type === 'game' && (
      <GameFinancesCard gameId={target.gameId} linkTeams={target.linkTeams} />
    )}
    <OperationsList
      action={
        <Button asChild size="sm" variant="outline">
          <Link href={FEATURES.operations.href}>
            <ArrowUpRight aria-hidden="true" className="size-4" />
            Ouvrir les opérations
          </Link>
        </Button>
      }
      emptyDescription={EMPTY_DESCRIPTIONS[target.type]}
      gameId={target.type === 'game' ? target.gameId : undefined}
      notice="Les opérations se saisissent dans Finances › Opérations : chaque ligne ouvre son opération."
      personId={target.type === 'person' ? target.personId : undefined}
      teamId={target.type === 'team' ? target.teamId : undefined}
      // A game sums its money in the card above, team by team.
      totals={
        target.type === 'person'
          ? 'person'
          : target.type === 'game'
            ? undefined
            : 'result'
      }
      tournamentId={
        target.type === 'tournament' ? target.tournamentId : undefined
      }
    />
  </section>
);
