import type { Metadata } from 'next';
import React from 'react';

import { FEATURES } from '$constants/feature-registry.constants';
import { OperationsPage } from '$features/operations/components/OperationsPage';
import { pageTitle } from '$utils/page-title.utils';

// Each page names itself in the browser tab (WCAG 2.4.2).
export const metadata: Metadata = {
  title: pageTitle(FEATURES.operations.label),
};

export default function OperationsRoute(): React.ReactNode {
  return <OperationsPage />;
}
