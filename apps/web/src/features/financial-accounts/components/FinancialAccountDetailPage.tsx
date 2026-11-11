'use client';

import { RefreshCw } from 'lucide-react';
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
import { ApiClientError } from '$utils/api.utils';
import { formatApproximateDate } from '$utils/approximate-date.utils';

import {
  deleteFinancialAccountRequest,
  fetchFinancialAccount,
} from '../financial-account.api';
import { FINANCIAL_ACCOUNT_ACTION_BAR_SLOT } from '../financial-account.constants';
import { getFinancialAccountCapabilities } from '../financial-account.permissions';
import { accountKindLine } from '../financial-account.ui';
import type { FinancialAccountItem } from '../types/financial-account.types';
import { AccountKindIcon } from './AccountKindIcon';
import { AccountState } from './AccountState';
import { Balance } from './Balance';

// The form loads with its own code, as a game's tabs do (page budget).
const FinancialAccountInformationSection = dynamic(() =>
  import('./FinancialAccountInformationSection').then(
    (module) => module.FinancialAccountInformationSection,
  ),
);

const ACCOUNTS_HREF = FEATURES.financialAccounts.href;

/** « Compte bancaire · Crédit Agricole · 1 250,00 € au 1er janvier 2027 ». */
const AccountContext: FC<{ account: FinancialAccountItem }> = ({ account }) => (
  <>
    {accountKindLine(account)} · <Balance cents={account.openingBalanceCents} />{' '}
    au {formatApproximateDate({ date: account.openingOn, precision: 'DAY' })}
  </>
);

type ContentProps = { accountId: string };

const FinancialAccountDetailContent: FC<ContentProps> = ({ accountId }) => {
  const router = useRouter();
  const { userData } = useUser();
  const { canManage, canView } = getFinancialAccountCapabilities(userData);
  const [account, setAccount] = useState<FinancialAccountItem | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return (): void => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (): Promise<FinancialAccountItem> => {
    const fresh = await fetchFinancialAccount(accountId);
    if (mountedRef.current) {
      setAccount(fresh);
      setError(null);
    }

    return fresh;
  }, [accountId]);

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
          action="consulter ce compte"
          back={{ href: ACCOUNTS_HREF, label: 'Retour aux comptes' }}
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
          actionHref={ACCOUNTS_HREF}
          actionLabel="Retour aux comptes"
          description="Ce compte n’existe pas ou a été supprimé."
          title="Compte introuvable"
        />
      );
    if (error || !account)
      return (
        <PageState
          actionLabel="Réessayer"
          description={error?.message ?? 'Le compte ne peut pas être chargé.'}
          icon={<RefreshCw className="size-5" />}
          onAction={() => void retry()}
          title="Chargement impossible"
          tone="destructive"
        />
      );

    return (
      <EntityDetailLayout
        condensedAside={<AccountState account={account} />}
        heroDescription={<AccountContext account={account} />}
        heroIcon={
          <span className="bg-surface-inset text-muted-foreground flex size-full items-center justify-center rounded-md">
            <AccountKindIcon className="size-6" kind={account.kind} />
          </span>
        }
        heroMeta={<AccountState account={account} />}
        heroTitle={account.name}
      >
        <section aria-label="Informations" className="space-y-5">
          <FinancialAccountInformationSection
            key={account.id}
            account={account}
            canUpdate={canManage}
            onChange={setAccount}
            onReload={load}
          />
          {canManage && (
            <EntityDangerZone
              description="Le compte disparaît de la liste ; le journal d’activité garde la trace de la suppression."
              dialogDescription="Cette action est irréversible. Seul un compte ajouté par erreur se supprime ; un compte fermé se clôture à sa date."
              dialogNotice="Le compte sera supprimé immédiatement et définitivement."
              dialogTitle={`Supprimer définitivement le compte ${account.name} ?`}
              onDelete={async (version) => {
                await deleteFinancialAccountRequest(account.id, version);
              }}
              onDeleted={() => router.replace(ACCOUNTS_HREF)}
              onDeletedLabel="Retour aux comptes"
              onReloadVersion={async () => (await load()).version}
              triggerLabel="Supprimer le compte"
              version={account.version}
            />
          )}
        </section>
        {/* Save bar of the record: at page level, outside the section. */}
        <div className="contents" id={FINANCIAL_ACCOUNT_ACTION_BAR_SLOT} />
      </EntityDetailLayout>
    );
  };

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: FEATURES.financialAccounts.audit.poleLabel },
        { href: ACCOUNTS_HREF, label: FEATURES.financialAccounts.label },
        { label: account && !error ? account.name : 'Compte' },
      ]}
    >
      {renderContent()}
    </AuthenticatedLayout>
  );
};

/**
 * Record of an account (10 November 2026), opened from its line on the
 * Comptes page: its information only; its movements and statements come
 * with the operations.
 */
export const FinancialAccountDetailPage: FC<ContentProps> = ({ accountId }) => {
  const { authorizationRevision, userData } = useUser();

  return (
    <FinancialAccountDetailContent
      key={`${accountId}:${userData?.id ?? ''}:${authorizationRevision}`}
      accountId={accountId}
    />
  );
};
