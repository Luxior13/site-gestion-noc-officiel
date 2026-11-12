'use client';

import { ArrowLeftRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import React, { type FC, type ReactNode, useEffect, useState } from 'react';

import { ContentState } from '$components/layout/ContentState';
import { operationDetailPath } from '$constants/routes.constants';
import { Button } from '$ui/button';
import {
  DataTableDesktop,
  DataTableMobileList,
  DataTableSection,
} from '$ui/data-table-section';
import directoryStyles from '$ui/directory.module.css';
import { ListSearchField } from '$ui/list-search-field';
import { ListPagination } from '$ui/pagination';
import { QuickFilter, QuickFilterGroup } from '$ui/quick-filter';
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
import { formatApproximateDate } from '$utils/approximate-date.utils';
import { cn } from '$utils/css.utils';
import { formatEuros } from '$utils/money.utils';

import { fetchOperations } from '../operation.api';
import {
  OPERATION_KIND_FILTER_LABELS,
  OPERATION_KINDS,
  OPERATION_LABEL_MAX_LENGTH,
  type OperationKind,
} from '../operation.constants';
import { operationDetails, operationLineTitle } from '../operation.ui';
import type { OperationItem, OperationsPage } from '../types/operation.types';
import { OperationAmount, ResultAmount } from './OperationAmount';

const OPERATION_NOUN = ['opération', 'opérations'] as const;

/** One focus ring per line: the stretched title link lights its row. */
const LINE_FOCUS =
  'has-[a:focus-visible]:ring-ring relative has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-inset';

const NAME_LINK =
  'text-foreground hover:text-primary-emphasis block min-w-0 outline-none after:absolute after:inset-0 hover:underline hover:underline-offset-[3px]';

const day = (value: string): string =>
  formatApproximateDate({ date: value, precision: 'DAY' });

const OperationTitle: FC<{ accountId?: string; item: OperationItem }> = ({
  accountId,
  item,
}) => (
  <Link className={NAME_LINK} href={operationDetailPath(item.id)}>
    <span className="font-semibold [overflow-wrap:anywhere]">
      {operationLineTitle(item, accountId)}
    </span>
  </Link>
);

type Props = {
  /** The operations of one account: its movements, signed from it. */
  accountId?: string;
  /** Beside the search, at the right edge: « Ajouter une opération ». */
  action?: ReactNode;
  /** Said when nothing was entered yet. */
  emptyDescription?: string;
  /** A game's operations, its teams' included. */
  gameId?: string;
  /** A tab that only reads names first where the operations are kept. */
  notice?: string;
  /** The operations an organisation paid or was paid. */
  organizationId?: string;
  /** The operations a record of the Répertoire paid or was paid. */
  personId?: string;
  /** A new value reads the first page again: after an addition. */
  reloadKey?: number;
  /** The operations of a team. */
  teamId?: string;
  /** The operations naming a tournament (11 November 2026). */
  totals?: 'person' | 'result';
  /**
   * What the tab sums up above its list: a team's or a game's money in and
   * out and their result, or what a person paid and was paid.
   */
  tournamentId?: string;
};

/**
 * « Entrées + 650,00 € · Sorties − 150,00 € · Résultat + 500,00 € », or
 * what a person paid the structure and was paid by it.
 */
const TotalsLine: FC<{
  expenseCents: number;
  incomeCents: number;
  mode: 'person' | 'result';
}> = ({ expenseCents, incomeCents, mode }) => {
  const figure = (label: string, value: ReactNode): ReactNode => (
    <span className="flex items-baseline gap-1.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </span>
  );

  return (
    <p
      aria-label="Totaux"
      className="mb-3 flex flex-wrap items-baseline gap-x-5 gap-y-1"
    >
      {figure(
        mode === 'person' ? 'Reçu de cette personne' : 'Entrées',
        <span className="text-success">+ {formatEuros(incomeCents)}</span>,
      )}
      {figure(
        mode === 'person' ? 'Versé à cette personne' : 'Sorties',
        `− ${formatEuros(expenseCents)}`,
      )}
      {mode === 'result' &&
        figure('Résultat', <ResultAmount cents={incomeCents - expenseCents} />)}
    </p>
  );
};

/**
 * Operations, the latest first (11 November 2026): search by label or note,
 * quick filters by kind with their numbers, 25 a page. Each line opens the
 * record of its operation.
 */
export const OperationsList: FC<Props> = ({
  accountId,
  action,
  emptyDescription,
  gameId,
  notice,
  organizationId,
  personId,
  reloadKey = 0,
  teamId,
  totals,
  tournamentId,
}) => {
  const showAccount = !accountId;
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<OperationKind | null>(null);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<OperationsPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  // The search waits for a pause in typing.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 300);

    return (): void => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchOperations(
      {
        accountId,
        gameId,
        kind: kind ?? undefined,
        organizationId,
        page,
        personId,
        q: search || undefined,
        teamId,
        tournamentId,
      },
      controller.signal,
    )
      .then((next) => {
        setData(next);
        if (next.page !== page) setPage(next.page);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          caught instanceof Error ? caught.message : 'Chargement impossible',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return (): void => controller.abort();
  }, [
    accountId,
    attempt,
    gameId,
    kind,
    organizationId,
    page,
    personId,
    reloadKey,
    search,
    teamId,
    tournamentId,
  ]);

  const isFiltered = Boolean(search) || kind !== null;
  const reset = (): void => {
    setQuery('');
    setSearch('');
    setKind(null);
    setPage(1);
  };
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const columns = showAccount ? 4 : 3;

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
      description={isFiltered ? undefined : emptyDescription}
      icon={<ArrowLeftRight aria-hidden="true" className="size-5" />}
      layout="panel"
      title={
        isFiltered
          ? 'Aucune opération trouvée'
          : 'Aucune opération pour l’instant'
      }
    />
  );

  const toolbar = (
    <div className="w-full">
      {notice && <p className="text-muted-foreground mb-3 text-xs">{notice}</p>}
      {totals &&
        data &&
        (data.totals.incomeCents > 0 || data.totals.expenseCents > 0) && (
          <TotalsLine
            expenseCents={data.totals.expenseCents}
            incomeCents={data.totals.incomeCents}
            mode={totals}
          />
        )}
      <div className="flex flex-wrap items-center gap-3">
        <form
          aria-label="Rechercher et filtrer les opérations"
          autoComplete="off"
          className={cn(directoryStyles.filterForm, 'min-w-0 flex-1 basis-60')}
          onSubmit={(event) => event.preventDefault()}
          role="search"
        >
          <ListSearchField
            ariaLabel="Rechercher une opération"
            maxLength={OPERATION_LABEL_MAX_LENGTH}
            onClear={() => setQuery('')}
            onValueChange={setQuery}
            placeholder="Libellé ou note…"
            value={query}
          />
        </form>
        {action}
      </div>
      <div className={directoryStyles.filterBar}>
        <div className={directoryStyles.quickFilterSets}>
          <QuickFilterGroup caption="Sens" label="Filtrer par sens">
            <QuickFilter
              count={data?.counts.ALL ?? null}
              label="Toutes"
              noun={OPERATION_NOUN}
              onClick={() => {
                setKind(null);
                setPage(1);
              }}
              pressed={kind === null}
            />
            {/* A transfer names no payer nor team: no filter there. */}
            {OPERATION_KINDS.filter(
              (filter) =>
                filter !== 'TRANSFER' ||
                !(
                  organizationId ||
                  teamId ||
                  gameId ||
                  personId ||
                  tournamentId
                ),
            ).map((filter) => (
              <QuickFilter
                // A closed list of three kinds.
                // eslint-disable-next-line security/detect-object-injection
                count={data ? data.counts[filter] : null}
                key={filter}
                // eslint-disable-next-line security/detect-object-injection
                label={OPERATION_KIND_FILTER_LABELS[filter]}
                noun={OPERATION_NOUN}
                onClick={() => {
                  setKind(filter);
                  setPage(1);
                }}
                pressed={kind === filter}
              />
            ))}
          </QuickFilterGroup>
        </div>
        <div className={directoryStyles.listCaption}>
          <p aria-live="polite" role="status">
            {data
              ? `${total} ${total > 1 ? 'opérations' : 'opération'}${isFiltered ? ` trouvée${total > 1 ? 's' : ''}` : ''}`
              : ''}
          </p>
        </div>
      </div>
    </div>
  );

  if (error && !data)
    return (
      <ContentState
        action={
          <Button
            onClick={() => setAttempt((value) => value + 1)}
            size="sm"
            type="button"
            variant="outline"
          >
            <RefreshCw className="size-4" />
            Réessayer
          </Button>
        }
        description={error}
        icon={<ArrowLeftRight aria-hidden="true" className="size-5" />}
        kind="error"
        layout="panel"
        title="Chargement impossible"
      />
    );

  return (
    // The list's controls are styled within this scope, on any page.
    <div className={directoryStyles.directory}>
      <DataTableSection
        className="border-border-content bg-surface-content rounded-panel"
        headerClassName="bg-surface-content-header"
        toolbar={toolbar}
      >
        {data === null ? (
          <div
            aria-label="Chargement des opérations"
            className="p-4"
            role="status"
          >
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            <DataTableDesktop>
              <Table
                aria-label="Liste des opérations"
                className={directoryStyles.table}
              >
                <TableCaption className="sr-only">
                  Les opérations, la plus récente en premier : date, libellé,
                  catégorie et qui a payé ou reçu, compte et montant
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Date</TableHead>
                    <TableHead>Opération</TableHead>
                    {showAccount && (
                      <TableHead className="w-[220px]">Compte</TableHead>
                    )}
                    <TableHead className="w-[160px] text-right">
                      Montant
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell className="h-44 text-center" colSpan={columns}>
                        {emptyState}
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow className={LINE_FOCUS} key={item.id}>
                        <TableCell className="pointer-events-none tabular-nums">
                          {day(item.occurredOn)}
                        </TableCell>
                        <TableCell>
                          <OperationTitle accountId={accountId} item={item} />
                          {operationDetails(item) && (
                            <p className="text-muted-foreground mt-0.5 text-xs [overflow-wrap:anywhere]">
                              {operationDetails(item)}
                            </p>
                          )}
                        </TableCell>
                        {showAccount && (
                          <TableCell className="pointer-events-none [overflow-wrap:anywhere]">
                            {item.toAccount
                              ? `${item.account.name} → ${item.toAccount.name}`
                              : item.account.name}
                          </TableCell>
                        )}
                        <TableCell className="pointer-events-none text-right">
                          <OperationAmount accountId={accountId} item={item} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </DataTableDesktop>
            <DataTableMobileList className={directoryStyles.mobileList}>
              {items.length === 0 ? (
                <div className="min-h-48 px-4 py-6">{emptyState}</div>
              ) : (
                items.map((item) => (
                  <div
                    className={cn(
                      LINE_FOCUS,
                      'px-4 py-3 hover:bg-[var(--surface-row-hover)]',
                    )}
                    key={item.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="min-w-0 text-sm">
                        <OperationTitle accountId={accountId} item={item} />
                      </h2>
                      <OperationAmount
                        accountId={accountId}
                        className="text-sm font-semibold"
                        item={item}
                      />
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs [overflow-wrap:anywhere]">
                      {[
                        day(item.occurredOn),
                        showAccount
                          ? item.toAccount
                            ? `${item.account.name} → ${item.toAccount.name}`
                            : item.account.name
                          : null,
                        operationDetails(item) || null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                ))
              )}
            </DataTableMobileList>
            {(data.totalPages > 1 || page > 1) && (
              <ListPagination
                ariaLabel="Pagination des opérations"
                canNext={data.page < data.totalPages}
                canPrevious={data.page > 1}
                isLoading={loading}
                onNext={() => setPage(data.page + 1)}
                onPrevious={() => setPage(Math.max(1, data.page - 1))}
                page={data.page}
                totalPages={data.totalPages}
              />
            )}
          </>
        )}
      </DataTableSection>
    </div>
  );
};
