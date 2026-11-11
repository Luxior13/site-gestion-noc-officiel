'use client';

import { Landmark, RefreshCw } from 'lucide-react';
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
import { AccessDeniedState, PageState } from '$components/layout/PageState';
import { FEATURES } from '$constants/feature-registry.constants';
import { useUser } from '$context/UserContext';
import { PageCanvas, PageShell } from '$ui/page-shell';
import { StatusBadge } from '$ui/status-badge';
import { ApiClientError } from '$utils/api.utils';
import { getLocalToday } from '$utils/approximate-date.utils';

import { deleteEntityRequest, fetchEntity } from '../entity.api';
import { ENTITY_ACTION_BAR_SLOT } from '../entity.constants';
import { getEntityCapabilities } from '../entity.permissions';
import {
  entityFormLabel,
  entityPeriodLabel,
  entityStateOf,
} from '../entity.ui';
import type { LegalEntityItem } from '../types/entity.types';

// The form loads with its own code, as a game's tabs do (page budget).
const EntityInformationSection = dynamic(() =>
  import('./EntityInformationSection').then(
    (module) => module.EntityInformationSection,
  ),
);

const ENTITIES_HREF = FEATURES.entities.href;

const EntityState: FC<{ entity: LegalEntityItem }> = ({ entity }) => {
  const state = entityStateOf(entity, getLocalToday());

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <StatusBadge tone={state.tone}>{state.label}</StatusBadge>
      {entity.isPrincipal && <StatusBadge tone="info">Principale</StatusBadge>}
    </span>
  );
};

/** Said instead of a deletion the server and the base refuse. */
const deletionRefusal = (entity: LegalEntityItem): string | undefined =>
  entity.accountCount > 0
    ? `Cette entité a ${entity.accountCount > 1 ? `${entity.accountCount} comptes` : 'un compte'} : indiquez sa date de fin plutôt que de la supprimer.`
    : undefined;

type ContentProps = { entityId: string };

const EntityDetailContent: FC<ContentProps> = ({ entityId }) => {
  const router = useRouter();
  const { userData } = useUser();
  const { canManage, canView } = getEntityCapabilities(userData);
  const [entity, setEntity] = useState<LegalEntityItem | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return (): void => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (): Promise<LegalEntityItem> => {
    const fresh = await fetchEntity(entityId);
    if (mountedRef.current) {
      setEntity(fresh);
      setError(null);
    }

    return fresh;
  }, [entityId]);

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
          action="consulter cette entité"
          back={{ href: ENTITIES_HREF, label: 'Retour aux entités' }}
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
          actionHref={ENTITIES_HREF}
          actionLabel="Retour aux entités"
          description="Cette entité n’existe pas ou a été supprimée."
          title="Entité introuvable"
        />
      );
    if (error || !entity)
      return (
        <PageState
          actionLabel="Réessayer"
          description={error?.message ?? 'L’entité ne peut pas être chargée.'}
          icon={<RefreshCw className="size-5" />}
          onAction={() => void retry()}
          title="Chargement impossible"
          tone="destructive"
        />
      );

    return (
      <EntityDetailLayout
        condensedAside={<EntityState entity={entity} />}
        heroDescription={`${entityFormLabel(entity)} · ${entityPeriodLabel(entity)}`}
        heroIcon={
          <span className="bg-surface-inset text-muted-foreground flex size-full items-center justify-center rounded-md">
            <Landmark aria-hidden="true" className="size-6" />
          </span>
        }
        heroMeta={<EntityState entity={entity} />}
        heroTitle={entity.name}
      >
        <section aria-label="Identité" className="space-y-5">
          <EntityInformationSection
            key={entity.id}
            canUpdate={canManage}
            entity={entity}
            onChange={setEntity}
            onReload={load}
          />
          {canManage && (
            <EntityDangerZone
              description="L’entité disparaît de la liste ; le journal d’activité garde la trace de la suppression."
              dialogDescription="Cette action est irréversible. Seule une entité saisie par erreur, sans compte, se supprime ; une entité dissoute garde sa fiche avec sa date de fin."
              dialogNotice="L’entité sera supprimée immédiatement et définitivement."
              dialogTitle={`Supprimer définitivement l’entité ${entity.name} ?`}
              onDelete={async (version) => {
                await deleteEntityRequest(entity.id, version);
              }}
              onDeleted={() => router.replace(ENTITIES_HREF)}
              onDeletedLabel="Retour aux entités"
              onReloadVersion={async () => (await load()).version}
              triggerLabel="Supprimer l’entité"
              unavailableReason={deletionRefusal(entity)}
              version={entity.version}
            />
          )}
        </section>
        {/* Save bar of the record: at page level, outside the section. */}
        <div className="contents" id={ENTITY_ACTION_BAR_SLOT} />
      </EntityDetailLayout>
    );
  };

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: FEATURES.entities.audit.poleLabel },
        { href: ENTITIES_HREF, label: FEATURES.entities.label },
        { label: entity && !error ? entity.name : 'Entité' },
      ]}
    >
      {renderContent()}
    </AuthenticatedLayout>
  );
};

/**
 * Record of an entity (10 November 2026), opened from its line on the
 * Entités page: its identity only for now; its leaders, insurances,
 * documents and finances come with their modules.
 */
export const EntityDetailPage: FC<ContentProps> = ({ entityId }) => {
  const { authorizationRevision, userData } = useUser();

  return (
    <EntityDetailContent
      key={`${entityId}:${userData?.id ?? ''}:${authorizationRevision}`}
      entityId={entityId}
    />
  );
};
