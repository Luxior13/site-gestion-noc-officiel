import { hasPermission, PERMISSIONS } from '$constants/permissions.constants';
import type { UserType } from '$types/auth.types';

type FinancialAccountPermissionUser = Pick<
  UserType,
  'isProtected' | 'permissions' | 'role'
> | null;

export type FinancialAccountCapabilities = Readonly<{
  canManage: boolean;
  canView: boolean;
  /** The entities page is linked when the account may read it. */
  canViewEntities: boolean;
}>;

/** Comptes (10 November 2026): rights of their own, in the Finances pole. */
export const getFinancialAccountCapabilities = (
  user: FinancialAccountPermissionUser,
): FinancialAccountCapabilities => {
  const permitted = (permission: string): boolean =>
    Boolean(
      user &&
      (user.isProtected ||
        hasPermission(user.role, permission, user.permissions)),
    );
  const canView = permitted(PERMISSIONS.FINANCIAL_ACCOUNTS.VIEW);

  return {
    canManage: canView && permitted(PERMISSIONS.FINANCIAL_ACCOUNTS.MANAGE),
    canView,
    canViewEntities: permitted(PERMISSIONS.ENTITIES.VIEW),
  };
};
