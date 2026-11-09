import type { Metadata } from 'next';
import React from 'react';

import { FEATURES } from '$constants/feature-registry.constants';
import { GameDetailPage } from '$features/games/components/GameDetailPage';
import { pageTitle } from '$utils/page-title.utils';

// Each page names itself in the browser tab (WCAG 2.4.2).
export const metadata: Metadata = {
  title: pageTitle('Fiche jeu', FEATURES.games.label),
};

type GameRouteProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ section?: string | string[] }>;
};

export default async function GameRoute({
  params,
  searchParams,
}: GameRouteProps): Promise<React.ReactNode> {
  const [{ id }, query] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<{ section?: string | string[] }>({}),
  ]);

  // Functions first (9 November 2026); any other value opens them too.
  return (
    <GameDetailPage
      activeSection={
        query.section === 'informations' ? 'informations' : 'fonctions'
      }
      gameId={id}
    />
  );
}
