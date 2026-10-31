import type { Metadata } from 'next';
import React from 'react';

import { FEATURES } from '$constants/feature-registry.constants';
import { HomePage } from '$features/dashboard/components/HomePage';
import { pageTitle } from '$utils/page-title.utils';

// A server route so that the home page names itself in the browser tab
// (WCAG 2.4.2, audit RR-10 of 31 October 2026).
export const metadata: Metadata = {
  title: pageTitle(FEATURES.dashboard.label),
};

export default function HomeRoute(): React.ReactNode {
  return <HomePage />;
}
