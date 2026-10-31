import { redirect } from 'next/navigation';

import { getVisibleNavigationSpaces } from '$constants/app.constants';
import { getPageAuthSession } from '$server/session';

/**
 * The pole has no hub page: /systeme opens the first page the account may
 * see, or home (SYS-14, 31 October 2026).
 */
export default async function SystemIndexPage(): Promise<never> {
  const { user } = await getPageAuthSession();
  if (!user) redirect('/login');
  const systemSpace = getVisibleNavigationSpaces(user).find(
    (space) => space.id === 'system',
  );
  redirect(systemSpace?.href ?? '/');
}
