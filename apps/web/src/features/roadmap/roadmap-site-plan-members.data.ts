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
        phase: null,
        summary:
          'En lecture : chaque passage dans une équipe, en cours et à venir puis terminés, avec le jeu, la fonction, le statut, le début, la fin et la durée. Chaque ligne ouvre son équipe, ses anciens membres pour un passage terminé.',
        upcoming:
          'Les passages de Bureau & staff, avec leur page ; puis les tournois joués (étape 5).',
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
      'Liste, sans onglet, sur le modèle du Répertoire : chaque jeu et, sur des lignes dessous reliées par un guide, ses équipes, en bandes alternées par jeu, dans l’ordre posé par glisser-déposer, actifs et inactifs mélangés (jeux, et équipes dans leur jeu), une icône de manette par défaut, une recherche sur les jeux et les équipes et un filtre ; ajout et modification en fenêtre d’un jeu (nom, nom court, première ouverture, actif) ; un bouton « Ajouter une équipe » : jeu choisi dans la fenêtre, actif ou non, nom unique dans le jeu, création, active, puis sa fiche s’ouvre ; le nom d’un jeu ou d’une équipe ouvre sa fiche ; renommer corrige une faute ; un jeu qui a des équipes ne se supprime pas, il devient inactif. C’est aussi la liste de choix des jeux.',
    upcoming: 'L’image de chaque jeu à la place de la manette.',
  },
  {
    area: 'esport',
    chantier: 'sport-teams',
    name: 'Fiche jeu',
    phase: null,
    summary:
      'Ouverte par le nom d’un jeu sur la page Jeux, ou juste après son ajout.',
    tabs: [
      {
        chantier: 'sport-teams',
        label: 'Fonctions',
        phase: null,
        summary:
          'Premier onglet : les fonctions de ce jeu (Joueur, Remplaçant, Coach…), type Joueur ou Encadrement, active ou non ; rangées par glisser-déposer selon leur importance, actives ou non, ordre repris partout ; ajout et modification en fenêtre, fonctions courantes en un clic quand la liste est vide ; une fonction inactive reste choisissable pour un passage ancien.',
        upcoming:
          'Le nombre de passages de chaque fonction avec le Roster ; le réglage « Donne accès à son équipe » viendra avec l’accès des managers.',
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
        label: 'Informations',
        phase: null,
        summary:
          'Dernier onglet : nom, nom court, première ouverture, actif, modifiés sur place ; zone dangereuse, qui explique « rendez-le inactif » quand le jeu a des équipes.',
      },
    ],
    upcoming:
      'Avec le Roster, le nombre de passages de chaque fonction ; puis l’onglet Finances ↗, entre Fonctions et Informations.',
  },
  {
    area: 'esport',
    chantier: 'sport-teams',
    name: 'Fiche équipe',
    phase: null,
    summary:
      'Ouverte par le nom d’une équipe sur la page Jeux, ou juste après son ajout.',
    tabs: [
      {
        chantier: 'access-scopes',
        label: 'Roster',
        phase: null,
        summary:
          'Premier onglet : ce qui est là et ce qui arrive, joueurs puis encadrement, dans l’ordre des fonctions, avec statut (Actuel, À venir), début, fin et durée ; un passage s’ajoute, se corrige, se termine ou change de fonction en fenêtre ; la personne se cherche dans le Répertoire.',
        upcoming:
          'Le manager lira le Roster de son équipe, sans le modifier ; la date de fin de contrat s’y lira, venue des contrats (étape 7).',
      },
      {
        chantier: 'access-scopes',
        label: 'Anciens membres',
        phase: null,
        summary:
          'Les passages terminés, jamais mêlés au Roster : par année de fin, la plus récente d’abord, avec début, fin et durée ; recherche et filtre Joueurs ou Encadrement ; un ancien membre s’ajoute ici avec ses deux dates.',
        upcoming: 'Le manager les lira pour son équipe, sans les modifier.',
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
        chantier: 'sport-teams',
        label: 'Informations',
        phase: null,
        summary:
          'Dernier onglet : nom, création, active, modifiés sur place ; le jeu, fixé à la création, figure dans l’en-tête ; zone dangereuse, qui explique « rendez-la inactive » quand le Roster a des passages.',
        upcoming: 'Anciens noms gardés au renommage.',
      },
    ],
    upcoming:
      'Le statut de chaque membre dans la structure, calculé depuis les passages.',
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
