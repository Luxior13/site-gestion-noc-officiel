import type { Metadata } from 'next';
import React from 'react';

import { FEATURES } from '$constants/feature-registry.constants';
import { FinancialAccountDetailPage } from '$features/financial-accounts/components/FinancialAccountDetailPage';
import { pageTitle } from '$utils/page-title.utils';

// Each page names itself in the browser tab (WCAG 2.4.2).
export const metadata: Metadata = {
  title: pageTitle('Fiche compte', FEATURES.financialAccounts.label),
};

type FinancialAccountRouteProps = { params: Promise<{ id: string }> };

export default async function FinancialAccountRoute({
  params,
}: FinancialAccountRouteProps): Promise<React.ReactNode> {
  const { id } = await params;

  return <FinancialAccountDetailPage accountId={id} />;
}
