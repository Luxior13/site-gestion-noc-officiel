import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { FEATURES } from '$constants/feature-registry.constants';
import { pageTitle } from '$utils/page-title.utils';

// Each page names itself in the browser tab (WCAG 2.4.2, audit of
// 31 October 2026).
export const metadata: Metadata = {
  title: pageTitle(FEATURES.roadmap.label),
};

export default function RoadmapLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return children;
}
