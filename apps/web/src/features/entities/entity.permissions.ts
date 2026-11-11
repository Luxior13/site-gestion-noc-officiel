import { hasPermission, PERMISSIONS } from '$constants/permissions.constants';
import type { UserType } from '$types/auth.types';

type EntityPermissionUser = Pick<
  UserType,
  'isProtected' | 'permissions' | 'role'
> | null;

export type EntityCapabilities = Readonly<{
  canManage: boolean;
  canView: boolean;
}>;

/** Entités (10 November 2026): rights of their own, in the Structure pole. */
export const getEntityCapabilities = (
  user: EntityPermissionUser,
): EntityCapabilities => {
  const permitted = (permission: string): boolean =>
    Boolean(
      user &&
      (user.isProtected ||
        hasPermission(user.role, permission, user.permissions)),
    );
  const canView = permitted(PERMISSIONS.ENTITIES.VIEW);

  return {
    canManage: canView && permitted(PERMISSIONS.ENTITIES.MANAGE),
    canView,
  };
};
