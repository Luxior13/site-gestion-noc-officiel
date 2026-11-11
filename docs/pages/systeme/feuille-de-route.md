# Feuille de route

[Index des pages](../../pages/README.md) · [Espace Système](README.md) · [Design](../../design/README.md) · [Guide général](../../REFERENCE_GENERALE.md)

## Identité

| Élément | Valeur |
| --- | --- |
| Route | `/systeme/feuille-de-route` |
| Espace | Système |
| Gabarit visé | [E. Page de lecture](../../design/gabarits.md#e-page-de-lecture) |
| État d’harmonisation | Aligné — voir [Harmonisation](../../design/harmonisation.md#état-par-page) |
| Point d’entrée | [page.tsx](../../../apps/web/src/app/systeme/feuille-de-route/page.tsx) → [RoadmapPage](../../../apps/web/src/features/roadmap/components/RoadmapPage.tsx) |
| Contrôle d’accès | session ; aucune permission propre |
| Chargement / erreur dédiés | communs à l’application |

Contenu métier de la feuille de route : [propositions](../../propositions/feuille-de-route.md).

## État courant — refonte du 7 novembre 2026

Le propriétaire trouvait la page dispersée (« plein de sections différentes »)
et a validé la refonte recommandée (« fais ce que tu recommandes, mais bien »).
Le même jour, il a demandé une lecture par pôle : « je ne veux pas que ce soit par étape mais par pôle ; les étapes, c’est plus pour aider à l’implémentation, mais c’est moi qui choisirais ».
La page montre donc un seul plan sous quatre vues, les chantiers par pôle
d’abord, avec une seule recherche et un seul filtre de pôle partagés par les
vues. Les étapes restent un ordre suggéré : la page ne désigne aucune
« prochaine » étape.

Composition, de haut en bas :

1. `PageIdentityHero` : titre, phrase « ce qui reste à construire, pôle par
   pôle ; la vue Pages et onglets montre aussi ce qui est déjà en place »
   (étapes suggérées, sans date promise, prochain chantier à choisir) et
   compteurs (chantiers, pages à construire, pages en place, pôles).
2. `PageSectionNavigation` en barre : **Chantiers** (par défaut, sans
   paramètre), **Pages et onglets** (`vue=pages`), **Couverture**
   (`vue=couverture`), **Ordre suggéré** (`vue=ordre`). Une vue est un filtre
   local : le changement passe par l’historique du navigateur
   (`onSectionChange` → `usePageQuery`), sans requête au serveur.
3. Une carte `DataTableSection` : barre d’outils du Répertoire (`ListSearchField`,
   filtres rapides « Pôle » à choix unique avec compteurs propres à la vue,
   « N chantiers » ou « N chantiers trouvés »), puis la vue active.
   - **Chantiers** : un groupe par pôle (titre, description, nombre de
     chantiers), puis une ligne par chantier, rangée par étape suggérée puis
     dans l’ordre du catalogue : icône du pôle, titre, première version,
     pastille « Étape N », chevron. La ligne se déplie sur place comme au
     Journal d’activité : pourquoi, première version, critère de livraison,
     suite ; prérequis et pages ou onglets en boutons.
   - **Pages et onglets** : tout le plan des pages, par pôle (54 au 9 novembre
     2026), ce qui est déjà en place distingué de ce qui reste (« je voudrais
     que les points déjà en place soient différenciés, pour que je sache »,
     9 novembre 2026). Une ligne par page avec ses onglets en pastilles :
     onglet en place coché et vert, onglet à construire avec son étape quand
     elle diffère de celle de la page. À droite, « En place » (vert) pour une
     page entièrement livrée, « En place + étape N » pour une page livrée
     qu’un chantier complétera, « Étape N » pour une page à construire.
     Dépliée : le contenu de la page et ce qui lui viendra (« À venir, étape N »),
     chaque onglet « en place », « en place, à compléter à l’étape N » ou
     « étape N », et les seuls chantiers qui y travaillent encore. Une légende
     en tête explique la coche et les étapes ; l’en-tête de chaque pôle compte
     ses pages et celles en place ; la recherche trouve « en place ». Un
     onglet en lecture (`managedIn`) porte une flèche ↗ dans sa pastille et
     dans le détail, avec « Lu ici, se modifie dans … » ; une seconde légende
     l’explique (règle du 8 novembre 2026).
   - **Couverture** : les sujets d’une structure esport, chacun avec ses
     chantiers en boutons ou l’outil qui le traite hors de ce site.
   - **Ordre suggéré** : les mêmes lignes, sans pastille d’étape, rangées par
     étape pour aider à l’implémentation : frise des dix étapes (lien vers
     chaque étape, étape vidée par un filtre non cliquable), puis un groupe par
     étape (numéro, titre, description, nombre de chantiers).
4. « À savoir », sous les vues Chantiers et Ordre suggéré : quatre principes
   courts, dont « les étapes ne sont qu’un ordre suggéré ».

Un bouton de prérequis, de page ou de chantier efface recherche et pôle, ouvre
la vue concernée (un chantier s’ouvre dans Ordre suggéré si cette vue est
affichée, sinon dans Chantiers), déplie la ligne visée, la fait défiler et y
place le focus.
Les données relient pages, onglets et sujets aux chantiers (`chantier`,
`ROADMAP_COVERAGE`) ; des tests vérifient qu’aucun chantier ni aucune page à
venir n’est orphelin, hors Recherche dans les dossiers et Intégrations.

Adaptations du gabarit, retenues le 7 novembre 2026 :

- Lignes dépliables plutôt que cartes : 38 cartes se lisaient mal ; une ligne
  ouverte masque son résumé, que le détail reprend en entier.
- Pas de bouton « Réinitialiser » dans la barre : deux critères seulement, la
  croix du champ et « Tous » les remettent à zéro, l’état vide propose
  « Réinitialiser les filtres » (et rend le focus à la recherche). Sur
  téléphone, le bouton aurait occupé une ligne seul et fait sauter la liste.
- Pas de filtre d’étape : chaque ligne porte son étape, et la vue Ordre
  suggéré les montre toutes dans l’ordre, avec la frise pour y sauter. Le
  paramètre `phase` d’un ancien lien est retiré.
- Pas de « Prochaine » étape mise en avant : le propriétaire choisit le
  prochain chantier ; un chantier sans prérequis « peut commencer à tout
  moment ».
- Les vues Chantiers, Couverture et Ordre suggéré ne montrent que ce qui reste
  à faire (décision du 8 novembre 2026 : « tout ce qui est déjà en place peut
  être retiré »). La vue Pages et onglets montre tout le plan, ce qui est en
  place distingué (décision du 9 novembre 2026, qui remplace pour cette vue
  celle du 8). Le plan complet reste dans `ROADMAP_SITE_PLAN` ; la vue des
  pages lit `ROADMAP_PAGES` (chaque page et onglet avec `delivered` et l’étape
  de ce qui reste), les chantiers lisent `ROADMAP_PLANNED_PAGES` (le seul reste
  à faire).
- Pas de badge « Type » ni de « Pour qui » : tout compte connecté appartient
  au bureau ou encadre une équipe ; ces champs sont retirés des données.

## État courant — clôture du socle du 13 octobre 2026

La [revue finale du socle](../../audits/2026-10-12-cloture-socle.md) est
terminée au périmètre livré, pour poursuivre le développement métier. Ses
preuves et limites ne constituent pas une qualification de déploiement.

La page livrée, son catalogue local et ses composants partagés ont été
revérifiés, avec parcours réel aux trois largeurs retenues. Aucun chantier futur
n’est rendu actif par cette clôture et aucun mécanisme de cache ou de
virtualisation n’est ajouté.

Les décisions et preuves datées ci-dessous restent conservées. Une nouvelle
revue répond à un changement, un défaut constaté ou une règle nouvelle.

## État courant — 12 octobre 2026

Route `/systeme/feuille-de-route`, catalogue informatif pour les comptes connectés.
Le catalogue comprend 38 chantiers, six pôles cibles et dix étapes ; ces nombres
ne représentent ni 38 pages à créer ni six pôles actifs. La navigation actuelle
compte trois pôles et six entrées principales.

La [revue du 12 octobre](../../audits/2026-10-12-feuille-de-route.md)
vérifie le catalogue, la correspondance documentaire et le parcours privé.
Les 18 scénarios client et huit parcours d'intégration Next/MFA réels passent ;
FDR-01 à FDR-04 sont clos sur le périmètre vérifié.

Sources : [décisions produit](../../propositions/feuille-de-route.md),
[matrice](../../propositions/intentions/pages/MATRICE_PREPARATION.md),
[catalogue](../../../apps/web/src/features/roadmap/roadmap.constants.ts),
[tests](../../../apps/web/src/__tests__/roadmap-catalog.test.ts).

## Décisions courantes et questions de revue

- 7 novembre 2026 : catalogue révisé sur décision du propriétaire, de 39 à
  38 chantiers, de huit à six pôles et de six à dix étapes courtes : registre historique,
  puis trésorerie ([décisions](../../propositions/feuille-de-route.md#à-quoi-sert-le-site)).
  Les identifiants conservés ne changent pas, même quand le titre change
  (`sport-teams` devient « Équipes & parcours »). Le filtre `pole=esport` ou
  `pole=activity` d’un ancien lien revient au filtre neutre.
- 7 novembre 2026 : présentation refondue en vues (voir l’état courant
  ci-dessus) ; le bloc dépliant du plan des pages (`RoadmapSitePlan`) et les
  cartes (`RoadmapCard`) sont retirés. Le même jour, sur demande du
  propriétaire, les chantiers par pôle deviennent la vue par défaut et la vue
  par étape devient « Ordre suggéré », en dernier onglet.
- 8 novembre 2026 : sept pôles (Personnes, ex-Membres ; Esport, nouveau) et
  listes de choix réparties dans les pages qui les utilisent
  ([réorganisation](../../propositions/feuille-de-route.md#réorganisation-du-8-novembre-2026)) ;
  le filtre `pole=esport` redevient valide. Esport reprend la couleur de
  Personnes en attendant la sienne.
- 10 novembre 2026 : jeux pratiqués retirés de la fiche personne et chantier
  Listes de choix clos, sur recommandation acceptée ; le catalogue compte
  37 chantiers. Le même jour, filtres du Répertoire par équipe et par jeu et
  anciens noms d’équipe retirés, sur décision du propriétaire ([retraits](../../propositions/feuille-de-route.md#retraits-du-10-novembre-2026)).
- 11 novembre 2026 : chantier Organisations & contacts livré et retiré du
  catalogue, qui compte 36 chantiers ; pages Organisations et fiche
  organisation en place ; les anciennes adresses des partenaires passent au
  chantier Partenariats & opportunités. Le même jour, pages Opérations et
  fiche opération, onglets Catégories et Moyens de paiement de Comptes,
  Mouvements d’un compte et Règlements ↗ d’une organisation en place ; le
  chantier Opérations & règlements garde les justificatifs et les onglets
  Finances ↗ des fiches jeu, équipe et personne.
- 25 octobre 2026 : la page reste ouverte à tout compte connecté et figure
  dans la section « Projet » du pôle Système, plus sous « Administration »
  ([DRT-04](../../audits/2026-10-25-coherence-des-droits.md)).
- Une ligne dépliée décrit raison, première version, critère de livraison,
  suite, prérequis et pages. Un chantier ne décrit que ce qui reste à
  construire, même sur un module existant (« Export du journal d’activité »).
- Les étapes suggèrent un ordre de construction, sans calendrier promis ni
  tâche planifiée ; le propriétaire choisit le prochain chantier, une fois ses
  prérequis livrés (7 novembre 2026).
- Les notifications sont replanifiées en étape 10 ; le journal d’activité est livré
  depuis le 30 octobre 2026, seul son export reste au catalogue. L’actualité interne
  devient la Chronologie de la structure. Leurs anciens liens ne rouvrent pas les
  modules.
- Faire évoluer ensemble décisions, données applicatives et matrice. Vérifier
  les identifiants, doublons, prérequis et dépendances circulaires.
- À la livraison d’un chantier : le retirer du catalogue ou réduire son texte
  au reste à faire ; passer ses pages et onglets à `phase: null`, avec
  `upcoming` seulement si un autre chantier les complète encore. Cette mise à
  jour ne modifie pas le registre des fonctionnalités.
- Sélectionner Q01–Q05, Q09, Q19, Q27 et Q30 selon le changement. Un tri du
  catalogue n’autorise aucune permission supplémentaire.
- Barre d’outils sur `surface-content-header` comme le Répertoire ; en-têtes
  de groupe `surface-panel-header` ; ligne ouverte en `surface-row-alternate`
  avec filet `border-strong`, comme le Journal d’activité.
- Conserver `PageIdentityHero` et ses compteurs : la page reste en lecture,
  sans tableau de gestion, pagination ni barre d’enregistrement. Le catalogue
  versionné en code ne nécessite aucun modèle Prisma ou éditeur métier.
- Recherche selon la règle commune du site : chaque mot dans n’importe quel
  ordre, accents et ponctuation ignorés, petits mots ignorés, singulier et
  pluriel équivalents (31 octobre 2026, RL-06).
- Utiliser `ListSearchField` avec son effacement partagé et la limite de
  200 caractères. La remise à zéro de l’état vide rend le focus à la
  recherche ; chaque ligne est un bouton nommé par son titre (et son pôle pour
  les lecteurs d’écran), avec `aria-expanded` et `aria-controls`.
- La recherche porte sur tout le texte d’un chantier, critère de livraison
  compris, même ligne repliée ; sur une page, elle lit aussi ses onglets et le
  titre de ses chantiers. Les valeurs inconnues de pôle ou de vue reviennent
  aux valeurs neutres ; l’URL est normalisée sans entrée d’historique
  supplémentaire, en conservant les autres paramètres et l’ancre. Aucun module
  futur n’est activé par cet écran.

## Preuves et limites

Le 8 novembre 2026, la flèche des onglets en lecture est vérifiée par les tests
`roadmap-site-plan` (onglets marqués, onglets normaux de la fiche personne,
texte pour lecteurs d’écran et légende), lint, types, la suite web, knip et
budget d’architecture ; rendu relu sur le banc client à 1 440, 768, 390 et
320 px, sans débordement ni erreur JavaScript.

Le 8 novembre 2026, le retrait de ce qui existe déjà est vérifié par lint,
types, la suite web (dont `roadmap-catalog`, `roadmap-search`,
`roadmap-site-plan` et `roadmap-views` : aucune ligne « Déjà en place » ni
« À compléter », Mon compte, Utilisateurs et Feuille de route absents, Fiche
utilisateur réduite à son Profil), knip, budget d’architecture, build et budget
de performance. Rendu relu sur le même banc client aux quatre largeurs, sans
débordement ni erreur JavaScript.

Le 7 novembre 2026, la refonte puis le regroupement par pôle sont vérifiés
par lint, types, la suite web (dont `roadmap-search`, `roadmap-site-plan` et
`roadmap-views`), knip, budget d’architecture, build et budget de
performance. Rendu relu sur banc client (composant et catalogue réels ; cadre,
session et `next/link` simulés) à 1 440, 768, 390 et 320 px : vue par défaut
par pôle, pôle Système avec « À compléter » et « Étape N », ligne dépliée,
prérequis suivi, onglet Ordre suggéré, frise et prérequis suivi sans quitter
cette vue, pôle et recherche, état vide, onglet Pages et onglets, page dépliée
puis chantier rejoint, Couverture ; aucun débordement horizontal ni erreur
JavaScript. À 320 px, la barre des vues défile avec ses flèches, comme
prévu par le composant. L’intégration authentifiée avec le vrai serveur Next
n’est pas rejouée pour cette refonte ; les E2E et suites SQL non plus.

Le [contrôle transverse des menus du 10 octobre](../../audits/2026-10-10-menus.md)
exécute les sélecteurs pôle et phase du composant réel, avec contexte de navigation
simulé, à quatre largeurs. Ils héritent des contours et arrondis partagés ; clavier,
fermeture et restitution du focus vérifiés. Cette preuve historique n'incluait
pas le parcours authentifié complet.

La cartographie et la réconciliation documentaire du 10 octobre examinent le
catalogue dans le code. La matrice est corrigée pour inclure notifications et
journal ; l’actualité reprend le statut « À cadrer » du catalogue. Les essais
applicatifs de la cartographie restent datés, non rejoués par cette modification.

Le [contrôle du 11 octobre](../../audits/2026-10-11-pages-restantes.md)
exécute rendu, URL invalide, recherche sans résultat, filtres pôle/étape et remise
à zéro à 320, 390, 768 et 1 440 px, sans erreur JavaScript ni débordement global.
Le composant et le catalogue sont réels ; session et navigation sont simulées.
L'intégration authentifiée restait alors à vérifier.

Le contrôle du 12 octobre confirme les 39 lignes de chantiers, leurs statuts
et prérequis, et les 57 correspondances d'anciennes destinations. Les trois
tests du catalogue passent ; aucun cycle ni prérequis d'étape ultérieure.
L'omission de `/activite/actualites` dans la matrice est corrigée et vérifiée.
Les **18 scénarios client** passent à six largeurs de 320 à 1 920 px : détails,
clavier, recherche, 48 combinaisons pôle/étape, URL et historique. Le focus de
réinitialisation et les noms contextuels sont corrigés et vérifiés dans ce cadre.
Les **20 tests ciblés** passent ; le rapport distingue leurs preuves de
l'intégration authentifiée : huit scénarios avec le véritable serveur Next
de production, PostgreSQL isolé, comptes racine et USER et connexion MFA.
Accès anonyme, cookie forgé et session périmée sont refusés ; filtres,
historique, rechargement, recherche et cadre réel passent à sept largeurs.
La suite web comporte 1 230 réussites et 100 tests ignorés ; build, types,
lint et budgets passent. Les tests SQL ignorés d'autres modules ne sont pas
comptés comme validés.

| ID | Point | Résultat / déclencheur de réexamen | État |
| --- | --- | --- | --- |
| FDR-01 | Intégration authentifiée | Huit scénarios réels réussis le 12 octobre ; rouvrir lors d'une modification du cadre privé ou de sa politique | Clos |
| FDR-02 à FDR-04 | Focus, détails accessibles et correspondance de matrice | Corrections vérifiées ; maintenir les noms contextuels, le focus de reprise et l'alignement des références | Clos |
| [RL-06](../../audits/2026-10-31-recherches-listes.md) | Recherche au pluriel | « réunions » trouvait 1 chantier, « reunion » 3 : même découpage des mots que l’éditeur d’autorisations (`getSearchTerms` : petits mots ignorés, singulier et pluriel équivalents), test sur le catalogue réel le 31 octobre 2026 | Clos |

Aucun défaut bloquant identifié dans ce périmètre. Lecteur d'écran, zoom natif,
appareils physiques et gestionnaires de mots de passe installés ne sont pas
couverts par ces preuves. Les étapes, statuts et prérequis seront réexaminés
avec les décisions produit lors de la conception ou livraison d'un chantier.
