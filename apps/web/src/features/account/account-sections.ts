import { hasPermission, PERMISSIONS } from '$constants/permissions.constants';
import type { UserType } from '$types/auth.types';

type AccountSectionUser = Pick<
  UserType,
  'isProtected' | 'permissions' | 'role'
> &
  Partial<Pick<UserType, 'mustChangePassword'>>;

const SECURITY_PERMISSIONS = [
  PERMISSIONS.ACCOUNT.VIEW_SECURITY,
  PERMISSIONS.ACCOUNT.CHANGE_PASSWORD,
  PERMISSIONS.ACCOUNT.MANAGE_MFA,
  PERMISSIONS.ACCOUNT.MANAGE_SESSIONS,
];

/**
 * The Sécurité tab of Mon compte gathers the password, the double
 * authentication and the sessions: shown with any of their permissions. Mon
 * compte and the quick navigation share this rule (audit RR-07).
 */
export const canSeeAccountSecurity = (user: AccountSectionUser): boolean =>
  Boolean(user.mustChangePassword) ||
  user.isProtected ||
  SECURITY_PERMISSIONS.some((permission) =>
    hasPermission(user.role, permission, user.permissions),
  );
