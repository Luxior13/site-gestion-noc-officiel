'use client';

import { Landmark, Plus } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { type FC, useCallback, useEffect, useState } from 'react';

import AuthenticatedLayout from '$components/AuthenticatedLayout';
import { ContentState } from '$components/layout/ContentState';
import { PageIdentityHero } from '$components/layout/PageIdentityHero';
import { AccessDeniedState } from '$components/layout/PageState';
import { FEATURES } from '$constants/feature-registry.constants';
import { entityDetailPath } from '$constants/routes.constants';
import { useUser } from '$context/UserContext';
import { Button } from '$ui/button';
import {
  DataTableDesktop,
  DataTableMobileList,
  DataTableSection,
} from '$ui/data-table-section';
import directoryStyles from '$ui/directory.module.css';
import { PageCanvas, PageShell } from '$ui/page-shell';
import { Skeleton } from '$ui/skeleton';
import { StatusBadge } from '$ui/status-badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '$ui/table';
import { getLocalToday } from '$utils/approximate-date.utils';
import { cn } from '$utils/css.utils';

import { fetchEntities } from '../entity.api';
import { getEntityCapabilities } from '../entity.permissions';
import {
  entityFormLabel,
  entityPeriodLabel,
  entityStateOf,
} from '../entity.ui';
import type { LegalEntityItem } from '../types/entity.types';

// The window loads when it opens: its date field stays off the page.
const EntityDialog = dynamic(() =>
  import('./EntityDialog').then((module) => module.EntityDialog),
);

/** One focus ring per line: the stretched name link lights its row. */
const LINE_FOCUS =
  'has-[a:focus-visible]:ring-ring relative has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-inset';

/** A name that opens its record, its link covering the whole line. */
const NAME_LINK =
  'text-foreground hover:text-primary-emphasis block min-w-0 outline-none after:absolute after:inset-0 hover:underline hover:underline-offset-[3px]';

const EntityAvatar: FC = () => (
  <span
    aria-hidden="true"
    className="rounded-tile border-border-default bg-surface-inset text-muted-foreground flex size-9 shrink-0 items-center justify-center border"
  >
    <Landmark className="size-4" />
  </span>
);

const EntityBadges: FC<{ entity: LegalEntityItem; today: string }> = ({
  entity,
  today,
}) => {
  const state = entityStateOf(entity, today);

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <StatusBadge tone={state.tone}>{state.label}</StatusBadge>
      {entity.isPrincipal && <StatusBadge tone="info">Principale</StatusBadge>}
    </span>
  );
};

const EntityName: FC<{ entity: LegalEntityItem }> = ({ entity }) => (
  <Link className={NAME_LINK} href={entityDetailPath(entity.id)}>
    <span className="font-semibold [overflow-wrap:anywhere]">
      {entity.name}
    </span>
  </Link>
);

