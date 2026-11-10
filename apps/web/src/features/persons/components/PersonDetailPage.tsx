'use client';

import { AtSign, Clock3, RefreshCw, Route, UserRound } from 'lucide-react';
import dynamic from 'next/dynamic';
import React, {
  type FC,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import AuthenticatedLayout from '$components/AuthenticatedLayout';
import { EntityDetailLayout } from '$components/layout/EntityDetailLayout';
import { PageDetailSkeleton } from '$components/layout/PageDetailSkeleton';
import type { PageSection } from '$components/layout/PageSectionNavigation';
import { AccessDeniedState, PageState } from '$components/layout/PageState';
import { FEATURES } from '$constants/feature-registry.constants';
import { personDetailPath } from '$constants/routes.constants';
import { useUser } from '$context/UserContext';
import { JournalHistoryLink } from '$features/audit/components/JournalHistoryLink';
import { getGameCapabilities } from '$features/games/game.permissions';
import {
  type JourneyReach,
  journeySourcesOf,
} from '$features/passages/journey-sources';
import { getStaffCapabilities } from '$features/staff/staff.permissions';
import { PageCanvas, PageShell } from '$ui/page-shell';
import { ApiClientError } from '$utils/api.utils';

import { getPerson } from '../person.api';
import { getPersonCapabilities } from '../person.permissions';
import {
  formatPersonActor,
  formatPersonDateTime,
  getPersonDisplayName,
} from '../person.ui';
import type { PersonDetail } from '../types/person.types';
import { PersonAvatar } from './PersonAvatar';
import { PersonDangerZone } from './PersonDangerZone';
import { PersonStatusBadge } from './PersonStatusBadge';

const PersonCollectionsSection = dynamic(() =>
  import('./PersonCollectionsSection').then(
    (module) => module.PersonCollectionsSection,
  ),
);
const PersonIdentitySection = dynamic(() =>
  import('./PersonIdentitySection').then(
    (module) => module.PersonIdentitySection,
  ),
);
const PersonOtherNicknamesCard = dynamic(() =>
  import('./PersonOtherNicknames').then(
    (module) => module.PersonOtherNicknamesCard,
  ),
);
const PersonJourneySection = dynamic(() =>
  import('$features/passages/components/PersonJourneySection').then(
    (module) => module.PersonJourneySection,
  ),
);

type PersonDetailPageProps = {
  activeSection: PersonDetailSection;
  initialPerson?: PersonDetail;
  initialPersonScope?: string;
  personId: string;
  returnHref: string;
};

export type PersonDetailSection = 'coordonnees' | 'identite' | 'parcours';

const PERSON_DETAIL_SECTIONS: readonly PageSection<PersonDetailSection>[] = [
  {
    icon: <UserRound className="size-4" />,
    id: 'identite',
    label: 'Identité',
  },
  {
    icon: <AtSign className="size-4" />,
    id: 'coordonnees',
    label: 'Coordonnées',
  },
  // Read here, kept in each team's Roster and the structure's Effectif
  // (9 November 2026); its sources follow the reader's rights.
  { icon: <Route className="size-4" />, id: 'parcours', label: 'Parcours' },
];

const DetailSkeleton: FC = () => (
  <PageShell className="py-0">
    <PageCanvas>
      <PageDetailSkeleton />
    </PageCanvas>
  </PageShell>
);

/**
 * Creation and last change, shown once in the hero for the whole record (as
 * on the user record) instead of a footer repeated under each section.
 */
const PersonRecordDates: FC<{ person: PersonDetail }> = ({ person }) => {
  const actor = person.lastChange?.actor;
  const changedAt = person.lastChange?.at ?? person.updatedAt;

  return (
    <>
      Créée le{' '}
      <time dateTime={person.createdAt}>
        {formatPersonDateTime(person.createdAt)}
      </time>
      {' · '}Modifiée le{' '}
      <time dateTime={changedAt}>{formatPersonDateTime(changedAt)}</time> par{' '}
      {actor ? formatPersonActor(actor) : 'un auteur non disponible'}
    </>
  );
};

const PersonDetailContent: FC<PersonDetailPageProps> = ({
  activeSection: requestedSection,
  initialPerson,
  personId,
  returnHref,
}) => {
  const { userData } = useUser();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(!initialPerson);
  const [person, setPerson] = useState<PersonDetail | null>(
    initialPerson ?? null,
  );
  const [identityDirty, setIdentityDirty] = useState(false);
  const { canDelete, canUpdate, canUpdateContact, canView, canViewContact } =
    getPersonCapabilities(userData);
  // The journey is read from the rosters: it follows the right to see them,
  // a team's or the structure's.
  const reach: JourneyReach = {
    structure: getStaffCapabilities(userData).canView,
    teams: getGameCapabilities(userData).canViewTeams,
  };
  const allowed = (section: PersonDetailSection): boolean =>
    section === 'identite' ||
    (section === 'coordonnees'
      ? canViewContact
      : reach.teams || reach.structure);
  const activeSection = allowed(requestedSection)
    ? requestedSection
    : 'identite';
  const mountedRef = useRef(false);
  const personRef = useRef(person);
  const requestRef = useRef<AbortController | null>(null);
  const retrySequenceRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;

    return (): void => {
      mountedRef.current = false;
      requestRef.current?.abort();
    };
  }, []);

  const acceptPerson = useCallback(
    (next: PersonDetail): void => {
      if (!mountedRef.current || next.id !== personId) return;
      if (personRef.current && next.version < personRef.current.version) return;
      personRef.current = next;
      setPerson(next);
      setError(null);
    },
    [personId],
  );

  const load = useCallback(async (): Promise<PersonDetail> => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const timer = window.setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await getPerson(personId, controller.signal);
      if (
        !mountedRef.current ||
        controller.signal.aborted ||
        requestRef.current !== controller
      ) {
        throw new DOMException('Lecture interrompue', 'AbortError');
      }
      if (response.id !== personId)
        throw new Error('Réponse inattendue pour cette fiche.');
      acceptPerson(response);

      return personRef.current ?? response;
    } catch (caught) {
      if (
        mountedRef.current &&
        requestRef.current === controller &&
        caught instanceof ApiClientError &&
        [401, 403, 404, 410].includes(caught.status)
      ) {
        personRef.current = null;
        setPerson(null);
        setError(caught);
      }
      if (controller.signal.aborted)
        throw new Error('Le chargement a pris trop de temps. Réessayez.');
      throw caught;
    } finally {
      window.clearTimeout(timer);
      if (requestRef.current === controller) requestRef.current = null;
    }
  }, [acceptPerson, personId]);

  const retry = useCallback(async (): Promise<void> => {
    const sequence = ++retrySequenceRef.current;
    setIsLoading(true);
    try {
      await load();
    } catch (caught) {
      if (mountedRef.current && sequence === retrySequenceRef.current)
        setError(
          caught instanceof Error
            ? caught
            : new Error('Chargement impossible.'),
        );
    } finally {
      if (mountedRef.current && sequence === retrySequenceRef.current)
        setIsLoading(false);
    }
  }, [load]);

  useEffect(() => {
    if (initialPerson?.id === personId) acceptPerson(initialPerson);
  }, [acceptPerson, initialPerson, personId]);

  useEffect(() => {
    // A record already shown is never reloaded under an open form.
    if (personRef.current || !canView) return;
    void retry();
  }, [canView, retry]);

  const renderContent = (): React.ReactNode => {
    if (
      !canView ||
      (error instanceof ApiClientError && [401, 403].includes(error.status))
    ) {
      return (
        <AccessDeniedState
          action="consulter cette fiche"
          back={{ href: returnHref, label: 'Retour au répertoire' }}
        />
      );
    }

    if (isLoading) return <DetailSkeleton />;

    if (error instanceof ApiClientError && error.status === 410) {
      return (
        <PageState
          actionHref={returnHref}
          actionLabel="Retour au répertoire"
          description="Cette fiche est masquée pendant sa suppression définitive. Aucune autre action n’est possible."
          icon={<Clock3 className="size-5" />}
          title="Suppression en cours"
        />
      );
    }

    if (error instanceof ApiClientError && error.status === 404) {
      return (
        <PageState
          actionHref={returnHref}
          actionLabel="Retour au répertoire"
          description="Cette fiche n’existe pas ou a été supprimée."
          title="Fiche introuvable"
        />
      );
    }

    if (error || !person) {
      return (
        <PageState
          actionLabel="Réessayer"
          description={error?.message ?? 'La fiche ne peut pas être chargée.'}
          icon={<RefreshCw className="size-5" />}
          onAction={() => void retry()}
          title="Chargement impossible"
          tone="destructive"
        />
      );
    }

    const sectionHref = (section: PersonDetailSection): string => {
      const params = new URLSearchParams({ returnTo: returnHref, section });

      return `${personDetailPath(personId)}?${params}`;
    };

    return (
      <EntityDetailLayout
        activeSection={activeSection}
        condensedAside={<PersonStatusBadge status={person.structureStatus} />}
        dirtySections={identityDirty ? ['identite'] : []}
        ariaLiveLabel={`Section ${PERSON_DETAIL_SECTIONS.find((section) => section.id === activeSection)?.label ?? 'Identité'} affichée`}
        heroActions={<JournalHistoryLink person={person.id} />}
        heroDescription={<PersonRecordDates person={person} />}
        heroIcon={
          <PersonAvatar className="size-full rounded-md" person={person} />
        }
        heroMeta={<PersonStatusBadge status={person.structureStatus} />}
        heroTitle={getPersonDisplayName(person)}
        navigationAriaLabel="Navigation de la fiche du répertoire"
        sectionHref={sectionHref}
        sections={PERSON_DETAIL_SECTIONS.filter((section) =>
          allowed(section.id),
        ).map((section) =>
          section.id === 'parcours'
            ? { ...section, managedIn: journeySourcesOf(reach) }
            : // The tab says how many contacts there are (27 October 2026),
              // emergency contacts and representatives included (10 November).
              section.id === 'coordonnees'
              ? {
                  ...section,
                  count:
                    person.emails.length +
                    person.phones.length +
                    person.socialProfiles.length +
                    person.emergencyContacts.length +
                    person.legalGuardians.length,
                }
              : section,
        )}
      >
        {activeSection === 'identite' ? (
          <section aria-label="Identité" className="space-y-5">
            <PersonIdentitySection
              key={person.id}
              afterNames={
                <PersonOtherNicknamesCard
                  canUpdate={canUpdate}
                  onChange={acceptPerson}
                  onReload={load}
                  person={person}
                />
              }
              canUpdate={canUpdate}
              onChange={acceptPerson}
              onDirtyChange={setIdentityDirty}
              onReload={load}
              person={person}
            />
            {canDelete && (
              <PersonDangerZone
                onReload={load}
                person={person}
                returnHref={returnHref}
              />
            )}
          </section>
        ) : activeSection === 'parcours' ? (
          <section aria-label="Parcours">
            <PersonJourneySection
              key={person.id}
              personId={person.id}
              reach={reach}
            />
          </section>
        ) : (
          <section aria-label="Coordonnées" className="space-y-5">
            <PersonCollectionsSection
              canUpdate={canUpdateContact}
              onChange={acceptPerson}
              onReload={load}
              person={person}
            />
          </section>
        )}

        {/* Barre d'action de la fiche : au niveau de la page, hors des sections. */}
        <div className="contents" id="person-record-action-bar" />
      </EntityDetailLayout>
    );
  };

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: FEATURES.persons.audit.poleLabel },
        { href: returnHref, label: FEATURES.persons.label },
        {
          label:
            canView && person?.id === personId && !error
              ? getPersonDisplayName(person)
              : 'Fiche',
        },
      ]}
    >
      {renderContent()}
    </AuthenticatedLayout>
  );
};

export const PersonDetailPage: FC<PersonDetailPageProps> = (props) => {
  const { authorizationRevision, userData } = useUser();
  const capabilities = getPersonCapabilities(userData);
  const scope = [
    props.personId,
    userData?.id ?? '',
    authorizationRevision,
    capabilities.canView,
    capabilities.canUpdate,
    capabilities.canViewContact,
    capabilities.canUpdateContact,
    capabilities.canDelete,
  ].join(':');
  const initialScopeRef = useRef(scope);
  const initialSnapshotAllowedRef = useRef(true);
  if (scope !== initialScopeRef.current)
    initialSnapshotAllowedRef.current = false;

  return (
    <PersonDetailContent
      key={scope}
      {...props}
      initialPerson={
        props.initialPersonScope === userData?.id &&
        initialSnapshotAllowedRef.current &&
        capabilities.canView &&
        props.initialPerson?.id === props.personId
          ? props.initialPerson
          : undefined
      }
    />
  );
};
