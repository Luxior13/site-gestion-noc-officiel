'use client';

import { Banknote, Landmark, Plus, Wallet } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { type FC, useCallback, useEffect, useState } from 'react';

import AuthenticatedLayout from '$components/AuthenticatedLayout';
import { ContentState } from '$components/layout/ContentState';
import { PageIdentityHero } from '$components/layout/PageIdentityHero';
import { AccessDeniedState } from '$components/layout/PageState';
import { FEATURES } from '$constants/feature-registry.constants';
import { financialAccountDetailPath } from '$constants/routes.constants';
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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '$ui/table';
import { formatApproximateDate } from '$utils/approximate-date.utils';
import { cn } from '$utils/css.utils';
import { formatEuros } from '$utils/money.utils';

import { fetchFinancialAccounts } from '../financial-account.api';
import {
  type FinancialAccountCapabilities,
  getFinancialAccountCapabilities,
} from '../financial-account.permissions';
import { accountKindLine } from '../financial-account.ui';
import type {
  FinancialAccountItem,
  FinancialAccountsOverview,
} from '../types/financial-account.types';
import { AccountState } from './AccountState';

// The window loads when it opens: its date field stays off the page.
const FinancialAccountDialog = dynamic(() =>
  import('./FinancialAccountDialog').then(
    (module) => module.FinancialAccountDialog,
  ),
);

/** One focus ring per line: the stretched name link lights its row. */
const LINE_FOCUS =
  'has-[a:focus-visible]:ring-ring relative has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-inset';

/** A name that opens its record, its link covering the whole line. */
const NAME_LINK =
  'text-foreground hover:text-primary-emphasis block min-w-0 outline-none after:absolute after:inset-0 hover:underline hover:underline-offset-[3px]';

const day = (value: string): string =>
  formatApproximateDate({ date: value, precision: 'DAY' });

const AccountAvatar: FC<{ account: FinancialAccountItem }> = ({ account }) => (
  <span
    aria-hidden="true"
    className="rounded-tile border-border-default bg-surface-inset text-muted-foreground flex size-9 shrink-0 items-center justify-center border"
  >
    {account.kind === 'CASH' ? (
      <Banknote className="size-4" />
    ) : account.kind === 'BANK' ? (
      <Landmark className="size-4" />
    ) : (
      <Wallet className="size-4" />
    )}
  </span>
);

const AccountName: FC<{ account: FinancialAccountItem }> = ({ account }) => (
  <Link className={NAME_LINK} href={financialAccountDetailPath(account.id)}>
    <span className="font-semibold [overflow-wrap:anywhere]">
      {account.name}
    </span>
  </Link>
);

