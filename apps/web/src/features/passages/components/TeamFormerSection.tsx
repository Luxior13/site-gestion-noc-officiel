'use client';

import { Plus, RotateCcw, Users } from 'lucide-react';
import React, { type FC, useEffect, useRef, useState } from 'react';

import { ContentState } from '$components/layout/ContentState';
import {
  MEMBER_FUNCTION_KINDS,
  memberFunctionGroupLabel,
  type MemberFunctionKind,
} from '$features/member-functions/member-function.constants';
import { Button } from '$ui/button';
import { DataTableSection } from '$ui/data-table-section';
import directoryStyles from '$ui/directory.module.css';
import { ListSearchField } from '$ui/list-search-field';
import { QuickFilter, QuickFilterGroup } from '$ui/quick-filter';
import { getLocalToday } from '$utils/approximate-date.utils';
import { cn } from '$utils/css.utils';

import {
  formerLines,
  matchesRosterSearch,
  passageEndYear,
  peopleCountsOf,
} from '../passage.ui';
import type { PassageItem } from '../types/passage.types';
import { PassageDialog } from './PassageDialog';
import {
  type PassageGroup,
  PassageLines,
  PassageLinesSkeleton,
  PassagesLoadError,
  type TeamPassagesProps,
} from './PassageLines';
import { useTeamRoster } from './useTeamRoster';

const PASSAGE_NOUN = ['passage', 'passages'] as const;

type KindFilter = 'all' | MemberFunctionKind;

const KIND_FILTERS: readonly KindFilter[] = ['all', ...MEMBER_FUNCTION_KINDS];

/** The archive by the year its passages ended, the latest first. */
const byEndYear = (lines: readonly PassageItem[]): PassageGroup[] => {
  const groups: { id: string; items: PassageItem[]; label: string }[] = [];
  for (const passage of lines) {
    const year = passageEndYear(passage);
    const last = groups.at(-1);
    if (last?.id === `fin-${year}`) last.items.push(passage);
    else
      groups.push({
        id: `fin-${year}`,
        items: [passage],
        label: `Fin en ${year}`,
      });
  }

  return groups;
};

/**
 * The former members of a team, its own tab (owner, 9 November 2026: « je ne
 * veux pas mélanger les anciens avec les en cours et à venir, car sur le très
 * long terme ça fera bordel »): every ended passage, by the year it ended,
 * the latest first; a search and the players or the staff, as the
 * Répertoire's bar. A former member is added here, with both dates.
 */
export const TeamFormerSection: FC<TeamPassagesProps> = ({
  canCreatePerson,
  canManage,
  canViewPersons,
  onCountsChange,
  team,
}) => {
  const { accept, error, load, retry, roster } = useTeamRoster(team.id);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<KindFilter>('all');
  const [editor, setEditor] = useState<{ item: PassageItem | null } | null>(
    null,
  );
  const today = useRef(getLocalToday()).current;

  useEffect(() => {
    if (roster) onCountsChange(peopleCountsOf(roster.passages, today));
  }, [onCountsChange, roster, today]);

  if (error)
    return (
      <PassagesLoadError
        error={error}
        onRetry={() => void retry()}
        title="Les anciens membres ne peuvent pas être chargés"
      />
    );

  const former = formerLines(roster?.passages ?? [], today);
  // The search narrows every count, as the Répertoire's faceted filters.
  const found = former.filter((passage) => matchesRosterSearch(passage, query));
  const ofKind =
    (entry: KindFilter) =>
    (passage: PassageItem): boolean =>
      entry === 'all' || passage.function.kind === entry;
  const shown = found.filter(ofKind(kind));
  const searching = query.trim() !== '';
  const changed = searching || kind !== 'all';

  const addButton = canManage ? (
    <Button
      className={directoryStyles.addButton}
      onClick={() => setEditor({ item: null })}
      type="button"
    >
      <Plus aria-hidden="true" />
      Ajouter un ancien membre
    </Button>
  ) : undefined;

  const toolbar = (
    <div className="w-full">
      <div
        aria-label="Rechercher dans les anciens membres"
        className={directoryStyles.filterForm}
        role="search"
      >
        <ListSearchField
          ariaLabel="Rechercher par pseudo, nom ou fonction"
          maxLength={80}
          onClear={() => setQuery('')}
          onValueChange={setQuery}
          placeholder="Pseudo, nom ou fonction…"
          value={query}
        />
        <div className={cn(directoryStyles.filterSelects, 'items-center')}>
          {/* Its place stays reserved while hidden: the addition stays put. */}
          <Button
            aria-hidden={!changed || undefined}
            aria-label="Réinitialiser la recherche et la fonction"
            className={cn(
              directoryStyles.iconButton,
              !changed && 'pointer-events-none invisible',
            )}
            onClick={() => {
              setQuery('');
              setKind('all');
            }}
            size="icon"
            tabIndex={changed ? undefined : -1}
            type="button"
            variant="ghost"
          >
            <RotateCcw aria-hidden="true" />
          </Button>
          {addButton}
        </div>
      </div>
      <div className={directoryStyles.filterBar}>
        <div className={directoryStyles.quickFilterSets}>
          <QuickFilterGroup caption="Fonction" label="Filtrer par fonction">
            {KIND_FILTERS.map((entry) => (
              <QuickFilter
                count={
                  roster === null ? null : found.filter(ofKind(entry)).length
                }
                key={entry}
                label={
                  entry === 'all' ? 'Tous' : memberFunctionGroupLabel(entry)
                }
                noun={PASSAGE_NOUN}
                onClick={() => setKind(entry)}
                pressed={entry === kind}
              />
            ))}
          </QuickFilterGroup>
        </div>
        <div className={directoryStyles.listCaption}>
          <p aria-live="polite" role="status">
            {roster === null
              ? 'Chargement…'
              : `${shown.length} passage${shown.length > 1 ? 's' : ''}${searching ? ` trouvé${shown.length > 1 ? 's' : ''}` : ''}`}
          </p>
        </div>
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
        {roster === null ? (
          <PassageLinesSkeleton label="Chargement des anciens membres" />
        ) : shown.length === 0 ? (
          <div className="px-4 py-8">
            <ContentState
              action={former.length === 0 ? addButton : undefined}
              className="min-h-0 border-0 bg-transparent p-0"
              description={
                former.length === 0
                  ? 'Un passage terminé arrive ici : un départ, ou une fonction quittée pour une autre.'
                  : undefined
              }
              icon={<Users aria-hidden="true" className="size-5" />}
              layout="panel"
              title={
                former.length === 0
                  ? 'Aucun ancien membre'
                  : 'Aucun passage trouvé'
              }
            />
          </div>
        ) : (
          <PassageLines
            canManage={canManage}
            canViewPersons={canViewPersons}
            groups={byEndYear(shown)}
            onOpen={(item) => setEditor({ item })}
            showStatus={false}
            teamName={team.name}
            today={today}
          />
        )}
      </DataTableSection>
      <PassageDialog
        canCreatePerson={canCreatePerson}
        canViewPersons={canViewPersons}
        former
        functions={roster?.functions ?? []}
        item={editor?.item ?? null}
        onClose={() => setEditor(null)}
        onReload={load}
        onSaved={(next) => {
          accept(next);
          setEditor(null);
        }}
        open={editor !== null}
        team={team}
      />
    </div>
  );
};
