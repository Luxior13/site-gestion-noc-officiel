import type { Metadata } from 'next';
import React from 'react';

import { FEATURES } from '$constants/feature-registry.constants';
import {
  StaffPage,
  type StaffSection,
} from '$features/staff/components/StaffPage';
import { pageTitle } from '$utils/page-title.utils';

// Each page names itself in the browser tab (WCAG 2.4.2).
export const metadata: Metadata = { title: pageTitle(FEATURES.staff.label) };

type StaffRouteProps = {
  searchParams?: Promise<{ section?: string | string[] }>;
};

export default async function StaffRoute({
  searchParams,
}: StaffRouteProps): Promise<React.ReactNode> {
  const query = await (searchParams ??
    Promise.resolve<{ section?: string | string[] }>({}));
  // The Effectif first (9 November 2026); any other value opens it too.
  const activeSection: StaffSection =
    query.section === 'anciens' || query.section === 'fonctions'
      ? query.section
      : 'effectif';

  return <StaffPage activeSection={activeSection} />;
}
