'use client';

import { Building2, Plus } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import AuthenticatedLayout from '$components/AuthenticatedLayout';
import { ContentState } from '$components/layout/ContentState';
import { PageIdentityHero } from '$components/layout/PageIdentityHero';
import { AccessDeniedState } from '$components/layout/PageState';
import { FEATURES } from '$constants/feature-registry.constants';
import { organizationDetailPath } from '$constants/routes.constants';
import { useUser } from '$context/UserContext';
import { Button } from '$ui/button';
import {
  DataTableDesktop,
  DataTableMobileList,
  DataTableSection,
} from '$ui/data-table-section';
import directoryStyles from '$ui/directory.module.css';
import { ListSearchField } from '$ui/list-search-field';
import { PageCanvas, PageShell } from '$ui/page-shell';
import { QuickFilter, QuickFilterGroup } from '$ui/quick-filter';
import { Skeleton } from '$ui/skeleton';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '$ui/table';
import { cn } from '$utils/css.utils';
import { getSearchTerms, includesSearchTerms } from '$utils/search-text.utils';

import { fetchOrganizations } from '../organization.api';
import {
  ORGANIZATION_KIND_FILTER_LABELS,
  ORGANIZATION_KINDS,
  ORGANIZATION_NAME_MAX_LENGTH,
  type OrganizationKind,
} from '../organization.constants';
import { getOrganizationCapabilities } from '../organization.permissions';
import { websiteLabel } from '../organization.ui';
import type { OrganizationItem } from '../types/organization.types';
import { OrganizationAvatar, OrganizationKinds } from './OrganizationParts';

// The window loads when it opens.
const OrganizationDialog = dynamic(() =>
  import('./OrganizationDialog').then((module) => module.OrganizationDialog),
);

const ORGANIZATION_NOUN = ['organisation', 'organisations'] as const;

type KindFilter = 'all' | OrganizationKind;
const KIND_FILTERS: readonly KindFilter[] = ['all', ...ORGANIZATION_KINDS];
const filterLabel = (filter: KindFilter): string =>
  // Filters come from the closed list.
  // eslint-disable-next-line security/detect-object-injection
  filter === 'all' ? 'Toutes' : ORGANIZATION_KIND_FILTER_LABELS[filter];
const matchesKind = (
  organization: OrganizationItem,
  filter: KindFilter,
): boolean => filter === 'all' || organization.kinds.includes(filter);

/** One focus ring per line: the stretched name link lights its row. */
const LINE_FOCUS =
  'has-[a:focus-visible]:ring-ring relative has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-inset';

/** A name that opens its record, its link covering the whole line. */
const NAME_LINK =
  'text-foreground hover:text-primary-emphasis block min-w-0 outline-none after:absolute after:inset-0 hover:underline hover:underline-offset-[3px]';

const contactsLabel = (count: number): string =>
  count === 0 ? 'Aucun' : String(count);

/** Name, then the site under it when there is one. */
const OrganizationName: FC<{ organization: OrganizationItem }> = ({
  organization,
}) => (
  <div className="min-w-0">
    <Link className={NAME_LINK} href={organizationDetailPath(organization.id)}>
      <span className="font-semibold [overflow-wrap:anywhere]">
        {organization.name}
      </span>
    </Link>
    {organization.website && (
      <p className="text-muted-foreground mt-0.5 text-xs [overflow-wrap:anywhere]">
        {websiteLabel(organization.website)}
      </p>
    )}
  </div>
);

