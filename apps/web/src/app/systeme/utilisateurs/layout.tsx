import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { FEATURES } from '$constants/feature-registry.constants';
import { pageTitle } from '$utils/page-title.utils';

export const metadata: Metadata = {
  description: 'Gérez les comptes, rôles et autorisations administratives.',
  title: pageTitle(FEATURES.users.label),
};

export default function AdministrationUsersLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return children;
}
