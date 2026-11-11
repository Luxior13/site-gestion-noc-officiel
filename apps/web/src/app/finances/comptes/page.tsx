import type { Metadata } from 'next';
import React from 'react';

import { FEATURES } from '$constants/feature-registry.constants';
import { FinancialAccountsPage } from '$features/financial-accounts/components/FinancialAccountsPage';
import { pageTitle } from '$utils/page-title.utils';

// Each page names itself in the browser tab (WCAG 2.4.2).
export const metadata: Metadata = {
  title: pageTitle(FEATURES.financialAccounts.label),
};

export default function FinancialAccountsRoute(): React.ReactNode {
  return <FinancialAccountsPage />;
}
