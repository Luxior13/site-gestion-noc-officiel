import { PAGE_PATHS } from '$constants/routes.constants';

import type {
  PermissionCategory,
  PermissionItem,
} from './permissions.constants';

type ViewManageKeys = Readonly<{
  MANAGE: string;
  VIEW: string;
}>;

const permission = (
  value: Omit<PermissionItem, 'requiresTargetMfa' | 'status'>,
): PermissionItem => ({
  ...value,
  requiresTargetMfa: false,
  status: 'active',
});

/**
 * Comptes, first page of the Finances pole (10 November 2026): the bank
 * accounts, online accounts and cash boxes of each entity. The board enters
 * the treasury, not only the treasurer (owner, same day).
 */
export const createFinancialAccountsPermissionCategory = (
  keys: ViewManageKeys,
): PermissionCategory => ({
  accessPermissionKey: keys.VIEW,
  assignment: 'delegable',
  description:
    'Les comptes bancaires, comptes en ligne et caisses de chaque entité, avec leur solde de départ.',
  icon: 'Wallet',
  key: 'financial-accounts',
  label: 'Comptes',
  permissions: [
    permission({
      action: 'view',
      description:
        'Consulter les comptes, leur établissement, leur entité et leur solde de départ',
      grantable: true,
      key: keys.VIEW,
      label: 'Consulter les comptes',
      module: 'Comptes',
      risk: 'sensitive',
      route: PAGE_PATHS.financialAccounts,
      surface: 'page',
    }),
    permission({
      action: 'manage',
      dependencies: [keys.VIEW],
      description:
        'Ouvrir, corriger, clôturer ou supprimer un compte et fixer son solde de départ',
      grantable: true,
      key: keys.MANAGE,
      label: 'Gérer les comptes',
      module: 'Comptes',
      risk: 'sensitive',
      route: PAGE_PATHS.financialAccounts,
      surface: 'page',
    }),
  ],
  poleKey: 'finance',
  routes: [PAGE_PATHS.financialAccounts],
  surface: 'page',
  tone: 'treasury',
});
