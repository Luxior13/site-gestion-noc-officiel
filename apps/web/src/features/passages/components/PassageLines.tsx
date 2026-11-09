'use client';

import { RefreshCw } from 'lucide-react';
import Link from 'next/link';
import React, { type FC, type ReactNode } from 'react';

import { ContentState } from '$components/layout/ContentState';
import { personDetailPath } from '$constants/routes.constants';
import { PersonAvatarFrame } from '$features/persons/components/PersonAvatar';
import { Button } from '$ui/button';
import directoryStyles from '$ui/directory.module.css';
import { Skeleton } from '$ui/skeleton';
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
  formatApproximateDate,
  formatApproximateDuration,
} from '$utils/approximate-date.utils';
import { cn } from '$utils/css.utils';

import {
  passagePeriodLabel,
  passageStateBadge,
  passageStateOn,
  type TeamPeopleCounts,
} from '../passage.ui';
import type { PassageItem } from '../types/passage.types';

/** What the Roster and the former members' tabs receive from the record. */
export type TeamPassagesProps = {
  canCreatePerson: boolean;
  canManage: boolean;
  canViewPersons: boolean;
  /** Keeps the counts of the tabs in step with the passages. */
  onCountsChange: (counts: TeamPeopleCounts) => void;
  team: Readonly<{ gameId: string; id: string; name: string }>;
};

/** One focus ring per line, lit by the stretched name. */
const LINE_FOCUS =
  'relative has-[[data-line-target]:focus-visible]:ring-ring has-[[data-line-target]:focus-visible]:ring-2 has-[[data-line-target]:focus-visible]:ring-inset';

/** A name whose target covers the whole line; the line carries the ring. */
const NAME_TARGET =
  'text-foreground hover:text-primary-emphasis block min-w-0 text-left font-semibold [overflow-wrap:anywhere] after:absolute after:inset-0 hover:underline hover:underline-offset-[3px] focus-visible:border-transparent focus-visible:ring-0 max-sm:min-h-0';

/** A block of lines: « Joueurs », « Encadrement », or a year of the archive. */
export type PassageGroup = Readonly<{
  id: string;
  items: readonly PassageItem[];
  label: string;
}>;

type Props = {
  canManage: boolean;
  canViewPersons: boolean;
  groups: readonly PassageGroup[];
  /** Opens the window of a passage, for who manages the roster. */
  onOpen: (passage: PassageItem) => void;
  /** The Roster says whether each line is current or to come; the archive's are all former. */
  showStatus: boolean;
  teamName: string;
  today: string;
};

/**
 * The lines of a roster, as the Répertoire's list (owner, 9 November 2026:
 * « le tableau doit plus être comme celui du Répertoire »): one table per
 * block, its first head naming the block and its count, the other columns at
 * the same widths from one block to the next; on a phone, its cards.
 */
