import type { Metadata } from 'next';
import React from 'react';

import { FEATURES } from '$constants/feature-registry.constants';
import {
  TournamentDetailPage,
  type TournamentDetailSection,
} from '$features/tournaments/components/TournamentDetailPage';
import { pageTitle } from '$utils/page-title.utils';

// Each page names itself in the browser tab (WCAG 2.4.2).
export const metadata: Metadata = {
  title: pageTitle('Fiche tournoi', FEATURES.tournaments.label),
};

type TournamentRouteProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ section?: string | string[] }>;
};

export default async function TournamentRoute({
  params,
  searchParams,
}: TournamentRouteProps): Promise<React.ReactNode> {
  const [{ id }, query] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<{ section?: string | string[] }>({}),
  ]);
  // Informations first; any other value opens them too.
  const activeSection: TournamentDetailSection =
    query.section === 'participants' || query.section === 'finances'
      ? query.section
      : 'informations';

  return (
    <TournamentDetailPage activeSection={activeSection} tournamentId={id} />
  );
}
