'use client';

import { Info, ReceiptText, RefreshCw, Users } from 'lucide-react';
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
import { tournamentDetailPath } from '$constants/routes.constants';
import { useUser } from '$context/UserContext';
import { PageCanvas, PageShell } from '$ui/page-shell';
import { ApiClientError } from '$utils/api.utils';
import { getLocalToday } from '$utils/approximate-date.utils';

import { deleteTournamentRequest, fetchTournament } from '../tournament.api';
import { TOURNAMENT_ACTION_BAR_SLOT } from '../tournament.constants';
import { getTournamentCapabilities } from '../tournament.permissions';
import {
  tournamentDatesLabel,
  tournamentStateOn,
  tournamentTitle,
} from '../tournament.ui';
import type { TournamentDetail } from '../types/tournament.types';
import { TournamentCancelAction } from './TournamentCancelAction';
import { TournamentAvatar, TournamentStateBadge } from './TournamentParts';

// Each tab loads with its own code.
const TournamentInformationSection = dynamic(() =>
  import('./TournamentInformationSection').then(
    (module) => module.TournamentInformationSection,
  ),
);
const TournamentParticipantsSection = dynamic(() =>
  import('./TournamentParticipantsSection').then(
    (module) => module.TournamentParticipantsSection,
  ),
);
const FinancesTab = dynamic(() =>
  import('$features/operations/components/FinancesTab').then(
    (module) => module.FinancesTab,
  ),
);

const TOURNAMENTS_HREF = FEATURES.tournaments.href;

export type TournamentDetailSection =
  'finances' | 'informations' | 'participants';

/**
 * What the tournament is, then our teams in it, then its money, read here
 * and entered in Finances (11 November 2026). Gains and Suivi come with the
 * second lot.
 */
const SECTIONS: readonly PageSection<TournamentDetailSection>[] = [
  {
    icon: <Info className="size-4" />,
    id: 'informations',
    label: 'Informations',
  },
  {
    icon: <Users className="size-4" />,
    id: 'participants',
    label: 'Participants',
  },
  {
    icon: <ReceiptText className="size-4" />,
    id: 'finances',
    label: 'Finances',
    managedIn: 'Finances',
  },
];

/** The first tab keeps the plain address. */
const sectionHrefOf =
  (id: string) =>
  (section: TournamentDetailSection): string =>
    section === 'informations'
      ? tournamentDetailPath(id)
      : `${tournamentDetailPath(id)}?section=${section}`;

/** « Valorant · 15 → 17 mars 2027 · LAN, Lyon », « Valorant · Date à fixer · En ligne ». */
const tournamentContext = (tournament: TournamentDetail): string =>
  [
    tournament.game.name,
    tournamentDatesLabel(tournament),
    tournament.format === 'LAN'
      ? tournament.location
        ? `LAN, ${tournament.location}`
        : 'LAN'
      : 'En ligne',
  ].join(' · ');

const entriesNotice = (count: number): string =>
  count === 0
    ? ''
    : count === 1
      ? ' Son équipe engagée et son line-up sont retirés avec lui.'
      : ` Ses ${count} équipes engagées et leurs line-ups sont retirés avec lui.`;

type ContentProps = {
  activeSection: TournamentDetailSection;
  tournamentId: string;
};

