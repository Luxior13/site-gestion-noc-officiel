import type { Metadata } from 'next';
import React from 'react';

import { FEATURES } from '$constants/feature-registry.constants';
import { FinancialAccountsPage } from '$features/financial-accounts/components/FinancialAccountsPage';
import { pageTitle } from '$utils/page-title.utils';

// Each page names itself in the browser tab (WCAG 2.4.2).
export const metadata: Metadata = {
  title: pageTitle(FEATURES.financialAccounts.label),
};

type FinancialAccountsRouteProps = {
  searchParams?: Promise<{ section?: string | string[] }>;
};

export default async function FinancialAccountsRoute({
  searchParams,
}: FinancialAccountsRouteProps): Promise<React.ReactNode> {
  const { section } = (await searchParams) ?? {};

  // The accounts first; any other value opens them too.
  return (
    <FinancialAccountsPage
      activeSection={
        section === 'categories' || section === 'moyens-de-paiement'
          ? section
          : 'comptes'
      }
    />
  );
}
