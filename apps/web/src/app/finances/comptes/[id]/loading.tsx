import React from 'react';

import AuthenticatedLayout from '$components/AuthenticatedLayout';
import { PageDetailSkeleton } from '$components/layout/PageDetailSkeleton';
import { FEATURES } from '$constants/feature-registry.constants';
import { PageCanvas, PageShell } from '$ui/page-shell';

export default function FinancialAccountLoading(): React.ReactNode {
  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: FEATURES.financialAccounts.audit.poleLabel },
        {
          href: FEATURES.financialAccounts.href,
          label: FEATURES.financialAccounts.label,
        },
        { label: 'Compte' },
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
