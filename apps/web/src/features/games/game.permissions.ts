import { hasPermission, PERMISSIONS } from '$constants/permissions.constants';
import type { UserType } from '$types/auth.types';

type GamePermissionUser = Pick<
  UserType,
  'isProtected' | 'permissions' | 'role'
> | null;

export type GameCapabilities = Readonly<{
  canManage: boolean;
  canView: boolean;
}>;

export const getGameCapabilities = (
  user: GamePermissionUser,
): GameCapabilities => {
  const permitted = (permission: string): boolean =>
    Boolean(
      user &&
      (user.isProtected ||
        hasPermission(user.role, permission, user.permissions)),
    );

  return {
    canManage: permitted(PERMISSIONS.GAMES.MANAGE),
    canView: permitted(PERMISSIONS.GAMES.VIEW),
  };
};
