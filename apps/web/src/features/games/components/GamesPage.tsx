'use client';

import { Gamepad2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { type FC, useCallback, useEffect, useState } from 'react';

import AuthenticatedLayout from '$components/AuthenticatedLayout';
import { ContentState } from '$components/layout/ContentState';
import { PageIdentityHero } from '$components/layout/PageIdentityHero';
import { AccessDeniedState } from '$components/layout/PageState';
import { FEATURES } from '$constants/feature-registry.constants';
import { teamDetailPath } from '$constants/routes.constants';
import { useUser } from '$context/UserContext';
import { TeamDialog } from '$features/teams/components/TeamDialog';
import { fetchTeams } from '$features/teams/team.api';
import type { TeamItem } from '$features/teams/types/team.types';
import { Button } from '$ui/button';
import directoryStyles from '$ui/directory.module.css';
import { PageCanvas, PageShell } from '$ui/page-shell';
import { Skeleton } from '$ui/skeleton';
import { compareActiveThenName } from '$utils/active-order.utils';
import { cn } from '$utils/css.utils';

import { fetchGames } from '../game.api';
import {
  type GameCapabilities,
  getGameCapabilities,
} from '../game.permissions';
import type { GameItem } from '../types/game.types';
import { GameDialog } from './GameDialog';
import { GamesList } from './GamesList';

type GameDialogState = { game: GameItem | null } | null;
/** The game a new team is added to. */
type TeamDialogState = { gameId: string } | null;

/** Replaces or adds an item, then keeps the list's order. */
const upsert = <Item extends { id: string; isActive: boolean; name: string }>(
  items: readonly Item[] | null,
  saved: Item,
): Item[] =>
  [...(items ?? []).filter((item) => item.id !== saved.id), saved].sort(
    compareActiveThenName,
  );

const GamesContent: FC<{ capabilities: GameCapabilities }> = ({
  capabilities: { canManage, canManageTeams, canViewTeams },
}) => {
  const router = useRouter();
  const [games, setGames] = useState<GameItem[] | null>(null);
  const [teams, setTeams] = useState<TeamItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [gameDialog, setGameDialog] = useState<GameDialogState>(null);
  const [teamDialog, setTeamDialog] = useState<TeamDialogState>(null);

  const load = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      setLoadError(null);
      try {
        // Teams only for who may see them; the games list stands alone.
        const [nextGames, nextTeams] = await Promise.all([
          fetchGames(signal),
          canViewTeams ? fetchTeams(signal) : Promise.resolve(null),
        ]);
        setGames(nextGames);
        setTeams(nextTeams);
      } catch (error) {
        if (signal?.aborted) return;
        setLoadError(
          error instanceof Error ? error.message : 'Chargement impossible',
        );
      }
    },
    [canViewTeams],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);

    return (): void => controller.abort();
  }, [load]);

  const openCreate = (): void => setGameDialog({ game: null });
  const openGame = gameDialog?.game ?? null;
  // The page's teams are the freshest count; the server's otherwise.
  const teamCountOf = (game: GameItem): number =>
    teams
      ? teams.filter((team) => team.gameId === game.id).length
      : game.teamCount;

  return (
    <div className={cn(directoryStyles.directory, 'space-y-[18px]')}>
      <PageIdentityHero
        actions={
          canManage ? (
            <Button className={directoryStyles.addButton} onClick={openCreate}>
              <Plus aria-hidden="true" />
              Ajouter un jeu
            </Button>
          ) : undefined
        }
        description={
          canViewTeams
            ? 'Les sections de la structure, une par jeu, et leurs équipes.'
            : 'Les sections de la structure, une par jeu.'
        }
        icon={<Gamepad2 aria-hidden="true" />}
        title={FEATURES.games.label}
      />
      {loadError ? (
        <ContentState
          action={
            <Button
              onClick={() => void load()}
              size="sm"
              type="button"
              variant="outline"
            >
              Réessayer
            </Button>
          }
          description={loadError}
          icon={<Gamepad2 aria-hidden="true" className="size-5" />}
          kind="error"
          layout="panel"
          title="Chargement impossible"
        />
      ) : games ? (
        <GamesList
          canManage={canManage}
          canManageTeams={canManageTeams}
          games={games}
          onAddTeam={(game) => setTeamDialog({ gameId: game.id })}
          onCreate={openCreate}
          onOpen={(game) => setGameDialog({ game })}
          teams={teams}
        />
      ) : (
        <div aria-label="Chargement des jeux" role="status">
          <Skeleton className="rounded-panel h-64" />
        </div>
      )}
      <GameDialog
        game={openGame}
        onClose={() => setGameDialog(null)}
        onDeleted={(id) => {
          setGames((current) =>
            (current ?? []).filter((game) => game.id !== id),
          );
          setGameDialog(null);
        }}
        onSaved={(saved) => {
          setGames((current) => upsert(current, saved));
          setGameDialog(null);
        }}
        open={gameDialog !== null}
        teamCount={openGame ? teamCountOf(openGame) : 0}
      />
      {canManageTeams && (
        <TeamDialog
          gameId={teamDialog?.gameId ?? ''}
          games={games ?? []}
          onClose={() => setTeamDialog(null)}
          onCreated={(created) => {
            setTeams((current) => upsert(current, created));
            setTeamDialog(null);
            // A new team opens on its record, where it is completed.
            router.push(teamDetailPath(created.id));
          }}
          open={teamDialog !== null}
        />
      )}
    </div>
  );
};

/** First page of the Esport pole: the games of the structure and their teams. */
export const GamesPage: FC = () => {
  const { authorizationRevision, userData } = useUser();
  const capabilities = getGameCapabilities(userData);

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: FEATURES.games.audit.poleLabel },
        { label: FEATURES.games.label },
      ]}
    >
      {capabilities.canView ? (
        <PageShell className="py-0">
          <PageCanvas contentClassName="py-6">
            <GamesContent
              capabilities={capabilities}
              key={`${userData?.id ?? ''}:${authorizationRevision}`}
            />
          </PageCanvas>
        </PageShell>
      ) : (
        <AccessDeniedState action="consulter les jeux" />
      )}
    </AuthenticatedLayout>
  );
};
