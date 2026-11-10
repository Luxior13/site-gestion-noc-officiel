'use client';

import { Gamepad2, Plus } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import React, { type FC, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import AuthenticatedLayout from '$components/AuthenticatedLayout';
import { ContentState } from '$components/layout/ContentState';
import { PageIdentityHero } from '$components/layout/PageIdentityHero';
import { AccessDeniedState } from '$components/layout/PageState';
import { FEATURES } from '$constants/feature-registry.constants';
import { gameDetailPath, teamDetailPath } from '$constants/routes.constants';
import { useUser } from '$context/UserContext';
import { TeamDialog } from '$features/teams/components/TeamDialog';
import { fetchTeams, reorderTeamsRequest } from '$features/teams/team.api';
import type { TeamItem } from '$features/teams/types/team.types';
import { Button } from '$ui/button';
import directoryStyles from '$ui/directory.module.css';
import { PageCanvas, PageShell } from '$ui/page-shell';
import { Skeleton } from '$ui/skeleton';
import { compareRank } from '$utils/active-order.utils';
import { ApiClientError } from '$utils/api.utils';
import { cn } from '$utils/css.utils';

import { fetchGames, reorderGamesRequest } from '../game.api';
import {
  type GameCapabilities,
  getGameCapabilities,
} from '../game.permissions';
import type { GameItem } from '../types/game.types';
import { GameDialog } from './GameDialog';

const ListSkeleton: FC = () => (
  <div aria-label="Chargement des jeux" role="status">
    <Skeleton className="rounded-panel h-64" />
  </div>
);

// The list brings the drag-and-drop: loaded with its own code (page budget).
const GamesList = dynamic(
  () => import('./GamesList').then((module) => module.GamesList),
  { loading: () => <ListSkeleton /> },
);

/** The given items take ranks 0 to n − 1, the others keep theirs. */
const rank = <
  Item extends {
    id: string;
    isActive: boolean;
    name: string;
    position: number;
  },
>(
  items: readonly Item[],
  ids: readonly string[],
): Item[] =>
  items
    .map((item) =>
      ids.includes(item.id)
        ? { ...item, position: ids.indexOf(item.id) }
        : item,
    )
    .sort(compareRank);

/** Replaces or adds an item, then keeps the list's order. */
const upsert = <
  Item extends {
    id: string;
    isActive: boolean;
    name: string;
    position: number;
  },
>(
  items: readonly Item[] | null,
  saved: Item,
): Item[] =>
  [...(items ?? []).filter((item) => item.id !== saved.id), saved].sort(
    compareRank,
  );

const GamesContent: FC<{ capabilities: GameCapabilities }> = ({
  capabilities: { canAddGames, canAddTeams, canViewTeams },
}) => {
  const router = useRouter();
  const [games, setGames] = useState<GameItem[] | null>(null);
  const [teams, setTeams] = useState<TeamItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [gameDialogOpen, setGameDialogOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

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

  /**
   * Shows a new order at once and saves it (owner, 9 November 2026); a
   * refusal puts the former order back, and a list changed meanwhile is read
   * again.
   */
  const saveOrder = async (
    show: () => void,
    restore: () => void,
    save: () => Promise<void>,
  ): Promise<void> => {
    if (savingOrder) return;
    show();
    setSavingOrder(true);
    try {
      await save();
      toast.success('Ordre enregistré');
    } catch (error) {
      restore();
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : 'L’ordre n’a pas été enregistré. Réessayez.',
      );
      if (error instanceof ApiClientError && error.status === 409) void load();
    } finally {
      setSavingOrder(false);
    }
  };

  const reorderGames = (ids: string[]): void => {
    const previous = games;
    void saveOrder(
      () => setGames((current) => current && rank(current, ids)),
      () => setGames(previous),
      async () => setGames(await reorderGamesRequest(ids)),
    );
  };

  const reorderTeams = (gameId: string, ids: string[]): void => {
    const previous = teams;
    void saveOrder(
      () => setTeams((current) => current && rank(current, ids)),
      () => setTeams(previous),
      async () => {
        const saved = await reorderTeamsRequest(gameId, ids);
        setTeams((current) =>
          [
            ...(current ?? []).filter((team) => team.gameId !== gameId),
            ...saved,
          ].sort(compareRank),
        );
      },
    );
  };

  const openCreate = (): void => setGameDialogOpen(true);
  // A team needs a game: without any, the page offers « Ajouter un jeu ».
  // Both concern whole games: not with a scope of teams, and adding or
  // ordering games needs every game (10 November 2026).
  const canAddTeam = canAddTeams && Boolean(games?.length);

  return (
    <div className={cn(directoryStyles.directory, 'space-y-[18px]')}>
      <PageIdentityHero
        actions={
          canAddGames || canAddTeam ? (
            <>
              {/* One entry for every team: its game is chosen in the window
                  (owner, 8 November 2026), instead of a line under each game. */}
              {canAddTeam && (
                <Button
                  className={directoryStyles.secondaryButton}
                  onClick={() => setTeamDialogOpen(true)}
                  variant="outline"
                >
                  <Plus aria-hidden="true" />
                  Ajouter une équipe
                </Button>
              )}
              {canAddGames && (
                <Button
                  className={directoryStyles.addButton}
                  onClick={openCreate}
                >
                  <Plus aria-hidden="true" />
                  Ajouter un jeu
                </Button>
              )}
            </>
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
          canManage={canAddGames}
          canReorderGames={canAddGames}
          canReorderTeams={canAddTeams}
          frozen={savingOrder}
          games={games}
          onCreate={openCreate}
          onReorderGames={reorderGames}
          onReorderTeams={reorderTeams}
          teams={teams}
        />
      ) : (
        <ListSkeleton />
      )}
      <GameDialog
        onClose={() => setGameDialogOpen(false)}
        onCreated={(created) => {
          setGames((current) => upsert(current, created));
          setGameDialogOpen(false);
          // A new game opens on its record, where it is completed.
          router.push(gameDetailPath(created.id));
        }}
        open={gameDialogOpen}
      />
      {canAddTeam && teamDialogOpen && (
        <TeamDialog
          games={games ?? []}
          onClose={() => setTeamDialogOpen(false)}
          onCreated={(created) => {
            setTeams((current) => upsert(current, created));
            setTeamDialogOpen(false);
            // A new team opens on its record, where it is completed.
            router.push(teamDetailPath(created.id));
          }}
          open
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
