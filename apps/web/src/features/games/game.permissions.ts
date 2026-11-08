import { hasPermission, PERMISSIONS } from '$constants/permissions.constants';
import type { UserType } from '$types/auth.types';

type GamePermissionUser = Pick<
  UserType,
  'isProtected' | 'permissions' | 'role'
> | null;

export type GameCapabilities = Readonly<{
  canManage: boolean;
  canManageTeams: boolean;
  canView: boolean;
  canViewTeams: boolean;
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

  const canView = permitted(PERMISSIONS.GAMES.VIEW);
  // Teams sit under their game: no game, no team.
  const canViewTeams = canView && permitted(PERMISSIONS.TEAMS.VIEW);

  return {
    canManage: permitted(PERMISSIONS.GAMES.MANAGE),
    canManageTeams: canViewTeams && permitted(PERMISSIONS.TEAMS.MANAGE),
    canView,
    canViewTeams,
  };
};
