'use client';

import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, {
  type FC,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import AuthenticatedLayout from '$components/AuthenticatedLayout';
import { EntityDangerZone } from '$components/layout/EntityDangerZone';
import { EntityDetailLayout } from '$components/layout/EntityDetailLayout';
import { PageDetailSkeleton } from '$components/layout/PageDetailSkeleton';
import { AccessDeniedState, PageState } from '$components/layout/PageState';
import { FEATURES } from '$constants/feature-registry.constants';
import { useUser } from '$context/UserContext';
import { PageCanvas, PageShell } from '$ui/page-shell';
import { StatusBadge } from '$ui/status-badge';
import { ApiClientError } from '$utils/api.utils';
import { formatApproximateDate } from '$utils/approximate-date.utils';

import { deleteGameRequest, fetchGame } from '../game.api';
import { getGameCapabilities } from '../game.permissions';
import type { GameItem } from '../types/game.types';
import { GameAvatar } from './GameAvatar';
import {
  GAME_ACTION_BAR_SLOT,
  GameInformationSection,
} from './GameInformationSection';

const GAMES_HREF = FEATURES.games.href;

const GameState: FC<{ game: GameItem }> = ({ game }) =>
  game.isActive ? (
    <StatusBadge tone="success">Actif</StatusBadge>
  ) : (
    <StatusBadge tone="muted">Inactif</StatusBadge>
  );

const teamCountLabel = (count: number): string =>
  count === 0 ? 'aucune équipe' : count > 1 ? `${count} équipes` : '1 équipe';

/** « VAL · depuis le 15 mars 2021 · 3 équipes ». */
const GameContext: FC<{ game: GameItem; showTeams: boolean }> = ({
  game,
  showTeams,
}) => (
  <>
    {game.shortName && `${game.shortName} · `}
    depuis {game.firstOpened.precision === 'DAY' ? 'le ' : ''}
    {formatApproximateDate(game.firstOpened)}
    {showTeams && ` · ${teamCountLabel(game.teamCount)}`}
  </>
);

const GameDetailContent: FC<{ gameId: string }> = ({ gameId }) => {
  const router = useRouter();
  const { userData } = useUser();
  const { canManage, canView, canViewTeams } = getGameCapabilities(userData);
  const [game, setGame] = useState<GameItem | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return (): void => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (): Promise<GameItem> => {
    const fresh = await fetchGame(gameId);
    if (mountedRef.current) {
      setGame(fresh);
      setError(null);
    }

    return fresh;
  }, [gameId]);

  const retry = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await load();
    } catch (caught) {
      if (mountedRef.current)
        setError(
          caught instanceof Error
            ? caught
            : new Error('Chargement impossible.'),
        );
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [load]);

  useEffect(() => {
    if (canView) void retry();
  }, [canView, retry]);

  const renderContent = (): React.ReactNode => {
    if (
      !canView ||
      (error instanceof ApiClientError && [401, 403].includes(error.status))
    )
      return (
        <AccessDeniedState
          action="consulter ce jeu"
          back={{ href: GAMES_HREF, label: 'Retour aux jeux' }}
        />
      );
    if (isLoading)
      return (
        <PageShell className="py-0">
          <PageCanvas>
            <PageDetailSkeleton />
          </PageCanvas>
        </PageShell>
      );
    if (error instanceof ApiClientError && error.status === 404)
      return (
        <PageState
          actionHref={GAMES_HREF}
          actionLabel="Retour aux jeux"
          description="Ce jeu n’existe pas ou a été supprimé."
          title="Jeu introuvable"
        />
      );
    if (error || !game)
      return (
        <PageState
          actionLabel="Réessayer"
          description={error?.message ?? 'Le jeu ne peut pas être chargé.'}
          icon={<RefreshCw className="size-5" />}
          onAction={() => void retry()}
          title="Chargement impossible"
          tone="destructive"
        />
      );

    return (
      // One content until its functions: no tabs (gabarit B, « Onglets »).
      <EntityDetailLayout
        condensedAside={<GameState game={game} />}
        heroDescription={<GameContext game={game} showTeams={canViewTeams} />}
        heroIcon={<GameAvatar className="size-full rounded-md" />}
        heroMeta={<GameState game={game} />}
        heroTitle={game.name}
      >
        <section aria-label="Informations" className="space-y-5">
          <GameInformationSection
            key={game.id}
            canUpdate={canManage}
            game={game}
            onChange={setGame}
            onReload={load}
          />
          {canManage && (
            <EntityDangerZone
              description="Le jeu disparaît de la liste ; le journal d’activité garde la trace de la suppression."
              dialogDescription="Cette action est irréversible. Seul un jeu créé par erreur, sans équipe, se supprime."
              dialogNotice="Le jeu sera supprimé immédiatement et définitivement."
              dialogTitle={`Supprimer définitivement le jeu ${game.name} ?`}
              onDelete={async (version) => {
                await deleteGameRequest(game.id, version);
              }}
              onDeleted={() => router.replace(GAMES_HREF)}
              onDeletedLabel="Retour aux jeux"
              onReloadVersion={async () => (await load()).version}
              triggerLabel="Supprimer le jeu"
              // Said instead of a deletion the server and the base refuse.
              unavailableReason={
                game.teamCount > 0
                  ? `Ce jeu a ${teamCountLabel(game.teamCount)} : rendez-le inactif plutôt que de le supprimer.`
                  : undefined
              }
              version={game.version}
            />
          )}
        </section>
        {/* Save bar of the record: at page level, outside the section. */}
        <div className="contents" id={GAME_ACTION_BAR_SLOT} />
      </EntityDetailLayout>
    );
  };

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: FEATURES.games.audit.poleLabel },
        { href: GAMES_HREF, label: FEATURES.games.label },
        { label: game && !error ? game.name : 'Jeu' },
      ]}
    >
      {renderContent()}
    </AuthenticatedLayout>
  );
};

/**
 * Record of a game (8 November 2026), opened from its line on the Jeux page.
 * Its information for now; its functions come with the roster, then its
 * finances.
 */
export const GameDetailPage: FC<{ gameId: string }> = ({ gameId }) => {
  const { authorizationRevision, userData } = useUser();

  return (
    <GameDetailContent
      key={`${gameId}:${userData?.id ?? ''}:${authorizationRevision}`}
      gameId={gameId}
    />
  );
};
