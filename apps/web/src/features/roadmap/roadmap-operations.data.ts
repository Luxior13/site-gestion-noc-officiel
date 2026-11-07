import type { RoadmapItem } from './types/roadmap.types';

export const OPERATIONS_ROADMAP_ITEMS: readonly RoadmapItem[] = [
  {
    area: 'system',
    audience: 'Membres du bureau',
    dependsOn: [],
    description:
      'Faire évoluer les listes de choix du site sans attendre un développement.',
    doneWhen:
      'Ajouter, renommer ou archiver une valeur ne demande aucun développement et ne réécrit pas l’historique.',
    firstRelease:
      'Une page avec un onglet par liste (jeux, fonctions, étiquettes, puis catégories et moyens de paiement), ajout direct depuis un champ et champ à choix multiples réutilisable.',
    id: 'reference-lists',
    kind: 'module',
    later: 'Nouvelles listes au fil des modules.',
    phase: 1,
    status: 'planned',
    title: 'Listes de référence',
  },
  {
    area: 'system',
    audience: 'Membres du bureau et administrateurs',
    baseline:
      'Les scripts de sauvegarde et de restauration existent ; l’export lisible et le suivi restent à construire.',
    dependsOn: ['sport-teams'],
    description: 'Garantir que le registre survit à l’outil.',
    doneWhen:
      'Un export lisible reprend tout le registre ; une restauration vérifie données, pièces et accès.',
    firstRelease:
      'Export lisible du registre, suivi des sauvegardes et restauration essayée.',
    id: 'data',
    kind: 'extension',
    later: 'Recherche dans les archives avec les droits des modules sources.',
    legacyHrefs: ['/systeme/exports-sauvegardes', '/systeme/archives'],
    phase: 2,
    status: 'partial',
    title: 'Données, exports & sauvegardes',
  },
  {
    area: 'today',
    audience: 'Membres du bureau',
    dependsOn: [],
    description: 'Transformer les décisions et engagements en actions suivies.',
    doneWhen:
      'Une action issue d’une réunion reste la même tâche dans toutes ses vues.',
    firstRelease:
      'Tâches assignées, échéances, statuts et liens vers le dossier source ; vue personnelle.',
    id: 'tasks',
    kind: 'module',
    later: 'Projets, dépendances et suivi du temps si nécessaire.',
    phase: 6,
    status: 'planned',
    title: 'Projets & tâches',
  },
  {
    area: 'structure',
    audience: 'Membres du bureau',
    dependsOn: ['legal-entities', 'tasks'],
    description: 'Préparer les réunions et conserver ce qui a été décidé.',
    doneWhen:
      'Une décision conserve instance, auteur, date, portée et preuve ; ses actions restent reliées à leurs responsables.',
    firstRelease:
      'Instances, participants du répertoire, ordre du jour, compte rendu, décisions et tâches liées ; les mandats se lisent dans le parcours.',
    id: 'meetings',
    kind: 'module',
    later:
      'Assemblées, votes, registres adaptés à la forme juridique et export des comptes rendus.',
    legacyHrefs: [
      '/vie-interne/reunions',
      '/vie-interne/reunions-suivi',
      '/bureau-juridique/decisions-bureau',
    ],
    phase: 6,
    status: 'planned',
    title: 'Réunions & décisions',
  },
  {
    area: 'system',
    audience: 'Membres du bureau et administrateurs',
    baseline:
      'Vue globale reconstruite le 30 octobre 2026 : lecture filtrable par type, importance, période et compte, recherche par auteur ou compte concerné, consultations tracées. Reste l’export autorisé.',
    dependsOn: [],
    description:
      'Expliquer qui a fait quoi, quand et sur quel dossier, sans exposer les données sensibles.',
    doneWhen:
      'Chaque événement conserve sa source, sa portée et ses preuves ; les détails sensibles restent filtrés par autorisation.',
    firstRelease:
      'Vue globale filtrable, recherche par acteur et par catégorie, export autorisé et suivi des accès.',
    id: 'activity-journal',
    kind: 'module',
    later:
      'Rétention par catégorie, tableaux de bord d’anomalies et alertes ciblées.',
    phase: 7,
    status: 'partial',
    title: 'Journal d’activité',
  },
  {
    area: 'relations',
    audience: 'Membres du bureau',
    dependsOn: [],
    description:
      'Retrouver partenaires, sponsors, clients et fournisseurs au même endroit.',
    doneWhen:
      'Une organisation peut être fournisseur et sponsor sans dupliquer sa fiche.',
    firstRelease:
      'Identité de l’organisation, interlocuteurs du répertoire et relations datées.',
    id: 'organizations',
    kind: 'module',
    later:
      'Relations simultanées, demandes de subvention et fusion contrôlée des doublons.',
    legacyHrefs: [
      '/bureau-juridique/partenaires',
      '/bureau-juridique/sponsors',
    ],
    phase: 3,
    status: 'planned',
    title: 'Organisations & contacts',
  },
  {
    area: 'relations',
    audience: 'Membres du bureau',
    dependsOn: ['organizations', 'contracts', 'tasks'],
    description:
      'Suivre les accords et ce qui est promis, livré ou à renouveler.',
    doneWhen:
      'Une négociation n’écrase pas un accord actif ; chaque livrable est suivi.',
    firstRelease:
      'Opportunités, responsables, engagements, livrables et échéances liés aux contrats.',
    id: 'partnerships',
    kind: 'module',
    later: 'Bilans partenaires, suivi des contreparties et renouvellements.',
    phase: 7,
    status: 'planned',
    title: 'Partenariats & opportunités',
  },
  {
    area: 'finance',
    audience: 'Trésorerie et membres du bureau autorisés',
    dependsOn: ['legal-entities'],
    description: 'Connaître les soldes réels et vérifier les mouvements.',
    doneWhen:
      'Un virement entre comptes ne crée pas de recette supplémentaire.',
    firstRelease:
      'Exercices, comptes bancaires et caisses, titulaire, devise, soldes initiaux et relevés.',
    id: 'accounts',
    kind: 'module',
    later: 'Rapprochement assisté avec les paiements importés.',
    legacyHrefs: ['/tresorerie/comptes'],
    phase: 3,
    status: 'planned',
    title: 'Comptes & rapprochement',
  },
  {
    area: 'finance',
    audience: 'Trésorerie',
    dependsOn: ['accounts', 'organizations'],
    description: 'Suivre l’argent réellement reçu ou versé et son origine.',
    doneWhen:
      'Engagement, somme due et règlement sont distincts ; les corrections sont tracées.',
    firstRelease:
      'Encaissements, décaissements, virements, catégories, moyens de paiement, justificatifs et affectations aux sommes dues ; lien vers une personne, une organisation, un tournoi ou une adhésion.',
    id: 'payments',
    kind: 'module',
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
    status: 'planned',
    title: 'Opérations & règlements',
  },
  {
    area: 'finance',
    audience: 'Trésorerie',
    dependsOn: ['payments'],
    description:
      'Suivre factures, avoirs et échéances indépendamment des paiements.',
    doneWhen:
      'Une facture peut précéder le paiement et être réglée en plusieurs fois.',
    firstRelease:
      'Factures clients/fournisseurs, pièces, échéances et règlements ; émission ou import selon l’outil retenu.',
    id: 'invoices',
    kind: 'module',
    later:
      'Devis, échanges comptables et plateforme de facturation électronique adaptée.',
    legacyHrefs: ['/tresorerie/factures-justificatifs'],
    phase: 4,
    status: 'planned',
    title: 'Facturation & achats',
  },
  {
    area: 'finance',
    audience: 'Membres du bureau et trésorerie',
    dependsOn: ['payments'],
    description: 'Demander, approuver et suivre un remboursement.',
    doneWhen:
      'Le demandeur voit son dossier sans recevoir les droits de validation.',
    firstRelease:
      'Dossier, lignes de frais, justificatifs, décision et règlement.',
    id: 'expenses',
    kind: 'module',
    later: 'Barèmes et délégations selon les usages.',
    legacyHrefs: ['/tresorerie/remboursements'],
    phase: 4,
    status: 'planned',
    title: 'Notes de frais & remboursements',
  },
  {
    area: 'finance',
    audience: 'Trésorerie et membres du bureau autorisés',
    dependsOn: ['payments'],
    description: 'Vérifier les dossiers et conserver les périodes clôturées.',
    doneWhen:
      'Exports et archives respectent entité, période et autorisations.',
    firstRelease:
      'Validations, pièces manquantes, historique, exports et clôture d’exercice.',
    id: 'finance-controls',
    kind: 'module',
    later: 'Transmissions comptables et contrôles de cohérence renforcés.',
    legacyHrefs: [
      '/systeme/validations',
      '/tresorerie/validations-finance',
      '/tresorerie/exports-finance',
      '/tresorerie/journal-financier',
      '/tresorerie/archives-finance',
    ],
    phase: 4,
    status: 'planned',
    title: 'Contrôles & clôtures',
  },
  {
    area: 'finance',
    audience: 'Membres du bureau et trésorerie',
    dependsOn: ['payments', 'invoices'],
    description: 'Comparer prévisions, engagements et réalisé par activité.',
    doneWhen:
      'Les synthèses séparent trésorerie, résultat de gestion et états comptables.',
    firstRelease:
      'Budgets versionnés, enveloppes par équipe/projet, écarts, prévisions de trésorerie et bilan par mois ou par année.',
    id: 'budget',
    kind: 'module',
    later: 'Rapports de gestion et échanges avec le cabinet comptable.',
    legacyHrefs: ['/tresorerie/budget', '/tresorerie/bilans'],
    phase: 9,
    status: 'planned',
    title: 'Budget & pilotage',
  },
  {
    area: 'system',
    audience: 'Membres du bureau',
    baseline:
      'La navigation rapide de l’en-tête retrouve les pages autorisées ; la page de recherche globale a été retirée le 9 octobre 2026.',
    dependsOn: ['documents'],
    description:
      'Retrouver les personnes et documents autorisés depuis la recherche globale.',
    doneWhen:
      'Résultats, extraits et compteurs respectent les droits des fiches.',
    firstRelease:
      'Recherche métier progressive, extraits limités et liens vers les fiches.',
    id: 'business-search',
    kind: 'extension',
    later: 'Archives et autres dossiers au fil de leur livraison.',
    phase: 9,
    status: 'partial',
    title: 'Recherche dans les dossiers',
  },
  {
    area: 'system',
    audience: 'Membres du bureau',
    dependsOn: ['tasks', 'documents'],
    description: 'Prévenir le bureau des échéances sans multiplier les écrans.',
    doneWhen:
      'Chaque rappel a une source et des destinataires autorisés ; une reprise ne crée pas de doublon.',
    firstRelease:
      'Boîte personnelle, rappels métier liés à leur source et règles limitées avec historique d’exécution.',
    id: 'automations',
    kind: 'module',
    later: 'Canaux email ou Discord, préférences et reprise après erreur.',
    legacyHrefs: [
      '/vie-interne/notifications-rappels',
      '/systeme/modeles',
      '/systeme/modeles-notifications',
      '/systeme/automatisations',
    ],
    phase: 10,
    status: 'planned',
    title: 'Rappels & notifications',
  },
  {
    area: 'system',
    audience: 'Membres du bureau et administrateurs',
    dependsOn: ['sport-teams', 'data'],
    description:
      'Relier ce site au site public, si la double saisie devient trop lourde.',
    doneWhen:
      'Rejouer une publication ne duplique pas les données et ne publie rien par défaut.',
    firstRelease:
      'Publication validée des équipes et des parcours vers noctambule.gg, avec des identifiants stables.',
    id: 'integrations',
    kind: 'integration',
    later: 'Connexions comptables et autres outils nécessaires.',
    phase: 10,
    status: 'planned',
    title: 'Intégrations & publication publique',
  },
  {
    area: 'structure',
    audience: 'Membres du bureau',
    dependsOn: [],
    description:
      'Savoir ce que la structure possède, qui le détient et ce qu’elle paie.',
    doneWhen:
      'Chaque prêt conserve détenteur et dates ; un abonnement a toujours un responsable et une échéance.',
    firstRelease:
      'Inventaire, prêts, maillots et stock ; services, domaines et licences avec titulaire, coût et échéance, jamais de mot de passe.',
    id: 'logistics',
    kind: 'module',
    later:
      'Garanties, maintenance et liens vers les dépenses et les assurances.',
    legacyHrefs: ['/bureau-juridique/inventaire-acces'],
    phase: 8,
    status: 'planned',
    title: 'Matériel & abonnements',
  },
  {
    area: 'relations',
    audience: 'Membres du bureau',
    dependsOn: ['tasks', 'compliance', 'partnerships'],
    description: 'Organiser les publications et engagements de visibilité.',
    doneWhen:
      'Chaque contenu a un responsable, les autorisations nécessaires et une validation.',
    firstRelease:
      'Calendrier éditorial, ressources graphiques, audience et validation avant publication.',
    id: 'communication',
    kind: 'module',
    later: 'Mesures de diffusion et connexions aux canaux externes.',
    phase: 10,
    status: 'planned',
    title: 'Communication & contenus',
  },
  {
    area: 'finance',
    audience: 'Trésorerie',
    dependsOn: ['competitions', 'payments'],
    description: 'Suivre les gains confirmés et leur répartition.',
    doneWhen:
      'Un résultat sportif ne déclenche pas automatiquement un encaissement.',
    firstRelease:
      'Montants annoncés, confirmés et reçus ; parts contractuelles et versements.',
    id: 'prizes',
    kind: 'module',
    later: 'Parts prévues aux contrats et paiements internationaux.',
    phase: 5,
    status: 'planned',
    title: 'Gains de compétition & primes',
  },
  {
    area: 'today',
    audience: 'Membres du bureau',
    dependsOn: ['tasks'],
    description: 'Voir d’un coup d’œil les dates qui engagent la structure.',
    doneWhen:
      'Une date modifiée dans son module se reflète ici, sans ressaisie.',
    firstRelease:
      'Réunions, échéances, renouvellements et dates limites de tournois, lus depuis leurs modules ; événements privés.',
    id: 'calendar',
    kind: 'view',
    later: 'Abonnements externes et récurrence avancée.',
    legacyHrefs: ['/vie-interne/calendrier-interne'],
    phase: 6,
    status: 'planned',
    title: 'Calendrier du bureau',
  },
  {
    area: 'structure',
    audience: 'Membres du bureau',
    dependsOn: ['sport-teams'],
    description:
      'Raconter la vie de la structure depuis ses débuts, sur une seule ligne de temps.',
    doneWhen:
      'Chaque fait a une date, une catégorie et un lien vers sa source ; rien n’est recopié.',
    firstRelease:
      'Faits datés saisis par le bureau ou tirés des modules : arrivée, départ, changement de roster, sponsor, décision, titre.',
    id: 'internal-news',
    kind: 'view',
    later: 'Mise en avant des faits marquants par année.',
    legacyHrefs: ['/activite/actualites'],
    phase: 8,
    status: 'planned',
    title: 'Chronologie de la structure',
  },
  {
    area: 'finance',
    audience: 'Trésorerie et membres du bureau autorisés',
    dependsOn: ['organizations', 'payments'],
    description: 'Suivre les aides reçues et ce qu’elles obligent à justifier.',
    doneWhen:
      'Une subvention conserve demande, décision, versements et justification ; un don garde son reçu.',
    firstRelease:
      'Dossiers de subvention, échéances et versements ; dons et reçus.',
    id: 'grants',
    kind: 'module',
    later: 'Valorisation du bénévolat dans les dossiers.',
    phase: 4,
    status: 'planned',
    title: 'Subventions & dons',
  },
  {
    area: 'structure',
    audience: 'Membres du bureau',
    dependsOn: ['payments', 'meetings'],
    description:
      'Présenter une année de la structure sans tout recompter à la main.',
    doneWhen:
      'Chaque chiffre renvoie à sa source et une année clôturée ne change plus.',
    firstRelease:
      'Par année : membres et mouvements, tournois et gains, finances, décisions ; prêt pour l’assemblée générale.',
    id: 'annual-report',
    kind: 'view',
    later: 'Comparaison entre années.',
    phase: 9,
    status: 'planned',
    title: 'Bilan annuel',
  },
  {
    area: 'people',
    audience: 'Managers et membres du bureau',
    dependsOn: ['sport-teams'],
    description:
      'Outiller les managers si le suivi quotidien d’une équipe doit vivre ici.',
    doneWhen:
      'Un manager ne voit que son équipe ; rien ne double le site public.',
    firstRelease:
      'Entraînements, présences, objectifs, débriefs et préparation, à choisir au cadrage.',
    id: 'sports-follow-up',
    kind: 'module',
    later: 'Statistiques et analyse vidéo, si elles servent.',
    legacyHrefs: [
      '/sport-team-control/scrims',
      '/sport-team-control/calendrier-esport',
      '/sport-team-control/performance',
      '/sport-team-control/debriefs',
      '/vie-interne/debriefs',
    ],
    phase: 10,
    status: 'planned',
    title: 'Suivi sportif',
  },
  {
    area: 'structure',
    audience: 'Membres du bureau',
    dependsOn: ['tasks', 'payments'],
    description:
      'Organiser LAN, bootcamps et déplacements, et en garder le dossier.',
    doneWhen:
      'Un événement relie participants, frais et documents sans les recopier.',
    firstRelease: 'Participants, hébergement, transport, budget et pièces.',
    id: 'events',
    kind: 'module',
    later: 'Événements ouverts au public et billetterie.',
    phase: 10,
    status: 'planned',
    title: 'Événements & déplacements',
  },
  {
    area: 'people',
    audience: 'Membres du bureau expressément habilités',
    dependsOn: ['contracts'],
    description: 'Suivre les personnes employées, quand la structure en aura.',
    doneWhen:
      'Les données RH restent séparées et la paie reste dans un outil qualifié.',
    firstRelease:
      'Contrats de travail, périodes et pièces, à cadrer avec la forme juridique.',
    id: 'hr',
    kind: 'module',
    later: 'Liaison à un outil de paie.',
    phase: 10,
    status: 'planned',
    title: 'Salariés & paie',
  },
];
