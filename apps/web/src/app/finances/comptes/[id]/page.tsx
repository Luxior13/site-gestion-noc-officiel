import type { Metadata } from 'next';
import React from 'react';

import { FEATURES } from '$constants/feature-registry.constants';
import { FinancialAccountDetailPage } from '$features/financial-accounts/components/FinancialAccountDetailPage';
import { pageTitle } from '$utils/page-title.utils';

// Each page names itself in the browser tab (WCAG 2.4.2).
export const metadata: Metadata = {
  title: pageTitle('Fiche compte', FEATURES.financialAccounts.label),
};

type FinancialAccountRouteProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ section?: string | string[] }>;
};

export default async function FinancialAccountRoute({
  params,
  searchParams,
}: FinancialAccountRouteProps): Promise<React.ReactNode> {
  const [{ id }, query] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<{ section?: string | string[] }>({}),
  ]);

  // Its movements first (11 November 2026); any other value opens them too.
  return (
    <FinancialAccountDetailPage
      accountId={id}
      activeSection={
        query.section === 'informations' ? 'informations' : 'mouvements'
      }
    />
  );
}