const TournamentDetailContent: FC<ContentProps> = ({
  activeSection,
  tournamentId,
}) => {
  const router = useRouter();
  const { userData } = useUser();
  const {
    canAddOrganizers,
    canManage,
    canOpenOrganizations,
    canOpenPersons,
    canOpenTeams,
    canView,
    canViewOperations,
  } = getTournamentCapabilities(userData);
  // Without the operations, their tab is not offered.
  const section: TournamentDetailSection =
    activeSection === 'finances' && !canViewOperations
      ? 'informations'
      : activeSection;
  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [informationDirty, setInformationDirty] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return (): void => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (): Promise<TournamentDetail> => {
    const fresh = await fetchTournament(tournamentId);
    if (mountedRef.current) {
      setTournament(fresh);
      setError(null);
    }

    return fresh;
  }, [tournamentId]);

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
          action="consulter ce tournoi"
          back={{ href: TOURNAMENTS_HREF, label: 'Retour aux tournois' }}
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
          actionHref={TOURNAMENTS_HREF}
          actionLabel="Retour aux tournois"
          description="Ce tournoi n’existe pas ou a été supprimé."
          title="Tournoi introuvable"
        />
      );
    if (error || !tournament)
      return (
        <PageState
          actionLabel="Réessayer"
          description={error?.message ?? 'Le tournoi ne peut pas être chargé.'}
          icon={<RefreshCw className="size-5" />}
          onAction={() => void retry()}
          title="Chargement impossible"
          tone="destructive"
        />
      );

    const state = tournamentStateOn(tournament, getLocalToday());

    return (
      <EntityDetailLayout
        activeSection={section}
        ariaLiveLabel={`Section ${SECTIONS.find((entry) => entry.id === section)?.label ?? 'Informations'} affichée`}
        condensedAside={<TournamentStateBadge state={state} />}
        dirtySections={informationDirty ? ['informations'] : []}
        heroDescription={tournamentContext(tournament)}
        heroIcon={<TournamentAvatar className="size-full rounded-md" />}
        heroMeta={<TournamentStateBadge state={state} />}
        heroTitle={tournamentTitle(tournament)}
        navigationAriaLabel="Navigation de la fiche tournoi"
        sectionHref={sectionHrefOf(tournament.id)}
        sections={SECTIONS.filter(
          (entry) => entry.id !== 'finances' || canViewOperations,
        ).map((entry) =>
          entry.id === 'participants'
            ? { ...entry, count: tournament.entries.length }
            : entry.id === 'finances'
              ? { ...entry, count: tournament.operationCount }
              : entry,
        )}
      >
        {section === 'participants' ? (
          <TournamentParticipantsSection
            canManage={canManage}
            canOpenPersons={canOpenPersons}
            canOpenTeams={canOpenTeams}
            onChange={(next) => {
              // Its last team of a scope of teams withdrawn: out of sight.
              if (next) setTournament(next);
              else router.replace(TOURNAMENTS_HREF);
            }}
            onReload={load}
            tournament={tournament}
          />
        ) : section === 'finances' ? (
          <FinancesTab
            key={tournament.id}
            target={{ tournamentId: tournament.id, type: 'tournament' }}
          />
        ) : (
          <section aria-label="Informations" className="space-y-5">
            <TournamentInformationSection
              key={tournament.id}
              canAddOrganizers={canAddOrganizers}
              canOpenOrganizations={canOpenOrganizations}
              canUpdate={canManage}
              onChange={setTournament}
              onDirtyChange={setInformationDirty}
              onReload={load}
              tournament={tournament}
            />
            {/* Annuler, for a tournament that can no longer be deleted. */}
            {canManage &&
              (tournament.operationCount > 0 || tournament.isCancelled) && (
                <TournamentCancelAction
                  onChange={setTournament}
                  onReload={load}
                  tournament={tournament}
                />
              )}
            {canManage && (
              <EntityDangerZone
                description="Le tournoi disparaît de la liste ; le journal d’activité garde la trace de la suppression."
                dialogDescription={`Cette action est irréversible. Seul un tournoi ajouté par erreur, ou en double, se supprime.${entriesNotice(tournament.entries.length)}`}
                dialogNotice="Le tournoi sera supprimé immédiatement et définitivement."
                dialogTitle={`Supprimer définitivement le tournoi ${tournamentTitle(tournament)} ?`}
                onDelete={async (version) => {
                  await deleteTournamentRequest(tournament.id, version);
                }}
                onDeleted={() => router.replace(TOURNAMENTS_HREF)}
                onDeletedLabel="Retour aux tournois"
                onReloadVersion={async () => (await load()).version}
                triggerLabel="Supprimer le tournoi"
                // Said instead of a deletion the server and the base refuse.
                unavailableReason={
                  tournament.operationCount > 0
                    ? `Ce tournoi a ${tournament.operationCount > 1 ? `${tournament.operationCount} opérations` : 'une opération'} : il reste, pour l’historique de la trésorerie. Annulez-le plutôt que de le supprimer.`
                    : undefined
                }
                version={tournament.version}
              />
            )}
          </section>
        )}
        {/* Save bar of the record: at page level, outside the section. */}
        <div className="contents" id={TOURNAMENT_ACTION_BAR_SLOT} />
      </EntityDetailLayout>
    );
  };

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: FEATURES.tournaments.audit.poleLabel },
        { href: TOURNAMENTS_HREF, label: FEATURES.tournaments.label },
        {
          label: tournament && !error ? tournamentTitle(tournament) : 'Tournoi',
        },
      ]}
    >
      {renderContent()}
    </AuthenticatedLayout>
  );
};

/**
 * Record of a tournament (11 November 2026), opened from its line on the
 * Tournois page: its information, our teams engaged with their line-up and
 * placement, then its money.
 */
export const TournamentDetailPage: FC<ContentProps> = ({
  activeSection,
  tournamentId,
}) => {
  const { authorizationRevision, userData } = useUser();

  return (
    <TournamentDetailContent
      key={`${tournamentId}:${userData?.id ?? ''}:${authorizationRevision}`}
      activeSection={activeSection}
      tournamentId={tournamentId}
    />
  );
};
