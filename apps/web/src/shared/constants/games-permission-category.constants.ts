import { PAGE_PATHS } from '$constants/routes.constants';

import type {
  PermissionCategory,
  PermissionItem,
} from './permissions.constants';

type GamePermissionKeys = Readonly<{
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

/** The games of the structure, first page of the Esport pole (8 November 2026). */
export const createGamesPermissionCategory = (
  keys: GamePermissionKeys,
): PermissionCategory => ({
  accessPermissionKey: keys.VIEW,
  assignment: 'delegable',
  description: 'Les jeux de la structure, une section par jeu.',
  icon: 'Gamepad2',
  key: 'games',
  label: 'Jeux',
  permissions: [
    permission({
      action: 'view',
      description:
        'Consulter la liste des jeux et leur date de première ouverture',
      grantable: true,
      key: keys.VIEW,
      label: 'Consulter les jeux',
      module: 'Jeux',
      risk: 'default',
      route: PAGE_PATHS.games,
      surface: 'page',
    }),
    permission({
      action: 'manage',
      dependencies: [keys.VIEW],
      description:
        'Ajouter un jeu, le modifier, le rendre actif ou non, et supprimer un jeu qui n’a jamais servi',
      grantable: true,
      key: keys.MANAGE,
      label: 'Gérer les jeux',
      module: 'Jeux',
      risk: 'sensitive',
      route: PAGE_PATHS.games,
      surface: 'page',
    }),
  ],
  poleKey: 'esport',
  routes: [PAGE_PATHS.games],
  surface: 'page',
  tone: 'esport',
});
