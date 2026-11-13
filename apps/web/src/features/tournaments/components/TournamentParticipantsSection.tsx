'use client';

import { Pencil, Plus, Users } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import React, { type FC, useState } from 'react';

import { ContentState } from '$components/layout/ContentState';
import { RubricCard } from '$components/layout/RubricCard';
import { teamDetailPath } from '$constants/routes.constants';
import { Button } from '$ui/button';
import { StatusBadge } from '$ui/status-badge';

import { placementLabel } from '../tournament.ui';
import type {
  TournamentDetail,
  TournamentEntryItem,
} from '../types/tournament.types';

// The window loads when it opens: it brings the teams' menu.
const TournamentEntryDialog = dynamic(() =>
  import('./TournamentEntryDialog').then(
    (module) => module.TournamentEntryDialog,
  ),
);

const entriesLabel = (count: number): string =>
  count > 1 ? `${count} équipes engagées` : '1 équipe engagée';

type Props = {
  canManage: boolean;
  canOpenTeams: boolean;
  onChange: (tournament: TournamentDetail | null) => void;
  onReload: () => Promise<TournamentDetail>;
  tournament: TournamentDetail;
};

/**
 * Our teams engaged in the tournament (11 November 2026), in one card: each
 * team, the link to its record, its placement and « Modifier ». Who played
 * is not kept (owner, 13 November 2026: « seulement les équipes
 * suffisent ») : the team's Roster and the public site tell it.
 */
export const TournamentParticipantsSection: FC<Props> = ({
  canManage,
  canOpenTeams,
  onChange,
  onReload,
  tournament,
}) => {
  // undefined: closed; null: engaging a team.
  const [editing, setEditing] = useState<
    TournamentEntryItem | null | undefined
  >(undefined);
  const engage = (
    <Button
      onClick={() => setEditing(null)}
      size="sm"
      type="button"
      variant={tournament.entries.length > 0 ? 'outline' : 'default'}
    >
      <Plus aria-hidden="true" className="size-4" />
      Engager une équipe
    </Button>
  );

  return (
    <section aria-label="Participants" className="space-y-3">
      <h2 className="sr-only">Participants</h2>
      {tournament.entries.length === 0 ? (
        <ContentState
          action={canManage ? engage : undefined}
          description="Une de nos équipes du jeu du tournoi, et son classement une fois le tournoi fini."
          icon={<Users aria-hidden="true" className="size-5" />}
          layout="panel"
          title="Aucune équipe engagée"
        />
      ) : (
        <RubricCard
          aside={canManage ? engage : undefined}
          contentClassName="p-0 sm:p-0"
          icon={<Users />}
          id="tournament-entries"
          title={entriesLabel(tournament.entries.length)}
        >
          <ul aria-label="Équipes engagées">
            {tournament.entries.map((entry) => {
              const placement = placementLabel(entry);

              return (
                <li
                  className="border-border-divider flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 border-t px-4 py-2.5 first:border-t-0 sm:px-5"
                  key={entry.id}
                >
                  {/* Never squeezed: under 10 rem, its placement goes below. */}
                  <span className="min-w-40 flex-1 text-sm font-medium [overflow-wrap:anywhere]">
                    {canOpenTeams ? (
                      <Link
                        className="underline-offset-4 hover:underline"
                        href={teamDetailPath(entry.team.id)}
                      >
                        {entry.team.name}
                      </Link>
                    ) : (
                      entry.team.name
                    )}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
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
                </li>
              );
            })}
          </ul>
        </RubricCard>
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
