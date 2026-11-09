'use client';

import { ArrowUpRight, Route } from 'lucide-react';
import Link from 'next/link';
import React, {
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { ContentState } from '$components/layout/ContentState';
import { FEATURES } from '$constants/feature-registry.constants';
import { teamDetailPath } from '$constants/routes.constants';
import { StructureAvatar } from '$features/staff/components/StructureAvatar';
import { TeamAvatar } from '$features/teams/components/TeamAvatar';
import { Button } from '$ui/button';
import { DataTableSection } from '$ui/data-table-section';
import directoryStyles from '$ui/directory.module.css';
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
  getLocalToday,
} from '$utils/approximate-date.utils';
import { cn } from '$utils/css.utils';

import { type JourneyReach, journeySourcesOf } from '../journey-sources';
import { fetchPersonJourney } from '../passage.api';
import {
  journeyBlocks,
  passagePeriodLabel,
  passageStateBadge,
  passageStateOn,
} from '../passage.ui';
import type { JourneyItem, PersonJourney } from '../types/passage.types';
import { PassageLinesSkeleton, PassagesLoadError } from './PassageLines';

/** One focus ring per line, lit by the stretched name. */
const LINE_FOCUS =
  'relative has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-inset';

const NAME_TARGET =
  'text-foreground hover:text-primary-emphasis block min-w-0 text-sm font-semibold outline-none after:absolute after:inset-0 hover:underline hover:underline-offset-[3px]';

type Block = Readonly<{
  id: string;
  items: readonly JourneyItem[];
  label: string;
}>;

/**
 * The Parcours tab of a person's record (owner, 9 November 2026: « il faut
 * ajouter l'onglet Parcours, du coup, maintenant, par rapport au Roster »):
 * every passage the reader may see, read from the Roster of each team or the
 * Effectif of Bureau & staff, where it is kept. What is there and coming,
 * then what ended, never mixed; each line opens its page, the former ones its
 * former members. Nothing is changed here.
 */
