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
 * Organisations, first page of the Relations pole (11 November 2026):
 * sponsors, partners, suppliers, clients, organisers and public funders in
 * one list, with the people to reach there.
 */
export const createOrganizationsPermissionCategory = (
  keys: ViewManageKeys,
): PermissionCategory => ({
  accessPermissionKey: keys.VIEW,
  assignment: 'delegable',
  description:
    'Les organisations avec lesquelles la structure travaille, et les personnes à y joindre.',
  icon: 'Building2',
  key: 'organizations',
  label: 'Organisations',
  permissions: [
    permission({
      action: 'view',
      description:
        'Consulter les organisations, leurs identifiants, leur adresse et leurs contacts',
      grantable: true,
      key: keys.VIEW,
      label: 'Consulter les organisations',
      module: 'Organisations',
      risk: 'default',
      route: PAGE_PATHS.organizations,
      surface: 'page',
    }),
    permission({
      action: 'manage',
      dependencies: [keys.VIEW],
      description:
        'Ajouter, corriger ou supprimer une organisation et ses contacts',
      grantable: true,
      key: keys.MANAGE,
      label: 'Gérer les organisations',
      module: 'Organisations',
      risk: 'sensitive',
      route: PAGE_PATHS.organizations,
      surface: 'page',
    }),
  ],
  poleKey: 'legal',
  routes: [PAGE_PATHS.organizations],
  surface: 'page',
  tone: 'legal',
});
