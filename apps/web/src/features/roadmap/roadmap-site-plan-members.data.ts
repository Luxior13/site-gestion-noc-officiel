import type { RoadmapPlannedPage } from './types/roadmap.types';

export const MEMBERS_SITE_PLAN: readonly RoadmapPlannedPage[] = [
  {
    area: 'today',
    name: 'Mon travail',
    phase: null,
    summary:
      'Accueil, sans onglet. Accueillera mes tâches, mes réunions à venir, les documents en attente et les échéances proches.',
  },
  {
    area: 'today',
    name: 'Tâches',
    phase: 6,
    summary:
      'Liste, sans onglet : les tâches du bureau, avec le filtre « Mes tâches ». Détail en fenêtre.',
  },
  {
    area: 'today',
    name: 'Calendrier',
    phase: 6,
    summary:
      'Lecture, sans onglet : réunions, échéances, renouvellements et dates limites, lus depuis leurs modules.',
  },
  {
    area: 'today',
    name: 'Mon compte',
    phase: null,
    summary: 'Depuis le menu du compte, pas dans un pôle.',
    tabs: [
      {
        label: 'Profil',
        phase: null,
        summary: 'Prénom, nom, identifiant, email de contact.',
      },
      {
        label: 'Autorisations',
        phase: null,
        summary: 'Ce que mon compte permet, en lecture seule.',
      },
      {
        label: 'Sécurité',
        phase: null,
        summary: 'Mot de passe, double authentification, sessions.',
      },
    ],
  },
  {
    area: 'people',
    name: 'Répertoire',
    phase: null,
    summary:
      'Liste, sans onglet : toutes les fiches, avec recherche et filtres. À venir (étape 1) : filtres par équipe, jeu, étiquette et anciens membres.',
  },
  {
    area: 'people',
    name: 'Fiche personne',
    phase: null,
    tabs: [
      {
        label: 'Identité',
        phase: null,
        summary:
          'Pseudo, nom, naissance, zone dangereuse ; statut calculé depuis le parcours, nationalité, jeux pratiqués et étiquettes (étape 1).',
      },
      {
        label: 'Coordonnées',
        phase: null,
        summary:
          'Emails, téléphones, réseaux sociaux ; adresse, identifiants de jeu, contact d’urgence et représentants légaux (étape 1).',
      },
      {
        label: 'Parcours',
        phase: 1,
        summary:
          'Passages datés : équipe ou structure, fonction, début, fin, motif de fin ; tournois joués ; anciens pseudos.',
      },
      {
        label: 'Adhésions',
        phase: 4,
        summary: 'Adhésions par campagne et état de cotisation.',
      },
      {
        label: 'Finances',
        phase: 4,
        summary: 'Cotisations réglées, remboursements et gains versés.',
      },
      {
        label: 'Documents',
        phase: 7,
        summary: 'Contrats, autorisations et chartes acceptées.',
      },
      {
        label: 'Matériel',
        phase: 8,
        summary: 'Prêts et restitutions, taille de maillot.',
      },
      {
        label: 'Suivi',
        phase: 5,
        summary:
          'Notes datées, problèmes et bans, par tournoi ou par jeu, réservés aux personnes habilitées.',
      },
    ],
  },
  {
    area: 'people',
    name: 'Équipes',
    phase: 1,
    summary:
      'Liste, sans onglet : les équipes par jeu, actives ou archivées. Création en fenêtre.',
  },
  {
    area: 'people',
    name: 'Fiche équipe',
    phase: 1,
    tabs: [
      {
        label: 'Effectif',
        phase: 1,
        summary:
          'Membres actuels et anciens, composition à une date. Seul onglet d’un manager.',
      },
      {
        label: 'Tournois',
        phase: 5,
        summary: 'Tournois joués par cette équipe.',
      },
      {
        label: 'Informations',
        phase: 1,
        summary: 'Nom, anciens noms, jeu, archivage.',
      },
    ],
  },
  {
    area: 'people',
    name: 'Adhésions',
    phase: 4,
    tabs: [
      {
        label: 'Adhérents',
        phase: 4,
        summary: 'Adhésions de la campagne choisie et état de cotisation.',
      },
      {
        label: 'Campagnes',
        phase: 4,
        summary: 'Périodes d’adhésion et leurs conditions.',
      },
    ],
  },
  {
    area: 'people',
    name: 'Tournois',
    phase: 5,
    summary:
      'Liste, sans onglet : les tournois, par jeu et par année. Création en fenêtre.',
  },
  {
    area: 'people',
    name: 'Fiche tournoi',
    phase: 5,
    tabs: [
      {
        label: 'Informations',
        phase: 5,
        summary:
          'Nom, jeu, organisateur, dates, règlement, frais, échéances, classement final.',
      },
      {
        label: 'Participants',
        phase: 5,
        summary: 'Équipes et membres engagés.',
      },
      {
        label: 'Gains',
        phase: 5,
        summary: 'Montants annoncés, confirmés et reçus, et leur répartition.',
      },
      {
        label: 'Suivi',
        phase: 5,
        summary:
          'Problèmes et bans liés à ce tournoi, réservés aux personnes habilitées.',
      },
    ],
  },
  {
    area: 'people',
    name: 'Recrutement',
    phase: 10,
    summary: 'Onglets définis à son cadrage.',
  },
  {
    area: 'people',
    name: 'Suivi sportif',
    phase: 10,
    summary: 'Onglets définis à son cadrage.',
  },
  {
    area: 'people',
    name: 'Salariés & paie',
    phase: 10,
    summary: 'Onglets définis à son cadrage.',
  },
  {
    area: 'people',
    name: 'Arrivées, départs & passations',
    phase: 8,
    tabs: [
      {
        label: 'Dossiers',
        phase: 8,
        summary:
          'Arrivées, départs et passations en cours, avec leur checklist.',
      },
      {
        label: 'Modèles',
        phase: 8,
        summary: 'Checklists types.',
      },
    ],
  },
  {
    area: 'relations',
    name: 'Organisations',
    phase: 3,
    summary:
      'Liste, sans onglet : partenaires, sponsors, clients et fournisseurs.',
  },
  {
    area: 'relations',
    name: 'Fiche organisation',
    phase: 3,
    tabs: [
      {
        label: 'Identité',
        phase: 3,
        summary: 'Nom, type, adresse, identifiants.',
      },
      {
        label: 'Contacts',
        phase: 3,
        summary: 'Interlocuteurs, liés aux fiches du Répertoire.',
      },
      {
        label: 'Règlements',
        phase: 3,
        summary: 'Factures et opérations liées.',
      },
      {
        label: 'Contrats',
        phase: 7,
        summary: 'Contrats et partenariats en cours et passés.',
      },
    ],
  },
  {
    area: 'relations',
    name: 'Partenariats',
    phase: 7,
    summary: 'Liste, sans onglet : opportunités et accords.',
  },
  {
    area: 'relations',
    name: 'Fiche partenariat',
    phase: 7,
    tabs: [
      {
        label: 'Accord',
        phase: 7,
        summary: 'Parties, période, contreparties, état.',
      },
      {
        label: 'Livrables',
        phase: 7,
        summary: 'Ce qui est promis, livré ou à renouveler.',
      },
      {
        label: 'Documents',
        phase: 7,
        summary: 'Pièces liées à l’accord.',
      },
    ],
  },
  {
    area: 'relations',
    name: 'Communication',
    phase: 10,
    summary: 'Onglets définis à son cadrage.',
  },
];
