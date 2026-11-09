import { hasPermission, PERMISSIONS } from '$constants/permissions.constants';
import type { UserType } from '$types/auth.types';

type StaffPermissionUser = Pick<
  UserType,
  'isProtected' | 'permissions' | 'role'
> | null;

export type StaffCapabilities = Readonly<{
  canManage: boolean;
  canView: boolean;
}>;

/** Bureau & staff (9 November 2026): its own rights, apart from the teams. */
export const getStaffCapabilities = (
  user: StaffPermissionUser,
): StaffCapabilities => {
  const permitted = (permission: string): boolean =>
    Boolean(
      user &&
      (user.isProtected ||
        hasPermission(user.role, permission, user.permissions)),
    );
  const canView = permitted(PERMISSIONS.STAFF.VIEW);

  return {
    canManage: canView && permitted(PERMISSIONS.STAFF.MANAGE),
    canView,
  };
};
