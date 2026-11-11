import { PERMISSIONS } from '$constants/permissions.constants';
import { PAGE_PATHS, TEAM_RECORDS_PATH } from '$constants/routes.constants';

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
  /**
   * Other paths that belong to this page in the navigation: records opened
   * from it outside its own path (a team from the Jeux page).
   */
  matchHrefs?: readonly string[];
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
  // The legal entities, second page of the Structure pole (10 November 2026).
  entities: defineFeature({
    audit: {
      pageKey: 'entities',
      pageLabel: 'Entités',
      poleKey: 'structure',
      poleLabel: 'Structure',
    },
    availability: 'live',
    description:
      'Les formes juridiques de la structure dans le temps : l’association et la période d’avant.',
    href: PAGE_PATHS.entities,
    icon: 'Landmark',
    id: 'entities',
    keywords: [
      'association',
      'société',
      'forme juridique',
      'identité juridique',
      'SIRET',
      'RNA',
      'siège',
      'entité principale',
    ],
    label: 'Entités',
    permissionMode: 'all',
    requiredPermissions: [PERMISSIONS.ENTITIES.VIEW],
  }),
  // First page of the Finances pole (10 November 2026).
  financialAccounts: defineFeature({
    audit: {
      pageKey: 'financial-accounts',
      pageLabel: 'Comptes',
      poleKey: 'finance',
      poleLabel: 'Finances',
    },
    availability: 'live',
    description:
      'Les comptes bancaires, comptes en ligne et caisses, avec leur solde de départ.',
    href: PAGE_PATHS.financialAccounts,
    icon: 'Wallet',
    id: 'financial-accounts',
    keywords: [
      'trésorerie',
      'banque',
      'compte bancaire',
      'caisse',
      'PayPal',
      'HelloAsso',
      'solde',
      'argent',
    ],
    label: 'Comptes',
    permissionMode: 'all',
    requiredPermissions: [PERMISSIONS.FINANCIAL_ACCOUNTS.VIEW],
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
    matchHrefs: [TEAM_RECORDS_PATH],
    permissionMode: 'all',
    requiredPermissions: [PERMISSIONS.GAMES.VIEW],
  }),
  // The money of the structure, in the Finances pole (11 November 2026).
  operations: defineFeature({
    audit: {
      pageKey: 'operations',
      pageLabel: 'Opérations',
      poleKey: 'finance',
      poleLabel: 'Finances',
    },
    availability: 'live',
    description:
      'L’argent reçu, versé ou passé d’un compte à l’autre, avec sa catégorie.',
    href: PAGE_PATHS.operations,
    icon: 'ArrowLeftRight',
    id: 'operations',
    keywords: [
      'recette',
      'dépense',
      'entrée',
      'sortie',
      'virement',
      'encaissement',
      'paiement',
      'cotisation',
      'cashprize',
      'argent',
    ],
    label: 'Opérations',
    permissionMode: 'all',
    requiredPermissions: [PERMISSIONS.OPERATIONS.VIEW],
  }),
  // First page of the Relations pole (11 November 2026).
  organizations: defineFeature({
    audit: {
      pageKey: 'organizations',
      pageLabel: 'Organisations',
      poleKey: 'legal',
      poleLabel: 'Relations',
    },
    availability: 'live',
    description:
      'Sponsors, partenaires, fournisseurs, clients, organisateurs et financeurs publics, avec leurs contacts.',
    href: PAGE_PATHS.organizations,
    icon: 'Building2',
    id: 'organizations',
    keywords: [
      'sponsor',
      'partenaire',
      'fournisseur',
      'client',
      'organisateur',
      'financeur',
      'subvention',
      'tiers',
      'société',
      'contact',
    ],
    label: 'Organisations',
    permissionMode: 'all',
    requiredPermissions: [PERMISSIONS.ORGANIZATIONS.VIEW],
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
  // First page of the Structure pole (9 November 2026).
  staff: defineFeature({
    audit: {
      pageKey: 'staff',
      pageLabel: 'Bureau & staff',
      poleKey: 'structure',
      poleLabel: 'Structure',
    },
    availability: 'live',
    description:
      'L’effectif de la structure : le bureau, le staff et les bénévoles.',
    href: PAGE_PATHS.staff,
    icon: 'BriefcaseBusiness',
    id: 'staff',
    keywords: [
      'bureau',
      'staff',
      'effectif',
      'mandats',
      'président',
      'trésorier',
      'secrétaire',
      'bénévoles',
      'graphiste',
      'monteur',
    ],
    label: 'Bureau & staff',
    permissionMode: 'all',
    requiredPermissions: [PERMISSIONS.STAFF.VIEW],
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
