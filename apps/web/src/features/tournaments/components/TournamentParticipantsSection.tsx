'use client';

import { Pencil, Plus, Users } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import React, { type FC, useState } from 'react';

import { ContentState } from '$components/layout/ContentState';
import { RubricCard } from '$components/layout/RubricCard';
import { personDetailPath, teamDetailPath } from '$constants/routes.constants';
import { PersonAvatarFrame } from '$features/persons/components/PersonAvatar';
import { Button } from '$ui/button';
import { StatusBadge } from '$ui/status-badge';

import { placementLabel } from '../tournament.ui';
import type {
  TournamentDetail,
  TournamentEntryItem,
} from '../types/tournament.types';

// The window loads when it opens: it brings the record search.
const TournamentEntryDialog = dynamic(() =>
  import('./TournamentEntryDialog').then(
    (module) => module.TournamentEntryDialog,
  ),
);

const entriesLabel = (count: number): string =>
  count === 0
    ? 'Aucune équipe engagée'
    : count > 1
      ? `${count} équipes engagées`
      : '1 équipe engagée';

type Props = {
  canManage: boolean;
  canOpenPersons: boolean;
  canOpenTeams: boolean;
  onChange: (tournament: TournamentDetail | null) => void;
  onReload: () => Promise<TournamentDetail>;
  tournament: TournamentDetail;
};

/**
 * Our teams engaged in the tournament (11 November 2026): one card per
 * team, its placement on the band, its line-up under it, each person with
 * the function held in the team's Roster at the tournament's dates, or
 * « Hors Roster » for a stand-in.
 */
export const TournamentParticipantsSection: FC<Props> = ({
  canManage,
  canOpenPersons,
  canOpenTeams,
  onChange,
  onReload,
  tournament,
}) => {
  // undefined: closed; null: engaging a team.
  const [editing, setEditing] = useState<
    TournamentEntryItem | null | undefined
  >(undefined);

  return (
    <section aria-label="Participants" className="space-y-3">
      <h2 className="sr-only">Participants</h2>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm" role="status">
          {entriesLabel(tournament.entries.length)}
        </p>
        {canManage && tournament.entries.length > 0 && (
          <Button
            onClick={() => setEditing(null)}
            size="sm"
            type="button"
            variant="outline"
          >
            <Plus aria-hidden="true" className="size-4" />
            Engager une équipe
          </Button>
        )}
      </div>
      {tournament.entries.length === 0 ? (
        <ContentState
          action={
            canManage ? (
              <Button onClick={() => setEditing(null)} size="sm" type="button">
                <Plus aria-hidden="true" className="size-4" />
                Engager une équipe
              </Button>
            ) : undefined
          }
          description="Une de nos équipes du jeu du tournoi, avec son line-up pris dans son Roster et son classement."
          icon={<Users aria-hidden="true" className="size-5" />}
          layout="panel"
          title="Aucune équipe engagée"
        />
      ) : (
        tournament.entries.map((entry) => {
          const placement = placementLabel(entry);

          return (
            <RubricCard
              aside={
                <div className="flex items-center gap-2">
                  <StatusBadge tone={placement ? 'success' : 'muted'}>
                    {placement ?? 'Classement à venir'}
                  </StatusBadge>
                  {canManage && (
                    <Button
                      aria-label={`Modifier la participation de ${entry.team.name}`}
                      onClick={() => setEditing(entry)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Pencil aria-hidden="true" className="size-4" />
                      Modifier
                    </Button>
                  )}
                </div>
              }
              contentClassName="p-0 sm:p-0"
              icon={<Users />}
              id={`tournament-entry-${entry.id}`}
              key={entry.id}
              title={
                canOpenTeams ? (
                  <Link
                    className="underline-offset-4 hover:underline"
                    href={teamDetailPath(entry.team.id)}
                  >
                    {entry.team.name}
                  </Link>
                ) : (
                  entry.team.name
                )
              }
            >
              {entry.lineup.length === 0 ? (
                <p className="text-muted-foreground px-4 py-4 text-sm sm:px-5">
                  Line-up pas encore saisi.
                </p>
              ) : (
                <ul aria-label={`Line-up de ${entry.team.name}`}>
                  {entry.lineup.map((member) => (
                    <li
                      className="border-border-divider flex min-h-12 items-center gap-3 border-t px-4 py-2 first:border-t-0 sm:px-5"
                      key={member.person.id}
                    >
                      <PersonAvatarFrame
                        className="size-8 rounded-md"
                        person={member.person}
                      />
                      <span className="min-w-0 flex-1 text-sm font-medium [overflow-wrap:anywhere]">
                        {canOpenPersons ? (
                          <Link
                            className="underline-offset-4 hover:underline"
                            href={personDetailPath(member.person.id)}
                          >
                            {member.person.displayName}
                          </Link>
                        ) : (
                          member.person.displayName
                        )}
                      </span>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {member.function?.name ?? 'Hors Roster'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </RubricCard>
          );
        })
      )}
      {editing !== undefined && (
        <TournamentEntryDialog
          entry={editing}
          onClose={() => setEditing(undefined)}
          onReload={onReload}
          onSaved={onChange}
          tournament={tournament}
        />
      )}
    </section>
  );
};