const EntitiesList: FC<{
  canManage: boolean;
  entities: readonly LegalEntityItem[];
  onCreate: () => void;
}> = ({ canManage, entities, onCreate }) => {
  const today = getLocalToday();
  const emptyState = (
    <ContentState
      action={
        canManage ? (
          <Button onClick={onCreate} size="sm" type="button">
            <Plus className="size-4" />
            Ajouter une entité
          </Button>
        ) : undefined
      }
      className="min-h-0 border-0 bg-transparent p-0"
      description="Commencez par l’association ; la période d’avant se saisit avec la forme « Sans forme juridique »."
      icon={<Landmark aria-hidden="true" className="size-5" />}
      layout="panel"
      title="Aucune entité pour l’instant"
    />
  );

  return (
    <DataTableSection
      className="border-border-content bg-surface-content rounded-panel"
      headerClassName="bg-surface-content-header"
      toolbar={
        <div className={directoryStyles.listCaption}>
          <p aria-live="polite" role="status">
            {entities.length > 1
              ? `${entities.length} entités, de la plus ancienne à la plus récente`
              : entities.length === 1
                ? '1 entité'
                : 'Aucune entité'}
          </p>
        </div>
      }
    >
      <DataTableDesktop>
        <Table aria-label="Liste des entités" className={directoryStyles.table}>
          <TableCaption className="sr-only">
            Les entités de la structure dans le temps, leur forme, leur période
            et leur état
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Entité</TableHead>
              <TableHead className="w-[220px]">Forme</TableHead>
              <TableHead className="w-[240px]">Période</TableHead>
              <TableHead className="w-[190px]">État</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entities.length === 0 ? (
              <TableRow>
                <TableCell className="h-44 text-center" colSpan={4}>
                  {emptyState}
                </TableCell>
              </TableRow>
            ) : (
              entities.map((entity) => (
                <TableRow className={LINE_FOCUS} key={entity.id}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <EntityAvatar />
                      <EntityName entity={entity} />
                    </div>
                  </TableCell>
                  <TableCell className="pointer-events-none">
                    {entityFormLabel(entity)}
                  </TableCell>
                  <TableCell className="pointer-events-none tabular-nums">
                    {entityPeriodLabel(entity)}
                  </TableCell>
                  <TableCell className="pointer-events-none">
                    <EntityBadges entity={entity} today={today} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DataTableDesktop>
      <DataTableMobileList className={directoryStyles.mobileList}>
        {entities.length === 0 ? (
          <div className="min-h-48 px-4 py-6">{emptyState}</div>
        ) : (
          entities.map((entity) => (
            <div
              className={cn(
                LINE_FOCUS,
                'px-4 py-3 hover:bg-[var(--surface-row-hover)]',
              )}
              key={entity.id}
            >
              <div className="flex items-start gap-3">
                <EntityAvatar />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm">
                    <EntityName entity={entity} />
                  </h2>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {entityFormLabel(entity)} · {entityPeriodLabel(entity)}
                  </p>
                  <div className="mt-2">
                    <EntityBadges entity={entity} today={today} />
                  </div>
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
  <div aria-label="Chargement des entités" role="status">
    <Skeleton className="rounded-panel h-48" />
  </div>
);

const EntitiesContent: FC<{ canManage: boolean }> = ({ canManage }) => {
  const router = useRouter();
  const [entities, setEntities] = useState<LegalEntityItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async (signal?: AbortSignal): Promise<void> => {
    setLoadError(null);
    try {
      setEntities(await fetchEntities(signal));
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
              Ajouter une entité
            </Button>
          ) : undefined
        }
        description="Les formes juridiques de la structure dans le temps : la période d’avant, l’association, demain peut-être une société. Chaque compte appartient à l’une d’elles."
        icon={<Landmark aria-hidden="true" />}
        title={FEATURES.entities.label}
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
          icon={<Landmark aria-hidden="true" className="size-5" />}
          kind="error"
          layout="panel"
          title="Chargement impossible"
        />
      ) : entities ? (
        <EntitiesList
          canManage={canManage}
          entities={entities}
          onCreate={() => setDialogOpen(true)}
        />
      ) : (
        <ListSkeleton />
      )}
      {dialogOpen && (
        <EntityDialog
          onClose={() => setDialogOpen(false)}
          onCreated={(created) => {
            setDialogOpen(false);
            // A new entity opens on its record, where it is completed.
            router.push(entityDetailPath(created.id));
          }}
          open
        />
      )}
    </div>
  );
};

/**
 * Entités, in the Structure pole (10 November 2026): the legal forms of the
 * structure in the order of time, the principal one marked.
 */
export const EntitiesPage: FC = () => {
  const { authorizationRevision, userData } = useUser();
  const { canManage, canView } = getEntityCapabilities(userData);

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: FEATURES.entities.audit.poleLabel },
        { label: FEATURES.entities.label },
      ]}
    >
      {canView ? (
        <PageShell className="py-0">
          <PageCanvas contentClassName="py-6">
            <EntitiesContent
              canManage={canManage}
              key={`${userData?.id ?? ''}:${authorizationRevision}`}
            />
          </PageCanvas>
        </PageShell>
      ) : (
        <AccessDeniedState action="consulter les entités" />
      )}
    </AuthenticatedLayout>
  );
};
