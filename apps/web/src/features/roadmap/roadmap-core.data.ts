import type { RoadmapItem } from './types/roadmap.types';

export const CORE_ROADMAP_ITEMS: readonly RoadmapItem[] = [
  {
    area: 'today',
    audience: 'Membres du bureau',
    baseline:
      'L’accueil existe ; les vues métier personnelles restent à construire.',
    dependsOn: ['tasks', 'documents'],
    description:
      'Retrouver ce qui me concerne sans parcourir tous les dossiers.',
    doneWhen:
      'Chaque action renvoie à sa source et respecte les droits de la personne connectée.',
    firstRelease:
      'Mes tâches, mes réunions à venir, les documents en attente et les échéances proches.',
    id: 'personal-work',
    kind: 'extension',
    later: 'Mes frais et mes rappels au fil des modules.',
    legacyHrefs: [
      '/tableau-de-bord/mes-taches',
      '/tableau-de-bord/prochaines-reunions',
      '/tableau-de-bord/documents-a-accepter',
      '/tableau-de-bord/alertes-importantes',
      '/tableau-de-bord/mes-rappels',
    ],
    phase: 3,
    status: 'partial',
    title: 'Mon travail & espace personnel',
  },
  {
    area: 'system',
    audience: 'Administrateurs et managers d’équipe',
    baseline:
      'L’authentification, les autorisations et les comptes existent ; la portée par équipe reste à construire.',
    dependsOn: ['sport-teams'],
    description:
      'Ouvrir un compte à un manager en le limitant à son équipe, sans lui montrer les autres pôles.',
    doneWhen:
      'Le serveur contrôle la portée ; un manager ne voit ni une autre équipe ni un autre pôle ; aucun lien entre fiche et compte n’est déduit d’un email.',
    firstRelease:
      'Liaison explicite entre un compte et une fiche, et portée par équipe.',
    id: 'access-scopes',
    kind: 'extension',
    later:
      'Portées par entité, délégations datées et revue périodique des accès, si le besoin apparaît.',
    phase: 1,
    status: 'partial',
    title: 'Accès & responsabilités métier',
  },
  {
    area: 'people',
    audience: 'Membres du bureau et managers',
    dependsOn: ['reference-lists'],
    description:
      'Savoir qui est passé dans la structure, à quelle fonction et dans quelle équipe.',
    doneWhen:
      'Retrouver qui était dans une équipe à n’importe quelle date ; corriger un passage ne crée pas une nouvelle identité.',
    firstRelease:
      'Équipes par jeu, passages datés (équipe ou structure, fonction, début, fin, dates approximatives admises), onglet Parcours de la fiche, membres actuels et anciens de chaque équipe, anciens pseudos.',
    id: 'sport-teams',
    kind: 'module',
    later: 'Frises et synthèses de parcours si elles servent.',
    legacyHrefs: [
      '/sport-team-control',
      '/sport-team-control/jeux',
      '/sport-team-control/rosters',
      '/sport-team-control/membres-esport',
    ],
    phase: 1,
    status: 'planned',
    title: 'Équipes & parcours',
  },
  {
    area: 'people',
    audience: 'Secrétariat et trésorerie',
    baseline:
      'Le répertoire gère déjà les identités et les coordonnées ; fonctions et équipes relèvent d’Équipes & parcours. Les adhésions restent à construire.',
    dependsOn: ['legal-entities', 'sport-teams'],
    description:
      'Suivre qui est adhérent, pour quelle période et à quelles conditions.',
    doneWhen:
      'Renouveler une adhésion conserve son historique et ne crée pas une nouvelle identité.',
    firstRelease:
      'Campagnes d’adhésion, adhésions datées et état de cotisation, rattachés aux fiches du répertoire.',
    id: 'person-relationships',
    kind: 'extension',
    later: 'Relances et liens vers les règlements.',
    legacyHrefs: [
      '/vie-interne/membres-adherents',
      '/vie-interne/membres',
      '/vie-interne/adherents',
      '/bureau-juridique/personnes-contacts',
    ],
    phase: 2,
    status: 'partial',
    title: 'Adhésions & cotisations',
  },
  {
    area: 'people',
    audience: 'Membres du bureau',
    dependsOn: ['sport-teams'],
    description: 'Suivre les candidatures jusqu’à la décision et à l’arrivée.',
    doneWhen:
      'Une personne peut candidater plusieurs fois sans dupliquer son identité.',
    firstRelease:
      'Poste ou équipe visée, essais, évaluations confidentielles et décision.',
    id: 'recruitment',
    kind: 'module',
    later: 'Campagnes et formulaire public avec contrôle des données reçues.',
    legacyHrefs: [
      '/vie-interne/recrutement-tryouts',
      '/sport-team-control/recrutement-tryouts',
    ],
    phase: 5,
    status: 'planned',
    title: 'Recrutement',
  },
  {
    area: 'people',
    audience: 'Membres du bureau',
    dependsOn: ['sport-teams', 'documents', 'tasks'],
    description: 'Éviter les oublis de documents, d’accès ou de matériel.',
    doneWhen:
      'Un départ suit accès et restitutions sans effacer les faits à conserver.',
    firstRelease:
      'Checklists datées, responsables, étapes et vue collective des dossiers ouverts.',
    id: 'onboarding',
    kind: 'module',
    later: 'Actions sur les services connectés après validation.',
    legacyHrefs: ['/vie-interne/onboarding-depart'],
    phase: 5,
    status: 'planned',
    title: 'Arrivées et départs',
  },
  {
    area: 'structure',
    audience: 'Membres du bureau',
    dependsOn: ['sport-teams'],
    description:
      'Garder le parcours dans la durée sans conserver plus de données personnelles que nécessaire.',
    doneWhen:
      'Chaque durée est justifiée et validée ; le parcours survit à la purge des coordonnées d’un ancien membre.',
    firstRelease:
      'Règles de conservation écrites, purge des coordonnées après le départ et anonymisation à la demande.',
    id: 'compliance',
    kind: 'module',
    later:
      'Preuves d’autorisation (droit à l’image, mineurs) selon le besoin réel.',
    phase: 1,
    status: 'planned',
    title: 'Confidentialité & conservation',
  },
  {
    area: 'structure',
    audience: 'Membres du bureau',
    dependsOn: [],
    description:
      'Préparer l’évolution de l’association et une éventuelle société.',
    doneWhen:
      'Chaque futur contrat et compte financier a une entité porteuse ; l’historique reste inchangé.',
    firstRelease:
      'Entité porteuse, identifiants, règles datées, assurances et responsabilités.',
    id: 'legal-entities',
    kind: 'module',
    later:
      'Coexistence association/société et transferts documentés quand nécessaires.',
    phase: 2,
    status: 'planned',
    title: 'Identité juridique & périmètres',
  },
  {
    area: 'structure',
    audience: 'Membres du bureau',
    dependsOn: ['legal-entities'],
    description: 'Retrouver la bonne version et suivre les actions attendues.',
    doneWhen:
      'Une acceptation vise une version précise et reste distincte d’une signature contractuelle.',
    firstRelease:
      'Bibliothèque, versions, modèles et acceptations saisies par le bureau.',
    id: 'documents',
    kind: 'module',
    later: 'Campagnes de relance et intégration de signature selon le besoin.',
    legacyHrefs: [
      '/bureau-juridique/documents',
      '/bureau-juridique/documents-officiels',
      '/bureau-juridique/acceptation-chartes',
      '/systeme/modeles-documents',
    ],
    phase: 3,
    status: 'planned',
    title: 'Documents & acceptations',
  },
  {
    area: 'structure',
    audience: 'Membres du bureau expressément habilités',
    dependsOn: ['sport-teams', 'compliance'],
    description:
      'Traiter les signalements avec confidentialité et traçabilité.',
    doneWhen:
      'Les signalements, sanctions internes et bans externes sont distingués.',
    firstRelease:
      'Signalement, faits, preuves, instruction, décision, recours et durée.',
    id: 'incidents',
    kind: 'module',
    later: 'Liens restreints vers personnes et équipes.',
    legacyHrefs: ['/bureau-juridique/incidents-sanctions'],
    phase: 3,
    status: 'planned',
    title: 'Incidents & sanctions',
  },
  {
    area: 'structure',
    audience: 'Membres du bureau',
    dependsOn: ['documents', 'legal-entities'],
    description: 'Suivre les engagements au-delà du fichier signé.',
    doneWhen:
      'Les pièces signées et conditions historiques ne sont pas réécrites après un changement.',
    firstRelease:
      'Parties, entité signataire, période, obligations, avenants, échéances et pièces.',
    id: 'contracts',
    kind: 'module',
    later: 'Signature externe et renouvellements guidés.',
    legacyHrefs: ['/bureau-juridique/contrats'],
    phase: 3,
    status: 'planned',
    title: 'Contrats & obligations',
  },
];
