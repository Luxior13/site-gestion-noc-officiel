# API

[Cartographie](README.md) · [Fiche Sécurité](../references/securite.md) ·
[Fiche API et concurrence](../references/api-concurrence.md) ·
[Permissions](../domaines/permissions.md)

Relevé du 31 octobre 2026 : **32 fichiers `route.ts`** (`/api/users/[id]/audit` retirée le 25 octobre, `/api/audit` ajoutée le 30 octobre 2026) sous
`apps/web/src/app/api`. Contrat commun : `requireAuth()` →
`requirePermission(user, PERMISSIONS.X.Y)` → `parseJsonBody` et
`schema.safeParse` → service de `features/<module>/server` → `apiSuccess` /
`apiErrors`. Une seule règle de cache depuis le 31 octobre 2026 ([SYS-12](constats.md)) :
`apiSuccess` et `apiError` marquent chaque réponse `private, no-store`, une route
n’emploie `withPrivateNoStore` que pour une réponse brute (204, réponse sans
enveloppe) et le middleware répète l’en-tête sur toute l’API. Le middleware
impose aussi le jeton CSRF sur toute mutation et limite le débit.

**Protections relevées** : gardes et permissions citées dans le fichier de la
route. Une route qui délègue son contrôle à un service le fait dans le service ;
ce relevé n’est pas une revue de sécurité.

## Authentification et compte personnel

| Route | Méthodes | Protections relevées |
| --- | --- | --- |
| `/api/auth/login` | POST | Publique, limitation de débit, défi MFA |
| `/api/auth/mfa/challenge` | DELETE | Annule le défi de connexion en cours |
| `/api/auth/mfa/verify` | POST | Défi MFA valide (`requireMfaEnabled`) |
| `/api/auth/logout` | POST | `requireAuth` |
| `/api/auth/me` | GET, PATCH | `requireAuth` ; PATCH `account:update_profile` |
| `/api/auth/contact-email` | PATCH | `account:update_contact` |
| `/api/auth/change-password` | POST | `account:change_password` (contrôle dans la route) |
| `/api/auth/mfa` | GET, DELETE | `account:manage_mfa` |
| `/api/auth/mfa/setup` | POST, PUT | `account:manage_mfa`, `requireMfaEnabled` |
| `/api/auth/mfa/recovery-codes` | POST | `account:manage_mfa`, `requireMfaEnabled` |
| `/api/auth/sessions` | GET, DELETE | `account:manage_sessions` |
| `/api/auth/step-up` | POST | `requireAuth` ; mot de passe seul (`password`) ou mot de passe et code (`full`) ; GET et DELETE retirés le 24 octobre 2026 |

## Répertoire

