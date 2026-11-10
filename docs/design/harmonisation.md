# Harmonisation : audit des écarts

[Système de design](README.md) · [Fondations](fondations.md) · [Préférences](preferences.md)

Audit du code au 19 octobre 2026 (commit `a39d1c9`), par relevés automatiques
des fichiers CSS et TSX de `apps/web/src`, tests exclus. Les chiffres décrivent
le code, pas un rendu vérifié dans un navigateur. Les mettre à jour à chaque
reprise d’une page ou d’un composant partagé.

## Synthèse

- **10 fichiers CSS (1 525 lignes)** : `globals.css` (468 lignes) porte tous les
  tokens ; neuf modules partagés ou métier (`directory.module.css` 382 lignes,
  `PermissionsEditor.module.css` 181, `PageIdentityHero.module.css` 133…).
- **Aucune couleur codée** : 0 valeur hexadécimale et 0 `rgba()` dans les
  modules CSS, 0 classe arbitraire `[#…]` dans les 154 fichiers TSX. Les
  modules consomment les tokens globaux, parfois via des alias locaux `--m-*`.
- **Aucun texte sous 10 px**, aucune `transition-all`, ombres limitées aux
  tokens `--shadow-*` et à des contours internes.
- Toutes les pages servies utilisent `PageIdentityHero` et les cadres communs ;
  leur alignement est suivi page par page ci-dessous.
- Les écarts restants sont des **valeurs arbitraires recopiées** (rayons,
  tailles) là où une variante partagée éviterait la divergence.

## Constats

