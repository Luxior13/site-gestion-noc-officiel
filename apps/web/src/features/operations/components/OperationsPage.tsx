'use client';

import { ArrowLeftRight, Plus } from 'lucide-react';
import dynamic from 'next/dynamic';
import React, { type FC, useState } from 'react';
import { toast } from 'sonner';

import AuthenticatedLayout from '$components/AuthenticatedLayout';
import { PageIdentityHero } from '$components/layout/PageIdentityHero';
import { AccessDeniedState } from '$components/layout/PageState';
import { FEATURES } from '$constants/feature-registry.constants';
import { useUser } from '$context/UserContext';
import { Button } from '$ui/button';
import directoryStyles from '$ui/directory.module.css';
import { PageCanvas, PageShell } from '$ui/page-shell';
import { cn } from '$utils/css.utils';

import { getOperationCapabilities } from '../operation.permissions';
import { OperationsList } from './OperationsList';

// The window loads when it opens: it brings the menus and the date field.
const OperationDialog = dynamic(() =>
  import('./OperationDialog').then((module) => module.OperationDialog),
);

const OperationsContent: FC<{
  canLinkPersons: boolean;
  canManage: boolean;
}> = ({ canLinkPersons, canManage }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

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
              Ajouter une opération
            </Button>
          ) : undefined
        }
        description="L’argent reçu, versé ou passé d’un compte à l’autre, le plus récent en premier. Le solde du jour de chaque compte est dans Comptes."
        icon={<ArrowLeftRight aria-hidden="true" />}
        title={FEATURES.operations.label}
      />
      <OperationsList
        emptyDescription={
          canManage
            ? 'Ajoutez la première : une entrée, une sortie ou un virement entre deux comptes.'
            : undefined
        }
        reloadKey={reloadKey}
      />
      {dialogOpen && (
        <OperationDialog
          canLinkPersons={canLinkPersons}
          onClose={() => setDialogOpen(false)}
          onCreated={() => {
            setDialogOpen(false);
            setReloadKey((value) => value + 1);
            toast.success('Opération ajoutée');
          }}
        />
      )}
    </div>
  );
};

/**
 * Opérations, in the Finances pole (11 November 2026): every operation, the
 * latest first; money received and paid are filters, not tabs. Added in a
 * window that leaves the list in place for the next one.
 */
export const OperationsPage: FC = () => {
  const { authorizationRevision, userData } = useUser();
  const { canLinkPersons, canManage, canView } =
    getOperationCapabilities(userData);

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: FEATURES.operations.audit.poleLabel },
        { label: FEATURES.operations.label },
      ]}
    >
      {canView ? (
        <PageShell className="py-0">
          <PageCanvas contentClassName="py-6">
            <OperationsContent
              canLinkPersons={canLinkPersons}
              canManage={canManage}
              key={`${userData?.id ?? ''}:${authorizationRevision}`}
            />
          </PageCanvas>
        </PageShell>
      ) : (
        <AccessDeniedState action="consulter les opérations" />
      )}
    </AuthenticatedLayout>
  );
};
