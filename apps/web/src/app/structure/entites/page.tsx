import type { Metadata } from 'next';
import React from 'react';

import { FEATURES } from '$constants/feature-registry.constants';
import { EntitiesPage } from '$features/entities/components/EntitiesPage';
import { pageTitle } from '$utils/page-title.utils';

// Each page names itself in the browser tab (WCAG 2.4.2).
export const metadata: Metadata = { title: pageTitle(FEATURES.entities.label) };

export default function EntitiesRoute(): React.ReactNode {
  return <EntitiesPage />;
}
