import type { Metadata } from 'next';
import React from 'react';

import { SITE_CONFIG } from '$constants/app.constants';
import { FEATURES } from '$constants/feature-registry.constants';
import { SystemSettingsPage } from '$features/settings/components/SystemSettingsPage';

// An explicit route like the other pages of the pole (SYS-14, 31 October
// 2026); the page names itself in the browser tab (WCAG 2.4.2).
export const metadata: Metadata = {
  title: `${FEATURES.systemSettings.label} · ${SITE_CONFIG.name}`,
};

export default function SystemSettingsRoute(): React.ReactNode {
  return <SystemSettingsPage />;
}
