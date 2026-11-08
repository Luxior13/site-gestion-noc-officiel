import { PERMISSIONS } from '$constants/permissions.constants';
import { PAGE_PATHS } from '$constants/routes.constants';

type FeatureAuditLocation = Readonly<{
  pageKey: string;
  pageLabel: string;
  poleKey: string;
  poleLabel: string;
}>;

export type FeatureDefinition = Readonly<{
  audit: FeatureAuditLocation;
  availability: 'live' | 'planned';
  description: string;
  href: string;
  icon: string;
  id: string;
  /**
   * Other words people use for this page: searched by the header quick
   * navigation, never displayed (audit RR-04, 31 October 2026).
   */
  keywords: readonly string[];
  label: string;
  permissionMode: 'all' | 'any';
  requiredPermissions: readonly string[];
}>;

const defineFeature = <const TFeature extends FeatureDefinition>(
  feature: TFeature,
): TFeature => feature;

export const FEATURES = {
  dashboard: defineFeature({
    audit: {
      pageKey: 'dashboard',
      pageLabel: 'Mon travail',
      poleKey: 'dashboard',
      poleLabel: 'Aujourd’hui',
    },
    availability: 'live',
    description: 'Accueil de votre espace personnel.',
    href: PAGE_PATHS.home,
    icon: 'LayoutDashboard',
    id: 'dashboard',
    keywords: ['tableau de bord', 'dashboard'],
    label: 'Mon travail',
    permissionMode: 'all',
    requiredPermissions: [PERMISSIONS.DASHBOARD.VIEW],
  }),
  games: defineFeature({
    audit: {
      pageKey: 'games',
      pageLabel: 'Jeux',
      poleKey: 'esport',
      poleLabel: 'Esport',
    },
    availability: 'live',
    description: 'Les jeux de la structure, une section par jeu.',
    href: PAGE_PATHS.games,
    icon: 'Gamepad2',
    id: 'games',
    keywords: ['sections', 'esport', 'jeux vidéo'],
    label: 'Jeux',
    permissionMode: 'all',
    requiredPermissions: [PERMISSIONS.GAMES.VIEW],
  }),
  persons: defineFeature({
    audit: {
      pageKey: 'persons',
      pageLabel: 'Répertoire',
      poleKey: 'internal',
      poleLabel: 'Personnes',
    },
    availability: 'live',
    description: 'Personnes et contacts de la structure.',
    href: PAGE_PATHS.persons,
    icon: 'Users',
    id: 'persons',
    keywords: ['membres', 'fiches', 'annuaire', 'profils', 'coordonnées'],
    label: 'Répertoire',
    permissionMode: 'all',
    requiredPermissions: [PERMISSIONS.PERSONS.VIEW],
  }),
  roadmap: defineFeature({
    audit: {
      pageKey: 'roadmap',
      pageLabel: 'Feuille de route',
      poleKey: 'system',
      poleLabel: 'Système',
    },
    availability: 'live',
    description: 'Fonctionnalités prévues et état de leur préparation.',
    href: PAGE_PATHS.roadmap,
    icon: 'ClipboardList',
    id: 'roadmap',
    keywords: ['roadmap', 'à venir', 'évolutions'],
    label: 'Feuille de route',
    permissionMode: 'all',
    requiredPermissions: [],
  }),
  systemActivity: defineFeature({
    audit: {
      pageKey: 'system-activity',
      pageLabel: 'Journal d’activité',
      poleKey: 'system',
      poleLabel: 'Système',
    },
    availability: 'live',
    description: 'Qui a fait quoi, quand et sur quel dossier.',
    href: PAGE_PATHS.systemActivity,
    icon: 'History',
    id: 'system-activity',
    keywords: ['historique', 'logs', 'audit', 'traces', 'connexions'],
    label: 'Journal d’activité',
    permissionMode: 'all',
    requiredPermissions: [PERMISSIONS.AUDIT.VIEW],
  }),
  systemSettings: defineFeature({
    audit: {
      pageKey: 'system-settings',
      pageLabel: 'Paramètres système',
      poleKey: 'system',
      poleLabel: 'Système',
    },
    availability: 'live',
    description: 'Configuration globale de la conservation des données.',
    href: PAGE_PATHS.systemSettings,
    icon: 'Settings',
    id: 'system-settings',
    keywords: ['réglages'],
    label: 'Paramètres système',
    permissionMode: 'all',
    requiredPermissions: [PERMISSIONS.SETTINGS.VIEW],
  }),
  users: defineFeature({
    audit: {
      pageKey: 'users',
      pageLabel: 'Utilisateurs',
      poleKey: 'system',
      poleLabel: 'Système',
    },
    availability: 'live',
    description: 'Comptes, rôles et autorisations administratives.',
    href: PAGE_PATHS.users,
    icon: 'Users',
    id: 'users',
    keywords: ['droits', 'permissions', 'accès'],
    label: 'Utilisateurs',
    permissionMode: 'all',
    requiredPermissions: [PERMISSIONS.USERS.VIEW],
  }),
} as const;

type FeatureKey = keyof typeof FEATURES;
export type FeatureId = (typeof FEATURES)[FeatureKey]['id'];

export const FEATURE_LIST = Object.values(FEATURES);

export const getFeatureById = (id: string): FeatureDefinition | null =>
  FEATURE_LIST.find((feature) => feature.id === id) ?? null;
