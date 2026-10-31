import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { pageTitle } from '$utils/page-title.utils';

export const metadata: Metadata = {
  description: 'Gérez votre profil, votre sécurité et vos sessions.',
  title: pageTitle('Mon compte'),
};

export default function MyAccountLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return children;
}
