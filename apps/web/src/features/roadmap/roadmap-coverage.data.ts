import type { RoadmapCoverageRow } from './types/roadmap.types';

/**
 * What an esport structure meets over the years, and where the site handles
 * it. A missing subject is added here before becoming a chantier.
 */
export const ROADMAP_COVERAGE: readonly RoadmapCoverageRow[] = [
  {
    chantiers: ['sport-teams'],
    subject:
      'Identité d’une personne, nationalité, adresse, identifiants de jeu, contact d’urgence',
  },
  {
    chantiers: ['sport-teams', 'compliance'],
    subject: 'Mineurs : représentants légaux, autorisations, droit à l’image',
  },
  {
    chantiers: ['sport-teams'],
    subject: 'Qui a été où, à quelle fonction, de quand à quand',
  },
  {
    chantiers: ['sport-teams'],
    subject: 'Roster des équipes de chaque jeu',
  },
  {
    chantiers: ['competitions', 'prizes'],
    subject: 'Tournois : frais, classement, participants, gains',
  },
  {
    chantiers: ['incidents'],
    subject: 'Notes, problèmes, bans, sanctions, signalements',
  },
  {
    chantiers: ['person-relationships'],
    subject: 'Adhésions et cotisations',
  },
  {
    chantiers: [
      'accounts',
      'payments',
      'invoices',
      'expenses',
      'finance-controls',
    ],
    subject: 'Recettes, dépenses, comptes, factures, frais, clôtures',
  },
  {
    chantiers: ['partnerships', 'grants'],
    subject: 'Sponsoring, subventions, dons',
  },
  {
    chantiers: ['payments', 'logistics'],
    subject: 'Ventes de la boutique et leur stock',
  },
  {
    chantiers: ['contracts'],
    subject: 'Contrats de joueurs, de staff, de partenaires',
  },
  {
    chantiers: ['hr'],
    subject: 'Salariat et paie, si la structure emploie',
  },
  {
    chantiers: ['grants'],
    subject: 'Bénévolat et valorisation des heures',
  },
  {
    chantiers: ['sport-teams', 'legal-entities', 'meetings'],
    subject: 'Assemblées, bureau, mandats, votes, statuts',
  },
  {
    chantiers: ['legal-entities'],
    subject: 'Assurances, affiliations, licences, marque',
  },
  {
    chantiers: ['legal-entities'],
    subject: 'Changement de forme juridique',
  },
  {
    chantiers: ['logistics'],
    subject: 'Matériel, maillots, prêts',
  },
  {
    chantiers: ['logistics'],
    subject: 'Comptes, domaines et abonnements de la structure',
  },
  {
    chantiers: ['onboarding'],
    subject: 'Changement de bureau, passation',
  },
  {
    chantiers: ['events'],
    subject: 'LAN, bootcamps, déplacements',
  },
  {
    chantiers: ['recruitment'],
    subject: 'Recrutement et essais',
  },
  {
    chantiers: ['sports-follow-up'],
    subject: 'Travail quotidien d’une équipe',
  },
  {
    chantiers: ['communication'],
    subject: 'Communication et visibilité',
  },
  {
    chantiers: ['internal-news', 'annual-report'],
    subject: 'Mémoire de la structure, bilan pour l’assemblée',
  },
  {
    chantiers: ['calendar', 'automations'],
    subject: 'Échéances et rappels',
  },
  {
    chantiers: ['compliance'],
    subject: 'Données personnelles, durées, effacement',
  },
  {
    chantiers: ['data'],
    subject: 'Survie des données, export, sauvegardes',
  },
  {
    chantiers: [],
    outside: 'Site public noctambule.gg',
    subject: 'Rencontres, résultats, palmarès, calendrier sportif, boutique',
  },
  {
    chantiers: [],
    outside: 'Discord',
    subject: 'Échanges quotidiens',
  },
];