const AccountsList: FC<{
  canAdd: boolean;
  onCreate: () => void;
  overview: FinancialAccountsOverview;
}> = ({ canAdd, onCreate, overview: { accounts, holders } }) => {
  // The holder is said only when there is more than one to tell apart.
  const showEntity = holders.length > 1;
  const columns = showEntity ? 5 : 4;
  const emptyState = (
    <ContentState
      action={
        canAdd ? (
          <Button onClick={onCreate} size="sm" type="button">
            <Plus className="size-4" />
            Ajouter un compte
          </Button>
        ) : undefined
      }
      className="min-h-0 border-0 bg-transparent p-0"
      description="Chaque compte bancaire, compte en ligne ou caisse, avec son solde au jour où le site commence à le suivre."
      icon={<Wallet aria-hidden="true" className="size-5" />}
      layout="panel"
      title="Aucun compte pour l’instant"
    />
  );

  return (
    <DataTableSection
      className="border-border-content bg-surface-content rounded-panel"
      headerClassName="bg-surface-content-header"
      toolbar={
        <div className={directoryStyles.listCaption}>
          <p aria-live="polite" role="status">
            {accounts.length === 0
              ? 'Aucun compte'
              : `${accounts.length} compte${accounts.length > 1 ? 's' : ''}`}
          </p>
        </div>
      }
    >
      <DataTableDesktop>
        <Table aria-label="Liste des comptes" className={directoryStyles.table}>
          <TableCaption className="sr-only">
            Les comptes de la structure, leur solde de départ, depuis quand et
            leur état
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Compte</TableHead>
              {showEntity && (
                <TableHead className="w-[200px]">Entité</TableHead>
              )}
              <TableHead className="w-[170px] text-right">
                Solde de départ
              </TableHead>
              <TableHead className="w-[170px]">Au</TableHead>
              <TableHead className="w-[120px]">État</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell className="h-44 text-center" colSpan={columns}>
                  {emptyState}
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => (
                <TableRow className={LINE_FOCUS} key={account.id}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <AccountAvatar account={account} />
                      <div className="min-w-0 flex-1">
                        <AccountName account={account} />
                        <p className="text-muted-foreground text-xs">
                          {accountKindLine(account)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  {showEntity && (
                    <TableCell className="pointer-events-none">
                      {account.entity.name}
                    </TableCell>
                  )}
                  <TableCell className="pointer-events-none text-right tabular-nums">
                    {formatEuros(account.openingBalanceCents)}
                  </TableCell>
                  <TableCell className="pointer-events-none tabular-nums">
                    {day(account.openingOn)}
                  </TableCell>
                  <TableCell className="pointer-events-none">
                    <AccountState account={account} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DataTableDesktop>
      <DataTableMobileList className={directoryStyles.mobileList}>
        {accounts.length === 0 ? (
          <div className="min-h-48 px-4 py-6">{emptyState}</div>
        ) : (
          accounts.map((account) => (
            <div
              className={cn(
                LINE_FOCUS,
                'px-4 py-3 hover:bg-[var(--surface-row-hover)]',
              )}
              key={account.id}
            >
              <div className="flex items-start gap-3">
                <AccountAvatar account={account} />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm">
                    <AccountName account={account} />
                  </h2>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {accountKindLine(account)}
                    {showEntity && ` · ${account.entity.name}`}
                  </p>
                  <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <AccountState account={account} />
                    <span className="tabular-nums">
                      {formatEuros(account.openingBalanceCents)} au{' '}
                      {day(account.openingOn)}
                    </span>
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
  <div aria-label="Chargement des comptes" role="status">
    <Skeleton className="rounded-panel h-48" />
  </div>
);

const FinancialAccountsContent: FC<{
  capabilities: FinancialAccountCapabilities;
}> = ({ capabilities: { canManage, canViewEntities } }) => {
  const router = useRouter();
  const [overview, setOverview] = useState<FinancialAccountsOverview | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async (signal?: AbortSignal): Promise<void> => {
    setLoadError(null);
    try {
      setOverview(await fetchFinancialAccounts(signal));
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

  // Every account belongs to an entity: without one, the page says where
  // to add the association first.
  const withoutHolder = overview !== null && overview.holders.length === 0;
  const canAdd = canManage && overview !== null && !withoutHolder;

  return (
    <div className={cn(directoryStyles.directory, 'space-y-[18px]')}>
      <PageIdentityHero
        actions={
          canAdd ? (
            <Button
              className={directoryStyles.addButton}
              onClick={() => setDialogOpen(true)}
            >
              <Plus aria-hidden="true" />
              Ajouter un compte
            </Button>
          ) : undefined
        }
        description="Les comptes bancaires, comptes en ligne et caisses de la structure, avec leur solde au jour où le site commence à les suivre."
        icon={<Wallet aria-hidden="true" />}
        title={FEATURES.financialAccounts.label}
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
          icon={<Wallet aria-hidden="true" className="size-5" />}
          kind="error"
          layout="panel"
          title="Chargement impossible"
        />
      ) : overview ? (
        withoutHolder && overview.accounts.length === 0 ? (
          <ContentState
            action={
              canViewEntities ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={FEATURES.entities.href}>Ouvrir les entités</Link>
                </Button>
              ) : undefined
            }
            description="Chaque compte appartient à une entité : ajoutez d’abord l’association dans Structure › Entités."
            icon={<Landmark aria-hidden="true" className="size-5" />}
            layout="panel"
            title="Aucune entité pour tenir un compte"
          />
        ) : (
          <AccountsList
            canAdd={canAdd}
            onCreate={() => setDialogOpen(true)}
            overview={overview}
          />
        )
      ) : (
        <ListSkeleton />
      )}
      {overview && dialogOpen && (
        <FinancialAccountDialog
          holders={overview.holders}
          onClose={() => setDialogOpen(false)}
          onCreated={(created) => {
            setDialogOpen(false);
            // A new account opens on its record.
            router.push(financialAccountDetailPath(created.id));
          }}
          open
        />
      )}
    </div>
  );
};

/**
 * Comptes, first page of the Finances pole (10 November 2026): each account
 * with its opening balance; the operations will move it.
 */
export const FinancialAccountsPage: FC = () => {
  const { authorizationRevision, userData } = useUser();
  const capabilities = getFinancialAccountCapabilities(userData);

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: FEATURES.financialAccounts.audit.poleLabel },
        { label: FEATURES.financialAccounts.label },
      ]}
    >
      {capabilities.canView ? (
        <PageShell className="py-0">
          <PageCanvas contentClassName="py-6">
            <FinancialAccountsContent
              capabilities={capabilities}
              key={`${userData?.id ?? ''}:${authorizationRevision}`}
            />
          </PageCanvas>
        </PageShell>
      ) : (
        <AccessDeniedState action="consulter les comptes" />
      )}
    </AuthenticatedLayout>
  );
};
