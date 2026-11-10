import { hasPermission, PERMISSIONS } from '$constants/permissions.constants';
import type { UserType } from '$types/auth.types';

type GamePermissionUser = Pick<
  UserType,
  'esportScope' | 'isProtected' | 'permissions' | 'role'
> | null;

export type GameCapabilities = Readonly<{
  /** Adding a game or ordering the games concerns every game. */
  canAddGames: boolean;
  /**
   * Adding a team to a shown game, or ordering its teams, concerns the whole
   * game: not with a scope of teams.
   */
  canAddTeams: boolean;
  /** Editing a shown game and its functions: the whole game is in scope. */
  canManage: boolean;
  /** Editing a shown team and its roster. */
  canManageTeams: boolean;
  canView: boolean;
  canViewTeams: boolean;
}>;

/**
 * What the account may do in the Esport pole: its permissions say what, its
 * Esport scope where (owner, 10 November 2026). The server lists only the
 * games and teams of the scope and checks every action again; these flags
 * only show or hide the controls.
 */
export const getGameCapabilities = (
  user: GamePermissionUser,
): GameCapabilities => {
  const permitted = (permission: string): boolean =>
    Boolean(
      user &&
      (user.isProtected ||
        hasPermission(user.role, permission, user.permissions)),
    );
  const scope = user?.isProtected ? 'ALL' : (user?.esportScope ?? 'ALL');

  const canView = permitted(PERMISSIONS.GAMES.VIEW);
  // Teams sit under their game: no game, no team.
  const canViewTeams = canView && permitted(PERMISSIONS.TEAMS.VIEW);
  const canManage = permitted(PERMISSIONS.GAMES.MANAGE) && scope !== 'TEAMS';
  const canManageTeams = canViewTeams && permitted(PERMISSIONS.TEAMS.MANAGE);

  return {
    canAddGames: canManage && scope === 'ALL',
    canAddTeams: canManageTeams && scope !== 'TEAMS',
    canManage,
    canManageTeams,
    canView,
    canViewTeams,
  };
};
