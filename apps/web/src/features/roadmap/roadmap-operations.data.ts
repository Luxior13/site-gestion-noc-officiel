import type { RoadmapItem } from './types/roadmap.types';

export const OPERATIONS_ROADMAP_ITEMS: readonly RoadmapItem[] = [
  {
    area: 'system',
    dependsOn: ['sport-teams'],
    description: 'Garantir que le registre survit à l’outil.',
    doneWhen:
      'Un export lisible reprend tout le registre ; une restauration vérifie données, pièces et accès.',
    firstRelease:
      'Export lisible du registre, suivi des sauvegardes et restauration essayée, juste avant la mise en production.',
    id: 'data',
    later: 'Recherche dans les archives avec les droits des modules sources.',
    legacyHrefs: ['/systeme/exports-sauvegardes', '/systeme/archives'],
    phase: 2,
    title: 'Données, exports & sauvegardes',
  },
  {
    area: 'today',
    dependsOn: [],
    description: 'Transformer les décisions et engagements en actions suivies.',
    doneWhen:
      'Une action issue d’une réunion reste la même tâche dans toutes ses vues.',
    firstRelease:
      'Tâches assignées, échéances, statuts et liens vers le dossier source ; vue personnelle.',
    id: 'tasks',
    later: 'Projets, dépendances et suivi du temps si nécessaire.',
    phase: 6,
    title: 'Projets & tâches',
  },
  {
    area: 'structure',
    dependsOn: ['legal-entities', 'tasks'],
    description: 'Préparer les réunions et conserver ce qui a été décidé.',
    doneWhen:
      'Une décision conserve instance, auteur, date, portée et preuve ; ses actions restent reliées à leurs responsables.',
    firstRelease:
      'Instances, participants du répertoire, ordre du jour, compte rendu, décisions et tâches liées ; les mandats se lisent dans l’Effectif de Bureau & staff.',
    id: 'meetings',
    later:
      'Assemblées, votes, registres adaptés à la forme juridique et export des comptes rendus.',
    legacyHrefs: [
      '/vie-interne/reunions',
      '/vie-interne/reunions-suivi',
      '/bureau-juridique/decisions-bureau',
    ],
    phase: 6,
    title: 'Réunions & décisions',
  },
  {
    area: 'system',
    dependsOn: [],
    description:
      'Sortir du site les événements d’une enquête, d’une demande RGPD ou d’un contrôle, sans exposer les données sensibles.',
    doneWhen:
      'L’export reprend les filtres de la vue et le même masquage que la lecture ; seul un compte autorisé à exporter le lance, et l’export laisse une trace.',
    firstRelease:
      'Export CSV ou JSON des résultats filtrés du journal d’activité.',
    id: 'activity-journal',
    later:
      'Rétention par catégorie, portée Esport ou par entité, tableaux de bord d’anomalies et alertes ciblées.',
    phase: 7,
    title: 'Export du journal d’activité',
  },
  {
    area: 'relations',
    dependsOn: [],
    description:
      'Retrouver partenaires, sponsors, clients et fournisseurs au même endroit.',
    doneWhen:
      'Une organisation peut être fournisseur et sponsor sans dupliquer sa fiche.',
    firstRelease:
      'Identité de l’organisation, interlocuteurs du répertoire et relations datées.',
    id: 'organizations',
    later:
      'Relations simultanées, demandes de subvention et fusion contrôlée des doublons.',
    legacyHrefs: [
      '/bureau-juridique/partenaires',
      '/bureau-juridique/sponsors',
    ],
    phase: 3,
    title: 'Organisations & contacts',
  },
  {
    area: 'relations',
    dependsOn: ['organizations', 'contracts', 'tasks'],
    description:
      'Suivre les accords et ce qui est promis, livré ou à renouveler.',
    doneWhen:
      'Une négociation n’écrase pas un accord actif ; chaque livrable est suivi.',
    firstRelease:
      'Opportunités, responsables, engagements, livrables et échéances liés aux contrats ; un partenariat peut soutenir une équipe ou un jeu précis, et apparaît alors sur sa fiche.',
    id: 'partnerships',
    later: 'Bilans partenaires, suivi des contreparties et renouvellements.',
    phase: 7,
    title: 'Partenariats & opportunités',
  },
  {
    area: 'finance',
    dependsOn: ['legal-entities'],
    description: 'Connaître les soldes réels et vérifier les mouvements.',
    doneWhen:
      'Un virement entre comptes ne crée pas de recette supplémentaire.',
    firstRelease:
      'Exercices, comptes bancaires et caisses, titulaire, devise, soldes initiaux et relevés.',
    id: 'accounts',
    later: 'Rapprochement assisté avec les paiements importés.',
    legacyHrefs: ['/tresorerie/comptes'],
    phase: 3,
    title: 'Comptes & rapprochement',
  },
  {
    area: 'finance',
    dependsOn: ['accounts', 'organizations'],
    description: 'Suivre l’argent réellement reçu ou versé et son origine.',
    doneWhen:
      'Engagement, somme due et règlement sont distincts ; les corrections sont tracées.',
    firstRelease:
      'Encaissements, décaissements, virements, catégories, moyens de paiement, justificatifs et affectations aux sommes dues ; lien vers une personne, une organisation, un tournoi ou une adhésion.',
    id: 'payments',
    later:
      'Vues cotisations, sponsoring, dons et subventions ; paiements partiels et relances.',
    legacyHrefs: [
      '/tresorerie/operations',
      '/tresorerie/recettes',
      '/tresorerie/depenses',
      '/tresorerie/cotisations-adherents',
      '/tresorerie/sponsoring-financier',
    ],
    phase: 3,
    title: 'Opérations & règlements',
  },
  {
    area: 'finance',
    dependsOn: ['payments'],
    description:
      'Suivre factures, avoirs et échéances indépendamment des paiements.',
    doneWhen:
      'Une facture peut précéder le paiement et être réglée en plusieurs fois.',
    firstRelease:
      'Factures clients/fournisseurs, pièces, échéances et règlements ; émission ou import selon l’outil retenu.',
    id: 'invoices',
    later:
      'Devis, échanges comptables et plateforme de facturation électronique adaptée.',
    legacyHrefs: ['/tresorerie/factures-justificatifs'],
    phase: 4,
    title: 'Facturation & achats',
  },
  {
    area: 'finance',
    dependsOn: ['payments'],
    description: 'Demander, approuver et suivre un remboursement.',
    doneWhen:
      'Le demandeur voit son dossier sans recevoir les droits de validation.',
    firstRelease:
      'Dossier, lignes de frais, justificatifs, décision et règlement.',
    id: 'expenses',
    later: 'Barèmes et délégations selon les usages.',
    legacyHrefs: ['/tresorerie/remboursements'],
    phase: 4,
    title: 'Notes de frais & remboursements',
  },
  {
    area: 'finance',
    dependsOn: ['payments'],
    description: 'Vérifier les dossiers et conserver les périodes clôturées.',
    doneWhen:
      'Exports et archives respectent entité, période et autorisations.',
    firstRelease:
      'Validations, pièces manquantes, historique, exports et clôture d’exercice.',
    id: 'finance-controls',
    later: 'Transmissions comptables et contrôles de cohérence renforcés.',
    legacyHrefs: [
      '/systeme/validations',
      '/tresorerie/validations-finance',
      '/tresorerie/exports-finance',
      '/tresorerie/journal-financier',
      '/tresorerie/archives-finance',
    ],
    phase: 4,
    title: 'Contrôles & clôtures',
  },
  {
    area: 'finance',
    dependsOn: ['payments', 'invoices'],
    description: 'Comparer prévisions, engagements et réalisé par activité.',
    doneWhen:
      'Les synthèses séparent trésorerie, résultat de gestion et états comptables.',
    firstRelease:
      'Budgets versionnés, enveloppes par équipe/projet, écarts, prévisions de trésorerie et bilan par mois ou par année.',
    id: 'budget',
    later: 'Rapports de gestion et échanges avec le cabinet comptable.',
    legacyHrefs: ['/tresorerie/budget', '/tresorerie/bilans'],
    phase: 9,
    title: 'Budget & pilotage',
  },
  {
    area: 'system',
    dependsOn: ['documents'],
    description:
      'Retrouver les personnes et documents autorisés depuis la recherche globale.',
    doneWhen:
      'Résultats, extraits et compteurs respectent les droits des fiches.',
    firstRelease:
      'Recherche métier progressive, extraits limités et liens vers les fiches.',
    id: 'business-search',
    later: 'Archives et autres dossiers au fil de leur livraison.',
    phase: 9,
    title: 'Recherche dans les dossiers',
  },
  {
    area: 'today',
    dependsOn: ['tasks', 'documents'],
    description: 'Prévenir le bureau des échéances sans multiplier les écrans.',
    doneWhen:
      'Chaque rappel a une source et des destinataires autorisés ; une reprise ne crée pas de doublon.',
    firstRelease:
      'Mes rappels dans Mon travail, liés à leur source ; règles limitées dans Paramètres système, avec historique d’exécution.',
    id: 'automations',
    later: 'Canaux email ou Discord, préférences et reprise après erreur.',
    legacyHrefs: [
      '/vie-interne/notifications-rappels',
      '/systeme/modeles',
      '/systeme/modeles-notifications',
      '/systeme/automatisations',
    ],
    phase: 10,
    title: 'Rappels & notifications',
  },
  {
    area: 'system',
    dependsOn: ['sport-teams', 'data'],
    description:
      'Relier ce site au site public, si la double saisie devient trop lourde.',
    doneWhen:
      'Rejouer une publication ne duplique pas les données et ne publie rien par défaut.',
    firstRelease:
      'Publication validée des équipes et des parcours vers noctambule.gg, avec des identifiants stables.',
    id: 'integrations',
    later: 'Connexions comptables et autres outils nécessaires.',
    phase: 10,
    title: 'Intégrations & publication publique',
  },
  {
    area: 'structure',
    dependsOn: [],
    description:
      'Savoir ce que la structure possède, qui le détient et ce qu’elle paie.',
    doneWhen:
      'Chaque prêt conserve détenteur et dates ; un abonnement a toujours un responsable et une échéance.',
    firstRelease:
      'Inventaire, prêts, maillots et stock ; services, domaines et licences avec titulaire, coût et échéance, jamais de mot de passe.',
    id: 'logistics',
    later:
      'Garanties, maintenance et liens vers les dépenses et les assurances.',
    legacyHrefs: ['/bureau-juridique/inventaire-acces'],
    phase: 8,
    title: 'Matériel & abonnements',
  },
  {
    area: 'relations',
    dependsOn: ['tasks', 'compliance', 'partnerships'],
    description: 'Organiser les publications et engagements de visibilité.',
    doneWhen:
      'Chaque contenu a un responsable, les autorisations nécessaires et une validation.',
    firstRelease:
      'Calendrier éditorial, ressources graphiques, audience et validation avant publication.',
    id: 'communication',
    later: 'Mesures de diffusion et connexions aux canaux externes.',
    phase: 10,
    title: 'Communication & contenus',
  },
  {
    area: 'finance',
    dependsOn: ['competitions', 'payments'],
    description: 'Suivre les gains confirmés et leur répartition.',
    doneWhen:
      'Un résultat sportif ne déclenche pas automatiquement un encaissement.',
    firstRelease:
      'Par équipe : montants annoncés et confirmés, répartition prévue entre les joueurs ; argent reçu et parts versées lus dans les opérations.',
    id: 'prizes',
    later: 'Parts prévues aux contrats et paiements internationaux.',
    phase: 5,
    title: 'Gains de compétition & primes',
  },
  {
    area: 'today',
    dependsOn: ['tasks'],
    description: 'Voir d’un coup d’œil les dates qui engagent la structure.',
    doneWhen:
      'Une date modifiée dans son module se reflète ici, sans ressaisie.',
    firstRelease:
      'Réunions, échéances, renouvellements et dates limites de tournois, lus depuis leurs modules ; événements privés.',
    id: 'calendar',
    later: 'Abonnements externes et récurrence avancée.',
    legacyHrefs: ['/vie-interne/calendrier-interne'],
    phase: 6,
    title: 'Calendrier du bureau',
  },
  {
    area: 'structure',
    dependsOn: ['sport-teams'],
    description:
      'Raconter la vie de la structure depuis ses débuts, sur une seule ligne de temps.',
    doneWhen:
      'Chaque fait a une date, une catégorie et un lien vers sa source ; rien n’est recopié.',
    firstRelease:
      'Faits datés saisis par le bureau ou tirés des modules : arrivée, départ, changement de roster, sponsor, décision, titre.',
    id: 'internal-news',
    later: 'Mise en avant des faits marquants par année.',
    legacyHrefs: ['/activite/actualites'],
    phase: 8,
    title: 'Chronologie de la structure',
  },
  {
    area: 'finance',
    dependsOn: ['organizations', 'payments'],
    description: 'Suivre les aides reçues et ce qu’elles obligent à justifier.',
    doneWhen:
      'Une subvention conserve demande, décision, versements et justification ; un don garde son reçu.',
    firstRelease:
      'Dossiers de subvention, échéances et versements ; dons et reçus.',
    id: 'grants',
    later: 'Valorisation du bénévolat dans les dossiers.',
    phase: 4,
    title: 'Subventions & dons',
  },
  {
    area: 'structure',
    dependsOn: ['payments', 'meetings'],
    description:
      'Présenter une année de la structure sans tout recompter à la main.',
    doneWhen:
      'Chaque chiffre renvoie à sa source et une année clôturée ne change plus.',
    firstRelease:
      'Par année : membres et mouvements, tournois et gains, finances, décisions ; prêt pour l’assemblée générale.',
    id: 'annual-report',
    later: 'Comparaison entre années.',
    phase: 9,
    title: 'Bilan annuel',
  },
  {
    area: 'esport',
    dependsOn: ['sport-teams', 'access-scopes'],
    description:
      'Garder la trace de l’activité d’une équipe : ses séances et qui y était.',
    doneWhen:
      'Un manager ne voit et ne remplit que son équipe ; rien ne double le site public ni les outils de jeu.',
    firstRelease:
      'Onglet Entraînements de la fiche équipe : séances (date, type, présents, objectif ou débrief court), comptées par saison pour le bilan et les subventions ; le manager remplit celles de son équipe.',
    id: 'sports-follow-up',
    later: 'Statistiques et analyse vidéo, si elles servent.',
    legacyHrefs: [
      '/sport-team-control/scrims',
      '/sport-team-control/calendrier-esport',
      '/sport-team-control/performance',
      '/sport-team-control/debriefs',
      '/vie-interne/debriefs',
    ],
    phase: 10,
    title: 'Entraînement',
  },
  {
    area: 'esport',
    dependsOn: ['tasks', 'payments', 'competitions', 'documents'],
    description:
      'Organiser les déplacements en LAN et en bootcamp, et en garder le dossier.',
    doneWhen:
      'Un déplacement relie participants, frais et documents sans les recopier ; un mineur sans autorisation parentale enregistrée est signalé.',
    firstRelease:
      'Page et fiche déplacement : motif (tournoi en LAN ou bootcamp), lieu, dates, équipe ; participants ; logistique ; budget prévu face aux dépenses réelles des Finances ; documents.',
    id: 'events',
    later: 'Événements ouverts au public et billetterie.',
    phase: 10,
    title: 'Déplacements',
  },
  {
    area: 'people',
    dependsOn: ['contracts'],
    description: 'Suivre les personnes employées, quand la structure en aura.',
    doneWhen:
      'Les données RH restent séparées et la paie reste dans un outil qualifié.',
    firstRelease:
      'Contrats de travail, périodes et pièces, à cadrer avec la forme juridique.',
    id: 'hr',
    later: 'Liaison à un outil de paie.',
    phase: 10,
    title: 'Salariés & paie',
  },
];
