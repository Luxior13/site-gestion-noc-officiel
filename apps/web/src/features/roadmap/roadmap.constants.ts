import { CORE_ROADMAP_ITEMS } from './roadmap-core.data';
import { OPERATIONS_ROADMAP_ITEMS } from './roadmap-operations.data';
import type {
  RoadmapArea,
  RoadmapItem,
  RoadmapKind,
  RoadmapPhase,
  RoadmapStatus,
} from './types/roadmap.types';

export const ROADMAP_AREAS: readonly RoadmapArea[] = [
  {
    description: 'Mon travail, mes tâches et ce qui m’attend.',
    icon: 'LayoutDashboard',
    id: 'today',
    label: 'Aujourd’hui',
    tone: 'dashboard',
  },
  {
    description: 'Répertoire, équipes, parcours et adhésions des membres.',
    icon: 'Users',
    id: 'people',
    label: 'Membres',
    tone: 'internal',
  },
  {
    description:
      'Organisations externes, partenariats et engagements commerciaux.',
    icon: 'Handshake',
    id: 'relations',
    label: 'Relations',
    tone: 'legal',
  },
  {
    description:
      'Identité juridique, réunions, décisions, documents et confidentialité.',
    icon: 'ShieldCheck',
    id: 'structure',
    label: 'Structure',
    tone: 'legal',
  },
  {
    description: 'Comptes, factures, paiements, budgets et contrôles.',
    icon: 'Wallet',
    id: 'finance',
    label: 'Finances',
    tone: 'treasury',
  },
  {
    description:
      'Accès, configuration, listes de référence, données et intégrations.',
    icon: 'Settings',
    id: 'system',
    label: 'Système',
    tone: 'system',
  },
];
export const ROADMAP_PHASES: readonly RoadmapPhase[] = [
  {
    description:
      'Savoir qui est passé dans la structure, à quelle fonction et dans quelle équipe.',
    id: 1,
    label: 'Listes & parcours',
  },
  {
    description:
      'Ouvrir le site aux managers et garder le registre dans la durée.',
    id: 2,
    label: 'Accès & conservation',
  },
  {
    description: 'Suivre les comptes et l’argent réellement reçu ou versé.',
    id: 3,
    label: 'Socle de trésorerie',
  },
  {
    description:
      'Couvrir factures, frais, subventions, adhésions et contrôles.',
    id: 4,
    label: 'Trésorerie complète',
  },
  {
    description:
      'Garder le dossier de chaque tournoi et le suivi des personnes.',
    id: 5,
    label: 'Tournois & suivi',
  },
  {
    description: 'Suivre les tâches, les dates et les décisions.',
    id: 6,
    label: 'Vie du bureau',
  },
  {
    description: 'Retrouver les pièces et ce que la structure a promis.',
    id: 7,
    label: 'Documents & engagements',
  },
  {
    description:
      'Transmettre le matériel, les accès et l’histoire de la structure.',
    id: 8,
    label: 'Mémoire & continuité',
  },
  {
    description: 'Exploiter des données fiables pour décider.',
    id: 9,
    label: 'Pilotage',
  },
  {
    description:
      'Ajouter ce qui répond à un usage réel, sans le construire d’avance.',
    id: 10,
    label: 'Selon les besoins',
  },
];
export const ROADMAP_ITEMS: readonly RoadmapItem[] = [
  ...CORE_ROADMAP_ITEMS,
  ...OPERATIONS_ROADMAP_ITEMS,
];
export const ROADMAP_STATUS_LABELS: Record<RoadmapStatus, string> = {
  partial: 'À compléter',
  planned: 'À cadrer',
};
export const ROADMAP_KIND_LABELS: Record<RoadmapKind, string> = {
  extension: 'Extension',
  integration: 'Intégration',
  module: 'Module',
  view: 'Vue partagée',
};

export const getRoadmapItem = (id: string): RoadmapItem | undefined =>
  ROADMAP_ITEMS.find((item) => item.id === id);
