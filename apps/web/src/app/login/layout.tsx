import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { pageTitle } from '$utils/page-title.utils';

export const metadata: Metadata = {
  title: pageTitle('Connexion'),
};

export default function LoginLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return children;
}
