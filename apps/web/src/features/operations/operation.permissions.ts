import { hasPermission, PERMISSIONS } from '$constants/permissions.constants';
import type { UserType } from '$types/auth.types';

type OperationPermissionUser = Pick<
  UserType,
  'isProtected' | 'permissions' | 'role'
> | null;

export type OperationCapabilities = Readonly<{
  /** Link a payer or payee from the Répertoire, and see it. */
  canLinkPersons: boolean;
  canManage: boolean;
  canView: boolean;
  canViewPersons: boolean;
}>;

/** Opérations (11 November 2026): rights of their own, in Finances. */
export const getOperationCapabilities = (
  user: OperationPermissionUser,
): OperationCapabilities => {
  const permitted = (permission: string): boolean =>
    Boolean(
      user &&
      (user.isProtected ||
        hasPermission(user.role, permission, user.permissions)),
    );
  const canView = permitted(PERMISSIONS.OPERATIONS.VIEW);
  const canManage = canView && permitted(PERMISSIONS.OPERATIONS.MANAGE);
  const canViewPersons = permitted(PERMISSIONS.PERSONS.VIEW);

  return {
    canLinkPersons: canManage && canViewPersons,
    canManage,
    canView,
    canViewPersons,
  };
};
