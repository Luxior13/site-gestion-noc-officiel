import type { Metadata } from 'next';
import React from 'react';

import { FEATURES } from '$constants/feature-registry.constants';
import { OrganizationsPage } from '$features/organizations/components/OrganizationsPage';
import { pageTitle } from '$utils/page-title.utils';

// Each page names itself in the browser tab (WCAG 2.4.2).
export const metadata: Metadata = {
  title: pageTitle(FEATURES.organizations.label),
};

export default function OrganizationsRoute(): React.ReactNode {
  return <OrganizationsPage />;
}
