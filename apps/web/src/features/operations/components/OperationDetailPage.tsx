'use client';

import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ReceiptText,
  RefreshCw,
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
import { AccessDeniedState, PageState } from '$components/layout/PageState';
import { RubricCard } from '$components/layout/RubricCard';
import { FEATURES } from '$constants/feature-registry.constants';
import {
  financialAccountDetailPath,
  personDetailPath,
} from '$constants/routes.constants';
import { useUser } from '$context/UserContext';
import { PageCanvas, PageShell } from '$ui/page-shell';
import { StatusBadge } from '$ui/status-badge';
import { ApiClientError } from '$utils/api.utils';
import { formatApproximateDate } from '$utils/approximate-date.utils';

import {
  deleteOperationRequest,
  fetchOperation,
  fetchOperationChoices,
} from '../operation.api';
import {
  OPERATION_ACTION_BAR_SLOT,
  OPERATION_KIND_LABELS,
} from '../operation.constants';
import { getOperationCapabilities } from '../operation.permissions';
import {
  assignmentLabel,
  counterpartyLabel,
  operationTitle,
} from '../operation.ui';
import type { OperationChoices, OperationItem } from '../types/operation.types';
import { OperationAmount } from './OperationAmount';

// The form loads with its own code: the fields bring the menus and search.
const OperationEditSection = dynamic(() =>
  import('./OperationEditSection').then(
    (module) => module.OperationEditSection,
  ),
);

const OPERATIONS_HREF = FEATURES.operations.href;

const day = (value: string): string =>
  formatApproximateDate({ date: value, precision: 'DAY' });

const KindIcon: FC<{ item: OperationItem }> = ({ item }) => (
  <span className="bg-surface-inset text-muted-foreground flex size-full items-center justify-center rounded-md">
    {item.kind === 'INCOME' ? (
      <ArrowDownLeft aria-hidden="true" className="text-success size-6" />
    ) : item.kind === 'EXPENSE' ? (
      <ArrowUpRight aria-hidden="true" className="size-6" />
    ) : (
      <ArrowLeftRight aria-hidden="true" className="size-6" />
    )}
  </span>
);

/** What a reader who cannot change it sees: the values, read only. */
const OperationSummary: FC<{ item: OperationItem }> = ({ item }) => {
  const payer = item.kind === 'INCOME' ? 'Payé par' : 'Payé à';
  const rows: [string, React.ReactNode][] = [
    ['Date', day(item.occurredOn)],
    ['Montant', <OperationAmount item={item} key="amount" />],
    [
      item.toAccount ? 'Compte de départ' : 'Compte',
      <Link
        className="hover:text-primary-emphasis hover:underline"
        href={financialAccountDetailPath(item.account.id)}
        key="account"
      >
        {item.account.name}
      </Link>,
    ],
    ...(item.toAccount
      ? ([['Compte d’arrivée', item.toAccount.name]] as [string, string][])
      : []),
    ...(item.label ? ([['Libellé', item.label]] as [string, string][]) : []),
    ...(item.category
      ? ([['Catégorie', item.category.name]] as [string, string][])
      : []),
    ...(item.paymentMethod
      ? ([['Moyen de paiement', item.paymentMethod.name]] as [string, string][])
      : []),
    ...(counterpartyLabel(item)
      ? ([
          [
            payer,
            item.person ? (
              <Link
                className="hover:text-primary-emphasis hover:underline"
                href={personDetailPath(item.person.id)}
                key="person"
              >
                {item.person.displayName}
              </Link>
            ) : (
              counterpartyLabel(item)
            ),
          ],
        ] as [string, React.ReactNode][])
      : []),
    ...(item.assignment
      ? ([['Équipe ou jeu', assignmentLabel(item.assignment)]] as [
          string,
          string,
        ][])
      : []),
    ...(item.note ? ([['Note', item.note]] as [string, string][]) : []),
  ];

  return (
    <RubricCard icon={<ReceiptText />} id="operation-summary" title="Opération">
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
        {rows.map(([label, value]) => (
          <React.Fragment key={label}>
            <dt className="text-muted-foreground text-sm">{label}</dt>
            <dd className="text-sm [overflow-wrap:anywhere]">{value}</dd>
          </React.Fragment>
        ))}
      </dl>
    </RubricCard>
  );
};

type ContentProps = { operationId: string };

