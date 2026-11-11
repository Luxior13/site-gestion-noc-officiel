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
 * Opérations, in the Finances pole (11 November 2026): money received, paid
 * and moved between two accounts. The board enters them, not only the
 * treasurer, without a validation (owner, « ok go »).
 */
export const createOperationsPermissionCategory = (
  keys: ViewManageKeys,
): PermissionCategory => ({
  accessPermissionKey: keys.VIEW,
  assignment: 'delegable',
  description:
    'L’argent reçu, versé ou passé d’un compte à l’autre, avec sa catégorie et qui a payé ou reçu.',
  icon: 'ArrowLeftRight',
  key: 'operations',
  label: 'Opérations',
  permissions: [
    permission({
      action: 'view',
      description:
        'Consulter les opérations, leurs montants, leur catégorie et qui a payé ou reçu, ici et sur les fiches qui les lisent',
      grantable: true,
      key: keys.VIEW,
      label: 'Consulter les opérations',
      module: 'Opérations',
      risk: 'sensitive',
      route: PAGE_PATHS.operations,
      surface: 'page',
    }),
    permission({
      action: 'manage',
      dependencies: [keys.VIEW],
      description:
        'Saisir, corriger ou supprimer une entrée, une sortie ou un virement',
      grantable: true,
      key: keys.MANAGE,
      label: 'Gérer les opérations',
      module: 'Opérations',
      risk: 'sensitive',
      route: PAGE_PATHS.operations,
      surface: 'page',
    }),
  ],
  poleKey: 'finance',
  routes: [PAGE_PATHS.operations],
  surface: 'page',
  tone: 'treasury',
});
