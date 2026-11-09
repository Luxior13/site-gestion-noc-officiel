'use client';

import { Archive, Info, RefreshCw, Users } from 'lucide-react';
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
import { gameDetailPath, teamDetailPath } from '$constants/routes.constants';
import { useUser } from '$context/UserContext';
import { getGameCapabilities } from '$features/games/game.permissions';
import type { TeamPeopleCounts } from '$features/passages/passage.ui';
import { getPersonCapabilities } from '$features/persons/person.permissions';
import { PageCanvas, PageShell } from '$ui/page-shell';
import { StatusBadge } from '$ui/status-badge';
import { ApiClientError } from '$utils/api.utils';
import { formatApproximateDate } from '$utils/approximate-date.utils';

import { deleteTeamRequest, fetchTeam } from '../team.api';
import type { TeamDetail } from '../types/team.types';
import { TEAM_ACTION_BAR_SLOT } from './team-record.constants';
import { TeamAvatar } from './TeamAvatar';

// Each tab loads with its own code.
const TeamRosterSection = dynamic(() =>
  import('$features/passages/components/TeamRosterSection').then(
    (module) => module.TeamRosterSection,
  ),
);
const TeamFormerSection = dynamic(() =>
  import('$features/passages/components/TeamFormerSection').then(
    (module) => module.TeamFormerSection,
  ),
);
const TeamInformationSection = dynamic(() =>
  import('./TeamInformationSection').then(
    (module) => module.TeamInformationSection,
  ),
);

const GAMES_HREF = FEATURES.games.href;

type TeamDetailSection = 'anciens' | 'informations' | 'roster';

/**
 * What a team is first: its roster, what is there and coming (owner,
 * 9 November 2026), then its former members, never mixed with it; its
 * information last. Tournois ↗, Entraînements, Finances ↗ and Partenaires ↗
 * will come before it.
 */
const TEAM_DETAIL_SECTIONS: readonly PageSection<TeamDetailSection>[] = [
  { icon: <Users className="size-4" />, id: 'roster', label: 'Roster' },
  {
    icon: <Archive className="size-4" />,
    id: 'anciens',
    label: 'Anciens membres',
  },
  {
    icon: <Info className="size-4" />,
    id: 'informations',
    label: 'Informations',
  },
];

/** The first tab keeps the plain address. */
const sectionHrefOf =
  (teamId: string) =>
  (section: TeamDetailSection): string =>
    section === 'roster'
      ? teamDetailPath(teamId)
      : `${teamDetailPath(teamId)}?section=${section}`;

const passagesLabel = (count: number): string =>
  count > 1 ? `${count} passages` : 'un passage';

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

type ContentProps = { activeSection: TeamDetailSection; teamId: string };

const TeamDetailContent: FC<ContentProps> = ({ activeSection, teamId }) => {
  const router = useRouter();
  const { userData } = useUser();
  const { canManageTeams, canViewTeams } = getGameCapabilities(userData);
  const persons = getPersonCapabilities(userData);
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [informationDirty, setInformationDirty] = useState(false);
  const setPeopleCounts = useCallback((counts: TeamPeopleCounts): void => {
    setTeam((current) =>
      current &&
      (current.memberCount !== counts.memberCount ||
        current.formerCount !== counts.formerCount)
        ? { ...current, ...counts }
        : current,
    );
  }, []);
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
      <EntityDetailLayout
        activeSection={activeSection}
        ariaLiveLabel={`Section ${TEAM_DETAIL_SECTIONS.find((section) => section.id === activeSection)?.label ?? 'Roster'} affichée`}
        condensedAside={<TeamState team={team} />}
        dirtySections={informationDirty ? ['informations'] : []}
        heroDescription={<TeamContext team={team} />}
        heroIcon={<TeamAvatar className="rounded-md" />}
        heroMeta={<TeamState team={team} />}
        heroTitle={team.name}
        navigationAriaLabel="Navigation de la fiche équipe"
        sectionHref={sectionHrefOf(team.id)}
        sections={TEAM_DETAIL_SECTIONS.map((section) =>
          // The people there today; the people gone.
          section.id === 'roster'
            ? { ...section, count: team.memberCount }
            : section.id === 'anciens'
              ? { ...section, count: team.formerCount }
              : section,
        )}
      >
        {activeSection === 'roster' ? (
          <section aria-label="Roster">
            <TeamRosterSection
              key={team.id}
              canCreatePerson={persons.canCreate}
              canManage={canManageTeams}
              canViewPersons={persons.canView}
              onCountsChange={setPeopleCounts}
              team={team}
            />
          </section>
        ) : activeSection === 'anciens' ? (
          <section aria-label="Anciens membres">
            <TeamFormerSection
              key={team.id}
              canCreatePerson={persons.canCreate}
              canManage={canManageTeams}
              canViewPersons={persons.canView}
              onCountsChange={setPeopleCounts}
              team={team}
            />
          </section>
        ) : (
          <section aria-label="Informations" className="space-y-5">
            <TeamInformationSection
              key={team.id}
              canUpdate={canManageTeams}
              onChange={(next) =>
                // The counts come from the roster, read apart.
                setTeam((current) =>
                  current
                    ? {
                        ...next,
                        formerCount: current.formerCount,
                        memberCount: current.memberCount,
                        passageCount: current.passageCount,
                      }
                    : next,
                )
              }
              onDirtyChange={setInformationDirty}
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
                // Said instead of a deletion the server and the base refuse.
                unavailableReason={
                  team.passageCount > 0
                    ? `Cette équipe a ${passagesLabel(team.passageCount)} dans son Roster : rendez-la inactive plutôt que de la supprimer.`
                    : undefined
                }
                version={team.version}
              />
            )}
          </section>
        )}
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
 * Record of a team (8 November 2026), opened from its line on the Jeux page:
 * its roster, then its information (9 November 2026).
 */
export const TeamDetailPage: FC<ContentProps> = ({ activeSection, teamId }) => {
  const { authorizationRevision, userData } = useUser();

  return (
    <TeamDetailContent
      key={`${teamId}:${userData?.id ?? ''}:${authorizationRevision}`}
      activeSection={activeSection}
      teamId={teamId}
    />
  );
};