| ID | Constat | Mesure | Règle concernée | Correction attendue |
| --- | --- | --- | --- | --- |
| HARMO-01 | Classe du badge de statut recopiée | La même chaîne (`inline-flex … rounded-[5px] border px-2 py-0.5 text-xs leading-5 font-medium`) est écrite dans `PersonStatusBadge`, `user-badges` (2), `UserOverviewCard` (3), `NewUserForm`, `NewUserSuccess`, `UserSecurityTab`, `SecuritySection`, `UsersListResults` (2) et `PersonListCells` | [Variantes autorisées](fondations.md#variantes-autorisées), [principe 5](principes.md#règles-fondatrices) | **Clos le 20 octobre 2026** : composant commun [`StatusBadge`](../../apps/web/src/components/ui/status-badge.tsx) adopté par tous ces usages ; la pastille « N coordonnées » du Répertoire est retirée (REP-22) |
| HARMO-02 | Rayons écrits en valeur arbitraire | `rounded-[10px]` ×22, `rounded-[7px]` ×13, `rounded-[5px]` ×13, `rounded-[8px]` ×7, `rounded-[4px]` ×6, `rounded-[6px]` ×4, `rounded-[2px]` ×1, dans 34 fichiers TSX ; dans le CSS : 6, 8, 10 px, 5 px (bouton de page) et 4 px | [Variantes autorisées](fondations.md#variantes-autorisées) | **Clos le 25 octobre 2026** : six jetons nommés par rôle (`panel`, `control`, `tile`, `compact`, `badge`, `option`) aux valeurs existantes, sans changement de rendu ; 51 classes et 13 règles CSS converties, `cn()` étendu ([fondations](fondations.md#espacements-et-arrondis)). `rounded-panel` est fixe à 10 px, comme l’était `rounded-[10px]` ; le passer à `rounded-lg` (8 px en portée indigo) reste un choix visuel à faire à la reprise d’une page |
| HARMO-03 | Tailles de texte arbitraires | `text-[11px]` ×16, `text-[13px]` ×7, `text-[10px]` ×5, `text-[16px]` ×3, `text-[14px]`, `text-[12px]`, `text-[0.9375rem]` | [Typographie](fondations.md#typographie) | **Qualifié le 25 octobre 2026** : il reste 10 tailles arbitraires, toutes dans des primitives ou des éléments uniques justifiés (champs 16 px puis 13 px, label 14 px, option de sélecteur 12 px, nom de la structure dans la sidebar 15 px, intitulé de groupe 11 px de la création) ; elles ne sont pas remplacées sans reprise visuelle de leur composant. `cn()` reconnaît désormais `text-caption` et `text-label` comme tailles, et non comme couleurs |
| HARMO-04 | Documentation de design en retard sur le code | Le 19 octobre 2026, l’ancien design system décrivait encore le rôle des Autorisations en variante par défaut avec lignes alternées, et les réglages en mode « Modifier » | [Ordre de priorité](README.md#ordre-de-priorité) | Corrigé le 19 octobre 2026 dans [fondations](fondations.md#espacements-et-arrondis), [gabarits](gabarits.md#d-page-de-réglages) et [comportements](comportements.md#saisie-brouillon-et-enregistrement) ; à chaque reprise, actualiser le fichier propriétaire dans le même travail |
| HARMO-06 | Liste Utilisateurs pas encore alignée sur les filtres rapides | `UsersOverview` en carte de synthèse (`PageAsideLayout`), menus « Filtrer par état du compte » et « Filtrer par rôle » | [Gabarit A](gabarits.md#a-liste-de-gestion), [préférences du 20 octobre 2026](preferences.md#journal) | **Clos le 20 octobre 2026** : deux groupes de filtres rapides (état, rôle), composant partagé `$ui/quick-filter`, tri au bord droit, banc rejoué 42/42 ([liste](../pages/systeme/utilisateurs/liste.md#reprise-en-profondeur--20-octobre-2026)) ; rôle confirmé en filtres rapides, groupes libellés ([PREF-Q2](preferences.md#questions-tranchées)) |
| HARMO-07 | Titres de section qui répètent leur lien | Mon compte : en-têtes « Profil · Votre identité et votre adresse de contact » et équivalent en Sécurité ; la fiche utilisateur les a retirés le 20 octobre 2026 | [Gabarit B](gabarits.md#b-fiche-à-sections), [préférences du 18 octobre 2026](preferences.md#journal) | **Clos le 20 octobre 2026** : Profil sans en-tête, Sécurité sans titre visible ; cadres imbriqués retirés ([Mon compte](../pages/mon-compte/README.md#reprise--20-octobre-2026)) |
| HARMO-08 | En-têtes de cartes de deux hauteurs sur une même page | `RubricCard` (p-3.5/p-4, environ 60 px) à côté de « Droits d’administration » (`AccessSection`) et « Sessions actives » (`AccountSessionsCard`, p-4/p-5, environ 68 px) dans Mon compte et la fiche utilisateur | [Composants](composants.md), [préférences du 27 octobre 2026](preferences.md#journal) | **Clos le 31 octobre 2026** : en-tête commun `RUBRIC_HEADER_CLASS` (Mon compte, fiche utilisateur, Sécurité) ; doublon « Session actuelle » retiré (AC-26, AC-27 de l’[audit complet](../audits/2026-10-31-audit-complet.md)) |
| HARMO-09 | Pages de création divergentes (gabarit C) | Nouvel utilisateur : rubriques en petites capitales, barre d’actions dans la carte ; Nouvelle fiche : sans rubrique, barre sous la carte, décalée de 12 px | [Gabarits](gabarits.md) | **Clos le 31 octobre 2026** : cartes de rubrique de la fiche ouverte, barre en ligne sous les cartes ([gabarit C](gabarits.md#c-formulaire-de-création)) |
| HARMO-10 | Confirmations sans nom de leur cible | « Supprimer définitivement cette fiche ? », « Réinitialiser le mot de passe ? » alors que la règle du 27 octobre 2026 nomme l’élément dans la confirmation de suppression d’une coordonnée | [Préférences](preferences.md#journal), [comportements](comportements.md) | **Clos le 31 octobre 2026** : toutes les confirmations nomment leur cible (AUD-Q1 tranchée) |
| HARMO-11 | Typographie des textes visibles | 94 chaînes à apostrophe droite et 31 `&apos;` contre environ 193 typographiques ; points de suspension ASCII corrigés le 31 octobre 2026 avec un test de garde | [Principes](principes.md) | **Clos le 31 octobre 2026** : 116 chaînes converties en « ’ », `&apos;` retiré ; « … », « ’ », « autorisation » et mots anglais gardés par `visible-wording-contracts` |
| HARMO-12 | Tokens d’accès sans consommateur | `--access-privileged`, `--access-admin`, `--access-member` et leurs alias `--color-access-*` sont définis dans `globals.css` ; aucun fichier TS, TSX ou CSS ne les utilise (relevé du 7 novembre 2026) ; les avatars prennent les tons d’état | [Fondations](fondations.md#pôles-et-avatars), [principes](principes.md#couleur) | **Clos le 7 novembre 2026** : tokens et mentions retirés (« ok go » du propriétaire), sans changement de rendu |
| HARMO-05 | Composants sans consommateur | `ResourceStateBoundary`, `Tabs`, `PageHero`, composants de l’actualité interne, `UserHistoryTab` | [Composants](composants.md#à-retirer-ou-à-adopter) | **Clos le 20 octobre 2026** : tous retirés ([SYS-01 à SYS-04](../systeme/constats.md)) |

## Plan de reprise proposé

Proposition, à confirmer selon les priorités du propriétaire :

1. Fait le 20 octobre 2026 : badge de statut commun (HARMO-01).
2. Fait le 20 octobre 2026 : liste Utilisateurs alignée sur les filtres rapides (HARMO-06).
3. Qualification des rayons et tailles arbitraires (HARMO-02, HARMO-03) à la
   reprise de chaque composant concerné, sans campagne de remplacement aveugle.
4. Fait le 20 octobre 2026 : code dormant retiré (HARMO-05, SYS-01 à SYS-04).

## État par page

Colonnes : **État** selon le gabarit et les pages de référence ; **Couleurs
codées** : valeurs hexadécimales dans les styles chargés par la page ;
**< 10 px** : textes sous 10 px ; **Marqueurs** : composants relevés dans le code.

| Route | Gabarit | État | Couleurs codées | < 10 px | Marqueurs |
| --- | --- | --- | ---: | ---: | --- |
| `/` | F | Aligné | 0 | 0 | `PageIdentityHero` |
| `/login` | G | Aligné ; champs adoucis vérifiés sur le serveur local le 17 octobre 2026 | 0 | 0 | Carte hors cadre, `MfaCodeInput` |
| `/personnes/repertoire` | A | **Référence** ; reprise du 20 octobre 2026, banc client 41/41, rendu réel validé par le propriétaire ; filtre et pastille « Ancien membre » (ton `former`) le 10 novembre 2026 | 0 | 0 | `PageIdentityHero`, `DataTableSection`, `QuickFilter`, `StatusBadge` |
| `/personnes/repertoire/nouveau` | C | Aligné ; reprise du 23 octobre 2026, banc client 28/28 ; cartes « Pseudo et nom » et « Statut », barre en ligne sous les cartes le 31 octobre 2026 ; carte « Statut » retirée le 9 novembre 2026 (statut calculé) | 0 | 0 | `PageIdentityHero` compact, `SectionActionBar` |
| `/personnes/repertoire/[id]` | B | Aligné ; reprise du 22 octobre 2026 (dates dans le bandeau, sans titre de section) ; `EntityHeader` le 27 octobre 2026, banc client 31/31 ; le 27 octobre 2026 : cartes de rubrique sur Identité (« Pseudo et nom », « Naissance et statut », devenue « Naissance » le 9 novembre 2026), Coordonnées en une colonne avec total sur l’onglet, historique de champ retiré ; banc client 31/31 ; onglet Parcours en lecture le 9 novembre 2026 (deux blocs, tableau du Répertoire, flèche `ArrowUpRight`), banc client à cinq largeurs ; lignes de la structure (Bureau & staff) le même jour, selon les droits du lecteur, banc client à cinq largeurs ; le 10 novembre 2026, carte « Naissance et nationalité » (`SearchSelect`), cartes Contacts d’urgence, Représentants légaux et « Représentant légal de » sur `CollectionCard`, fenêtres au modèle du passage, avatars des fiches liées, zone dangereuse expliquée pour un représentant (`unavailableReason`) ; captures réelles à 1 440 et 390 px ; drapeaux des pays (nationalité, pays des téléphones), carte « Autres pseudos » (`RubricCard` avec nombre et « Ajouter » en en-tête) ID du compte Discord et carte « Comptes de jeu » le même jour ; onglet En ligne (autres pseudos, réseaux, comptes de jeu) le même jour, Identité réduite à ses champs principaux | 0 | 0 | `EntityDetailLayout`, `EntityHeader`, `SectionActionBar`, `PageSectionNavigation` (`managedIn`), `DataTableSection`, `Table`, `StatusBadge`, `TeamAvatar`, `StructureAvatar`, `SearchSelect`, `PersonPicker`, `PersonAvatarFrame`, `Dialog`, `AlertDialog` |
| `/mon-compte` | B | Aligné ; onglet Autorisations en lecture : flèche ↗ à trancher (PREF-Q6, règle du 8 novembre 2026) ; reprise du 20 octobre 2026 (états dans le bandeau, sections sans titre répété ni cadre imbriqué) ; `EntityHeader`, cartes de rubrique (`RubricCard`) et onglets alignés sur la fiche utilisateur (Profil · Autorisations · Sécurité) le 27 octobre 2026, banc client 28/28 | 0 | 0 | `UserIdentityStatus`, `EntityHeader` (`PageSectionNavigation`), `RubricCard`, `SectionActionBar` |
| `/esport/jeux/[id]` | B | Aligné à sa création le 8 novembre 2026 (même composition que la fiche équipe ; explication à la place de la suppression quand le jeu a des équipes) ; onglets Fonctions et Informations le 9 novembre 2026 (liste de choix dans la fiche, fenêtre d’une fonction, ordre par glisser-déposer) ; banc client à quatre largeurs | 0 | 0 | `EntityDetailLayout` (`sections`), `DataTableSection`, `SortableList`, `Dialog`, `AlertDialog`, `Select`, `Switch`, `ContentState`, `RubricCard`, `SectionActionBar`, `UnsavedNavigationDialog`, `EntityDangerZone` (`unavailableReason`), `ApproximateDateField`, `GameAvatar` |
| `/esport/equipes/[id]` | B | Aligné à sa création le 8 novembre 2026 (section modifiée sur place, barre d’enregistrement commune, zone dangereuse) ; onglets Roster et Informations le 9 novembre 2026 (Roster en blocs, filtres et date, fenêtre d’un passage, explication à la place de la suppression), avatars des personnes et tableau du Répertoire le même jour, puis Roster limité aux membres actuels et à venir, onglet Anciens membres (par année de fin, recherche, filtre Fonction) et colonne Durée ; banc client à quatre largeurs | 0 | 0 | `EntityDetailLayout` (`sections`), `DataTableSection`, `QuickFilter`, `DatePicker`, `Dialog`, `AlertDialog`, `Select`, `Switch`, `ApproximateDateField`, `RubricCard`, `SectionActionBar`, `UnsavedNavigationDialog`, `EntityDangerZone` (`unavailableReason`), `TeamAvatar`, `PersonAvatarFrame`, `ListSearchField`, `QuickFilter`, `Table`, `StatusBadge` |
| `/structure/bureau-staff` | B | Aligné à sa création le 9 novembre 2026 : la fiche de la structure, composée comme la fiche équipe (Effectif, Anciens membres, Fonctions), composants partagés sans copie ; banc client à cinq largeurs (1 440, 1 024, 768, 390, 320 px) : Effectif en blocs Bureau et Staff, ajout avec les fonctions de la structure, anciens membres filtrés Bureau, fonctions et fenêtre du type, lecture seule, accès refusé, Parcours avec ses lignes de la structure ; aucun débordement, aucune erreur JavaScript | 0 | 0 | `EntityDetailLayout` (`sections`), `DataTableSection`, `Table`, `StatusBadge`, `PersonAvatarFrame`, `QuickFilter`, `ListSearchField`, `SortableList`, `Dialog`, `AlertDialog`, `SearchSelect`, `Select`, `Switch`, `ApproximateDateField`, `StructureAvatar` |
| `/esport/jeux` | A | Aligné à sa création le 8 novembre 2026 (liste du Répertoire, création et modification en fenêtre ; icône par défaut et équipes sous chaque jeu le même jour) ; jeux et équipes rangés par glisser-déposer, un seul ordre, actifs et inactifs mélangés, le 9 novembre 2026 ; banc client à quatre largeurs | 0 | 0 | `PageIdentityHero`, `DataTableSection` (`groupedTable`, `withHandles`), `SortableGroup`, `SortableItem`, `secondaryButton`, `ListSearchField`, `QuickFilter`, `StatusBadge`, `ContentState`, `Dialog`, `AlertDialog`, `GameAvatar`, `TeamAvatar`, `ApproximateDateField` |
| `/systeme/utilisateurs` | A | **Référence** (complément) ; reprise du 20 octobre 2026, banc client 42/42, ligne de filtres revue sur le rendu réel | 0 | 0 | `DataTableSection`, `QuickFilter`, `StatusBadge` |
| `/systeme/utilisateurs/nouveau` | C | Aligné ; reprise du 23 octobre 2026, banc client 28/28 ; cartes « Identité », « Connexion et contact », « Rôle », barre en ligne sous les cartes le 31 octobre 2026 | 0 | 0 | `PageIdentityHero` compact, `SectionActionBar` |
| `/systeme/utilisateurs/[id]` | B | **Référence** (barre d’enregistrement, en-tête de fiche) ; reprise du 20 octobre 2026 ; éditeur d’autorisations refait le 26 octobre 2026 ; `EntityHeader` et cartes de rubrique (`RubricCard`) le 27 octobre 2026, banc client 58/58 | 0 | 0 | `EntityHeader`, `RubricCard`, `UserIdentityStatus`, `PermissionsEditor`, `PermissionNavigation`, `SectionActionBar` |
| `/systeme/journal-activite` | A | Aligné ; reconstruit le 30 octobre 2026 en lecture seule (recherche, période, filtres rapides, lignes dépliables, pagination commune), banc client 12/12 | 0 | 0 | `PageIdentityHero`, `DataTableSection`, `QuickFilter`, `ListPagination` |
| `/systeme/parametres` | D | Aligné (refonte du 14 octobre 2026) ; revu le 23 octobre 2026 ; choix rapides, équivalence en années et avertissements encadrés le 27 octobre 2026, banc client 34/34 | 0 | 0 | `PageIdentityHero`, `SectionActionBar` |
| `/systeme/feuille-de-route` | E | Aligné ; refondue le 7 novembre 2026 en quatre vues (Chantiers par pôle, Pages et onglets, Couverture, Ordre suggéré) à lignes dépliables, banc client à quatre largeurs | 0 | 0 | `PageIdentityHero`, `PageSectionNavigation`, `DataTableSection`, `QuickFilter`, `ListSearchField`, `StatusBadge`, `ContentState` |
| États techniques (erreur, 404, chargement) | G | Aligné | 0 | 0 | `RouteErrorState`, `PageState`, `Skeleton` |

Redirections sans rendu propre : `/systeme` sans segment, et les alias
`/administration` et `/tableau-de-bord` ([routes](../systeme/routes.md)).

## Reproduire les mesures

Depuis `apps/web/src` :

```bash
grep -rhoE '#[0-9a-fA-F]{3,8}\b' --include=*.module.css . | wc -l
grep -rnoE '\[#[0-9a-fA-F]{3,8}\]' --include=*.tsx . | wc -l
grep -rnE 'font-size: *[0-9](\.[0-9]+)?px' --include=*.css .
grep -rhoE 'rounded(-[a-z]+)?-\[[^]]+\]' --include=*.tsx . | sort | uniq -c
grep -rhoE 'text-\[[0-9.]+(px|rem)\]' --include=*.tsx . | sort | uniq -c
grep -rlE 'transition-all|transition: *all' --include=*.tsx --include=*.css .
```

Ces relevés sont des indicateurs ; une reprise de page vérifie le rendu réel.