const OperationDetailContent: FC<ContentProps> = ({ operationId }) => {
  const router = useRouter();
  const { userData } = useUser();
  const { canLinkPersons, canManage, canView } =
    getOperationCapabilities(userData);
  const [operation, setOperation] = useState<OperationItem | null>(null);
  const [choices, setChoices] = useState<OperationChoices | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return (): void => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (): Promise<OperationItem> => {
    const fresh = await fetchOperation(operationId);
    if (mountedRef.current) {
      setOperation(fresh);
      setError(null);
    }

    return fresh;
  }, [operationId]);

  const retry = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await Promise.all([
        load(),
        canManage
          ? fetchOperationChoices().then((loaded) => {
              if (mountedRef.current) setChoices(loaded);
            })
          : Promise.resolve(),
      ]);
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
  }, [canManage, load]);

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
          action="consulter cette opération"
          back={{ href: OPERATIONS_HREF, label: 'Retour aux opérations' }}
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
          actionHref={OPERATIONS_HREF}
          actionLabel="Retour aux opérations"
          description="Cette opération n’existe pas ou a été supprimée."
          title="Opération introuvable"
        />
      );
    if (error || !operation)
      return (
        <PageState
          actionLabel="Réessayer"
          description={
            error?.message ?? 'L’opération ne peut pas être chargée.'
          }
          icon={<RefreshCw className="size-5" />}
          onAction={() => void retry()}
          title="Chargement impossible"
          tone="destructive"
        />
      );

    return (
      <EntityDetailLayout
        condensedAside={
          <StatusBadge tone="muted">
            {OPERATION_KIND_LABELS[operation.kind]}
          </StatusBadge>
        }
        heroDescription={
          <>
            {day(operation.occurredOn)} ·{' '}
            {operation.toAccount
              ? `${operation.account.name} → ${operation.toAccount.name}`
              : operation.account.name}{' '}
            · <OperationAmount item={operation} />
          </>
        }
        heroIcon={<KindIcon item={operation} />}
        heroMeta={
          <StatusBadge tone="muted">
            {OPERATION_KIND_LABELS[operation.kind]}
          </StatusBadge>
        }
        heroTitle={operationTitle(operation)}
      >
        <section aria-label="Opération" className="space-y-5">
          {canManage && choices ? (
            <OperationEditSection
              key={operation.id}
              canLinkPersons={canLinkPersons}
              choices={choices}
              onChange={setOperation}
              onReload={load}
              operation={operation}
            />
          ) : (
            <OperationSummary item={operation} />
          )}
          {canManage && (
            <EntityDangerZone
              description="L’opération disparaît de la liste et des soldes ; le journal d’activité garde la trace de la suppression."
              dialogDescription="Cette action est irréversible. Une opération saisie par erreur, ou dans le mauvais sens, se supprime puis se saisit à nouveau."
              dialogNotice="L’opération sera supprimée immédiatement et définitivement."
              dialogTitle={`Supprimer définitivement l’opération ${operationTitle(operation)} ?`}
              onDelete={async (version) => {
                await deleteOperationRequest(operation.id, version);
              }}
              onDeleted={() => router.replace(OPERATIONS_HREF)}
              onDeletedLabel="Retour aux opérations"
              onReloadVersion={async () => (await load()).version}
              triggerLabel="Supprimer l’opération"
              version={operation.version}
            />
          )}
        </section>
        {/* Save bar of the record: at page level, outside the section. */}
        <div className="contents" id={OPERATION_ACTION_BAR_SLOT} />
      </EntityDetailLayout>
    );
  };

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: FEATURES.operations.audit.poleLabel },
        { href: OPERATIONS_HREF, label: FEATURES.operations.label },
        {
          label: operation && !error ? operationTitle(operation) : 'Opération',
        },
      ]}
    >
      {renderContent()}
    </AuthenticatedLayout>
  );
};

/**
 * Record of an operation (11 November 2026), opened from its line: its
 * values, edited in place by who enters operations; its supporting
 * documents and what it settles come later.
 */
export const OperationDetailPage: FC<ContentProps> = ({ operationId }) => {
  const { authorizationRevision, userData } = useUser();

  return (
    <OperationDetailContent
      key={`${operationId}:${userData?.id ?? ''}:${authorizationRevision}`}
      operationId={operationId}
    />
  );
};
