import { CORE_ROADMAP_ITEMS } from './roadmap-core.data';
import { OPERATIONS_ROADMAP_ITEMS } from './roadmap-operations.data';
import type {
  RoadmapArea,
  RoadmapItem,
  RoadmapPhase,
} from './types/roadmap.types';

/**
 * Seven poles, each answering one question (owner, 8 November 2026): who
 * passed through the structure, which teams and tournaments, where the money
 * stands… A list of choices lives next to what it classifies.
 */
export const ROADMAP_AREAS: readonly RoadmapArea[] = [
  {
    description:
      'Ce qui m’attend : mon travail, mes rappels, les tâches et le calendrier du bureau.',
    icon: 'LayoutDashboard',
    id: 'today',
    label: 'Aujourd’hui',
    tone: 'dashboard',
  },
  {
    description:
      'Qui est passé par la structure : répertoire, parcours, adhésions, recrutement, arrivées et départs.',
    icon: 'Users',
    id: 'people',
    label: 'Personnes',
    tone: 'internal',
  },
  {
    description:
      'Quelles équipes, quels tournois : jeux, équipes, tournois, entraînement et déplacements.',
    icon: 'Gamepad2',
    id: 'esport',
    label: 'Esport',
    tone: 'esport',
  },
  {
    description:
      'Où en est l’argent : comptes, opérations, factures, frais, subventions, budgets et contrôles.',
    icon: 'Wallet',
    id: 'finance',
    label: 'Finances',
    tone: 'treasury',
  },
  {
    description:
      'Avec qui à l’extérieur : organisations, partenariats et communication.',
    icon: 'Handshake',
    id: 'relations',
    label: 'Relations',
    tone: 'legal',
  },
  {
    description:
      'L’association et sa mémoire : identité juridique, réunions et décisions, documents, contrats, incidents, matériel.',
    icon: 'ShieldCheck',
    id: 'structure',
    label: 'Structure',
    tone: 'legal',
  },
  {
    description:
      'Le fonctionnement de l’outil : comptes utilisateurs, accès, journal, paramètres, données et feuille de route.',
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
export const getRoadmapItem = (id: string): RoadmapItem | undefined =>
  ROADMAP_ITEMS.find((item) => item.id === id);
