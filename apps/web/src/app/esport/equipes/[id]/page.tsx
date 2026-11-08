import type { Metadata } from 'next';
import React from 'react';

import { FEATURES } from '$constants/feature-registry.constants';
import { TeamDetailPage } from '$features/teams/components/TeamDetailPage';
import { pageTitle } from '$utils/page-title.utils';

// Each page names itself in the browser tab (WCAG 2.4.2).
export const metadata: Metadata = {
  title: pageTitle('Fiche équipe', FEATURES.games.label),
};

type TeamRouteProps = { params: Promise<{ id: string }> };

export default async function TeamRoute({
  params,
}: TeamRouteProps): Promise<React.ReactNode> {
  const { id } = await params;

  return <TeamDetailPage teamId={id} />;
}
