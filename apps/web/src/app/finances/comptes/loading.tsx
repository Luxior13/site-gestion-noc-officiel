import React from 'react';

import AuthenticatedLayout from '$components/AuthenticatedLayout';
import { PageDetailSkeleton } from '$components/layout/PageDetailSkeleton';
import { FEATURES } from '$constants/feature-registry.constants';
import { PageCanvas, PageShell } from '$ui/page-shell';

export default function FinancialAccountsLoading(): React.ReactNode {
  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: FEATURES.financialAccounts.audit.poleLabel },
        { label: FEATURES.financialAccounts.label },
      ]}
    >
      <PageShell className="py-0">
        <PageCanvas>
          <PageDetailSkeleton />
        </PageCanvas>
      </PageShell>
    </AuthenticatedLayout>
  );
}
