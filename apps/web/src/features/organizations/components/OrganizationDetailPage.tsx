'use client';

import {
  ArrowUpRight,
  Building2,
  ReceiptText,
  RefreshCw,
  Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
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
import { organizationDetailPath } from '$constants/routes.constants';
import { useUser } from '$context/UserContext';
import { getOperationCapabilities } from '$features/operations/operation.permissions';
import { Button } from '$ui/button';
import { PageCanvas, PageShell } from '$ui/page-shell';
import { ApiClientError } from '$utils/api.utils';

import {
  deleteOrganizationRequest,
  fetchOrganization,
} from '../organization.api';
import { ORGANIZATION_ACTION_BAR_SLOT } from '../organization.constants';
import { getOrganizationCapabilities } from '../organization.permissions';
import { websiteLabel } from '../organization.ui';
import type { OrganizationDetail } from '../types/organization.types';
import { OrganizationAvatar, OrganizationKinds } from './OrganizationParts';

// Each tab loads with its own code: the contacts bring the record search.
const OrganizationIdentitySection = dynamic(() =>
  import('./OrganizationIdentitySection').then(
    (module) => module.OrganizationIdentitySection,
  ),
);
const OperationsList = dynamic(() =>
  import('$features/operations/components/OperationsList').then(
    (module) => module.OperationsList,
  ),
);
const OrganizationContactsSection = dynamic(() =>
  import('./OrganizationContactsSection').then(
    (module) => module.OrganizationContactsSection,
  ),
);

const ORGANIZATIONS_HREF = FEATURES.organizations.href;

type OrganizationDetailSection = 'contacts' | 'identite' | 'reglements';

/**
 * What the organisation is, whom to reach there, then the money it paid or
 * was paid, read here and kept in Finances (11 November 2026).
 */
const SECTIONS: readonly PageSection<OrganizationDetailSection>[] = [
  { icon: <Building2 className="size-4" />, id: 'identite', label: 'Identité' },
  { icon: <Users className="size-4" />, id: 'contacts', label: 'Contacts' },
  {
    icon: <ReceiptText className="size-4" />,
    id: 'reglements',
    label: 'Règlements',
    managedIn: 'Finances',
  },
];

/** The first tab keeps the plain address. */
const sectionHrefOf =
  (id: string) =>
  (section: OrganizationDetailSection): string =>
    section === 'identite'
      ? organizationDetailPath(id)
      : `${organizationDetailPath(id)}?section=${section}`;

/** « ldlc.com · 2 contacts ». */
const organizationContext = (organization: OrganizationDetail): string => {
  const count = organization.contacts.length;
  const contacts =
    count === 0
      ? 'aucun contact'
      : count > 1
        ? `${count} contacts`
        : '1 contact';

  return organization.website
    ? `${websiteLabel(organization.website)} · ${contacts}`
    : contacts.charAt(0).toUpperCase() + contacts.slice(1);
};

/** Said in the deletion window: the contacts leave with it. */
const contactsNotice = (count: number): string =>
  count === 0
    ? ''
    : count === 1
      ? ' Son contact est supprimé avec elle.'
      : ` Ses ${count} contacts sont supprimés avec elle.`;

type ContentProps = {
  activeSection: OrganizationDetailSection;
  organizationId: string;
};

const OrganizationDetailContent: FC<ContentProps> = ({
  activeSection,
  organizationId,
}) => {
  const router = useRouter();
  const { userData } = useUser();
  const { canLinkPersons, canManage, canView } =
    getOrganizationCapabilities(userData);
  const canViewOperations = getOperationCapabilities(userData).canView;
  // Without the operations, their tab is not offered.
  const section: OrganizationDetailSection =
    activeSection === 'reglements' && !canViewOperations
      ? 'identite'
      : activeSection;
  const [organization, setOrganization] = useState<OrganizationDetail | null>(
    null,
  );
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [identityDirty, setIdentityDirty] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return (): void => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (): Promise<OrganizationDetail> => {
    const fresh = await fetchOrganization(organizationId);
    if (mountedRef.current) {
      setOrganization(fresh);
      setError(null);
    }

    return fresh;
  }, [organizationId]);

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
          action="consulter cette organisation"
          back={{ href: ORGANIZATIONS_HREF, label: 'Retour aux organisations' }}
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
          actionHref={ORGANIZATIONS_HREF}
          actionLabel="Retour aux organisations"
          description="Cette organisation n’existe pas ou a été supprimée."
          title="Organisation introuvable"
        />
      );
    if (error || !organization)
      return (
        <PageState
          actionLabel="Réessayer"
          description={
            error?.message ?? 'L’organisation ne peut pas être chargée.'
          }
          icon={<RefreshCw className="size-5" />}
          onAction={() => void retry()}
          title="Chargement impossible"
          tone="destructive"
        />
      );

    return (
      <EntityDetailLayout
        activeSection={section}
        ariaLiveLabel={`Section ${section === 'contacts' ? 'Contacts' : section === 'reglements' ? 'Règlements' : 'Identité'} affichée`}
        condensedAside={<OrganizationKinds kinds={organization.kinds} />}
        dirtySections={identityDirty ? ['identite'] : []}
        heroDescription={organizationContext(organization)}
        heroIcon={<OrganizationAvatar className="size-full rounded-md" />}
        heroMeta={<OrganizationKinds kinds={organization.kinds} />}
        heroTitle={organization.name}
        navigationAriaLabel="Navigation de la fiche organisation"
        sectionHref={sectionHrefOf(organization.id)}
        sections={SECTIONS.filter(
          (entry) => entry.id !== 'reglements' || canViewOperations,
        ).map((entry) =>
          entry.id === 'contacts'
            ? { ...entry, count: organization.contacts.length }
            : entry.id === 'reglements'
              ? { ...entry, count: organization.operationCount }
              : entry,
        )}
      >
        {section === 'reglements' ? (
          <section aria-label="Règlements" className="space-y-3">
            <h2 className="sr-only">Règlements</h2>
            <OperationsList
              action={
                <Button asChild size="sm" variant="outline">
                  <Link href={FEATURES.operations.href}>
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                    Ouvrir les opérations
                  </Link>
                </Button>
              }
              emptyDescription="Les entrées et sorties d’argent qui la nomment, payée par elle ou versée à elle, s’affichent ici."
              notice="Les règlements se saisissent dans Finances › Opérations : chaque ligne ouvre son opération."
              organizationId={organization.id}
            />
          </section>
        ) : section === 'contacts' ? (
          <section aria-label="Contacts" className="space-y-3">
            <OrganizationContactsSection
              canLinkPersons={canLinkPersons}
              canManage={canManage}
              onChange={setOrganization}
              onReload={load}
              organization={organization}
            />
          </section>
        ) : (
          <section aria-label="Identité" className="space-y-5">
            <OrganizationIdentitySection
              key={organization.id}
              canUpdate={canManage}
              onChange={setOrganization}
              onDirtyChange={setIdentityDirty}
              onReload={load}
              organization={organization}
            />
            {canManage && (
              <EntityDangerZone
                description="L’organisation disparaît de la liste ; le journal d’activité garde la trace de la suppression."
                dialogDescription={`Cette action est irréversible. Seule une organisation ajoutée par erreur, ou en double, se supprime.${contactsNotice(organization.contacts.length)}`}
                dialogNotice="L’organisation sera supprimée immédiatement et définitivement."
                dialogTitle={`Supprimer définitivement l’organisation ${organization.name} ?`}
                onDelete={async (version) => {
                  await deleteOrganizationRequest(organization.id, version);
                }}
                onDeleted={() => router.replace(ORGANIZATIONS_HREF)}
                onDeletedLabel="Retour aux organisations"
                onReloadVersion={async () => (await load()).version}
                triggerLabel="Supprimer l’organisation"
                // Said instead of a deletion the server and the base refuse.
                unavailableReason={
                  organization.operationCount > 0
                    ? `Cette organisation a ${organization.operationCount > 1 ? `${organization.operationCount} opérations` : 'une opération'} : elle reste, pour l’historique de la trésorerie.`
                    : undefined
                }
                version={organization.version}
              />
            )}
          </section>
        )}
        {/* Save bar of the record: at page level, outside the section. */}
        <div className="contents" id={ORGANIZATION_ACTION_BAR_SLOT} />
      </EntityDetailLayout>
    );
  };

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: FEATURES.organizations.audit.poleLabel },
        { href: ORGANIZATIONS_HREF, label: FEATURES.organizations.label },
        {
          label: organization && !error ? organization.name : 'Organisation',
        },
      ]}
    >
      {renderContent()}
    </AuthenticatedLayout>
  );
};

/**
 * Record of an organisation (11 November 2026), opened from its line on the
 * Organisations page: its identity, then its contacts; the money paid or
 * received comes with the operations, read here.
 */
export const OrganizationDetailPage: FC<ContentProps> = ({
  activeSection,
  organizationId,
}) => {
  const { authorizationRevision, userData } = useUser();

  return (
    <OrganizationDetailContent
      key={`${organizationId}:${userData?.id ?? ''}:${authorizationRevision}`}
      activeSection={activeSection}
      organizationId={organizationId}
    />
  );
};