| Route | Méthodes | Protections relevées |
| --- | --- | --- |
| `/api/jeux` | GET, POST | `games:view` ; POST `games:manage`. Nom unique quels que soient la casse et les accents (409 avec le détail du champ) ; chaque jeu porte son nombre d’équipes (`teamCount`) ; GET dans l’ordre posé à la main, actifs et inactifs mélangés ; un jeu ajouté se place en dernier |
| `/api/jeux/ordre` | PUT | `games:manage`, corps `{ ids }` : le nouvel ordre de tous les jeux, actifs ou non, chacun une fois ; 409 si un jeu a été ajouté ou supprimé entre-temps, 400 pour un doublon ; même ordre : aucune écriture ; sinon une trace `GAME_REORDER` (avant, après) ; rend tous les jeux ; 9 novembre 2026 |
| `/api/jeux/[id]/equipes/ordre` | PUT | `teams:manage`, corps `{ ids }` : le nouvel ordre de toutes les équipes du jeu, actives ou non ; 409 pour une équipe manquante, d’un autre jeu ou ajoutée entre-temps ; une trace `TEAM_REORDER` avec le jeu ; rend les équipes du jeu ; 9 novembre 2026 |
| `/api/jeux/[id]` | GET, PATCH, DELETE | GET `games:view` : le jeu avec ses nombres d’équipes et de fonctions (`functionCount`), pour sa fiche ; PATCH et DELETE `games:manage`, version attendue ; ajout, modification et suppression tracés dans la même transaction ; DELETE refusé (409) pour un jeu qui a des équipes ; sans équipe, ses fonctions partent avec lui, nommées dans la trace |
| `/api/jeux/[id]/fonctions` | GET, POST | GET `games:view` : les fonctions du jeu, chacune avec son nombre de passages (`passageCount`), joueurs puis encadrement, chacun dans l’ordre posé (`position`) ; POST `games:manage`. Nom unique dans le jeu (409 avec le détail du champ), jeu inexistant refusé (404) ; 9 novembre 2026 |
| `/api/jeux/[id]/fonctions/courantes` | POST | `games:manage`, corps `{}` : ajoute Joueur, Remplaçant, Coach, Manager et Analyste à un jeu qui n’a aucune fonction, en une transaction, chacune tracée ; 409 s’il en a déjà |
| `/api/jeux/[id]/fonctions/ordre` | PUT | `games:manage`, corps `{ kind, ids }` : le nouvel ordre de toutes les fonctions d’un bloc (joueurs ou encadrement), actives ou non, chacune une fois ; 409 si le bloc a changé (fonction ajoutée, retirée, d’un autre bloc ou d’un autre jeu), 400 pour un doublon ; même ordre : aucune écriture ; sinon une trace `FUNCTION_REORDER` (avant, après) ; rend toutes les fonctions du jeu dans leur ordre ; les lignes du bloc sont verrouillées le temps de l’écriture ; 9 novembre 2026 |
| `/api/jeux/[id]/fonctions/[functionId]` | PATCH, DELETE | `games:manage`, version attendue ; une fonction d’un autre jeu répond 404 ; DELETE refusé (409) pour une fonction déjà utilisée (`ON DELETE RESTRICT` des passages à venir) ; chaque écriture tracée dans la même transaction (catégorie `FUNCTION`) |
| `/api/equipes/[id]/passages` | GET, POST | GET `teams:view` : le Roster (`passages` : personne avec son nom d’affichage, fonction, début, fin, version ; `functions` : celles du jeu de l’équipe) ; POST `teams:manage` : une fiche, une fonction du jeu, un début, une fin facultative ; 409 si la même fonction est déjà tenue sur la période (`start`), 400 pour une fonction d’un autre jeu (`functionId`), une fiche absente (`personId`) ou une fin avant le début (`end`) ; rend le Roster ; trace `PASSAGE_CREATE` sur la fiche ; 9 novembre 2026 |
| `/api/equipes/[id]/passages/[passageId]` | PATCH, DELETE | `teams:manage`, version attendue ; la personne ne change pas (un `personId` est refusé, 400) ; rend le Roster ; traces `PASSAGE_UPDATE` (champs changés) et `PASSAGE_DELETE` |
| `/api/equipes/[id]/passages/[passageId]/changement` | POST | `teams:manage`, corps `{ at, expectedVersion, functionId }` : le passage se termine à `at` et un nouveau commence avec l’autre fonction, en une transaction et deux traces ; 400 pour la même fonction ou une date hors du passage |
| `/api/passages/personnes` | GET | `teams:manage` ou `staff:manage` (9 novembre 2026), `?q=` : `{ persons, more }` (recherche commune `searchPersonSuggestions` des fiches, 10 novembre 2026), au plus 6 fiches du Répertoire dont le pseudo, le prénom ou le nom contiennent chaque mot tapé, avec leur nom d’affichage, leur pseudo, prénom et nom (initiales de l’avatar), et `more` s’il y en a davantage |
| `/api/equipes` | GET, POST | `teams:view` ; POST `teams:manage`. Nom unique dans son jeu (409 avec le détail du champ), jeu inexistant refusé (404) ; 8 novembre 2026 ; GET dans l’ordre posé à la main de chaque jeu, actives et inactives mélangées ; une équipe ajoutée se place en dernier de son jeu |
| `/api/equipes/[id]` | GET, PATCH, DELETE | GET `teams:view` : l’équipe avec son jeu, ses membres du jour (`memberCount`), ses anciens membres (`formerCount`, personnes ayant un passage terminé) et son nombre de passages (`passageCount`), pour sa fiche ; DELETE refusé (409) pour une équipe qui a des passages ; PATCH et DELETE `teams:manage`, version attendue ; le jeu ne change pas (un `gameId` dans PATCH est refusé, 400) ; chaque écriture tracée dans la même transaction (catégorie `TEAM`) |
| `/api/personnes` | GET, POST | `persons:view` ; POST `persons:create`. La recherche `?q=` trouve aussi un autre pseudo (`matchedOtherNickname` sur la ligne) et l’ID seul d’un compte Discord ou Steam (10 novembre 2026). GET renvoie `overview`, compteurs à facettes des filtres rapides (20 octobre 2026) ; `?structureStatus=` filtre sur le statut calculé depuis les passages en cours, que POST et PATCH refusent (9 novembre 2026) |
| `/api/personnes/[id]` | GET, PATCH, DELETE | `persons:view`, `persons:update`, `persons:delete` ; la fiche porte `nationality`, et avec `persons:view_contact` `emergencyContacts`, `legalGuardians` et `represents` (10 novembre 2026) ; DELETE refuse en 409 la fiche d’un représentant légal tant qu’elle représente quelqu’un |
| `/api/personnes/[id]/parcours` | GET | `persons:view` et au moins `teams:view` ou `staff:view` (9 novembre 2026) : `{ passages }`, les passages de la fiche dans les listes que le lecteur voit (équipes avec `teams:view`, structure avec `staff:view`), chacun avec sa fonction, son équipe (`isActive`) et le jeu de l’équipe, ses dates au début de leur période, le début le plus ancien d’abord ; équipe `null` pour un passage de la structure ; 404 pour une fiche absente ; lecture seule, pour l’onglet Parcours |
| `/api/structure` | GET | `staff:view` (9 novembre 2026) : `{ memberCount, formerCount, functionCount }`, les nombres des onglets de Bureau & staff (personnes présentes, personnes ayant un passage terminé, fonctions de la structure) |
| `/api/structure/effectif` | GET, POST | GET `staff:view` : l’Effectif de la structure (`passages` sans équipe, `functions` sans jeu), comme le Roster d’une équipe ; POST `staff:manage` : une fiche, une fonction de la structure, un début, une fin facultative ; 409 si la même fonction est déjà tenue sur la période, 400 pour une fonction d’un jeu (`functionId`) ; rend l’Effectif ; trace `PASSAGE_CREATE` sur la fiche, rangée sous Structure › Bureau & staff ; 9 novembre 2026 |
| `/api/structure/effectif/[passageId]` | PATCH, DELETE | `staff:manage`, version attendue ; un passage d’une équipe répond 404 ; rend l’Effectif ; traces `PASSAGE_UPDATE` et `PASSAGE_DELETE` |
| `/api/structure/effectif/[passageId]/changement` | POST | `staff:manage`, comme celui d’une équipe : le passage se termine à `at` et un nouveau commence avec l’autre fonction de la structure |
| `/api/structure/fonctions` | GET, POST | GET `staff:view` : les fonctions de la structure, Bureau puis Staff, chacune avec son nombre de passages ; POST `staff:manage` : type `BOARD` ou `STAFF` seulement (400 pour `PLAYER`) ; nom unique dans la structure (409) ; trace `FUNCTION_CREATE` sous Bureau & staff ; 9 novembre 2026 |
| `/api/structure/fonctions/[functionId]` | PATCH, DELETE | `staff:manage`, version attendue ; une fonction d’un jeu répond 404 ; DELETE refusé (409) pour une fonction déjà utilisée |
| `/api/structure/fonctions/courantes` | POST | `staff:manage` : Président, Vice-président, Trésorier, Secrétaire, Graphiste, Monteur, Community manager et Bénévole, pour une structure sans fonction (409 sinon) |
| `/api/structure/fonctions/ordre` | PUT | `staff:manage` : l’ordre d’un groupe (`BOARD` ou `STAFF`), comme celui d’un jeu ; trace `FUNCTION_REORDER` |
| `/api/personnes/[id]/emails` | POST | `persons:update_contact` |
| `/api/personnes/[id]/emails/[emailId]` | PATCH, DELETE | `persons:update_contact` |
| `/api/personnes/[id]/telephones` | POST | `persons:update_contact` |
| `/api/personnes/[id]/telephones/[phoneId]` | PATCH, DELETE | `persons:update_contact` |
| `/api/personnes/[id]/reseaux-sociaux` | POST | `persons:update_contact` ; réseaux sociaux et, depuis le 10 novembre 2026, comptes de jeu (clés `riot`, `steam`, `epic`, `battlenet`, `playstation`, `xbox`, `ea`, `ubisoft`, `faceit`) ; pour Discord et Steam, `profileUrl` est le lien de l’ID du compte, tout autre lien refusé |
| `/api/personnes/[id]/reseaux-sociaux/[profileId]` | PATCH, DELETE | `persons:update_contact` |
| `/api/personnes/[id]/autres-pseudos` | POST | `persons:update` (10 novembre 2026) : `nickname`, `note` et `until` (date approximative) facultatifs ; 409 pour un pseudo déjà présent ou le pseudo principal ; vingt au plus ; ne change pas la version de la fiche ; répond `{ person }` |
| `/api/personnes/[id]/autres-pseudos/[nicknameId]` | PATCH, DELETE | `persons:update`, version du pseudo |
| `/api/personnes/[id]/contacts-urgence` | POST | `persons:update_contact` (10 novembre 2026) : nom, lien facultatif, pays et numéro, `personVersion` ; cinq au plus ; répond `{ person }` |
| `/api/personnes/[id]/contacts-urgence/[contactId]` | PATCH, DELETE | `persons:update_contact`, versions de la fiche et du contact |
| `/api/personnes/[id]/representants-legaux` | POST | `persons:update_contact` (10 novembre 2026) : `guardianId` (une autre fiche), `relation`, `personVersion` ; 409 pour la fiche elle-même ou un représentant déjà lié ; quatre au plus |
| `/api/personnes/[id]/representants-legaux/[linkId]` | PATCH, DELETE | `persons:update_contact` : PATCH ne change que `relation` ; DELETE retire le lien, la fiche du représentant reste |
| `/api/personnes/suggestions` | GET | `persons:update_contact` (10 novembre 2026), `?q=` : `{ persons, more }`, même recherche que `/api/passages/personnes` (autres pseudos compris), pour choisir un représentant légal |

