# Tests et contrôles

[Cartographie](README.md) · [Fiche Tests et validation](../references/tests-validation.md) ·
[Méthode d’audit](../methode/audit.md) · [Guide de contribution](../methode/guide-contribution.md)

## Familles de tests

Relevé du 7 novembre 2026.

| Famille | Volume | Emplacement | Commande |
| --- | --- | --- | --- |
| Tests web (Vitest, rendu serveur `renderToStaticMarkup`) | 149 fichiers `*.test.ts` (dont `tournaments` et `tournaments-postgres`, tournois : schémas, fourchette, line-up pris dans le Roster et remplaçant ponctuel, portée Esport, refus du service et de la base, journal et line-up masqué, depuis le 11 novembre 2026 ; `operations` et `operations-postgres`, listes de la trésorerie et opérations : valeurs courantes, ordre, valeur utilisée gardée, solde du jour, filtres et nombres, refus du service et de la base, ce qu’une opération nomme reste, montants signés, journal masqué, depuis le 11 novembre 2026, puis filtres d’une équipe, d’un jeu et d’une fiche avec leurs totaux et détail d’un jeu par équipe le même jour ; `organizations` et `organizations-postgres`, organisations et contacts : types rangés et uniques, site lu comme on le dit, numéro au format international, contact par nom ou par fiche, Répertoire réservé à qui le lit, suppression en cascade, journal et valeurs masquées, depuis le 11 novembre 2026 ; `treasury` et `treasury-postgres`, entités et comptes : forme, période, entité principale, entité déduite d’un compte, montants en centimes, refus en base et dans le service, journal et valeurs masquées, depuis le 10 novembre 2026 ; `esport-scope` et `esport-scope-postgres`, portée Esport d’un compte : filtres, refus hors portée, réglage dans les autorisations et journal, depuis le 10 novembre 2026 ; `person-relatives-schemas` et `person-relatives-postgres`, nationalité, contacts d’urgence, représentants légaux, autres pseudos et ID Discord, `person-other-nicknames`, `person-account-id` (ID Discord et Steam, comptes de jeu) et `country-flag`, depuis le 10 novembre 2026 ; `search-select`, menu des listes du site, et `staff-postgres`, Bureau & staff : Effectif, fonctions Bureau et Staff, droits propres et Parcours limité aux listes visibles, depuis le 9 novembre 2026 ; `passages` et `passages-postgres`, Roster d’une équipe, ses anciens membres et parcours d’une fiche, `member-functions` et `member-functions-postgres`, fonctions de chaque jeu, `sortable-list` et `manual-order`, listes rangées par glisser-déposer, et `date-picker`, champ de date du site, depuis le 9 novembre 2026 ; `games` et `games-postgres`, page Jeux, puis `teams` et `teams-postgres`, équipes, depuis le 8 novembre 2026 ; `visible-wording-contracts`, garde du vocabulaire visible, depuis le 31 octobre 2026 ; `feature-readiness` et `person-schema-readiness` retirés avec le sondage de disponibilité le même jour ; `roadmap-card` remplacé par `roadmap-views` et `disclosure` le 7 novembre 2026) | `apps/web/src/__tests__/` et quelques modules | `bun run test` ; un fichier : `bunx vitest run src/__tests__/<nom>.test.ts` depuis `apps/web` |
| Tests SQL sur PostgreSQL jetable | 22 fichiers `*-postgres.test.ts` (inclus ci-dessus) | `apps/web/src/__tests__/` | `bun run test:postgres` avec `POSTGRES_TEST_ADMIN_URL` (rôle d’un PostgreSQL **local** autorisé à créer des bases) : recrée les vingt bases `*_test`, applique les migrations après avoir vérifié la cible, puis lance les vingt-deux suites (dont `operations-postgres`, base `operations_test`, variable `OPERATIONS_TEST_DATABASE_URL`, depuis le 11 novembre 2026, `organizations-postgres`, base `organizations_test`, variable `ORGANIZATIONS_TEST_DATABASE_URL`, depuis le 11 novembre 2026, `treasury-postgres`, base `treasury_test`, variable `TREASURY_TEST_DATABASE_URL`, depuis le 10 novembre 2026, `esport-scope-postgres`, base `esport_scope_test`, variable `ESPORT_SCOPE_TEST_DATABASE_URL`, depuis le 10 novembre 2026, `person-relatives-postgres`, base `person_relatives_service_test`, variable `PERSON_RELATIVES_TEST_DATABASE_URL`, depuis le 10 novembre 2026, `staff-postgres`, base `staff_service_test`, variable `STAFF_TEST_DATABASE_URL`, depuis le 9 novembre 2026, `audit-journal-postgres`, base `audit_journal_service_test`, depuis le 30 octobre 2026, `games-postgres`, base `games_service_test`, et `teams-postgres`, base `teams_service_test`, depuis le 8 novembre 2026, `member-functions-postgres`, base `member_functions_service_test`, et `passages-postgres`, base `passages_service_test`, depuis le 9 novembre 2026). Exécuté par la CI depuis le 24 octobre 2026. Sans PostgreSQL configuré, un serveur jetable se démarre avec les binaires installés : `initdb -D <dossier> -U postgres --auth=trust`, `pg_ctl -D <dossier> -o "-p 5433 -c listen_addresses=127.0.0.1" start`, puis `POSTGRES_TEST_ADMIN_URL=postgresql://postgres@127.0.0.1:5433/postgres` ; l’arrêter ensuite avec `pg_ctl stop`. Sans leur variable `<MODULE>_TEST_DATABASE_URL`, ces suites sont ignorées par `bun run test` |
| Tests de la base | 5 fichiers (`node --test`) | `packages/database/test/` : format, signature et chiffrement des sauvegardes (dont, depuis le 9 novembre 2026, le registre dans la copie et le refus de toute table du schéma absente de la copie ; format v13 avec les contacts d’urgence, représentants légaux et autres pseudos depuis le 10 novembre 2026 ; format v16 avec les organisations et leurs contacts, puis v17 avec les listes de la trésorerie et les opérations, puis v18 avec les tournois, depuis le 11 novembre 2026, et v19 le 12 avec leurs dates facultatives), chiffrement des secrets TOTP, plan de performance | `bun --cwd packages/database run test` |
| Parcours navigateur Playwright | `admin-smoke.spec.ts` et ses contrôles (création et fiche utilisateur, paramètres) | `apps/web/e2e/` | `bun run test:e2e` (build de production, base dont le nom contient `e2e` ou `test`) |
| Contrats de structure | Frontières shadcn, autocomplétion, design system, contrats UX | `apps/web/src/__tests__/` | Inclus dans `bun run test` |
| Documentation | Liens, ancres, index, fiches de page | [check-docs.mjs](../../scripts/check-docs.mjs) | `bun run docs:check`, `bun run docs:check:test` |

