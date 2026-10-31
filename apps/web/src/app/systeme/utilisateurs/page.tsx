'use client';

import React, { type FC, Suspense } from 'react';

import AuthenticatedLayout from '$components/AuthenticatedLayout';
import { AccessDeniedState } from '$components/layout/PageState';
import { FEATURES } from '$constants/feature-registry.constants';
import { hasPermission, PERMISSIONS } from '$constants/permissions.constants';
import { useUser } from '$context/UserContext';
import { UsersDirectorySkeleton } from '$features/users/components/UsersDirectorySkeleton';
import { UsersListPage } from '$features/users/components/UsersListPage';
import { getUsersListVisibilityKey } from '$features/users/users-list.utils';
import directoryStyles from '$ui/directory.module.css';
import { PageCanvas, PageShell } from '$ui/page-shell';
import { cn } from '$utils/css.utils';

const UsersListFallback: FC = () => <UsersDirectorySkeleton />;

const UsersAdministrationContent: FC = () => {
  const { userData } = useUser();
  const canViewUsers = userData
    ? userData.isProtected ||
      hasPermission(userData.role, PERMISSIONS.USERS.VIEW, userData.permissions)
    : false;

  if (!userData || !canViewUsers) {
    return <AccessDeniedState action="consulter les utilisateurs" />;
  }

  return (
    <PageShell className="py-0">
      <PageCanvas contentClassName="py-6">
        <div className={cn(directoryStyles.directory, 'space-y-[18px]')}>
          <Suspense fallback={<UsersListFallback />}>
            <UsersListPage key={getUsersListVisibilityKey(userData)} />
          </Suspense>
        </div>
      </PageCanvas>
    </PageShell>
  );
};

const UsersAdministrationPage: FC = () => {
  return (
    <AuthenticatedLayout
      breadcrumbs={[
        {
          label: FEATURES.users.audit.poleLabel,
        },
        { href: FEATURES.users.href, label: FEATURES.users.label },
      ]}
    >
      <UsersAdministrationContent />
    </AuthenticatedLayout>
  );
};

export default UsersAdministrationPage;
