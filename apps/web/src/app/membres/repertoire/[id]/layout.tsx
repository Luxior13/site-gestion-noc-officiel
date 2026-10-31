import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { SITE_CONFIG } from '$constants/app.constants';
import { FEATURES } from '$constants/feature-registry.constants';

// Each page names itself in the browser tab (WCAG 2.4.2, audit of
// 31 October 2026).
export const metadata: Metadata = {
  title: `Fiche · ${FEATURES.persons.label} · ${SITE_CONFIG.name}`,
};

export default function PersonRecordLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return children;
}
