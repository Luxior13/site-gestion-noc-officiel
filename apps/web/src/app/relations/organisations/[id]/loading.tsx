import React from 'react';

import AuthenticatedLayout from '$components/AuthenticatedLayout';
import { PageDetailSkeleton } from '$components/layout/PageDetailSkeleton';
import { FEATURES } from '$constants/feature-registry.constants';
import { PageCanvas, PageShell } from '$ui/page-shell';

export default function OrganizationLoading(): React.ReactNode {
  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: FEATURES.organizations.audit.poleLabel },
        {
          href: FEATURES.organizations.href,
          label: FEATURES.organizations.label,
        },
        { label: 'Organisation' },
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
