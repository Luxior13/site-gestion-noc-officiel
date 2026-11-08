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
import { gameDetailPath } from '$constants/routes.constants';
import { useUser } from '$context/UserContext';
import { getGameCapabilities } from '$features/games/game.permissions';
import { PageCanvas, PageShell } from '$ui/page-shell';
import { StatusBadge } from '$ui/status-badge';
import { ApiClientError } from '$utils/api.utils';
import { formatApproximateDate } from '$utils/approximate-date.utils';

import { deleteTeamRequest, fetchTeam } from '../team.api';
import type { TeamDetail } from '../types/team.types';
import { TeamAvatar } from './TeamAvatar';
import {
  TEAM_ACTION_BAR_SLOT,
  TeamInformationSection,
} from './TeamInformationSection';

const GAMES_HREF = FEATURES.games.href;

const TeamState: FC<{ team: TeamDetail }> = ({ team }) =>
  team.isActive ? (
    <StatusBadge tone="success">Active</StatusBadge>
  ) : (
    <StatusBadge tone="muted">Inactive</StatusBadge>
  );

/** « Valorant · depuis septembre 2023 », as precisely as the date is known. */
const TeamContext: FC<{ team: TeamDetail }> = ({ team }) => (
  <>
    {team.game.name} · depuis {team.founded.precision === 'DAY' ? 'le ' : ''}
    {formatApproximateDate(team.founded)}
  </>
);

const TeamDetailContent: FC<{ teamId: string }> = ({ teamId }) => {
  const router = useRouter();
  const { userData } = useUser();
  const { canManageTeams, canViewTeams } = getGameCapabilities(userData);
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return (): void => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (): Promise<TeamDetail> => {
    const fresh = await fetchTeam(teamId);
    if (mountedRef.current) {
      setTeam(fresh);
      setError(null);
    }

    return fresh;
  }, [teamId]);

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
    if (canViewTeams) void retry();
  }, [canViewTeams, retry]);

  const renderContent = (): React.ReactNode => {
    if (
      !canViewTeams ||
      (error instanceof ApiClientError && [401, 403].includes(error.status))
    )
      return (
        <AccessDeniedState
          action="consulter cette équipe"
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
          description="Cette équipe n’existe pas ou a été supprimée."
          title="Équipe introuvable"
        />
      );
    if (error || !team)
      return (
        <PageState
          actionLabel="Réessayer"
          description={error?.message ?? 'L’équipe ne peut pas être chargée.'}
          icon={<RefreshCw className="size-5" />}
          onAction={() => void retry()}
          title="Chargement impossible"
          tone="destructive"
        />
      );

    return (
      // One content until the roster: no tabs (gabarit B, « Onglets »).
      <EntityDetailLayout
        condensedAside={<TeamState team={team} />}
        heroDescription={<TeamContext team={team} />}
        heroIcon={<TeamAvatar className="rounded-md" />}
        heroMeta={<TeamState team={team} />}
        heroTitle={team.name}
      >
        <section aria-label="Informations" className="space-y-5">
          <TeamInformationSection
            key={team.id}
            canUpdate={canManageTeams}
            onChange={setTeam}
            onReload={load}
            team={team}
          />
          {canManageTeams && (
            <EntityDangerZone
              description="L’équipe disparaît de la liste de son jeu. Une équipe qui a déjà servi (joueurs, tournois) ne se supprime pas : rendez-la inactive."
              dialogDescription="Cette action est irréversible ; le journal d’activité garde la trace de la suppression."
              dialogNotice="L’équipe sera supprimée immédiatement et définitivement."
              dialogTitle={`Supprimer définitivement l’équipe ${team.name} ?`}
              onDelete={async (version) => {
                await deleteTeamRequest(team.id, version);
              }}
              onDeleted={() => router.replace(GAMES_HREF)}
              onDeletedLabel="Retour aux jeux"
              onReloadVersion={async () => (await load()).version}
              triggerLabel="Supprimer l’équipe"
              version={team.version}
            />
          )}
        </section>
        {/* Save bar of the record: at page level, outside the section. */}
        <div className="contents" id={TEAM_ACTION_BAR_SLOT} />
      </EntityDetailLayout>
    );
  };

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: FEATURES.games.audit.poleLabel },
        { href: GAMES_HREF, label: FEATURES.games.label },
        // The team sits under its game, whose record the crumb opens.
        ...(team && !error
          ? [{ href: gameDetailPath(team.game.id), label: team.game.name }]
          : []),
        { label: team && !error ? team.name : 'Équipe' },
      ]}
    >
      {renderContent()}
    </AuthenticatedLayout>
  );
};

/**
 * Record of a team (8 November 2026), opened from its line on the Jeux page.
 * Its information for now; the roster comes next, then its other tabs.
 */
export const TeamDetailPage: FC<{ teamId: string }> = ({ teamId }) => {
  const { authorizationRevision, userData } = useUser();

  return (
    <TeamDetailContent
      key={`${teamId}:${userData?.id ?? ''}:${authorizationRevision}`}
      teamId={teamId}
    />
  );
};
