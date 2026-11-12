import type { Metadata } from 'next';
import React from 'react';

import { FEATURES } from '$constants/feature-registry.constants';
import {
  TeamDetailPage,
  type TeamDetailSection,
} from '$features/teams/components/TeamDetailPage';
import { pageTitle } from '$utils/page-title.utils';

// Each page names itself in the browser tab (WCAG 2.4.2).
export const metadata: Metadata = {
  title: pageTitle('Fiche équipe', FEATURES.games.label),
};

type TeamRouteProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ section?: string | string[] }>;
};

export default async function TeamRoute({
  params,
  searchParams,
}: TeamRouteProps): Promise<React.ReactNode> {
  const [{ id }, query] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<{ section?: string | string[] }>({}),
  ]);

  // The roster first (9 November 2026); any other value opens it too.
  const activeSection: TeamDetailSection =
    query.section === 'informations' ||
    query.section === 'anciens' ||
    query.section === 'finances' ||
    query.section === 'tournois'
      ? query.section
      : 'roster';

  return <TeamDetailPage activeSection={activeSection} teamId={id} />;
}