Comme toute l’API, ces routes répondent `private, no-store`. Une base pas
encore migrée répond un 503 explicite (« Le Répertoire attend une mise à jour de
la base de données ») au lieu d’une erreur générique ([SYS-11](constats.md)).

## Utilisateurs

| Route | Méthodes | Protections relevées |
| --- | --- | --- |
| `/api/audit` | GET | `audit:view` ; écrit d’abord la trace `AUDIT_VIEW` (une par quart d’heure et par lecteur) ; filtres `type`, `show`, `period`, `search`, `user`, `person`, `page`, instantané `asOf` ; masquage selon le lecteur (30 octobre 2026) |
| `/api/users` | GET, POST | `users:view`, colonnes `users:view_contact` / `users:view_security` ; POST `users:create`, `users:update_contact`, preuve récente. GET renvoie `stats`, compteurs à facettes des filtres rapides (20 octobre 2026) |
| `/api/users/[id]` | GET, PATCH, DELETE | `users:view`, `users:update_profile`, `users:update_login`, `users:update_contact`, `users:update_status`, `users:delete_account`, preuves récentes |
| `/api/users/[id]/sessions` | GET, DELETE | `users:view_sessions`, `users:revoke_sessions`, preuve récente |
| `/api/users/[id]/reset-password` | POST | `users:reset_password`, preuve récente |
| `/api/users/[id]/reset-mfa` | POST | `requireAuth`, `users:reset_mfa` ; preuve, garde d'un administrateur cible et transaction dans le service |

## Système et observation

| Route | Méthodes | Protections relevées |
| --- | --- | --- |
| `/api/systeme/parametres` | GET | `settings:view` |
| `/api/systeme/parametres/[key]` | PUT | `settings:update`, preuve récente de mot de passe |
| `/api/observability/web-vitals` | POST | `requireAuth` |
| `/api/health`, `/api/health/live`, `/api/health/ready` | GET | Publiques ; aucune donnée personnelle. `ready` sert au déploiement : base, schéma central, clés MFA et présence des tables du Répertoire ; plus aucune page ne l’interroge depuis le 31 octobre 2026 |

## Relevé

```bash
for f in $(find apps/web/src/app/api -name route.ts | sort); do
  echo "$f: $(grep -oE 'export (async )?(const|function) (GET|POST|PATCH|PUT|DELETE)' "$f" | grep -oE '(GET|POST|PATCH|PUT|DELETE)' | tr '\n' ' ')"
done
```
