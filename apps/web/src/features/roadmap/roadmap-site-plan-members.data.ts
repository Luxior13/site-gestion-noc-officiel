import type { RoadmapPlannedPage } from './types/roadmap.types';

export const MEMBERS_SITE_PLAN: readonly RoadmapPlannedPage[] = [
  {
    area: 'today',
    chantier: 'personal-work',
    name: 'Mon travail',
    phase: null,
    summary: 'Accueil, sans onglet.',
    upcoming:
      'Mes tâches, mes réunions à venir, les documents en attente et les échéances proches.',
  },
  {
    area: 'today',
    chantier: 'tasks',
    name: 'Tâches',
    phase: 6,
    summary:
      'Liste, sans onglet : les tâches du bureau, avec le filtre « Mes tâches ». Détail en fenêtre.',
  },
  {
    area: 'today',
    chantier: 'calendar',
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
    chantier: 'sport-teams',
    name: 'Répertoire',
    phase: null,
    summary:
      'Liste, sans onglet : toutes les fiches, avec recherche et filtres.',
    upcoming: 'Filtres par équipe, jeu et anciens membres.',
  },
  {
    area: 'people',
    name: 'Fiche personne',
    phase: null,
    tabs: [
      {
        chantier: 'sport-teams',
        label: 'Identité',
        phase: null,
        summary: 'Pseudo, nom, naissance, zone dangereuse.',
        upcoming:
          'Statut calculé depuis le parcours, nationalité, jeux pratiqués et anciens pseudos, y compris ceux d’avant le site.',
      },
      {
        chantier: 'sport-teams',
        label: 'Coordonnées',
        phase: null,
        summary: 'Emails, téléphones, réseaux sociaux.',
        upcoming:
          'Adresse, identifiants de jeu, contact d’urgence et représentants légaux.',
      },
      {
        chantier: 'sport-teams',
        label: 'Parcours',
        managedIn: 'le Roster de chaque équipe et l’Effectif de Bureau & staff',
        phase: 1,
        summary:
          'Passages datés : équipe ou structure, fonction, début et fin ; tournois joués. Chaque ligne ouvre son équipe ou Bureau & staff.',
      },
      {
        chantier: 'person-relationships',
        label: 'Adhésions',
        managedIn: 'Adhésions',
        phase: 4,
        summary: 'Adhésions par campagne et état de cotisation.',
      },
      {
        chantier: 'person-relationships',
        label: 'Finances',
        managedIn: 'Finances',
        phase: 4,
        summary: 'Cotisations réglées, remboursements et gains versés.',
      },
      {
        chantier: 'documents',
        label: 'Documents',
        managedIn: 'Documents et Contrats',
        phase: 7,
        summary: 'Contrats, autorisations et chartes acceptées.',
      },
      {
        chantier: 'logistics',
        label: 'Matériel',
        managedIn: 'Matériel & abonnements',
        phase: 8,
        summary: 'Prêts et restitutions, taille de maillot.',
      },
      {
        chantier: 'incidents',
        label: 'Suivi',
        phase: 5,
        summary:
          'Notes, sanctions de la structure (tous ses tournois ou un jeu, motif, durée, levée) et bans externes qui dépassent un tournoi ; les problèmes et bans d’un tournoi y figurent aussi, saisis dans sa fiche. Réservé aux personnes habilitées.',
      },
    ],
  },
  {
    area: 'esport',
    chantier: 'sport-teams',
    name: 'Jeux',
    phase: null,
    summary:
      'Liste, sans onglet : les sections de la structure, les actives en tête, chacune avec une icône de manette par défaut, avec recherche et filtre ; ajout et modification en fenêtre (nom, nom court, première ouverture, actif), renommer seulement pour corriger une faute. C’est aussi la liste de choix des jeux.',
    upcoming:
      'Les équipes sous chaque jeu : une équipe ouvre sa fiche et son roster en un clic, le nom du jeu ouvre sa fiche ; l’image de chaque jeu à la place de la manette.',
  },
  {
    area: 'esport',
    chantier: 'sport-teams',
    name: 'Fiche jeu',
    phase: 1,
    tabs: [
      {
        label: 'Équipes',
        phase: 1,
        summary:
          'Les équipes de ce jeu (principale, académie…), actives ou archivées, avec leurs joueurs actuels ; création en fenêtre ; chaque ligne ouvre sa fiche.',
      },
      {
        chantier: 'payments',
        label: 'Finances',
        managedIn: 'Finances',
        phase: 3,
        summary:
          'Total de la section : ses équipes, plus les opérations liées au jeu lui-même (licence, matériel commun) ; détaillé par équipe.',
      },
      {
        chantier: 'reference-lists',
        label: 'Fonctions',
        phase: 1,
        summary:
          'Les fonctions de ce jeu : joueur, remplaçant, coach, manager, ou des postes propres au jeu ; réglage « Donne accès à son équipe » ; ajouter, renommer, archiver.',
      },
    ],
  },
  {
    area: 'esport',
    chantier: 'sport-teams',
    name: 'Fiche équipe',
    phase: 1,
    tabs: [
      {
        label: 'Roster',
        phase: 1,
        summary:
          'Joueurs et encadrement actuels et anciens, avec début et fin ; composition à une date ; on y ajoute ou termine un passage. Date de fin de contrat affichée seule, lue dans les contrats (étape 7). Seule fiche d’un manager, en lecture.',
      },
      {
        chantier: 'competitions',
        label: 'Tournois',
        managedIn: 'Tournois',
        phase: 5,
        summary:
          'Tournois joués par cette équipe, avec son classement. Un manager les voit et crée ceux de son équipe, sans les gains ni le Suivi.',
      },
      {
        chantier: 'sports-follow-up',
        label: 'Entraînements',
        phase: 10,
        summary:
          'Séances : date, type (entraînement, scrim, bootcamp), présents, objectif ou débrief court ; nombre de séances et de présents par saison, pour le bilan et les subventions. Un manager remplit celles de son équipe.',
      },
      {
        chantier: 'payments',
        label: 'Finances',
        managedIn: 'Finances',
        phase: 3,
        summary:
          'Ce que l’équipe coûte et rapporte : inscriptions, gains, déplacements et autres opérations liées à l’équipe ; enveloppe de budget comparée au réalisé. Invisible pour un manager.',
      },
      {
        chantier: 'partnerships',
        label: 'Partenaires',
        managedIn: 'Partenariats',
        phase: 7,
        summary:
          'Les partenaires qui soutiennent cette équipe et ce qu’elle leur doit (logo sur le maillot, publications, présence). Un manager les voit, sans les montants.',
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
    chantier: 'person-relationships',
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
    area: 'esport',
    chantier: 'competitions',
    name: 'Tournois',
    phase: 5,
    summary:
      'Liste, sans onglet : les tournois, filtrés par jeu, équipe, année et état (à venir, en cours, terminé, calculé depuis les dates) ; chaque ligne : nom, jeu, équipes, dates, état, classement. Création en fenêtre : nom, jeu, dates, organisateur. Un manager crée ceux de son équipe.',
  },
  {
    area: 'esport',
    chantier: 'competitions',
    name: 'Fiche tournoi',
    phase: 5,
    tabs: [
      {
        label: 'Informations',
        phase: 5,
        summary:
          'Nom, jeu, organisateur (sa fiche organisation), circuit ou ligue facultatif, en ligne ou LAN (lieu et déplacement lié), dates, règles du tournoi (lien ou pièce), frais d’inscription, échéances (inscription, dépôt du roster, check-in) reprises au calendrier ; état calculé depuis les dates.',
      },
      {
        label: 'Participants',
        phase: 5,
        summary:
          'Pour chacune de nos équipes engagées : line-up (membres engagés, remplaçants compris) et classement final. Une sanction de la structure en cours refuse l’inscription, avec son motif ; un ban externe du même jeu, organisateur ou circuit avertit. Un manager remplit ceux de son équipe.',
      },
      {
        chantier: 'prizes',
        label: 'Gains',
        phase: 5,
        summary:
          'Par équipe : montant annoncé, montant confirmé et répartition prévue entre les joueurs, saisis ici ; argent reçu et parts versées lus dans les Finances, avec un lien. Un résultat ne crée aucun encaissement.',
      },
      {
        chantier: 'incidents',
        label: 'Suivi',
        phase: 5,
        summary:
          'Problèmes et bans survenus pendant ce tournoi, saisis ici et visibles sur la fiche de chaque personne. Réservé aux personnes habilitées.',
      },
    ],
  },
  {
    area: 'people',
    chantier: 'recruitment',
    name: 'Recrutement',
    phase: 10,
    summary: 'Onglets définis à son cadrage.',
  },
  {
    area: 'people',
    chantier: 'hr',
    name: 'Salariés & paie',
    phase: 10,
    summary: 'Onglets définis à son cadrage.',
  },
  {
    area: 'people',
    chantier: 'onboarding',
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
    chantier: 'organizations',
    name: 'Organisations',
    phase: 3,
    summary:
      'Liste, sans onglet : partenaires, sponsors, clients et fournisseurs.',
  },
  {
    area: 'relations',
    chantier: 'organizations',
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
        chantier: 'payments',
        label: 'Règlements',
        managedIn: 'Finances',
        phase: 3,
        summary: 'Factures et opérations liées.',
      },
      {
        chantier: 'contracts',
        label: 'Contrats',
        managedIn: 'Contrats et Partenariats',
        phase: 7,
        summary: 'Contrats et partenariats en cours et passés.',
      },
    ],
  },
  {
    area: 'relations',
    chantier: 'partnerships',
    name: 'Partenariats',
    phase: 7,
    summary: 'Liste, sans onglet : opportunités et accords.',
  },
  {
    area: 'relations',
    chantier: 'partnerships',
    name: 'Fiche partenariat',
    phase: 7,
    tabs: [
      {
        label: 'Accord',
        phase: 7,
        summary:
          'Parties, équipe ou jeu soutenu (facultatif), période, contreparties, état.',
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
    chantier: 'communication',
    name: 'Communication',
    phase: 10,
    summary: 'Onglets définis à son cadrage.',
  },
];
