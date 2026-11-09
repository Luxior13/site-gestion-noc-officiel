'use client';

import { Archive, RefreshCw, UserCog, Users } from 'lucide-react';
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
import { useUser } from '$context/UserContext';
import { STRUCTURE_SCOPE } from '$features/member-functions/member-function.constants';
import type { PassagePlaceView } from '$features/passages/components/PassageLines';
import { STRUCTURE_PASSAGES } from '$features/passages/passage.constants';
import type { TeamPeopleCounts } from '$features/passages/passage.ui';
import { getPersonCapabilities } from '$features/persons/person.permissions';
import { PageCanvas, PageShell } from '$ui/page-shell';
import { ApiClientError } from '$utils/api.utils';

import { fetchStaffSummary } from '../staff.api';
import { getStaffCapabilities } from '../staff.permissions';
import type { StaffSummary } from '../types/staff.types';
import { StructureAvatar } from './StructureAvatar';

// Each tab loads with its own code: the functions bring the drag-and-drop.
const RosterSection = dynamic(() =>
  import('$features/passages/components/RosterSection').then(
    (module) => module.RosterSection,
  ),
);
const FormerMembersSection = dynamic(() =>
  import('$features/passages/components/FormerMembersSection').then(
    (module) => module.FormerMembersSection,
  ),
);
const MemberFunctionsSection = dynamic(() =>
  import('$features/member-functions/components/MemberFunctionsSection').then(
    (module) => module.MemberFunctionsSection,
  ),
);

const STAFF_HREF = FEATURES.staff.href;

export type StaffSection = 'anciens' | 'effectif' | 'fonctions';

/**
 * As a team's record (owner, 9 November 2026: « ok go »): who is there and
 * coming, then the former members, never mixed, then the functions the
 * Effectif chooses from. « Effectif », where « roster » would sound wrong
 * (8 November 2026).
 */
const STAFF_SECTIONS: readonly PageSection<StaffSection>[] = [
  { icon: <Users className="size-4" />, id: 'effectif', label: 'Effectif' },
  {
    icon: <Archive className="size-4" />,
    id: 'anciens',
    label: 'Anciens membres',
  },
  { icon: <UserCog className="size-4" />, id: 'fonctions', label: 'Fonctions' },
];

/** The first tab keeps the plain address. */
const sectionHref = (section: StaffSection): string =>
  section === 'effectif' ? STAFF_HREF : `${STAFF_HREF}?section=${section}`;

/** The structure's passages, its functions those of the structure. */
const STRUCTURE_PLACE: PassagePlaceView = {
  formerHref: sectionHref('anciens'),
  functionsHref: sectionHref('fonctions'),
  name: 'la structure',
  scope: STRUCTURE_PASSAGES,
};

type ContentProps = { activeSection: StaffSection };

const StaffContent: FC<ContentProps> = ({ activeSection }) => {
  const { userData } = useUser();
  const { canManage, canView } = getStaffCapabilities(userData);
  const persons = getPersonCapabilities(userData);
  const [summary, setSummary] = useState<StaffSummary | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return (): void => {
      mountedRef.current = false;
    };
  }, []);

  const retry = useCallback(async (): Promise<void> => {
    setError(null);
    setSummary(null);
    try {
      const fresh = await fetchStaffSummary();
      if (mountedRef.current) setSummary(fresh);
    } catch (caught) {
      if (mountedRef.current)
        setError(
          caught instanceof Error
            ? caught
            : new Error('Chargement impossible.'),
        );
    }
  }, []);

  useEffect(() => {
    if (canView) void retry();
  }, [canView, retry]);

  // The tabs keep their counts in step with what they show.
  const setPeopleCounts = useCallback((counts: TeamPeopleCounts): void => {
    setSummary((current) =>
      current &&
      (current.memberCount !== counts.memberCount ||
        current.formerCount !== counts.formerCount)
        ? { ...current, ...counts }
        : current,
    );
  }, []);
  const setFunctionCount = useCallback((functionCount: number): void => {
    setSummary((current) =>
      current && current.functionCount !== functionCount
        ? { ...current, functionCount }
        : current,
    );
  }, []);

  const renderContent = (): React.ReactNode => {
    if (
      !canView ||
      (error instanceof ApiClientError && [401, 403].includes(error.status))
    )
      return <AccessDeniedState action="consulter Bureau & staff" />;
    if (error)
      return (
        <PageState
          actionLabel="Réessayer"
          description={error.message}
          icon={<RefreshCw className="size-5" />}
          onAction={() => void retry()}
          title="Chargement impossible"
          tone="destructive"
        />
      );
    if (!summary)
      return (
        <PageShell className="py-0">
          <PageCanvas>
            <PageDetailSkeleton />
          </PageCanvas>
        </PageShell>
      );

    const counts = new Map<StaffSection, number>([
      ['anciens', summary.formerCount],
      ['effectif', summary.memberCount],
      ['fonctions', summary.functionCount],
    ]);
    const placeProps = {
      canCreatePerson: persons.canCreate,
      canManage,
      canViewPersons: persons.canView,
      onCountsChange: setPeopleCounts,
      place: STRUCTURE_PLACE,
    };

    return (
      <EntityDetailLayout
        activeSection={activeSection}
        ariaLiveLabel={`Section ${STAFF_SECTIONS.find((section) => section.id === activeSection)?.label ?? 'Effectif'} affichée`}
        heroDescription="Qui fait vivre la structure hors des équipes : le bureau élu, le staff et les bénévoles."
        heroIcon={<StructureAvatar className="rounded-md" />}
        heroTitle={FEATURES.staff.label}
        navigationAriaLabel="Navigation de Bureau & staff"
        sectionHref={sectionHref}
        sections={STAFF_SECTIONS.map((section) => ({
          ...section,
          count: counts.get(section.id),
        }))}
      >
        {activeSection === 'effectif' ? (
          <section aria-label="Effectif">
            <RosterSection {...placeProps} />
          </section>
        ) : activeSection === 'anciens' ? (
          <section aria-label="Anciens membres">
            <FormerMembersSection {...placeProps} />
          </section>
        ) : (
          <section aria-label="Fonctions">
            <MemberFunctionsSection
              canManage={canManage}
              onCountChange={setFunctionCount}
              scope={STRUCTURE_SCOPE}
              subject="de la structure, hors des équipes"
            />
          </section>
        )}
      </EntityDetailLayout>
    );
  };

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: FEATURES.staff.audit.poleLabel },
        { label: FEATURES.staff.label },
      ]}
    >
      {renderContent()}
    </AuthenticatedLayout>
  );
};

/**
 * Bureau & staff (9 November 2026), first page of the Structure pole: the
 * Effectif of the structure, its former members and its functions, as a
 * team's record keeps its Roster.
 */
export const StaffPage: FC<ContentProps> = ({ activeSection }) => {
  const { authorizationRevision, userData } = useUser();

  return (
    <StaffContent
      key={`${userData?.id ?? ''}:${authorizationRevision}`}
      activeSection={activeSection}
    />
  );
};