La CI ([ci.yml](../../.github/workflows/ci.yml)) installe les dépendances,
génère le client Prisma, audite les dépendances, lance `bun run check` puis un
parcours E2E de production. Sa configuration ne prouve pas une exécution réussie.

## Choisir les contrôles et lire leur résultat

Les commandes ci-dessous partent de la racine du dépôt. Leur définition se trouve
dans les scripts [racine](../../package.json), [web](../../apps/web/package.json)
et [base](../../packages/database/package.json). Sélectionner selon le changement
et le risque ; une correction documentaire ne demande pas un audit de production.

| Commande | Objet | Limite / effet à connaître |
| --- | --- | --- |
| `bun run docs:check` | Liens locaux, ancres Markdown et présence dans les index documentaires | Ne prouve pas l’exactitude métier ni la disponibilité des liens Internet |
| `bun run docs:check:test` | Régressions du contrôleur documentaire | Utilise des fichiers temporaires isolés, supprimés après les tests |
| `bun run lint` | Conventions et analyses statiques | Un succès ne démontre pas un parcours |
| `bun run typecheck` | Contrats TypeScript | Ne prouve pas les contraintes réellement déployées en base |
| `bun run --filter web check:architecture` | Budgets structurels du code | Un dépassement exige une analyse, pas un relèvement automatique du seuil |
| `bun run test` | Suites automatisées des packages | Lire les simulations, prérequis et tests ignorés ; aucun verdict global si une suite échoue |
| `bun run build` | Compilation de production | Produit des artefacts ; ne publie pas le site |
| `bun run --filter web check:performance` | Budgets des artefacts du build | Exige un build à jour ; ne mesure pas les requêtes SQL ni une session utilisateur |
| `bun run test:e2e` | Parcours navigateur et préparation E2E | Examiner la configuration et la préparation avant exécution ; environnement et comptes dédiés requis |
| `bun run persons:performance` | Mesures du répertoire en base | Vérifier la cible, le volume et les effets du script ; ne pas viser une base réelle par défaut |
| `bun run check` | Chaîne générale : documentation, tests du contrôleur, lint, code mort (knip), types, architecture, tests, build et budget de build | S’arrête au premier échec ; les étapes suivantes sont alors non exécutées ; ne comprend pas les E2E |

`maintenance`, les migrations, les scripts d’initialisation et les restaurations
ne sont pas des vérifications neutres : ils peuvent écrire, purger ou remplacer
des données. Consulter [Exploitation](../exploitation/operations.md) et le
[guide de la base](../../packages/database/prisma/README.md) selon le besoin.
Utiliser une cible isolée pour les essais qui modifient des données.

