import { hasPermission, PERMISSIONS } from '$constants/permissions.constants';
import type { UserType } from '$types/auth.types';

type OrganizationPermissionUser = Pick<
  UserType,
  'isProtected' | 'permissions' | 'role'
> | null;

export type OrganizationCapabilities = Readonly<{
  /** Link a contact to a record of the Répertoire, and open it. */
  canLinkPersons: boolean;
  canManage: boolean;
  canView: boolean;
  canViewPersons: boolean;
}>;

/** Organisations (11 November 2026): rights of their own, in Relations. */
export const getOrganizationCapabilities = (
  user: OrganizationPermissionUser,
): OrganizationCapabilities => {
  const permitted = (permission: string): boolean =>
    Boolean(
      user &&
      (user.isProtected ||
        hasPermission(user.role, permission, user.permissions)),
    );
  const canView = permitted(PERMISSIONS.ORGANIZATIONS.VIEW);
  const canManage = canView && permitted(PERMISSIONS.ORGANIZATIONS.MANAGE);
  const canViewPersons = permitted(PERMISSIONS.PERSONS.VIEW);

  return {
    canLinkPersons: canManage && canViewPersons,
    canManage,
    canView,
    canViewPersons,
  };
};
