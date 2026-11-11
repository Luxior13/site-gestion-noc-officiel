'use client';

import { Info, ReceiptText, RefreshCw, UserCog } from 'lucide-react';
import dynamic from 'next/dynamic';
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
import type { PageSection } from '$components/layout/PageSectionNavigation';
import { AccessDeniedState, PageState } from '$components/layout/PageState';
import { FEATURES } from '$constants/feature-registry.constants';
import { gameDetailPath } from '$constants/routes.constants';
import { useUser } from '$context/UserContext';
import { getOperationCapabilities } from '$features/operations/operation.permissions';
import { PageCanvas, PageShell } from '$ui/page-shell';
import { StatusBadge } from '$ui/status-badge';
import { ApiClientError } from '$utils/api.utils';
import { formatApproximateDate } from '$utils/approximate-date.utils';

import { deleteGameRequest, fetchGame } from '../game.api';
import { GAME_ACTION_BAR_SLOT } from '../game.constants';
import { getGameCapabilities } from '../game.permissions';
import type { GameItem } from '../types/game.types';
import { GameAvatar } from './GameAvatar';

// Each tab loads with its own code: the functions bring the drag-and-drop.
const MemberFunctionsSection = dynamic(() =>
  import('$features/member-functions/components/MemberFunctionsSection').then(
    (module) => module.MemberFunctionsSection,
  ),
);
const FinancesTab = dynamic(() =>
  import('$features/operations/components/FinancesTab').then(
    (module) => module.FinancesTab,
  ),
);
const GameInformationSection = dynamic(() =>
  import('./GameInformationSection').then(
    (module) => module.GameInformationSection,
  ),
);

const GAMES_HREF = FEATURES.games.href;

export type GameDetailSection = 'finances' | 'fonctions' | 'informations';

/**
 * What the game is first, its information last (owner, 9 November 2026), as
 * a team keeps its information last; between them, its money and its teams',
 * read here and entered in Finances (11 November 2026).
 */
const GAME_DETAIL_SECTIONS: readonly PageSection<GameDetailSection>[] = [
  { icon: <UserCog className="size-4" />, id: 'fonctions', label: 'Fonctions' },
  {
    icon: <ReceiptText className="size-4" />,
    id: 'finances',
    label: 'Finances',
    managedIn: 'Finances',
  },
  {
    icon: <Info className="size-4" />,
    id: 'informations',
    label: 'Informations',
  },
];

/** The first tab keeps the plain address. */
const sectionHrefOf =
  (gameId: string) =>
  (section: GameDetailSection): string =>
    section === 'fonctions'
      ? gameDetailPath(gameId)
      : `${gameDetailPath(gameId)}?section=${section}`;

const GameState: FC<{ game: GameItem }> = ({ game }) =>
  game.isActive ? (
    <StatusBadge tone="success">Actif</StatusBadge>
  ) : (
    <StatusBadge tone="muted">Inactif</StatusBadge>
  );

const teamCountLabel = (count: number): string =>
  count === 0 ? 'aucune équipe' : count > 1 ? `${count} équipes` : '1 équipe';

/** Said in the deletion window: unused functions leave with the game. */
const functionsNotice = (count: number): string =>
  count === 0
    ? ''
    : count === 1
      ? ' Sa fonction, jamais utilisée, est supprimée avec lui.'
      : ` Ses ${count} fonctions, jamais utilisées, sont supprimées avec lui.`;

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

type ContentProps = { activeSection: GameDetailSection; gameId: string };

const GameDetailContent: FC<ContentProps> = ({ activeSection, gameId }) => {
  const router = useRouter();
  const { userData } = useUser();
  const { canManage, canView, canViewTeams } = getGameCapabilities(userData);
  const canViewOperations = getOperationCapabilities(userData).canView;
  // Without the operations, their tab is not offered.
  const section: GameDetailSection =
    activeSection === 'finances' && !canViewOperations
      ? 'fonctions'
      : activeSection;
  const [game, setGame] = useState<GameItem | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [informationDirty, setInformationDirty] = useState(false);
  const mountedRef = useRef(false);
  const setFunctionCount = useCallback((functionCount: number): void => {
    setGame((current) =>
      current && current.functionCount !== functionCount
        ? { ...current, functionCount }
        : current,
    );
  }, []);

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
      <EntityDetailLayout
        activeSection={section}
        ariaLiveLabel={`Section ${GAME_DETAIL_SECTIONS.find((entry) => entry.id === section)?.label ?? 'Fonctions'} affichée`}
        condensedAside={<GameState game={game} />}
        dirtySections={informationDirty ? ['informations'] : []}
        heroDescription={<GameContext game={game} showTeams={canViewTeams} />}
        heroIcon={<GameAvatar className="size-full rounded-md" />}
        heroMeta={<GameState game={game} />}
        heroTitle={game.name}
        navigationAriaLabel="Navigation de la fiche jeu"
        sectionHref={sectionHrefOf(game.id)}
        sections={GAME_DETAIL_SECTIONS.filter(
          (entry) => entry.id !== 'finances' || canViewOperations,
        ).map((entry) =>
          entry.id === 'fonctions'
            ? { ...entry, count: game.functionCount }
            : entry,
        )}
      >
        {section === 'fonctions' ? (
          <section aria-label="Fonctions">
            <MemberFunctionsSection
              key={game.id}
              canManage={canManage}
              onCountChange={setFunctionCount}
              scope={{ gameId: game.id, type: 'game' }}
              subject={`d’une équipe de ${game.name}`}
            />
          </section>
        ) : section === 'finances' ? (
          <FinancesTab
            key={game.id}
            target={{ gameId: game.id, linkTeams: canViewTeams, type: 'game' }}
          />
        ) : (
          <section aria-label="Informations" className="space-y-5">
            <GameInformationSection
              key={game.id}
              canUpdate={canManage}
              game={game}
              onChange={setGame}
              onDirtyChange={setInformationDirty}
              onReload={load}
            />
            {canManage && (
              <EntityDangerZone
                description="Le jeu disparaît de la liste ; le journal d’activité garde la trace de la suppression."
                dialogDescription={`Cette action est irréversible. Seul un jeu créé par erreur, sans équipe, se supprime.${functionsNotice(game.functionCount)}`}
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
        )}
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
 * Record of a game (8 November 2026), opened from its line on the Jeux page:
 * its functions, its finances (11 November 2026), then its information.
 */
export const GameDetailPage: FC<ContentProps> = ({ activeSection, gameId }) => {
  const { authorizationRevision, userData } = useUser();

  return (
    <GameDetailContent
      key={`${gameId}:${userData?.id ?? ''}:${authorizationRevision}`}
      activeSection={activeSection}
      gameId={gameId}
    />
  );
};
