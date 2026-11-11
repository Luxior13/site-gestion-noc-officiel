import React from 'react';

import AuthenticatedLayout from '$components/AuthenticatedLayout';
import { PageDetailSkeleton } from '$components/layout/PageDetailSkeleton';
import { FEATURES } from '$constants/feature-registry.constants';
import { PageCanvas, PageShell } from '$ui/page-shell';

export default function EntityLoading(): React.ReactNode {
  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: FEATURES.entities.audit.poleLabel },
        { href: FEATURES.entities.href, label: FEATURES.entities.label },
        { label: 'Entité' },
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