export const PassageLines: FC<Props> = ({
  canManage,
  canViewPersons,
  groups,
  onOpen,
  showStatus,
  teamName,
  today,
}) => {
  const interactive = canManage || canViewPersons;

  /** The name, target of the whole line; truncated in a cell, wrapped on a card. */
  const name = (passage: PassageItem, layout: 'card' | 'cell'): ReactNode => {
    const text = (
      <span
        className={
          layout === 'cell'
            ? 'block truncate'
            : 'block [overflow-wrap:anywhere]'
        }
      >
        {passage.person.displayName}
      </span>
    );

    return canManage ? (
      <Button
        aria-label={`Modifier le passage de ${passage.person.displayName}, ${passage.function.name}`}
        className={NAME_TARGET}
        data-line-target=""
        onClick={() => onOpen(passage)}
        size="inline"
        title={passage.person.displayName}
        type="button"
        variant="link"
      >
        {text}
      </Button>
    ) : canViewPersons ? (
      <Link
        className={cn(NAME_TARGET, 'outline-none')}
        data-line-target=""
        href={personDetailPath(passage.person.id)}
        title={passage.person.displayName}
      >
        {text}
      </Link>
    ) : (
      <span
        className="block min-w-0 font-semibold"
        title={passage.person.displayName}
      >
        {text}
      </span>
    );
  };

  const duration = (passage: PassageItem): string | null =>
    formatApproximateDuration(passage.start, passage.end, today);

  const badge = (passage: PassageItem): ReactNode => {
    const { label, tone } = passageStateBadge(passageStateOn(passage, today));

    return <StatusBadge tone={tone}>{label}</StatusBadge>;
  };

  const line = (passage: PassageItem): ReactNode => (
    <TableRow
      className={cn(interactive && LINE_FOCUS)}
      data-roster-line=""
      key={passage.id}
    >
      <TableCell>
        <div className="flex min-w-0 items-center gap-2.5">
          <PersonAvatarFrame person={passage.person} />
          <div className="min-w-0 flex-1">{name(passage, 'cell')}</div>
        </div>
      </TableCell>
      <TableCell className="pointer-events-none [overflow-wrap:anywhere]">
        {passage.function.name}
      </TableCell>
      {showStatus && (
        <TableCell className="pointer-events-none">{badge(passage)}</TableCell>
      )}
      <TableCell className="text-muted-foreground pointer-events-none tabular-nums">
        {formatApproximateDate(passage.start)}
      </TableCell>
      <TableCell className="text-muted-foreground pointer-events-none tabular-nums">
        {passage.end ? (
          formatApproximateDate(passage.end)
        ) : (
          <>
            <span aria-hidden="true">—</span>
            <span className="sr-only">Pas de fin</span>
          </>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground pointer-events-none tabular-nums">
        {duration(passage) ?? (
          <>
            <span aria-hidden="true">—</span>
            <span className="sr-only">Pas encore commencé</span>
          </>
        )}
      </TableCell>
    </TableRow>
  );

  /** On a phone, a card as the Répertoire's: the period said in words. */
  const card = (passage: PassageItem): ReactNode => (
    <div
      className={cn(
        'px-4 py-3',
        interactive && cn(LINE_FOCUS, 'hover:bg-surface-row-hover'),
      )}
      data-roster-line=""
      key={passage.id}
    >
      <div className="flex items-start gap-3">
        <PersonAvatarFrame person={passage.person} />
        <div className="min-w-0 flex-1 space-y-1.5">
          {name(passage, 'card')}
          <div className="flex flex-wrap items-center gap-2">
            {showStatus && badge(passage)}
            <span className="text-muted-foreground text-sm">
              {passage.function.name}
            </span>
          </div>
          <p className="text-muted-foreground text-xs">
            {[passagePeriodLabel(passage, today), duration(passage)]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </div>
    </div>
  );

  // Six columns need room: the table from 56 rem of list, cards below.
  return (
    <>
      <div className="hidden @min-[56rem]/data-table:block">
        {groups.map((group) => (
          <Table className={directoryStyles.table} key={group.id}>
            <TableCaption className="sr-only">
              {`${group.label}, ${teamName} : fonction${showStatus ? ', statut' : ''}, début, fin et durée`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {group.label}
                  <span className="ml-1.5 font-normal tabular-nums">
                    {group.items.length}
                  </span>
                </TableHead>
                <TableHead className="w-[150px]">Fonction</TableHead>
                {showStatus && (
                  <TableHead className="w-[110px]">Statut</TableHead>
                )}
                <TableHead className="w-[140px]">Début</TableHead>
                <TableHead className="w-[140px]">Fin</TableHead>
                <TableHead className="w-[120px]">Durée</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{group.items.map(line)}</TableBody>
          </Table>
        ))}
      </div>
      {groups.map((group) => (
        <section
          aria-labelledby={`passages-${group.id}`}
          className="@min-[56rem]/data-table:hidden"
          key={group.id}
        >
          <h3
            className="bg-surface-table-head border-border-divider text-muted-foreground flex items-center justify-between border-y px-4 py-2 text-xs font-medium"
            id={`passages-${group.id}`}
          >
            {group.label}
            <span className="tabular-nums">{group.items.length}</span>
          </h3>
          {/* The Répertoire's cards (`DataTableMobileList`), to 56 rem. */}
          <div
            className={cn(
              'divide-border-divider bg-surface [&>*:nth-child(even)]:bg-surface-row-alternate [&>*:nth-child(even):hover]:bg-surface-tile-hover divide-y',
              directoryStyles.mobileList,
            )}
          >
            {group.items.map(card)}
          </div>
        </section>
      ))}
    </>
  );
};

/** Three grey lines while the passages load. */
export const PassageLinesSkeleton: FC<{ label: string }> = ({ label }) => (
  <div aria-busy="true" aria-label={label} className="space-y-2 p-4">
    {[0, 1, 2].map((line) => (
      <Skeleton className="h-9 w-full" key={line} />
    ))}
  </div>
);

/** The passages could not be read: said, with « Réessayer ». */
export const PassagesLoadError: FC<{
  error: Error;
  onRetry: () => void;
  title: string;
}> = ({ error, onRetry, title }) => (
  <ContentState
    action={
      <Button onClick={onRetry} size="sm" type="button" variant="outline">
        <RefreshCw className="size-4" />
        Réessayer
      </Button>
    }
    description={error.message}
    kind="error"
    title={title}
  />
);
