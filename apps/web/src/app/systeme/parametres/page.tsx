import type { Metadata } from 'next';
import React from 'react';

import { FEATURES } from '$constants/feature-registry.constants';
import { SystemSettingsPage } from '$features/settings/components/SystemSettingsPage';
import { pageTitle } from '$utils/page-title.utils';

// An explicit route like the other pages of the pole (SYS-14, 31 October
// 2026); the page names itself in the browser tab (WCAG 2.4.2).
export const metadata: Metadata = {
  title: pageTitle(FEATURES.systemSettings.label),
};

export default function SystemSettingsRoute(): React.ReactNode {
  return <SystemSettingsPage />;
}