Régression SQL du répertoire : depuis `apps/web`, lancer
`bun run test src/__tests__/persons-list-postgres.test.ts` avec
`PERSONS_LIST_TEST_DATABASE_URL` pointant vers une base locale jetable nommée
`repertoire_pagination_test`. Ce groupe est ignoré sans cette variable ; il crée
et supprime un schéma unique et n'utilise pas `DATABASE_URL`. Le schéma minimal
teste la liste et ses comptages, avec une table de passages réduite pour le
statut calculé (passage en cours, fini la veille, fini le jour même, à venir),
pas les migrations ni les mutations métier.
Lancer directement la commande pour une preuve nouvelle, sans cache Turbo.

Régression SQL de la recherche Utilisateurs : depuis `apps/web`, lancer
`bun run test src/__tests__/users-list-postgres.test.ts` avec
`USERS_LIST_TEST_DATABASE_URL` pointant vers une base locale jetable nommée
`users_list_test`. Sans cette variable, ce groupe est ignoré. Il crée et supprime
son propre schéma unique, refuse une cible non locale ou un autre nom de base,
et n'utilise jamais `DATABASE_URL` par défaut. Le schéma minimal vérifie la
recherche et sa visibilité ; il ne valide pas les migrations, les sessions ou
les mutations. Exécuter directement pour une preuve nouvelle sans cache Turbo.
La variable est déclarée dans l'environnement de la tâche de test Turbo. La
suite charge la fonction `search_text` depuis la migration
`20261031140000_shared_search_text` dans son schéma.

Règle de recherche commune (audit RL du 31 octobre 2026) : `search-text.test.ts`
vérifie `normalizeSearchText` (accents, lettres « œ », « ø », « ß », apostrophes,
autres alphabets). La suite `audit-journal-postgres`, sur base entièrement
migrée, compare la fonction SQL `search_text` à la règle TypeScript pour chaque
caractère des blocs latins, grecs, cyrilliques, de ponctuation et de formes de
compatibilité, vérifie la recherche du journal par mots dans n’importe quel
ordre et l’usage des index d’expression par la recherche des utilisateurs. Toute
modification de la règle TypeScript exige une migration qui redéfinit la
fonction SQL : ce test échoue sinon.

## Couverture de la documentation

Le [contrôleur](../../scripts/check-docs.mjs) découvre tous les fichiers
Markdown de `docs/` (rapports d’audit et preuves compris), `AGENTS.md`,
`CLAUDE.md`, `README.md` et les guides de la base. Il contrôle les liens
relatifs, images locales et ancres Markdown avec la casse exacte, y compris dans
le même fichier ; les exemples entre délimiteurs de code et les commentaires
sont ignorés, les destinations externes ne sont pas interrogées. Il exige aussi :
chaque fiche de `references/` reliée depuis le guide, aucun document orphelin
dans les dossiers de référence, chaque fiche de `pages/` accessible depuis son
index, chaque `page.tsx` citée par une fiche et chaque rapport daté relié depuis
l’index des audits. Le périmètre exact est décrit dans
l’[index de la documentation](../README.md#contrôle-du-référentiel).

Les chemins cités comme texte ou code, les fragments de fichiers non Markdown et
la syntaxe Markdown exotique demandent une relecture humaine. Ce script ne
remplace pas un moteur complet de rendu Markdown.

Les intentions historiques de `propositions/intentions/` restent toutes
accessibles depuis leurs index, sous-dossiers compris. Leur présence ne prouve
aucune fonction livrée.

Un lien cassé se corrige vers la vraie source. Pour un fichier retiré cité dans un
audit historique, conserver son ancien chemin comme texte explicitement historique.
Ne pas recréer un fichier obsolète ni ajouter une exclusion globale pour rendre le
contrôle vert. Tester le contrôleur lui-même (`bun run docs:check:test`) quand sa
logique change.

## Vérifications manuelles ciblées

Pour une page : action principale, lecture après rechargement, refus d’accès,
clavier/focus, petit écran et état d’erreur selon les sujets applicables. Une capture
seule ne démontre ni l’interaction ni la sauvegarde. Pour une donnée : contrôler
sa source, les règles de calcul, les filtres et sa portée d’autorisation.

Consigner commande/scénario, date, environnement, résultat et limite selon
[la méthode d’audit](../methode/audit.md). Une ancienne réussite n’annule pas un échec actuel.
Les problèmes connus et résultats datés sont dans les
[rapports](../audits/README.md) et les [suivis](../pages/README.md), pas figés dans ce guide.
