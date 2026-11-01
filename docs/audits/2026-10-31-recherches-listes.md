# Recherches des listes et de l’éditeur d’autorisations — audit ciblé du 31 octobre 2026

[Index des audits](README.md) · [Méthode](../methode/audit.md) ·
[Règle des listes](../design/comportements.md#listes-recherche-et-pagination) ·
[Recherche rapide de l’en-tête](2026-10-31-recherche-rapide.md)

## Question, périmètre et état examiné

- **Demande du propriétaire** : après l’audit de la recherche rapide, « faut
  vérifier d’autre composant de ce type ? » puis « ok go » sur la proposition :
  vérifier les autres champs de recherche (accents, majuscules, ponctuation,
  plusieurs mots, droits, absence de résultat, effacement), pour qu’une même
  saisie donne le même résultat partout.
- **Attendu** : la [règle des listes](../design/comportements.md#listes-recherche-et-pagination)
  (« accents et casse normalisés, mots d’identité dans n’importe quel ordre ») ;
  la préférence « Listes de gestion : recherche des mots dans les deux ordres »
  (10 octobre 2026) ; pour l’éditeur d’autorisations, la décision du 26 octobre
  2026 (chaque mot, petits mots ignorés, singulier et pluriel équivalents).
- **Type** : audit transverse ciblé de cinq champs : Répertoire
  (`GET /api/personnes`), Utilisateurs (`GET /api/users`), Journal d’activité
  (`GET /api/audit`), Feuille de route (recherche locale), Autorisations de la
  fiche utilisateur (recherche locale). La recherche rapide de l’en-tête a son
  [propre rapport](2026-10-31-recherche-rapide.md).
- **État** : `main` à `0e0658b`, sans changement local. PostgreSQL 17 jetable
  local (port 5433, langue « C ») ; la base partagée n’a pas été interrogée.
- **Exclusions** : aucun parcours navigateur. Les recherches serveur passent
  par les vraies routes et le vrai SQL, mais l’affichage, l’effacement et les
  messages vides sont examinés dans le code.

## Preuves

| Preuve | Contenu | Limite |
| --- | --- | --- |
| Lecture du code | [Répertoire](../../apps/web/src/features/persons/server/person-search.ts) et sa [normalisation](../../apps/web/src/features/persons/person.utils.ts), [Utilisateurs](../../apps/web/src/features/users/server/users-list-search.ts), [Journal](../../apps/web/src/features/audit/server/audit-journal.service.ts), [Feuille de route](../../apps/web/src/features/roadmap/roadmap-search.ts), [Autorisations](../../apps/web/src/components/users/permission-editor-view.ts), [`ListSearchField`](../../apps/web/src/components/ui/list-search-field.tsx), [champ de l’éditeur](../../apps/web/src/components/users/PermissionNavigation.tsx) | Aucun parcours exécuté |
| Sonde par les routes réelles | Test Vitest temporaire, retiré après relevé : cinq comptes, cinq fiches et cinq événements fictifs nommés « André Lefèvre », « Iñaki Álvarez », « Zoé Cœurdevey », « Jean-Pierre d’Artagnan » (apostrophe typographique) et « Ludmila Søren » ; 14 requêtes sur les trois routes en superadmin, 3 requêtes du journal en administrateur. La garde de configuration du module Personnes (clés de chiffrement absentes du banc) est neutralisée dans la sonde seule | Base presque vide, langue « C » |
| Sonde locale | Les mêmes noms à travers les quatre normalisations JavaScript ; 12 requêtes sur le catalogue réel de la Feuille de route et 12 sur celui de l’éditeur | Logique seule, sans rendu |
| Plans PostgreSQL | `EXPLAIN` avec balayage séquentiel désactivé, sur la base migrée | Base presque vide |

## Résultats des recherches serveur

✓ : la personne est trouvée ; ✗ : aucun résultat alors qu’elle existe.

| Saisie | Répertoire | Utilisateurs | Journal |
| --- | --- | --- | --- |
| `andre` | ✓ | ✓ | ✗ |
| `ANDRÉ` | ✓ | ✓ | ✗ (dépend de la langue de la base, voir RL-01) |
| `André Lefèvre` | ✓ | ✓ | ✓ |
| `lefevre andre` | ✓ | ✓ | ✗ |
| `inaki`, `alvarez` | ✓ | ✗ | ✗ |
| `coeurdevey` | ✗ | ✗ | ✗ |
| `cœur` | ✓ | ✓ | ✓ |
| `jean pierre` | ✓ | ✓ | ✗ |
| `jean-pierre`, `artagnan` | ✓ | ✓ | ✓ |
| `d'artagnan` (apostrophe droite) | ✗ | ✗ | ✗ |
| `soren` | ✗ | ✗ | ✗ |
| `zo` | ✓ | ✓ | non appliquée (3 caractères minimum, décision du 30 octobre) |

Recherches locales :

| Saisie | Feuille de route | Autorisations |
| --- | --- | --- |
| Singulier / pluriel | `reunion` 3 chantiers, `réunions` 1 ; `equipe` 10, `équipes` 4 ; `facture` = `factures` | `utilisateur` = `utilisateurs` (19) ; `fiche` = `fiches` (4) |
| Ordre et petits mots | `sponsors partenaires` = `partenaires sponsors` | `mot de passe` = `passe mot` (5) |
| Apostrophe | Droite ou typographique équivalentes | `journal d'activité` = `journal d’activité` (1) |

Normalisations comparées : « Cœurdevey » devient `coeurdevey` dans l’en-tête et
la Feuille de route, reste `cœurdevey` au Répertoire et se découpe en `c` et
`urdevey` dans l’éditeur ; « Søren » garde son `ø` partout, et l’éditeur le
découpe en `s` et `ren`.

## Ce qui est conforme

| Élément | Observé |
| --- | --- |
| Droits | Journal : un administrateur ordinaire qui cherche « André Lefèvre », « Racine » ou l’identifiant du compte protégé n’obtient aucun événement de ce compte (sonde). Utilisateurs et Répertoire : coordonnées cherchées seulement avec le droit, identité privée du compte protégé jamais révélée ; suites `users-list-postgres` et `persons-list-postgres`, réussies le 31 octobre (`test:postgres` 227/227), non rejouées pour cet audit |
| Caractères spéciaux | `%`, `_` et `\` littéraux au Répertoire et aux Utilisateurs (mêmes suites) ; `%` ignoré au Journal, où `_` ne fait qu’élargir (limite documentée) |
| Répertoire | Accents, casse, ordre des mots, tirets |
| Utilisateurs | Accents français, casse, ordre des mots, tirets |
| Feuille de route, Autorisations | Accents, casse, ordre des mots, apostrophes ; singulier et pluriel équivalents dans l’éditeur |
| Absence de résultat | Message dédié partout : « Aucune fiche trouvée », « Aucun utilisateur trouvé », « Aucun événement pour ces filtres », « Aucun chantier ne correspond », « Aucune autorisation ne correspond à cette recherche. » |
| Effacement | Bouton « Effacer la recherche » qui rend le focus au champ dans les quatre listes (`ListSearchField`) |
| Longueur | 100 caractères (Répertoire, Utilisateurs, Journal), 200 (Feuille de route), 80 (éditeur) ; aucun effet constaté |

## Constats

| ID | Nature / priorité | Reproduction : attendu / observé | Impact | Action proposée | État |
| --- | --- | --- | --- | --- | --- |
| RL-01 | Défaut, P2 | Journal : `andre`, `lefevre andre`, `jean pierre` ne trouvent rien alors que « André Lefèvre » et « Jean-Pierre d’Artagnan » ont des événements. La recherche exige la suite exacte de caractères (`ILIKE`) dans l’un des quatre noms figés, sans repli des accents (limite acceptée à la livraison du 30 octobre pour garder l’index trigrammes). Elle contredit la règle des listes et la préférence « mots dans les deux ordres ». Sur cette base en langue « C », `ANDRÉ` ne trouve pas non plus « André » ; une base en langue UTF-8 replie cette casse, non vérifié sur la base partagée | Une recherche d’auteur peut conclure à tort qu’il n’a rien fait. Contournements : « Filtrer sur cet auteur » (par identifiant) et l’identifiant de connexion, souvent sans accent | Chaque mot, dans n’importe quel ordre, sur la forme sans accents des quatre noms ; index trigrammes sur cette forme (migration) ; minimum de trois caractères conservé | Corrigé et vérifié |
| RL-02 | Défaut, P2 | Utilisateurs : `inaki`, `alvarez`, `soren`, `coeurdevey`, `d'artagnan` ne trouvent rien. La table d’accents écrite à la main ne couvre que 15 lettres françaises ; apostrophes droite et typographique distinctes | Noms étrangers introuvables sans l’accent exact, alors que des joueurs peuvent en porter | Règle commune (RL-04) | Corrigé et vérifié |
| RL-03 | Défaut, P2 | Répertoire : `coeurdevey`, `soren`, `d'artagnan` ne trouvent rien. Les noms normalisés enregistrés gardent `œ`, `æ`, `ø` et l’apostrophe saisie (un iPhone remplace souvent `'` par `’`) | Même effet sur la liste la plus consultée | Règle commune, puis recalcul des noms normalisés enregistrés (migration) ; un nom fait seulement de ponctuation doit rester non vide (contrainte `CHECK`) | Corrigé et vérifié |
| RL-04 | Dette, P2 | Quatre normalisations distinctes (en-tête et Feuille de route ; Répertoire ; Utilisateurs en SQL ; éditeur) et aucune au Journal ; aucune ne traite `ø`. L’éditeur découpe `œ`, `æ` et `ø` en fragments (« cœur » cherche `c` et `ur`), sans effet aujourd’hui : aucun libellé n’en contient | Cause commune de RL-01 à RL-03 : une même saisie donne des résultats différents d’une page à l’autre | Une seule règle, en JavaScript (navigateur et serveur) et en SQL (fonction immuable créée par migration), testées l’une contre l’autre | Corrigé et vérifié |
| RL-05 | Dette, P2 | Utilisateurs : les quatre index trigrammes (prénom, nom, identifiant, email de contact) ne servent jamais. La recherche compare `lower(translate(colonne))`, et PostgreSQL lit toute la table même avec le balayage séquentiel désactivé. Le Journal, lui, utilise ses index | Sans effet mesuré : 17 ms à 10 000 comptes ([USR-03](../pages/systeme/utilisateurs/liste.md)) | Avec RL-04, index sur la forme normalisée à la place des quatre inutiles | Corrigé et vérifié |
| RL-06 | Suggestion, P3 | Feuille de route : le pluriel réduit les résultats (`réunions` 1 chantier, `reunion` 3), alors que l’éditeur rend singulier et pluriel équivalents et ignore les petits mots | Chantiers manqués selon la forme tapée | Même découpage des mots que l’éditeur | Corrigé et vérifié |
| RL-07 | Suggestion, P3 | Éditeur d’autorisations : pas de bouton « Effacer la recherche » ; seul le bouton natif du navigateur existe, absent de Firefox. Examiné dans le code | Effacement moins direct que dans les quatre listes | Même bouton que `ListSearchField`, focus rendu au champ | Corrigé et vérifié |

## Corrections du 31 octobre 2026

Sur « ok go » du propriétaire, toutes les recommandations sont appliquées le
même jour, sur `main` à `0e0658b` avec des changements locaux non commités.

| Constat | Correction | Contrôle |
| --- | --- | --- |
| RL-04 | Règle unique [`normalizeSearchText`](../../apps/web/src/shared/utils/search-text.utils.ts) : décomposition NFKD, diacritiques retirés, minuscules, « œ », « æ », « ø », « ß », « þ », « đ », « ł »… lus à la latine, ponctuation, symboles et espaces lus comme des séparateurs. Elle remplace les normalisations de l’en-tête, de la Feuille de route, de l’éditeur, du Répertoire, des Utilisateurs et du nom public du compte protégé. Migration [`20261031140000_shared_search_text`](../../packages/database/prisma/migrations/20261031140000_shared_search_text/migration.sql) : fonction SQL immuable `search_text`, dont la table de lettres est générée depuis la règle TypeScript ; elle ne dépend pas de la langue de la base, et un nom sans accent passe par un raccourci | `search-text.test.ts` ; `audit-journal-postgres` compare SQL et TypeScript pour chaque caractère des blocs latins, grecs, cyrilliques, de ponctuation et de compatibilité, et pour des noms complets ; sur base jetable, les deux versions de la fonction concordent sur les 1 112 064 caractères Unicode |
| RL-01 | Colonne `AuditLog.searchText` (les quatre noms figés sous cette forme), écrite par le déclencheur `AuditLog_search_text` à l’insertion, jamais par l’application ; index trigrammes sur cette colonne, à la place des quatre index par nom. Recherche : chaque mot, dans n’importe quel ordre ; trois lettres ou chiffres au moins. Les événements passés sont complétés par la migration, seule à lever la garde d’ajout seul, le temps de remplir cette colonne ; les noms figés restent protégés par leur propre déclencheur | Route réelle sur PostgreSQL : `andre`, `ANDRÉ`, `lefevre andre`, `jean pierre`, `d'artagnan`, `Artagnan Lefèvre` trouvent l’événement, `andre hopper` non. Navigateur : un seul événement pour quatre saisies, état vide pour `andre hopper`. Migration rejouée sur données existantes : colonne remplie, garde réactivée, modification de nouveau refusée |
| RL-02, RL-05 | Recherche des Utilisateurs sur `search_text(identifiant prénom nom)` et `search_text(email)` ; deux index trigrammes d’expression remplacent les quatre index inutiles. Une ponctuation seule ne filtre rien | `users-list-postgres` : `inaki`, `ALVAREZ iñaki`, `soren`, `d'artagnan jean pierre`, `coeurdevey`, `CŒUR`. Plan d’exécution : les deux index servent la recherche. Coût mesuré : 2,5 µs pour un nom sans accent (inchangé), 16 µs avec accents. Navigateur : « alvarez INAKI » → 1 compte |
| RL-03 | `normalizePersonSearchValue` applique la règle commune ; un nom fait seulement de symboles (« -_- ») garde l’ancienne forme, non vide et cherchable tel quel. La migration recalcule les noms normalisés et le nom de tri | `persons-list-postgres` (lettres, apostrophes, ponctuation sans joker) ; migration rejouée sur des fiches existantes (`cœurdevey` → `coeurdevey`, `d’artagnan` → `d artagnan`, « -_- » inchangé) ; navigateur : `coeurdevey`, `d'artagnan jean`, `-_-` |
| RL-06 | Feuille de route : `getSearchTerms`, comme l’éditeur | `roadmap-search.test.ts` sur le catalogue réel : `réunions` = `reunion`, `équipes` = `equipe` |
| RL-07 | Bouton « Effacer la recherche » dans le champ de l’éditeur, focus rendu au champ, bouton du navigateur masqué | Navigateur : 32 px centré à 1 440 px ; à 390 px, 36 px visibles et zone tactile de 44 px ; aucun débordement |

Contrôles d’ensemble :

- Vitest : 1 257 réussis et 235 ignorés.
- Suites PostgreSQL : 235/235.
- Types, lint, code mort et budget d’architecture réussis ; contrôle documentaire réussi.
- Navigateur sur build de production et base jetable (port 3002) : sonde des
  recherches réussie ; suite E2E complète réussie (1 scénario, 1,3 min).
- Captures relues, non conservées.

## Verdict et suivi

**Conforme sur le périmètre vérifié.** Une même saisie donne désormais le même
résultat dans les cinq champs et dans la recherche de l’en-tête. Les droits
restent conformes.

Limites :

- **La migration n’est pas appliquée sur la base partagée.** Tant qu’elle ne
  l’est pas, l’application, qui attend la colonne `searchText`, ne peut plus
  écrire d’événement sur cette base. Elle s’applique avec
  `bun run db:migrate:deploy`, après une sauvegarde.
- Aucun lecteur d’écran ni appareil physique n’a été utilisé. Firefox n’a pas
  été essayé : le bouton d’effacement ne dépend plus du navigateur.
- Les lettres hors des blocs vérifiés (écritures d’Asie, par exemple) gardent
  leur forme, de façon identique en TypeScript et en SQL.

Réexamen : à l’ajout d’un champ de recherche, qui utilise `normalizeSearchText`,
ou à toute modification de cette règle, qui demande une migration redéfinissant
`search_text`.
