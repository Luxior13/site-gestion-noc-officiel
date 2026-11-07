import type { RoadmapPlannedPage } from './types/roadmap.types';

export const MANAGEMENT_SITE_PLAN: readonly RoadmapPlannedPage[] = [
  {
    area: 'structure',
    name: 'Identité juridique',
    phase: 3,
    tabs: [
      {
        label: 'Identité',
        phase: 3,
        summary: 'Dénomination, forme, identifiants, adresse.',
      },
      {
        label: 'Mandats',
        phase: 3,
        summary: 'Qui occupe quelle fonction, lu depuis les parcours.',
      },
      {
        label: 'Assurances',
        phase: 3,
        summary:
          'Assurances, affiliations, licences, marque, et leurs échéances.',
      },
      {
        label: 'Documents',
        phase: 7,
        summary: 'Statuts et pièces officielles.',
      },
    ],
  },
  {
    area: 'structure',
    name: 'Chronologie',
    phase: 8,
    summary:
      'Lecture, sans onglet : les grands faits de la structure depuis ses débuts, saisis ou tirés des modules.',
  },
  {
    area: 'structure',
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
        phase: 6,
        summary:
          'Toutes les décisions, retrouvables sans ouvrir chaque réunion.',
      },
    ],
  },
  {
    area: 'structure',
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
        label: 'Tâches',
        phase: 6,
        summary: 'Actions issues de la réunion.',
      },
    ],
  },
  {
    area: 'structure',
    name: 'Documents',
    phase: 7,
    summary: 'Liste, sans onglet : la bibliothèque de la structure.',
  },
  {
    area: 'structure',
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
    name: 'Contrats',
    phase: 7,
    summary: 'Liste, sans onglet : contrats en cours et passés.',
  },
  {
    area: 'structure',
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
        label: 'Règlements',
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
    name: 'Incidents',
    phase: 5,
    summary: 'Liste, sans onglet, réservée aux personnes habilitées.',
  },
  {
    area: 'structure',
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
        label: 'Documents',
        phase: 7,
        summary: 'Pièces du dossier.',
      },
    ],
  },
  {
    area: 'structure',
    name: 'Bilan annuel',
    phase: 9,
    tabs: [
      {
        label: 'Membres',
        phase: 9,
        summary: 'Effectifs, arrivées et départs de l’année.',
      },
      {
        label: 'Activité',
        phase: 9,
        summary: 'Tournois, gains, décisions et événements.',
      },
      {
        label: 'Finances',
        phase: 9,
        summary: 'Recettes, dépenses et résultat de l’exercice.',
      },
    ],
  },
  {
    area: 'structure',
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
    ],
  },
  {
    area: 'structure',
    name: 'Événements & déplacements',
    phase: 10,
    summary: 'Onglets définis à son cadrage.',
  },
  {
    area: 'finance',
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
    ],
  },
  {
    area: 'finance',
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
    name: 'Opérations',
    phase: 3,
    summary:
      'Liste, sans onglet : encaissements, décaissements et virements. Recettes et dépenses sont des filtres.',
  },
  {
    area: 'finance',
    name: 'Fiche opération',
    phase: 3,
    tabs: [
      {
        label: 'Opération',
        phase: 3,
        summary:
          'Date, montant, moyen de paiement, compte, catégorie ; lien vers une personne, une organisation, un tournoi ou une adhésion.',
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
    name: 'Factures',
    phase: 4,
    summary: 'Liste, sans onglet : ventes et achats, avec leur échéance.',
  },
  {
    area: 'finance',
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
    name: 'Notes de frais',
    phase: 4,
    summary: 'Liste, sans onglet : demandes de remboursement et leur état.',
  },
  {
    area: 'finance',
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
    name: 'Budget',
    phase: 9,
    summary: 'Liste, sans onglet : les budgets, par version.',
  },
  {
    area: 'finance',
    name: 'Fiche budget',
    phase: 9,
    tabs: [
      {
        label: 'Prévisions',
        phase: 9,
        summary: 'Enveloppes par équipe ou par projet.',
      },
      {
        label: 'Suivi',
        phase: 9,
        summary: 'Réalisé, écarts et trésorerie prévue.',
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
        label: 'Profil',
        phase: null,
        summary:
          'Identité, connexion, contact ; fiche Répertoire liée (étape 2).',
      },
      {
        label: 'Autorisations',
        phase: null,
        summary: 'Rôle et autorisations du compte.',
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
    name: 'Journal d’activité',
    phase: null,
    summary: 'Liste, sans onglet : qui a fait quoi. Export à venir (étape 7).',
  },
  {
    area: 'system',
    name: 'Paramètres système',
    phase: null,
    summary:
      'Réglages, sans onglet. Accueillera la conservation des coordonnées (étape 2).',
  },
  {
    area: 'system',
    name: 'Listes de référence',
    phase: 1,
    tabs: [
      {
        label: 'Jeux',
        phase: 1,
        summary: 'Ajouter, renommer, archiver.',
      },
      {
        label: 'Fonctions',
        phase: 1,
        summary:
          'Ajouter, renommer, archiver ; réglage « Donne accès à son équipe ».',
      },
      {
        label: 'Étiquettes',
        phase: 1,
        summary: 'Repères libres pour classer les fiches.',
      },
      {
        label: 'Catégories',
        phase: 3,
        summary: 'Catégories d’opération : cotisations, sponsoring, cashprize…',
      },
      {
        label: 'Moyens de paiement',
        phase: 3,
        summary: 'Virement, espèces, carte…',
      },
      {
        label: 'Types de matériel',
        phase: 8,
        summary: 'Maillot, périphérique, licence…',
      },
    ],
  },
  {
    area: 'system',
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
    name: 'Rappels & notifications',
    phase: 10,
    summary: 'Onglets définis à son cadrage.',
  },
  {
    area: 'system',
    name: 'Feuille de route',
    phase: null,
    summary: 'Lecture, sans onglet : chantiers, pages et onglets prévus.',
  },
];
