'use client';

import { Plus, Users } from 'lucide-react';
import Link from 'next/link';
import React, { type FC, useEffect, useRef, useState } from 'react';

import { ContentState } from '$components/layout/ContentState';
import {
  functionKindsOf,
  memberFunctionGroupLabel,
} from '$features/member-functions/member-function.constants';
import { Button } from '$ui/button';
import { DataTableSection } from '$ui/data-table-section';
import directoryStyles from '$ui/directory.module.css';
import { getLocalToday } from '$utils/approximate-date.utils';

import {
  countPeopleOn,
  peopleCountsOf,
  placeWordsOf,
  rosterLines,
} from '../passage.ui';
import type { PassageItem } from '../types/passage.types';
import { PassageDialog } from './PassageDialog';
import {
  type PassageGroup,
  PassageLines,
  PassageLinesSkeleton,
  type PassagePlaceProps,
  PassagesLoadError,
} from './PassageLines';
import { useRoster } from './useRoster';

/**
 * What is there and coming in a place (owner, 9 November 2026: « le but est
 * de voir ce qu'il y a actuellement et à venir »): the Roster of a team, first
 * tab of its record, or the Effectif of the structure, first tab of Bureau &
 * staff. The players or the board, then the staff, in the order of the
 * functions, the arrivals after the members; the former passages have their
 * own tab. A passage is added and corrected in a window.
 */
export const RosterSection: FC<PassagePlaceProps> = ({
  canCreatePerson,
  canManage,
  canViewPersons,
  onCountsChange,
  place,
}) => {
  const { accept, error, load, retry, roster } = useRoster(place.scope);
  const [editor, setEditor] = useState<{ item: PassageItem | null } | null>(
    null,
  );
  const today = useRef(getLocalToday()).current;
  const words = placeWordsOf(place.scope.type);

  useEffect(() => {
    if (roster) onCountsChange(peopleCountsOf(roster.passages, today));
  }, [onCountsChange, roster, today]);

  if (error)
    return (
      <PassagesLoadError
        error={error}
        onRetry={() => void retry()}
        title={words.loadError}
      />
    );

  const passages = roster?.passages ?? [];
  const lines = rosterLines(passages, today);
  const members = countPeopleOn(passages, today, 'current');
  const coming = countPeopleOn(passages, today, 'upcoming');
  const groups: PassageGroup[] = functionKindsOf(words.functionScope).flatMap(
    (kind) => {
      const items = lines.filter((passage) => passage.function.kind === kind);

      return items.length === 0
        ? []
        : [
            {
              id: kind.toLowerCase(),
              items,
              label: memberFunctionGroupLabel(kind, words.functionScope),
            },
          ];
    },
  );

  const addButton = canManage ? (
    <Button
      className={directoryStyles.addButton}
      onClick={() => setEditor({ item: null })}
      type="button"
    >
      <Plus aria-hidden="true" />
      Ajouter un membre
    </Button>
  ) : undefined;

  // What the list holds, then the addition flush right: nothing to filter in
  // the composition of the day.
  const toolbar = (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <div className={directoryStyles.listCaption}>
        <p aria-live="polite" role="status">
          {roster === null
            ? 'Chargement…'
            : `${members} membre${members > 1 ? 's' : ''}${coming > 0 ? ` · ${coming} à venir` : ''}`}
        </p>
      </div>
      {addButton}
    </div>
  );

  return (
    <div className={directoryStyles.directory}>
      <DataTableSection
        className="border-border-content bg-surface-content rounded-panel"
        headerClassName="bg-surface-content-header"
        toolbar={toolbar}
      >
        {roster !== null && roster.functions.length === 0 && canManage && (
          // A passage needs a function of its list: said, never blocked.
          <p className="border-border-divider text-muted-foreground border-b px-4 py-3 text-sm">
            {words.noFunctions}{' '}
            <Link
              className="text-primary-emphasis underline-offset-4 hover:underline"
              href={place.functionsHref}
            >
              {words.addFunctions}
            </Link>
          </p>
        )}
        {roster === null ? (
          <PassageLinesSkeleton label={`Chargement ${words.ofList}`} />
        ) : lines.length === 0 ? (
          <div className="px-4 py-8">
            <ContentState
              action={passages.length === 0 ? addButton : undefined}
              className="min-h-0 border-0 bg-transparent p-0"
              description={
                passages.length === 0 ? (
                  canManage ? (
                    `Ajoutez ${words.members}, actuels ou passés, avec leurs dates : le registre se construit tout seul.`
                  ) : undefined
                ) : (
                  <>
                    Les passages terminés sont dans les{' '}
                    <Link
                      className="text-primary-emphasis underline-offset-4 hover:underline"
                      href={place.formerHref}
                    >
                      anciens membres
                    </Link>
                    .
                  </>
                )
              }
              icon={<Users aria-hidden="true" className="size-5" />}
              layout="panel"
              title={
                passages.length === 0
                  ? 'Aucun membre pour l’instant'
                  : 'Aucun membre actuellement'
              }
            />
          </div>
        ) : (
          <PassageLines
            canManage={canManage}
            canViewPersons={canViewPersons}
            groups={groups}
            onOpen={(item) => setEditor({ item })}
            placeName={place.name}
            showStatus
            today={today}
          />
        )}
      </DataTableSection>
      <PassageDialog
        canCreatePerson={canCreatePerson}
        canViewPersons={canViewPersons}
        functions={roster?.functions ?? []}
        item={editor?.item ?? null}
        onClose={() => setEditor(null)}
        onReload={load}
        onSaved={(next) => {
          accept(next);
          setEditor(null);
        }}
        open={editor !== null}
        place={place}
      />
    </div>
  );
};
