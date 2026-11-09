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
 * Bureau & staff, first page of the Structure pole (9 November 2026): the
 * roster of the structure and its functions. Rights of their own (owner,
 * « ok go »): a manager never sees the board, and managing the teams does not
 * mean changing the mandates.
 */
export const createStaffPermissionCategory = (
  keys: ViewManageKeys,
): PermissionCategory => ({
  accessPermissionKey: keys.VIEW,
  assignment: 'delegable',
  description:
    'L’effectif de la structure (bureau, staff, bénévoles) et ses fonctions.',
  icon: 'ShieldCheck',
  key: 'staff',
  label: 'Bureau & staff',
  permissions: [
    permission({
      action: 'view',
      description:
        'Consulter qui occupe chaque fonction de la structure, avec ses dates, et les anciens membres',
      grantable: true,
      key: keys.VIEW,
      label: 'Consulter Bureau & staff',
      module: 'Bureau & staff',
      risk: 'default',
      route: PAGE_PATHS.staff,
      surface: 'page',
    }),
    permission({
      action: 'manage',
      dependencies: [keys.VIEW],
      description:
        'Ajouter, corriger ou terminer un passage dans la structure, et gérer ses fonctions',
      grantable: true,
      key: keys.MANAGE,
      label: 'Gérer Bureau & staff',
      module: 'Bureau & staff',
      risk: 'sensitive',
      route: PAGE_PATHS.staff,
      surface: 'page',
    }),
  ],
  poleKey: 'structure',
  routes: [PAGE_PATHS.staff],
  surface: 'page',
  tone: 'legal',
});
