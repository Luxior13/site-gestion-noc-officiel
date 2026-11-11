import type { Metadata } from 'next';
import React from 'react';

import { FEATURES } from '$constants/feature-registry.constants';
import { OperationDetailPage } from '$features/operations/components/OperationDetailPage';
import { pageTitle } from '$utils/page-title.utils';

// Each page names itself in the browser tab (WCAG 2.4.2).
export const metadata: Metadata = {
  title: pageTitle('Fiche opération', FEATURES.operations.label),
};

type OperationRouteProps = { params: Promise<{ id: string }> };

export default async function OperationRoute({
  params,
}: OperationRouteProps): Promise<React.ReactNode> {
  const { id } = await params;

  return <OperationDetailPage operationId={id} />;
}
