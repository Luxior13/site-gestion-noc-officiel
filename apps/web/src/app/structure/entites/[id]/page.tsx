import type { Metadata } from 'next';
import React from 'react';

import { FEATURES } from '$constants/feature-registry.constants';
import { EntityDetailPage } from '$features/entities/components/EntityDetailPage';
import { pageTitle } from '$utils/page-title.utils';

// Each page names itself in the browser tab (WCAG 2.4.2).
export const metadata: Metadata = {
  title: pageTitle('Fiche entité', FEATURES.entities.label),
};

type EntityRouteProps = { params: Promise<{ id: string }> };

export default async function EntityRoute({
  params,
}: EntityRouteProps): Promise<React.ReactNode> {
  const { id } = await params;

  return <EntityDetailPage entityId={id} />;
}
