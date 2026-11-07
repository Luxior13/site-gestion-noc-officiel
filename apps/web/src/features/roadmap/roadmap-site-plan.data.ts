import type { RoadmapPlannedPage } from './types/roadmap.types';

/**
 * Every page of the target site, with its planned tabs. `phase: null` means
 * already delivered. docs/propositions/feuille-de-route.md prints the same plan.
 */
export const ROADMAP_SITE_PLAN: readonly RoadmapPlannedPage[] = [
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
    phase: 3,
    summary:
      'Liste, sans onglet : les tâches du bureau, avec le filtre « Mes tâches ». Détail en fenêtre.',
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
      'Liste, sans onglet : toutes les fiches, avec recherche et filtres.',
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
          'Pseudo, nom, naissance, statut, jeux pratiqués (étape 1), zone dangereuse.',
      },
      {
        label: 'Coordonnées',
        phase: null,
        summary: 'Emails, téléphones, réseaux sociaux.',
      },
      {
        label: 'Parcours',
        phase: 1,
        summary:
          'Passages datés : équipe ou structure, fonction, début, fin ; anciens pseudos.',
      },
      {
        label: 'Adhésions',
        phase: 2,
        summary: 'Adhésions par campagne et état de cotisation.',
      },
      {
        label: 'Documents',
        phase: 3,
        summary: 'Pièces liées à la personne.',
      },
      {
        label: 'Sanctions',
        phase: 3,
        summary: 'Sanctions et bans datés, réservés aux personnes habilitées.',
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
        label: 'Informations',
        phase: 1,
        summary: 'Nom, jeu, archivage.',
      },
    ],
  },
  {
    area: 'people',
    name: 'Adhésions',
    phase: 2,
    tabs: [
      {
        label: 'Adhérents',
        phase: 2,
        summary: 'Adhésions de la campagne choisie et état de cotisation.',
      },
      {
        label: 'Campagnes',
        phase: 2,
        summary: 'Périodes d’adhésion et leurs conditions.',
      },
    ],
  },
  {
    area: 'people',
    name: 'Recrutement',
    phase: 5,
    summary: 'Onglets définis à son cadrage.',
  },
  {
    area: 'people',
    name: 'Arrivées et départs',
    phase: 5,
    summary: 'Onglets définis à son cadrage.',
  },
  {
    area: 'relations',
    name: 'Organisations',
    phase: 2,
    summary:
      'Liste, sans onglet : partenaires, sponsors, clients et fournisseurs.',
  },
  {
    area: 'relations',
    name: 'Fiche organisation',
    phase: 2,
    tabs: [
      {
        label: 'Identité',
        phase: 2,
        summary: 'Nom, type, adresse, identifiants.',
      },
      {
        label: 'Contacts',
        phase: 2,
        summary: 'Interlocuteurs, liés aux fiches du Répertoire.',
      },
      {
        label: 'Règlements',
        phase: 2,
        summary: 'Factures et opérations liées.',
      },
      {
        label: 'Contrats',
        phase: 3,
        summary: 'Contrats et partenariats en cours et passés.',
      },
    ],
  },
  {
    area: 'relations',
    name: 'Partenariats',
    phase: 3,
    summary: 'Liste, sans onglet : opportunités et accords.',
  },
  {
    area: 'relations',
    name: 'Fiche partenariat',
    phase: 3,
    tabs: [
      {
        label: 'Accord',
        phase: 3,
        summary: 'Parties, période, contreparties, état.',
      },
      {
        label: 'Livrables',
        phase: 3,
        summary: 'Ce qui est promis, livré ou à renouveler.',
      },
      {
        label: 'Documents',
        phase: 3,
        summary: 'Pièces liées à l’accord.',
      },
    ],
  },
  {
    area: 'relations',
    name: 'Communication',
    phase: 5,
    summary: 'Onglets définis à son cadrage.',
  },
  {
    area: 'structure',
    name: 'Identité juridique',
    phase: 2,
    tabs: [
      {
        label: 'Identité',
        phase: 2,
        summary: 'Dénomination, forme, identifiants, adresse.',
      },
      {
        label: 'Mandats',
        phase: 2,
        summary: 'Qui occupe quelle fonction, lu depuis les parcours.',
      },
      {
        label: 'Assurances',
        phase: 2,
        summary: 'Assurances, affiliations, licences et leurs échéances.',
      },
      {
        label: 'Documents',
        phase: 3,
        summary: 'Statuts et pièces officielles.',
      },
    ],
  },
  {
    area: 'structure',
    name: 'Réunions',
    phase: 3,
    tabs: [
      {
        label: 'Réunions',
        phase: 3,
        summary: 'Réunions passées et à venir.',
      },
      {
        label: 'Décisions',
        phase: 3,
        summary:
          'Toutes les décisions, retrouvables sans ouvrir chaque réunion.',
      },
    ],
  },
  {
    area: 'structure',
    name: 'Fiche réunion',
    phase: 3,
    tabs: [
      {
        label: 'Préparation',
        phase: 3,
        summary: 'Instance, date, participants, ordre du jour.',
      },
      {
        label: 'Compte rendu',
        phase: 3,
        summary: 'Ce qui a été dit.',
      },
      {
        label: 'Décisions',
        phase: 3,
        summary: 'Décisions prises, avec portée et preuve.',
      },
      {
        label: 'Tâches',
        phase: 3,
        summary: 'Actions issues de la réunion.',
      },
    ],
  },
  {
    area: 'structure',
    name: 'Documents',
    phase: 3,
    summary: 'Liste, sans onglet : la bibliothèque de la structure.',
  },
  {
    area: 'structure',
    name: 'Fiche document',
    phase: 3,
    tabs: [
      {
        label: 'Document',
        phase: 3,
        summary: 'Titre, nature, état, version en vigueur.',
      },
      {
        label: 'Versions',
        phase: 3,
        summary: 'Toutes les versions et leurs dates.',
      },
      {
        label: 'Acceptations',
        phase: 3,
        summary: 'Qui a accepté quelle version, saisi par le bureau.',
      },
    ],
  },
  {
    area: 'structure',
    name: 'Contrats',
    phase: 3,
    summary: 'Liste, sans onglet : contrats en cours et passés.',
  },
  {
    area: 'structure',
    name: 'Fiche contrat',
    phase: 3,
    tabs: [
      {
        label: 'Contrat',
        phase: 3,
        summary: 'Parties, entité signataire, période, état.',
      },
      {
        label: 'Obligations',
        phase: 3,
        summary: 'Obligations, échéances et avenants.',
      },
      {
        label: 'Règlements',
        phase: 3,
        summary: 'Factures et opérations liées.',
      },
      {
        label: 'Documents',
        phase: 3,
        summary: 'Pièces signées.',
      },
    ],
  },
  {
    area: 'structure',
    name: 'Incidents',
    phase: 3,
    summary: 'Liste, sans onglet, réservée aux personnes habilitées.',
  },
  {
    area: 'structure',
    name: 'Fiche incident',
    phase: 3,
    tabs: [
      {
        label: 'Faits',
        phase: 3,
        summary: 'Signalement, personnes concernées, dates.',
      },
      {
        label: 'Instruction',
        phase: 3,
        summary: 'Preuves et échanges.',
      },
      {
        label: 'Décision',
        phase: 3,
        summary: 'Décision, recours et durée.',
      },
      {
        label: 'Documents',
        phase: 3,
        summary: 'Pièces du dossier.',
      },
    ],
  },
  {
    area: 'structure',
    name: 'Ressources & logistique',
    phase: 5,
    summary: 'Onglets définis à son cadrage.',
  },
  {
    area: 'finance',
    name: 'Comptes',
    phase: 2,
    tabs: [
      {
        label: 'Comptes',
        phase: 2,
        summary: 'Comptes bancaires et caisses, avec leur solde.',
      },
      {
        label: 'Exercices',
        phase: 2,
        summary: 'Exercices ouverts et clôturés ; la clôture se fait ici.',
      },
    ],
  },
  {
    area: 'finance',
    name: 'Fiche compte',
    phase: 2,
    tabs: [
      {
        label: 'Mouvements',
        phase: 2,
        summary: 'Opérations de ce compte.',
      },
      {
        label: 'Relevés',
        phase: 2,
        summary: 'Relevés et rapprochement.',
      },
      {
        label: 'Informations',
        phase: 2,
        summary: 'Titulaire, devise, solde initial.',
      },
    ],
  },
  {
    area: 'finance',
    name: 'Opérations',
    phase: 2,
    summary:
      'Liste, sans onglet : encaissements, décaissements et virements. Recettes et dépenses sont des filtres.',
  },
  {
    area: 'finance',
    name: 'Fiche opération',
    phase: 2,
    tabs: [
      {
        label: 'Opération',
        phase: 2,
        summary: 'Date, montant, compte, catégorie, tiers.',
      },
      {
        label: 'Affectations',
        phase: 2,
        summary: 'À quelles sommes dues elle se rapporte.',
      },
      {
        label: 'Justificatifs',
        phase: 2,
        summary: 'Pièces de l’opération.',
      },
    ],
  },
  {
    area: 'finance',
    name: 'Factures',
    phase: 2,
    summary: 'Liste, sans onglet : ventes et achats, avec leur échéance.',
  },
  {
    area: 'finance',
    name: 'Fiche facture',
    phase: 2,
    tabs: [
      {
        label: 'Facture',
        phase: 2,
        summary: 'Lignes, montants, échéance, état.',
      },
      {
        label: 'Règlements',
        phase: 2,
        summary: 'Paiements reçus ou versés, même partiels.',
      },
      {
        label: 'Justificatifs',
        phase: 2,
        summary: 'Pièces de la facture.',
      },
    ],
  },
  {
    area: 'finance',
    name: 'Notes de frais',
    phase: 2,
    summary: 'Liste, sans onglet : demandes de remboursement et leur état.',
  },
  {
    area: 'finance',
    name: 'Fiche note de frais',
    phase: 2,
    tabs: [
      {
        label: 'Demande',
        phase: 2,
        summary: 'Demandeur, lignes de frais, total.',
      },
      {
        label: 'Justificatifs',
        phase: 2,
        summary: 'Pièces de la demande.',
      },
      {
        label: 'Règlements',
        phase: 2,
        summary: 'Décision et remboursement.',
      },
    ],
  },
  {
    area: 'finance',
    name: 'Contrôles',
    phase: 2,
    tabs: [
      {
        label: 'Pièces manquantes',
        phase: 2,
        summary: 'Opérations et factures sans justificatif.',
      },
      {
        label: 'Validations',
        phase: 2,
        summary: 'Ce qui attend une validation.',
      },
      {
        label: 'Exports',
        phase: 2,
        summary: 'Exports par exercice.',
      },
    ],
  },
  {
    area: 'finance',
    name: 'Budget',
    phase: 4,
    summary: 'Liste, sans onglet : les budgets, par version.',
  },
  {
    area: 'finance',
    name: 'Fiche budget',
    phase: 4,
    tabs: [
      {
        label: 'Prévisions',
        phase: 4,
        summary: 'Enveloppes par équipe ou par projet.',
      },
      {
        label: 'Suivi',
        phase: 4,
        summary: 'Réalisé, écarts et trésorerie prévue.',
      },
    ],
  },
  {
    area: 'finance',
    name: 'Gains & primes',
    phase: 5,
    summary: 'Onglets définis à son cadrage.',
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
          'Identité, connexion, contact ; fiche Répertoire liée (étape 1).',
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
    summary: 'Liste, sans onglet : qui a fait quoi. Export à venir (étape 3).',
  },
  {
    area: 'system',
    name: 'Paramètres système',
    phase: null,
    summary:
      'Réglages, sans onglet. Accueillera la conservation des coordonnées (étape 1).',
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
    ],
  },
  {
    area: 'system',
    name: 'Données',
    phase: 1,
    tabs: [
      {
        label: 'Exports',
        phase: 1,
        summary: 'Export lisible du registre.',
      },
      {
        label: 'Sauvegardes',
        phase: 1,
        summary: 'État des sauvegardes et dernière restauration essayée.',
      },
    ],
  },
  {
    area: 'system',
    name: 'Rappels & notifications',
    phase: 5,
    summary: 'Onglets définis à son cadrage.',
  },
  {
    area: 'system',
    name: 'Feuille de route',
    phase: null,
    summary: 'Lecture, sans onglet : chantiers, pages et onglets prévus.',
  },
];
