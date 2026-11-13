import { hasPermission, PERMISSIONS } from '$constants/permissions.constants';
import type { UserType } from '$types/auth.types';

type TournamentPermissionUser = Pick<
  UserType,
  'esportScope' | 'isProtected' | 'permissions' | 'role'
> | null;

export type TournamentCapabilities = Readonly<{
  /** A typed organiser absent from the organisations is added to them. */
  canAddOrganizers: boolean;
  /** Adding, editing a tournament, engaging a team, its placement. */
  canManage: boolean;
  /** The organiser's record opens with the organisations. */
  canOpenOrganizations: boolean;
  /** A team's name opens its record. */
  canOpenTeams: boolean;
  canView: boolean;
  /** The Finances tab, the operations naming the tournament. */
  canViewOperations: boolean;
  /** Who only sees chosen teams engages one at the creation. */
  mustChooseTeam: boolean;
}>;

/**
 * What the account may do with the tournaments (11 November 2026): its
 * permissions say what, its Esport scope which ones. The server lists only
 * the tournaments of the scope and checks every action again; these flags
 * only show or hide the controls.
 */
export const getTournamentCapabilities = (
  user: TournamentPermissionUser,
): TournamentCapabilities => {
  const permitted = (permission: string): boolean =>
    Boolean(
      user &&
      (user.isProtected ||
        hasPermission(user.role, permission, user.permissions)),
    );
  const scope = user?.isProtected ? 'ALL' : (user?.esportScope ?? 'ALL');
  const canView = permitted(PERMISSIONS.TOURNAMENTS.VIEW);
  const canManage = canView && permitted(PERMISSIONS.TOURNAMENTS.MANAGE);
  const canOpenOrganizations = permitted(PERMISSIONS.ORGANIZATIONS.VIEW);

  return {
    // Who could not open the record could not correct a mistyped name.
    canAddOrganizers:
      canManage &&
      canOpenOrganizations &&
      permitted(PERMISSIONS.ORGANIZATIONS.MANAGE),
    canManage,
    canOpenOrganizations,
    canOpenTeams:
      permitted(PERMISSIONS.GAMES.VIEW) && permitted(PERMISSIONS.TEAMS.VIEW),
    canView,
    canViewOperations: permitted(PERMISSIONS.OPERATIONS.VIEW),
    mustChooseTeam: scope === 'TEAMS',
  };
};
