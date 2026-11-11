import type { Metadata } from 'next';
import React from 'react';

import { FEATURES } from '$constants/feature-registry.constants';
import { OrganizationDetailPage } from '$features/organizations/components/OrganizationDetailPage';
import { pageTitle } from '$utils/page-title.utils';

// Each page names itself in the browser tab (WCAG 2.4.2).
export const metadata: Metadata = {
  title: pageTitle('Fiche organisation', FEATURES.organizations.label),
};

type OrganizationRouteProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ section?: string | string[] }>;
};

export default async function OrganizationRoute({
  params,
  searchParams,
}: OrganizationRouteProps): Promise<React.ReactNode> {
  const [{ id }, query] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<{ section?: string | string[] }>({}),
  ]);

  // Identité first; any other value opens it too.
  return (
    <OrganizationDetailPage
      activeSection={query.section === 'contacts' ? 'contacts' : 'identite'}
      organizationId={id}
    />
  );
}
