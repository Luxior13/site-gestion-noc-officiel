'use client';

import { Gamepad2, Plus } from 'lucide-react';
import React, { type FC, useCallback, useEffect, useState } from 'react';

import AuthenticatedLayout from '$components/AuthenticatedLayout';
import { ContentState } from '$components/layout/ContentState';
import { PageIdentityHero } from '$components/layout/PageIdentityHero';
import { AccessDeniedState } from '$components/layout/PageState';
import { FEATURES } from '$constants/feature-registry.constants';
import { useUser } from '$context/UserContext';
import { Button } from '$ui/button';
import directoryStyles from '$ui/directory.module.css';
import { PageCanvas, PageShell } from '$ui/page-shell';
import { Skeleton } from '$ui/skeleton';
import { cn } from '$utils/css.utils';

import { fetchGames } from '../game.api';
import { getGameCapabilities } from '../game.permissions';
import { compareGames } from '../game-order.utils';
import type { GameItem } from '../types/game.types';
import { GameDialog } from './GameDialog';
import { GamesList } from './GamesList';

type DialogState = { game: GameItem | null } | null;

const GamesContent: FC<{ canManage: boolean }> = ({ canManage }) => {
  const [games, setGames] = useState<GameItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);

  const load = useCallback(async (signal?: AbortSignal): Promise<void> => {
    setLoadError(null);
    try {
      setGames(await fetchGames(signal));
    } catch (error) {
      if (signal?.aborted) return;
      setLoadError(
        error instanceof Error ? error.message : 'Chargement impossible',
      );
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);

    return (): void => controller.abort();
  }, [load]);

  const openCreate = (): void => setDialog({ game: null });

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
        description="Les sections de la structure, une par jeu."
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
          games={games}
          onCreate={openCreate}
          onOpen={(game) => setDialog({ game })}
        />
      ) : (
        <div aria-label="Chargement des jeux" role="status">
          <Skeleton className="rounded-panel h-64" />
        </div>
      )}
      <GameDialog
        game={dialog?.game ?? null}
        onClose={() => setDialog(null)}
        onDeleted={(id) => {
          setGames((current) =>
            (current ?? []).filter((game) => game.id !== id),
          );
          setDialog(null);
        }}
        onSaved={(saved) => {
          setGames((current) =>
            [
              ...(current ?? []).filter((game) => game.id !== saved.id),
              saved,
            ].sort(compareGames),
          );
          setDialog(null);
        }}
        open={dialog !== null}
      />
    </div>
  );
};

/** First page of the Esport pole: the games of the structure (8 November 2026). */
export const GamesPage: FC = () => {
  const { authorizationRevision, userData } = useUser();
  const { canManage, canView } = getGameCapabilities(userData);

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: FEATURES.games.audit.poleLabel },
        { label: FEATURES.games.label },
      ]}
    >
      {canView ? (
        <PageShell className="py-0">
          <PageCanvas contentClassName="py-6">
            <GamesContent
              canManage={canManage}
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
