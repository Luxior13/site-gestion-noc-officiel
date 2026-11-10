import 'server-only';

import { type User } from '@repo/database';

import {
  normalizePermissionOverrides,
  type PermissionsData,
} from '$constants/permissions.constants';
import type { UserType } from '$types/auth.types';

/**
 * Map User to UserType (client-safe)
 */
type ClientSafeUser = Pick<
  User,
  | 'contactEmail'
  | 'contactEmailVerifiedAt'
  | 'createdAt'
  | 'firstName'
  | 'id'
  | 'isActive'
  | 'isProtected'
  | 'lastLoginAt'
  | 'lastName'
  | 'loginName'
  | 'mfaEnabledAt'
  | 'mustChangePassword'
  | 'passwordChangedAt'
  | 'permissions'
  | 'role'
> &
  Partial<Pick<User, 'esportScope' | 'updatedAt'>>;

export const mapUserToUserType = (user: ClientSafeUser): UserType => ({
  contactEmail: user.contactEmail,
  contactEmailVerifiedAt: user.contactEmailVerifiedAt,
  createdAt: user.createdAt,
  // The kind only: the server reads the chosen games or teams itself.
  ...(user.esportScope ? { esportScope: user.esportScope } : {}),
  firstName: user.firstName,
  id: user.id,
  isActive: user.isActive,
  isProtected: user.isProtected,
  lastLoginAt: user.lastLoginAt,
  lastName: user.lastName ?? '',
  loginName: user.loginName,
  mfaEnabledAt: user.mfaEnabledAt,
  mustChangePassword: user.mustChangePassword,
  passwordChangedAt: user.passwordChangedAt,
  permissions: normalizePermissionOverrides(
    user.permissions as PermissionsData | null,
  ),
  role: user.role,
  securityDetailsVisible: true,
  ...(user.updatedAt ? { updatedAt: user.updatedAt } : {}),
});
