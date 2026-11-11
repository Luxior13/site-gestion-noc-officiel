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
 * Entités, in the Structure pole (10 November 2026): the association, the
 * period before it and, tomorrow, a company. Read by the treasury; managed
 * by the board, a few times in the life of the structure.
 */
export const createEntitiesPermissionCategory = (
  keys: ViewManageKeys,
): PermissionCategory => ({
  accessPermissionKey: keys.VIEW,
  assignment: 'delegable',
  description:
    'Les formes juridiques de la structure dans le temps : l’association, la période d’avant, demain peut-être une société.',
  icon: 'Landmark',
  key: 'entities',
  label: 'Entités',
  permissions: [
    permission({
      action: 'view',
      description:
        'Consulter les entités, leur forme, leurs dates, leurs identifiants et leur siège',
      grantable: true,
      key: keys.VIEW,
      label: 'Consulter les entités',
      module: 'Entités',
      risk: 'default',
      route: PAGE_PATHS.entities,
      surface: 'page',
    }),
    permission({
      action: 'manage',
      dependencies: [keys.VIEW],
      description:
        'Ajouter, corriger ou supprimer une entité et choisir l’entité principale',
      grantable: true,
      key: keys.MANAGE,
      label: 'Gérer les entités',
      module: 'Entités',
      risk: 'sensitive',
      route: PAGE_PATHS.entities,
      surface: 'page',
    }),
  ],
  poleKey: 'structure',
  routes: [PAGE_PATHS.entities],
  surface: 'page',
  tone: 'legal',
});
