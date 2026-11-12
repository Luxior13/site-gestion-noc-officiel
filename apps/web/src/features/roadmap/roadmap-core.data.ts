import type { RoadmapItem } from './types/roadmap.types';

export const CORE_ROADMAP_ITEMS: readonly RoadmapItem[] = [
  {
    area: 'today',
    dependsOn: ['tasks', 'documents'],
    description:
      'Retrouver ce qui me concerne sans parcourir tous les dossiers.',
    doneWhen:
      'Chaque action renvoie à sa source et respecte les droits de la personne connectée.',
    firstRelease:
      'Mes tâches, mes réunions à venir, les documents en attente et les échéances proches.',
    id: 'personal-work',
    later: 'Mes frais et mes rappels au fil des modules.',
    legacyHrefs: [
      '/tableau-de-bord/mes-taches',
      '/tableau-de-bord/prochaines-reunions',
      '/tableau-de-bord/documents-a-accepter',
      '/tableau-de-bord/alertes-importantes',
      '/tableau-de-bord/mes-rappels',
    ],
    phase: 7,
    title: 'Mon travail & espace personnel',
  },
  {
    area: 'system',
    dependsOn: ['sport-teams'],
    description:
      'Relier un compte à sa fiche du Répertoire, pour l’afficher ; la portée Esport qui limite un manager est livrée (10 novembre 2026).',
    doneWhen:
      'Une fiche liée à un compte se voit sur sa fiche Utilisateur ; la liaison n’ouvre rien : seules les autorisations et la portée Esport du compte donnent accès.',
    firstRelease:
      'Fiche du Répertoire liée au compte, choisie à la main, jamais déduite d’un email.',
    id: 'access-scopes',
    later:
      'Portées par entité, délégations datées et revue périodique des accès, si le besoin apparaît.',
    phase: 2,
    title: 'Accès & responsabilités métier',
  },
  {
    area: 'people',
    dependsOn: [],
    description:
      'Savoir qui est passé dans la structure, à quelle fonction et dans quelle équipe.',
    doneWhen:
      'Retrouver qui était dans une équipe à n’importe quelle date ; corriger un passage ne crée pas une nouvelle identité.',
    firstRelease:
      'Page Jeux, fiche de chaque jeu (ses équipes) et de chaque équipe (Roster), page Bureau & staff ; passages datés (équipe ou structure, fonction, début, fin, dates approximatives admises) saisis dans le Roster d’une équipe ou l’Effectif de Bureau & staff, et lus dans l’onglet Parcours de la fiche. Fiche complétée : nationalité, autres pseudos, adresse, identifiants de jeu, contact d’urgence, représentants légaux.',
    id: 'sport-teams',
    later: 'Frises et synthèses de parcours si elles servent.',
    legacyHrefs: [
      '/sport-team-control',
      '/sport-team-control/jeux',
      '/sport-team-control/rosters',
      '/sport-team-control/membres-esport',
    ],
    phase: 1,
    title: 'Équipes & parcours',
  },
  {
    area: 'people',
    dependsOn: ['legal-entities', 'sport-teams'],
    description:
      'Suivre qui est adhérent, pour quelle période et à quelles conditions.',
    doneWhen:
      'Renouveler une adhésion conserve son historique et ne crée pas une nouvelle identité.',
    firstRelease:
      'Campagnes d’adhésion, adhésions datées et état de cotisation, rattachés aux fiches du répertoire.',
    id: 'person-relationships',
    later: 'Relances et liens vers les règlements.',
    legacyHrefs: [
      '/vie-interne/membres-adherents',
      '/vie-interne/membres',
      '/vie-interne/adherents',
      '/bureau-juridique/personnes-contacts',
    ],
    phase: 4,
    title: 'Adhésions & cotisations',
  },
  {
    area: 'people',
    dependsOn: ['sport-teams'],
    description: 'Suivre les candidatures jusqu’à la décision et à l’arrivée.',
    doneWhen:
      'Une personne peut candidater plusieurs fois sans dupliquer son identité.',
    firstRelease:
      'Poste ou équipe visée, essais, évaluations confidentielles et décision.',
    id: 'recruitment',
    later: 'Campagnes et formulaire public avec contrôle des données reçues.',
    legacyHrefs: [
      '/vie-interne/recrutement-tryouts',
      '/sport-team-control/recrutement-tryouts',
    ],
    phase: 10,
    title: 'Recrutement',
  },
  {
    area: 'people',
    dependsOn: ['sport-teams', 'documents', 'tasks'],
    description:
      'Éviter les oublis de documents, d’accès ou de matériel, y compris quand le bureau change.',
    doneWhen:
      'Un départ suit accès et restitutions sans effacer les faits à conserver.',
    firstRelease:
      'Checklists datées, responsables, étapes et vue collective des dossiers ouverts ; passation d’un mandat.',
    id: 'onboarding',
    later: 'Actions sur les services connectés après validation.',
    legacyHrefs: ['/vie-interne/onboarding-depart'],
    phase: 8,
    title: 'Arrivées, départs & passations',
  },
  {
    area: 'esport',
    dependsOn: ['sport-teams', 'access-scopes'],
    description:
      'Garder la trace de chaque tournoi : qui y a participé, ce qu’il a rapporté et ce qui s’y est mal passé.',
    doneWhen:
      'Un problème ou un ban reste relié à sa personne et à son tournoi ; un résultat sportif ne déclenche aucun encaissement ; un manager ne touche qu’aux tournois de son équipe, sans en voir les gains ni le suivi.',
    firstRelease:
      'Le déplacement lié à une LAN (avec les Déplacements), le règlement en pièce jointe (avec le stockage des fichiers) et la fin des inscriptions reprise au calendrier du bureau. La page Tournois, la fiche (Informations, Participants avec line-up et classement, Finances ↗), l’onglet Tournois ↗ d’une équipe et les tournois joués du Parcours sont livrés le 11 novembre 2026 ; un manager crée et remplit les tournois de son équipe. Les gains et le Suivi ont leurs chantiers. Les rencontres restent sur le site public.',
    id: 'competitions',
    later: 'Licences et programmes d’éditeurs.',
    legacyHrefs: ['/sport-team-control/tournois-matchs'],
    phase: 5,
    title: 'Tournois',
  },
  {
    area: 'structure',
    dependsOn: ['sport-teams'],
    description:
      'Garder le parcours dans la durée sans conserver plus de données personnelles que nécessaire.',
    doneWhen:
      'Chaque durée est justifiée et validée ; le parcours survit à la purge des coordonnées d’un ancien membre.',
    firstRelease:
      'Règles de conservation écrites, purge des coordonnées après le départ et anonymisation à la demande.',
    id: 'compliance',
    later:
      'Preuves d’autorisation (droit à l’image, mineurs) selon le besoin réel.',
    phase: 2,
    title: 'Confidentialité & conservation',
  },
  {
    area: 'structure',
    dependsOn: [],
    description:
      'Savoir quelle entité porte chaque acte, de l’association à une éventuelle société, sans jamais le demander quand le site peut le déduire.',
    doneWhen:
      'Chaque compte, exercice, facture et contrat a une entité, trouvée sans saisie tant qu’une seule existe ; changer de forme ne réécrit rien.',
    firstRelease:
      'Fiche de chaque entité : paramètres fiscaux datés, dirigeants ↗ lus dans Bureau & staff, assurances et finances ↗. La page Entités, l’identité de chaque entité, l’entité principale et la règle de déduction pour les comptes sont livrées le 10 novembre 2026.',
    id: 'legal-entities',
    later:
      'À la deuxième entité : entité porteuse de chaque équipe, entité des fonctions du Bureau, filtre Entité des Finances ; remplacement ou coexistence et transferts documentés.',
    phase: 3,
    title: 'Entités juridiques & périmètres',
  },
  {
    area: 'structure',
    dependsOn: ['legal-entities'],
    description: 'Retrouver la bonne version et suivre les actions attendues.',
    doneWhen:
      'Une acceptation vise une version précise et reste distincte d’une signature contractuelle.',
    firstRelease:
      'Bibliothèque, versions, modèles et acceptations saisies par le bureau.',
    id: 'documents',
    later: 'Campagnes de relance et intégration de signature selon le besoin.',
    legacyHrefs: [
      '/bureau-juridique/documents',
      '/bureau-juridique/documents-officiels',
      '/bureau-juridique/acceptation-chartes',
      '/systeme/modeles-documents',
    ],
    phase: 7,
    title: 'Documents & acceptations',
  },
  {
    area: 'structure',
    dependsOn: ['sport-teams', 'compliance', 'competitions'],
    description:
      'Garder les notes sur une personne et traiter les signalements avec confidentialité et traçabilité.',
    doneWhen:
      'Notes, problèmes, sanctions de la structure et bans externes sont distingués, datés et signés ; une sanction en cours refuse l’inscription à un tournoi jusqu’à sa levée, elle-même tracée.',
    firstRelease:
      'Onglet Suivi de la fiche : notes, sanctions de la structure (tous ses tournois ou un jeu) et bans externes ; les problèmes et bans d’un tournoi se saisissent dans sa fiche et se lisent sur la personne ; contrôle à l’inscription des participants. Dossiers d’incident : faits, preuves, instruction, décision, recours et durée.',
    id: 'incidents',
    later: 'Liens restreints vers personnes et équipes.',
    legacyHrefs: ['/bureau-juridique/incidents-sanctions'],
    phase: 5,
    title: 'Suivi, incidents & sanctions',
  },
  {
    area: 'structure',
    dependsOn: ['documents', 'legal-entities'],
    description: 'Suivre les engagements au-delà du fichier signé.',
    doneWhen:
      'Les pièces signées et conditions historiques ne sont pas réécrites après un changement.',
    firstRelease:
      'Parties, entité signataire, période, obligations, avenants, échéances et pièces ; la date de fin d’un contrat de joueur s’affiche seule dans le Roster de son équipe.',
    id: 'contracts',
    later: 'Signature externe et renouvellements guidés.',
    legacyHrefs: ['/bureau-juridique/contrats'],
    phase: 7,
    title: 'Contrats & obligations',
  },
];