export const PersonJourneySection: FC<{
  personId: string;
  reach: JourneyReach;
}> = ({ personId, reach }) => {
  const [journey, setJourney] = useState<PersonJourney | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const today = useRef(getLocalToday()).current;

  const load = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      setError(null);
      setJourney(null);
      try {
        setJourney(await fetchPersonJourney(personId, signal));
      } catch (caught) {
        if (!signal?.aborted)
          setError(
            caught instanceof Error
              ? caught
              : new Error('Chargement impossible.'),
          );
      }
    },
    [personId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);

    return (): void => controller.abort();
  }, [load]);

  if (error)
    return (
      <PassagesLoadError
        error={error}
        onRetry={() => void load()}
        title="Le parcours ne peut pas être chargé"
      />
    );

  const { current, former } = journeyBlocks(journey?.passages ?? [], today);
  const blocks: Block[] = [
    { id: 'actuel', items: current, label: 'En cours et à venir' },
    // Its lines say « Ancien » too: the columns of both blocks line up.
    { id: 'termine', items: former, label: 'Terminés' },
  ].filter((block) => block.items.length > 0);

  /**
   * The team and its game under it, or Bureau & staff and « La structure »;
   * a former passage opens the former members.
   */
  const identity = (
    passage: JourneyItem,
    layout: 'card' | 'cell',
  ): ReactNode => {
    const gone = passageStateOn(passage, today) === 'former';
    const name = passage.team?.name ?? FEATURES.staff.label;
    const page = passage.team
      ? teamDetailPath(passage.team.id)
      : FEATURES.staff.href;

    return (
      <div className="flex min-w-0 items-center gap-2.5">
        {passage.team ? (
          <TeamAvatar className="rounded-tile size-9 shrink-0" />
        ) : (
          <StructureAvatar className="rounded-tile size-9 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <Link
            className={NAME_TARGET}
            href={`${page}${gone ? '?section=anciens' : ''}`}
            title={name}
          >
            <span
              className={
                layout === 'cell'
                  ? 'block truncate'
                  : 'block [overflow-wrap:anywhere]'
              }
            >
              {name}
            </span>
          </Link>
          <p className="text-muted-foreground truncate text-xs">
            {passage.team
              ? `${passage.team.game.name}${passage.team.isActive ? '' : ' · équipe inactive'}`
              : 'La structure'}
          </p>
        </div>
      </div>
    );
  };

  const badge = (passage: JourneyItem): ReactNode => {
    const { label, tone } = passageStateBadge(passageStateOn(passage, today));

    return <StatusBadge tone={tone}>{label}</StatusBadge>;
  };

  const duration = (passage: JourneyItem): string | null =>
    formatApproximateDuration(passage.start, passage.end, today);

  const none = (spoken: string): ReactNode => (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">{spoken}</span>
    </>
  );

  const line = (passage: JourneyItem): ReactNode => (
    <TableRow className={LINE_FOCUS} data-journey-line="" key={passage.id}>
      <TableCell>{identity(passage, 'cell')}</TableCell>
      <TableCell className="pointer-events-none [overflow-wrap:anywhere]">
        {passage.function.name}
      </TableCell>
      <TableCell className="pointer-events-none">{badge(passage)}</TableCell>
      <TableCell className="text-muted-foreground pointer-events-none tabular-nums">
        {formatApproximateDate(passage.start)}
      </TableCell>
      <TableCell className="text-muted-foreground pointer-events-none tabular-nums">
        {passage.end ? formatApproximateDate(passage.end) : none('Pas de fin')}
      </TableCell>
      <TableCell className="text-muted-foreground pointer-events-none tabular-nums">
        {duration(passage) ?? none('Pas encore commencé')}
      </TableCell>
    </TableRow>
  );

  const card = (passage: JourneyItem): ReactNode => (
    <div
      className={cn('px-4 py-3', LINE_FOCUS, 'hover:bg-surface-row-hover')}
      data-journey-line=""
      key={passage.id}
    >
      <div className="space-y-1.5">
        {identity(passage, 'card')}
        <div className="flex flex-wrap items-center gap-2 pl-[46px]">
          {badge(passage)}
          <span className="text-muted-foreground text-sm">
            {passage.function.name}
          </span>
        </div>
        <p className="text-muted-foreground pl-[46px] text-xs">
          {[passagePeriodLabel(passage, today), duration(passage)]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
    </div>
  );

  const sources = journeySourcesOf(reach);
  // The pages where it is kept, named first, with the way there (rule of
  // 8 November 2026 for a tab that only reads).
  const toolbar = (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <p className="text-muted-foreground text-xs">
        Le parcours se tient dans {sources} : chaque ligne ouvre sa page.
      </p>
      <div className="flex flex-wrap gap-2">
        {reach.teams && (
          <Button asChild size="sm" variant="outline">
            <Link href={FEATURES.games.href}>
              <ArrowUpRight aria-hidden="true" className="size-4" />
              Ouvrir les jeux
            </Link>
          </Button>
        )}
        {reach.structure && (
          <Button asChild size="sm" variant="outline">
            <Link href={FEATURES.staff.href}>
              <ArrowUpRight aria-hidden="true" className="size-4" />
              Ouvrir {FEATURES.staff.label}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className={directoryStyles.directory}>
      <DataTableSection
        className="border-border-content bg-surface-content rounded-panel"
        headerClassName="bg-surface-content-header"
        toolbar={toolbar}
      >
        {journey === null ? (
          <PassageLinesSkeleton label="Chargement du parcours" />
        ) : blocks.length === 0 ? (
          <div className="px-4 py-8">
            <ContentState
              className="min-h-0 border-0 bg-transparent p-0"
              description={`Un passage s’ajoute dans ${sources} ; il s’affiche ici.`}
              icon={<Route aria-hidden="true" className="size-5" />}
              layout="panel"
              title="Aucun passage pour l’instant"
            />
          </div>
        ) : (
          <>
            {/* Six columns need room: the table from 56 rem, cards below. */}
            <div className="hidden @min-[56rem]/data-table:block">
              {blocks.map((block) => (
                <Table className={directoryStyles.table} key={block.id}>
                  <TableCaption className="sr-only">
                    {`${block.label} : ${reach.structure ? 'équipe ou structure' : 'équipe'}, fonction, statut, début, fin et durée`}
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {block.label}
                        <span className="ml-1.5 font-normal tabular-nums">
                          {block.items.length}
                        </span>
                      </TableHead>
                      <TableHead className="w-[150px]">Fonction</TableHead>
                      <TableHead className="w-[110px]">Statut</TableHead>
                      <TableHead className="w-[140px]">Début</TableHead>
                      <TableHead className="w-[140px]">Fin</TableHead>
                      <TableHead className="w-[120px]">Durée</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{block.items.map(line)}</TableBody>
                </Table>
              ))}
            </div>
            {blocks.map((block) => (
              <section
                aria-labelledby={`parcours-${block.id}`}
                className="@min-[56rem]/data-table:hidden"
                key={block.id}
              >
                <h3
                  className="bg-surface-table-head border-border-divider text-muted-foreground flex items-center justify-between border-y px-4 py-2 text-xs font-medium"
                  id={`parcours-${block.id}`}
                >
                  {block.label}
                  <span className="tabular-nums">{block.items.length}</span>
                </h3>
                <div
                  className={cn(
                    'divide-border-divider bg-surface [&>*:nth-child(even)]:bg-surface-row-alternate [&>*:nth-child(even):hover]:bg-surface-tile-hover divide-y',
                    directoryStyles.mobileList,
                  )}
                >
                  {block.items.map(card)}
                </div>
              </section>
            ))}
          </>
        )}
      </DataTableSection>
    </div>
  );
};
