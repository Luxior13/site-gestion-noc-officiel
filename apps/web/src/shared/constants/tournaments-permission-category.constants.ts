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
 * The tournaments of the structure, in the Esport pole (11 November 2026):
 * each tournament, its engaged teams, their line-up and placement. The
 * account's Esport scope says which ones; a manager creates and fills those
 * of his team.
 */
export const createTournamentsPermissionCategory = (
  keys: ViewManageKeys,
): PermissionCategory => ({
  accessPermissionKey: keys.VIEW,
  assignment: 'delegable',
  description:
    'Les tournois de la structure, les équipes engagées, leur line-up et leur classement.',
  icon: 'Trophy',
  key: 'tournaments',
  label: 'Tournois',
  permissions: [
    permission({
      action: 'view',
      description:
        'Consulter les tournois, leurs informations, les équipes engagées, leur line-up et leur classement',
      grantable: true,
      key: keys.VIEW,
      label: 'Consulter les tournois',
      module: 'Tournois',
      risk: 'default',
      route: PAGE_PATHS.tournaments,
      surface: 'page',
    }),
    permission({
      action: 'manage',
      dependencies: [keys.VIEW],
      description:
        'Ajouter, corriger ou supprimer un tournoi, engager une équipe, tenir son line-up et son classement, et chercher pour cela une fiche du Répertoire par son nom',
      grantable: true,
      key: keys.MANAGE,
      label: 'Gérer les tournois',
      module: 'Tournois',
      risk: 'sensitive',
      route: PAGE_PATHS.tournaments,
      surface: 'page',
    }),
  ],
  poleKey: 'esport',
  routes: [PAGE_PATHS.tournaments],
  surface: 'page',
  tone: 'esport',
});
