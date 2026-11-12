import type { Metadata } from 'next';
import React from 'react';

import { FEATURES } from '$constants/feature-registry.constants';
import { TournamentsPage } from '$features/tournaments/components/TournamentsPage';
import { pageTitle } from '$utils/page-title.utils';

// Each page names itself in the browser tab (WCAG 2.4.2).
export const metadata: Metadata = {
  title: pageTitle(FEATURES.tournaments.label),
};

export default function TournamentsRoute(): React.ReactNode {
  return <TournamentsPage />;
}
