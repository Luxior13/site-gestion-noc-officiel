import type { RoadmapPlannedPage } from './types/roadmap.types';

export const MANAGEMENT_SITE_PLAN: readonly RoadmapPlannedPage[] = [
  {
    area: 'structure',
    name: 'Bureau & staff',
    phase: null,
    summary:
      'Première page du pôle Structure (9 novembre 2026), comme la fiche d’une équipe : l’effectif de la structure hors des équipes.',
    tabs: [
      {
        label: 'Effectif',
        phase: null,
        summary:
          'Le roster de la structure : qui est là et qui arrive, le bureau élu puis le staff (graphistes, monteurs, bénévoles…), dans l’ordre des fonctions, avec statut, début, fin et durée ; un passage s’ajoute, se corrige, se termine ou change de fonction avec la même fenêtre que dans le Roster d’une équipe.',
      },
      {
        label: 'Anciens membres',
        phase: null,
        summary:
          'Les passages terminés, jamais mêlés à l’Effectif : par année de fin, la plus récente d’abord ; recherche et filtre Bureau ou Staff ; un ancien membre s’ajoute ici avec ses deux dates, depuis 2014.',
      },
      {
        label: 'Fonctions',
        phase: null,
        summary:
          'Fonctions de la structure, type Bureau (mandats élus : président, trésorier, secrétaire) ou Staff (graphiste, monteur, community manager, bénévole) ; rangées par glisser-déposer ; ajouter, renommer, rendre inactive, comme les fonctions d’un jeu ; fonctions courantes en un clic quand la liste est vide.',
      },
    ],
  },
  // The legal forms over time (owner, 9 November 2026: « ok pour moi »):
  // the association today, maybe a company tomorrow, each act keeping its own.
  {
    area: 'structure',
    chantier: 'legal-entities',
    name: 'Entités',
    phase: 3,
    summary:
      'Liste, sans onglet : la suite des formes juridiques de la structure, dans le temps : « Avant l’association » (depuis 2014, sans entité), l’association, demain peut-être une société ; chacune avec sa forme, ses dates, son état et la pastille « Principale ».',
  },
  {
    area: 'structure',
    chantier: 'legal-entities',
    name: 'Fiche entité',
    phase: 3,
    tabs: [
      {
        label: 'Identité',
        phase: 3,
        summary:
          'Dénomination, forme, dates, identifiants, siège, entité principale ; paramètres fiscaux datés (TVA, reçus de dons), appliqués d’office à ses actes.',
      },
      {
        label: 'Dirigeants',
        managedIn: 'Bureau & staff',
        phase: 3,
        summary:
          'Les mandats de son bureau ou de sa direction, avec leurs dates.',
      },
      {
        label: 'Assurances',
        phase: 3,
        summary:
          'Assurances, affiliations, licences, marque, et leurs échéances.',
      },
      {
        chantier: 'documents',
        label: 'Documents',
        phase: 7,
        summary: 'Statuts et pièces officielles.',
      },
      {
        chantier: 'accounts',
        label: 'Finances',
        managedIn: 'Finances',
        phase: 3,
        summary:
          'Ses comptes et ses exercices, jamais mêlés à ceux d’une autre entité.',
      },
    ],
  },
  {
    area: 'structure',
    chantier: 'internal-news',
    name: 'Chronologie',
    phase: 8,
    summary:
      'Lecture, sans onglet : les grands faits de la structure depuis ses débuts, saisis ou tirés des modules.',
  },
  {
    area: 'structure',
    chantier: 'meetings',
    name: 'Réunions',
    phase: 6,
    tabs: [
      {
        label: 'Réunions',
        phase: 6,
        summary: 'Réunions passées et à venir.',
      },
      {
        label: 'Décisions',
        managedIn: 'Fiche réunion',
        phase: 6,
        summary:
          'Toutes les décisions, retrouvables sans ouvrir chaque réunion.',
      },
    ],
  },
  {
    area: 'structure',
    chantier: 'meetings',
    name: 'Fiche réunion',
    phase: 6,
    tabs: [
      {
        label: 'Préparation',
        phase: 6,
        summary: 'Instance, date, participants, ordre du jour.',
      },
      {
        label: 'Compte rendu',
        phase: 6,
        summary: 'Ce qui a été dit.',
      },
      {
        label: 'Décisions',
        phase: 6,
        summary: 'Décisions prises, avec portée et preuve.',
      },
      {
        chantier: 'tasks',
        label: 'Tâches',
        phase: 6,
        summary: 'Actions issues de la réunion.',
      },
    ],
  },
  {
    area: 'structure',
    chantier: 'documents',
    name: 'Documents',
    phase: 7,
    summary: 'Liste, sans onglet : la bibliothèque de la structure.',
  },
  {
    area: 'structure',
    chantier: 'documents',
    name: 'Fiche document',
    phase: 7,
    tabs: [
      {
        label: 'Document',
        phase: 7,
        summary: 'Titre, nature, état, version en vigueur.',
      },
      {
        label: 'Versions',
        phase: 7,
        summary: 'Toutes les versions et leurs dates.',
      },
      {
        label: 'Acceptations',
        phase: 7,
        summary: 'Qui a accepté quelle version, saisi par le bureau.',
      },
    ],
  },
  {
    area: 'structure',
    chantier: 'contracts',
    name: 'Contrats',
    phase: 7,
    summary: 'Liste, sans onglet : contrats en cours et passés.',
  },
  {
    area: 'structure',
    chantier: 'contracts',
    name: 'Fiche contrat',
    phase: 7,
    tabs: [
      {
        label: 'Contrat',
        phase: 7,
        summary: 'Parties, entité signataire, période, état.',
      },
      {
        label: 'Obligations',
        phase: 7,
        summary: 'Obligations, échéances et avenants.',
      },
      {
        chantier: 'payments',
        label: 'Règlements',
        managedIn: 'Finances',
        phase: 7,
        summary: 'Factures et opérations liées.',
      },
      {
        label: 'Documents',
        phase: 7,
        summary: 'Pièces signées.',
      },
    ],
  },
  {
    area: 'structure',
    chantier: 'incidents',
    name: 'Incidents',
    phase: 5,
    summary: 'Liste, sans onglet, réservée aux personnes habilitées.',
  },
  {
    area: 'structure',
    chantier: 'incidents',
    name: 'Fiche incident',
    phase: 5,
    tabs: [
      {
        label: 'Faits',
        phase: 5,
        summary: 'Signalement, personnes concernées, dates.',
      },
      {
        label: 'Instruction',
        phase: 5,
        summary: 'Preuves et échanges.',
      },
      {
        label: 'Décision',
        phase: 5,
        summary: 'Décision, recours et durée.',
      },
      {
        chantier: 'documents',
        label: 'Documents',
        phase: 7,
        summary: 'Pièces du dossier.',
      },
    ],
  },
  {
    area: 'structure',
    chantier: 'annual-report',
    name: 'Bilan annuel',
    phase: 9,
    tabs: [
      {
        label: 'Membres',
        managedIn: 'les Rosters des équipes et l’Effectif de Bureau & staff',
        phase: 9,
        summary: 'Effectifs, arrivées et départs de l’année.',
      },
      {
        label: 'Activité',
        managedIn: 'Tournois, Réunions et Déplacements',
        phase: 9,
        summary: 'Tournois, gains, décisions et événements.',
      },
      {
        label: 'Finances',
        managedIn: 'Finances',
        phase: 9,
        summary: 'Recettes, dépenses et résultat de l’exercice.',
      },
    ],
  },
  {
    area: 'structure',
    chantier: 'logistics',
    name: 'Matériel & abonnements',
    phase: 8,
    tabs: [
      {
        label: 'Matériel',
        phase: 8,
        summary: 'Inventaire, prêts, maillots et stock.',
      },
      {
        label: 'Abonnements',
        phase: 8,
        summary:
          'Services, domaines et licences : titulaire, coût, échéance, jamais de mot de passe.',
      },
      {
        label: 'Types de matériel',
        phase: 8,
        summary: 'Maillot, périphérique, licence…',
      },
    ],
  },
  {
    area: 'esport',
    chantier: 'events',
    name: 'Déplacements',
    phase: 10,
    summary:
      'Liste, sans onglet : les déplacements à venir et passés, filtrés par jeu et par équipe ; création en fenêtre.',
  },
  {
    area: 'esport',
    chantier: 'events',
    name: 'Fiche déplacement',
    phase: 10,
    tabs: [
      {
        label: 'Informations',
        phase: 10,
        summary:
          'Motif (tournoi en LAN lié ou bootcamp), lieu, dates, équipe ; dates reprises au calendrier du bureau.',
      },
      {
        label: 'Participants',
        phase: 10,
        summary:
          'Personnes du Répertoire ; un mineur sans autorisation parentale valide est signalé.',
      },
      {
        label: 'Logistique',
        phase: 10,
        summary: 'Transport, hébergement, horaires.',
      },
      {
        label: 'Budget',
        phase: 10,
        summary:
          'Budget prévu, saisi ici ; dépenses réelles lues dans les Finances (opérations, notes de frais), avec un lien.',
      },
      {
        label: 'Documents',
        phase: 10,
        summary: 'Billets, réservations, autorisations parentales.',
      },
    ],
  },
  {
    area: 'finance',
    chantier: 'accounts',
    name: 'Comptes',
    phase: 3,
    tabs: [
      {
        label: 'Comptes',
        phase: 3,
        summary: 'Comptes bancaires et caisses, avec leur solde.',
      },
      {
        label: 'Exercices',
        phase: 3,
        summary: 'Exercices ouverts et clôturés ; la clôture se fait ici.',
      },
      {
        chantier: 'payments',
        label: 'Catégories',
        phase: 3,
        summary: 'Catégories d’opération : cotisations, sponsoring, cashprize…',
      },
      {
        chantier: 'payments',
        label: 'Moyens de paiement',
        phase: 3,
        summary: 'Virement, espèces, carte…',
      },
    ],
  },
  {
    area: 'finance',
    chantier: 'accounts',
    name: 'Fiche compte',
    phase: 3,
    tabs: [
      {
        label: 'Mouvements',
        phase: 3,
        summary: 'Opérations de ce compte.',
      },
      {
        label: 'Relevés',
        phase: 3,
        summary: 'Relevés et rapprochement.',
      },
      {
        label: 'Informations',
        phase: 3,
        summary: 'Titulaire, devise, solde initial.',
      },
    ],
  },
  {
    area: 'finance',
    chantier: 'payments',
    name: 'Opérations',
    phase: 3,
    summary:
      'Liste, sans onglet : encaissements, décaissements et virements. Recettes et dépenses sont des filtres.',
  },
  {
    area: 'finance',
    chantier: 'payments',
    name: 'Fiche opération',
    phase: 3,
    tabs: [
      {
        label: 'Opération',
        phase: 3,
        summary:
          'Date, montant, moyen de paiement, compte, catégorie ; lien vers une personne, un jeu ou une équipe, une organisation, un tournoi ou une adhésion.',
      },
      {
        label: 'Affectations',
        phase: 3,
        summary: 'À quelles sommes dues elle se rapporte.',
      },
      {
        label: 'Justificatifs',
        phase: 3,
        summary: 'Pièces de l’opération.',
      },
    ],
  },
  {
    area: 'finance',
    chantier: 'invoices',
    name: 'Factures',
    phase: 4,
    summary: 'Liste, sans onglet : ventes et achats, avec leur échéance.',
  },
  {
    area: 'finance',
    chantier: 'invoices',
    name: 'Fiche facture',
    phase: 4,
    tabs: [
      {
        label: 'Facture',
        phase: 4,
        summary: 'Lignes, montants, échéance, état.',
      },
      {
        label: 'Règlements',
        phase: 4,
        summary: 'Paiements reçus ou versés, même partiels.',
      },
      {
        label: 'Justificatifs',
        phase: 4,
        summary: 'Pièces de la facture.',
      },
    ],
  },
  {
    area: 'finance',
    chantier: 'expenses',
    name: 'Notes de frais',
    phase: 4,
    summary: 'Liste, sans onglet : demandes de remboursement et leur état.',
  },
  {
    area: 'finance',
    chantier: 'expenses',
    name: 'Fiche note de frais',
    phase: 4,
    tabs: [
      {
        label: 'Demande',
        phase: 4,
        summary: 'Demandeur, lignes de frais, total.',
      },
      {
        label: 'Justificatifs',
        phase: 4,
        summary: 'Pièces de la demande.',
      },
      {
        label: 'Règlements',
        phase: 4,
        summary: 'Décision et remboursement.',
      },
    ],
  },
  {
    area: 'finance',
    chantier: 'grants',
    name: 'Subventions & dons',
    phase: 4,
    tabs: [
      {
        label: 'Subventions',
        phase: 4,
        summary: 'Dossiers de subvention et leur état.',
      },
      {
        label: 'Dons',
        phase: 4,
        summary: 'Dons reçus et reçus émis.',
      },
    ],
  },
  {
    area: 'finance',
    chantier: 'grants',
    name: 'Fiche subvention',
    phase: 4,
    tabs: [
      {
        label: 'Dossier',
        phase: 4,
        summary: 'Financeur, objet, montant demandé et accordé.',
      },
      {
        label: 'Échéances',
        phase: 4,
        summary: 'Dates de dépôt, de versement et de justification.',
      },
      {
        label: 'Règlements',
        phase: 4,
        summary: 'Versements reçus.',
      },
      {
        label: 'Justificatifs',
        phase: 4,
        summary: 'Pièces du dossier.',
      },
    ],
  },
  {
    area: 'finance',
    chantier: 'finance-controls',
    name: 'Contrôles',
    phase: 4,
    tabs: [
      {
        label: 'Pièces manquantes',
        phase: 4,
        summary: 'Opérations et factures sans justificatif.',
      },
      {
        label: 'Validations',
        phase: 4,
        summary: 'Ce qui attend une validation.',
      },
      {
        label: 'Exports',
        phase: 4,
        summary: 'Exports par exercice.',
      },
    ],
  },
  {
    area: 'finance',
    chantier: 'budget',
    name: 'Budget',
    phase: 9,
    summary: 'Liste, sans onglet : les budgets, par version.',
  },
  {
    area: 'finance',
    chantier: 'budget',
    name: 'Fiche budget',
    phase: 9,
    tabs: [
      {
        label: 'Prévisions',
        phase: 9,
        summary: 'Enveloppes par équipe ou par projet.',
      },
      {
        label: 'Réalisé',
        managedIn: 'Opérations',
        phase: 9,
        summary: 'Dépenses et recettes réelles, écarts et trésorerie prévue.',
      },
    ],
  },
  {
    area: 'system',
    name: 'Utilisateurs',
    phase: null,
    summary: 'Liste, sans onglet : les comptes, avec recherche et filtres.',
  },
  {
    area: 'system',
    name: 'Fiche utilisateur',
    phase: null,
    tabs: [
      {
        chantier: 'access-scopes',
        label: 'Profil',
        phase: null,
        summary: 'Identité, connexion, contact.',
        upcoming: 'Fiche du répertoire liée au compte.',
      },
      {
        label: 'Autorisations',
        phase: null,
        summary:
          'Rôle et autorisations du compte, et les jeux et équipes qu’il voit dans l’Esport.',
      },
      {
        label: 'Sécurité',
        phase: null,
        summary:
          'État du compte, mot de passe, double authentification, sessions.',
      },
    ],
  },
  {
    area: 'system',
    chantier: 'activity-journal',
    name: 'Journal d’activité',
    phase: null,
    summary: 'Liste, sans onglet : qui a fait quoi.',
    upcoming: 'Export CSV ou JSON des résultats filtrés.',
  },
  {
    area: 'system',
    chantier: 'compliance',
    name: 'Paramètres système',
    phase: null,
    summary: 'Réglages, sans onglet.',
    upcoming: 'Conservation des coordonnées après le départ d’une personne.',
  },
  {
    area: 'system',
    chantier: 'data',
    name: 'Données',
    phase: 2,
    tabs: [
      {
        label: 'Exports',
        phase: 2,
        summary: 'Export lisible du registre.',
      },
      {
        label: 'Sauvegardes',
        phase: 2,
        summary: 'État des sauvegardes et dernière restauration essayée.',
      },
    ],
  },
  {
    area: 'system',
    name: 'Feuille de route',
    phase: null,
    tabs: [
      {
        label: 'Chantiers',
        phase: null,
        summary:
          'Chantiers par pôle avec leur étape suggérée, dépliés sur place : première version, critère de livraison, prérequis et pages.',
      },
      {
        label: 'Pages et onglets',
        phase: null,
        summary: 'Les pages visées par pôle, leurs onglets et leur étape.',
      },
      {
        label: 'Couverture',
        phase: null,
        summary:
          'Les sujets d’une structure esport et les chantiers qui les traitent.',
      },
      {
        label: 'Ordre suggéré',
        phase: null,
        summary:
          'Les mêmes chantiers rangés par étape, pour aider à choisir le prochain.',
      },
    ],
  },
];
