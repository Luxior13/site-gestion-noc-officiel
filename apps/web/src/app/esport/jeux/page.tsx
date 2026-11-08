import type { Metadata } from 'next';
import React from 'react';

import { FEATURES } from '$constants/feature-registry.constants';
import { GamesPage } from '$features/games/components/GamesPage';
import { pageTitle } from '$utils/page-title.utils';

export const metadata: Metadata = { title: pageTitle(FEATURES.games.label) };

export default function GamesRoute(): React.ReactNode {
  return <GamesPage />;
}