const OrganizationsList: FC<{
  canManage: boolean;
  onCreate: () => void;
  organizations: readonly OrganizationItem[];
}> = ({ canManage, onCreate, organizations }) => {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<KindFilter>('all');
  const terms = useMemo(() => getSearchTerms(query), [query]);
  const searched = useMemo(
    () =>
      organizations.filter((organization) =>
        includesSearchTerms(
          [
            organization.name,
            organization.website ? websiteLabel(organization.website) : '',
            organization.siretNumber ?? '',
          ].join(' '),
          terms,
        ),
      ),
    [organizations, terms],
  );
  const visible = searched.filter((organization) =>
    matchesKind(organization, kind),
  );
  const isFiltered = Boolean(query.trim()) || kind !== 'all';
  const reset = (): void => {
    setQuery('');
    setKind('all');
  };

  const emptyState = (
    <ContentState
      action={
        isFiltered ? (
          <Button onClick={reset} size="sm" type="button" variant="link">
            Réinitialiser
          </Button>
        ) : canManage ? (
          <Button onClick={onCreate} size="sm" type="button">
            <Plus className="size-4" />
            Ajouter une organisation
          </Button>
        ) : undefined
      }
      className="min-h-0 border-0 bg-transparent p-0"
      description={
        isFiltered
          ? undefined
          : 'Sponsors, partenaires, fournisseurs, clients, organisateurs de tournois et financeurs publics, tous ici.'
      }
      icon={<Building2 aria-hidden="true" className="size-5" />}
      layout="panel"
      title={
        isFiltered
          ? 'Aucune organisation trouvée'
          : 'Aucune organisation pour l’instant'
      }
    />
  );

  const toolbar = (
    <div className="w-full">
      <form
        aria-label="Rechercher et filtrer les organisations"
        autoComplete="off"
        className={directoryStyles.filterForm}
        onSubmit={(event) => event.preventDefault()}
        role="search"
      >
        <ListSearchField
          ariaLabel="Rechercher une organisation"
          maxLength={ORGANIZATION_NAME_MAX_LENGTH}
          onClear={() => setQuery('')}
          onValueChange={setQuery}
          placeholder="Nom, site ou SIRET…"
          value={query}
        />
      </form>
      <div className={directoryStyles.filterBar}>
        <div className={directoryStyles.quickFilterSets}>
          <QuickFilterGroup caption="Type" label="Filtrer par type">
            {KIND_FILTERS.map((filter) => (
              <QuickFilter
                count={
                  searched.filter((organization) =>
                    matchesKind(organization, filter),
                  ).length
                }
                key={filter}
                label={filterLabel(filter)}
                noun={ORGANIZATION_NOUN}
                onClick={() => setKind(filter)}
                pressed={filter === kind}
              />
            ))}
          </QuickFilterGroup>
        </div>
        <div className={directoryStyles.listCaption}>
          <p aria-live="polite" role="status">
            {`${visible.length} ${visible.length > 1 ? 'organisations' : 'organisation'}${isFiltered ? ` trouvée${visible.length > 1 ? 's' : ''}` : ''}`}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <DataTableSection
      className="border-border-content bg-surface-content rounded-panel"
      headerClassName="bg-surface-content-header"
      toolbar={toolbar}
    >
      <DataTableDesktop>
        <Table
          aria-label="Liste des organisations"
          className={directoryStyles.table}
        >
          <TableCaption className="sr-only">
            Les organisations avec lesquelles la structure travaille, leurs
            types et leur nombre de contacts
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Organisation</TableHead>
              <TableHead className="w-[42%]">Types</TableHead>
              <TableHead className="w-[120px]">Contacts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell className="h-44 text-center" colSpan={3}>
                  {emptyState}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((organization) => (
                <TableRow className={LINE_FOCUS} key={organization.id}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <OrganizationAvatar />
                      <OrganizationName organization={organization} />
                    </div>
                  </TableCell>
                  <TableCell className="pointer-events-none">
                    <OrganizationKinds kinds={organization.kinds} />
                  </TableCell>
                  <TableCell className="pointer-events-none tabular-nums">
                    {contactsLabel(organization.contactCount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DataTableDesktop>
      <DataTableMobileList className={directoryStyles.mobileList}>
        {visible.length === 0 ? (
          <div className="min-h-48 px-4 py-6">{emptyState}</div>
        ) : (
          visible.map((organization) => (
            <div
              className={cn(
                LINE_FOCUS,
                'px-4 py-3 hover:bg-[var(--surface-row-hover)]',
              )}
              key={organization.id}
            >
              <div className="flex items-start gap-3">
                <OrganizationAvatar />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm">
                    <OrganizationName organization={organization} />
                  </h2>
                  <div className="mt-2">
                    <OrganizationKinds kinds={organization.kinds} />
                  </div>
                  <p className="text-muted-foreground mt-1.5 text-xs">
                    {organization.contactCount === 0
                      ? 'Aucun contact'
                      : organization.contactCount > 1
                        ? `${organization.contactCount} contacts`
                        : '1 contact'}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </DataTableMobileList>
    </DataTableSection>
  );
};

const ListSkeleton: FC = () => (
  <div aria-label="Chargement des organisations" role="status">
    <Skeleton className="rounded-panel h-48" />
  </div>
);

const OrganizationsContent: FC<{ canManage: boolean }> = ({ canManage }) => {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<OrganizationItem[] | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async (signal?: AbortSignal): Promise<void> => {
    setLoadError(null);
    try {
      setOrganizations(await fetchOrganizations(signal));
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

  return (
    <div className={cn(directoryStyles.directory, 'space-y-[18px]')}>
      <PageIdentityHero
        actions={
          canManage ? (
            <Button
              className={directoryStyles.addButton}
              onClick={() => setDialogOpen(true)}
            >
              <Plus aria-hidden="true" />
              Ajouter une organisation
            </Button>
          ) : undefined
        }
        description="Les organisations avec lesquelles la structure travaille, dans une seule liste : une organisation peut être à la fois sponsor et fournisseur."
        icon={<Building2 aria-hidden="true" />}
        title={FEATURES.organizations.label}
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
          icon={<Building2 aria-hidden="true" className="size-5" />}
          kind="error"
          layout="panel"
          title="Chargement impossible"
        />
      ) : organizations ? (
        <OrganizationsList
          canManage={canManage}
          onCreate={() => setDialogOpen(true)}
          organizations={organizations}
        />
      ) : (
        <ListSkeleton />
      )}
      {dialogOpen && (
        <OrganizationDialog
          onClose={() => setDialogOpen(false)}
          onCreated={(created) => {
            setDialogOpen(false);
            // A new organisation opens on its record, where it is completed.
            router.push(organizationDetailPath(created.id));
          }}
        />
      )}
    </div>
  );
};

/**
 * Organisations, first page of the Relations pole (11 November 2026):
 * every organisation in one list, filtered by kind (owner: « une seule
 * liste avec un filtre par type »).
 */
export const OrganizationsPage: FC = () => {
  const { authorizationRevision, userData } = useUser();
  const { canManage, canView } = getOrganizationCapabilities(userData);

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: FEATURES.organizations.audit.poleLabel },
        { label: FEATURES.organizations.label },
      ]}
    >
      {canView ? (
        <PageShell className="py-0">
          <PageCanvas contentClassName="py-6">
            <OrganizationsContent
              canManage={canManage}
              key={`${userData?.id ?? ''}:${authorizationRevision}`}
            />
          </PageCanvas>
        </PageShell>
      ) : (
        <AccessDeniedState action="consulter les organisations" />
      )}
    </AuthenticatedLayout>
  );
};
