# Données

[Cartographie](README.md) · [Fiche Schéma Prisma](../references/schema-prisma.md) ·
[Fiche Migrations](../references/migrations.md) · [Confidentialité](../references/confidentialite.md) ·
[Guide de la base](../../packages/database/prisma/README.md) ·
[Schéma Prisma](../../packages/database/prisma/schema.prisma)

Relevé du 10 novembre 2026 dans `packages/database/prisma/schema.prisma` :
**27 modèles, 17 énumérations, PostgreSQL**. Les migrations contiennent aussi
des contraintes `CHECK`, des déclencheurs et des index partiels absents du
schéma Prisma : ne pas les retirer parce qu’ils n’y figurent pas. La revue
complète du schéma est celle du [13 octobre 2026](../audits/2026-10-13-schema-prisma.md).

Le projet est en développement : les données locales ne sont pas jetables par
défaut ; toute évolution passe par une migration reproductible, appliquée avec
le wrapper sûr `bun run db:migrate:deploy` et une sauvegarde
([procédures](../exploitation/operations.md)).

## Modèles par domaine

Colonnes : nombre de champs (relations comprises), nombre d’`@@index` et
`@@unique`, modèles cibles des relations.

### Comptes, sessions et sécurité

| Modèle | Champs | Index | Relations | Rôle |
| --- | ---: | ---: | --- | --- |
| `User` | 32 | 9 | sessions, audit, MFA, réservations d’identifiant, paramètres, portée Esport | Compte de connexion, rôle `UserRole`, compte racine protégé ; portée Esport `esportScope` (`EsportScope` : `ALL`, `GAMES`, `TEAMS`, 10 novembre 2026), toujours `ALL` pour un administrateur (`User_esportScope_admin_check`, absente de `schema.prisma`) ; recherche par deux index trigrammes d’expression sur `search_text`, absents du schéma |
| `UserEsportScopeItem` | 8 | 4 | `User`, `Game`, `Team` (tous `ON DELETE CASCADE`) | Un jeu ou une équipe choisi dans la portée Esport d’un compte (10 novembre 2026), exactement l’un des deux (`UserEsportScopeItem_target_check`, absente de `schema.prisma`) ; seules les lignes du type de la portée comptent ; un jeu ou une équipe supprimé la quitte, une portée vidée n’ouvre rien ([permissions](../domaines/permissions.md#portée-esport)) |
| `LoginNameReservation` | 4 | 1 | `User` | Identifiants réservés (pas de réutilisation après suppression) |
| `Session` | 17 | 4 | `User` | Sessions avec expiration absolue et d’inactivité, preuves récentes |
| `TotpCredential` | 10 | 1 | `User` | Secret TOTP chiffré du compte |
| `TotpEnrollment` | 9 | 1 | `User` | Configuration MFA en cours |
| `MfaRecoveryCode` | 7 | 2 | `User` | Codes de secours (empreintes) |
| `MfaLoginChallenge` | 11 | 2 | `User` | Défi de connexion entre mot de passe et MFA |
| `RateLimit` | 7 | 1 | — | Compteurs de limitation de débit |

### Journal d’audit

| Modèle | Champs | Index | Relations | Rôle |
| --- | ---: | ---: | --- | --- |
| `AuditLog` | 31 | 18 | `User`, `AuditFieldChange` | Événements durables (actions, catégories, flux, résultat, gravité) ; `searchText` (les quatre noms figés sous la forme de recherche commune) écrit par le déclencheur `AuditLog_search_text`, jamais par l’application |
| `AuditFieldChange` | 20 | 3 | `AuditLog`, `AuditEncryptionKeyVersion` | Valeurs avant/après par champ, chiffrées selon `AuditValueStorageMode` |
| `AuditEncryptionKeyVersion` | 4 | 0 | `AuditFieldChange` | Versions de clé de chiffrement du journal ([rotation](../exploitation/operations.md#rotation-des-clés-daudit)) |

### Répertoire des personnes

| Modèle | Champs | Index | Relations | Rôle |
| --- | ---: | ---: | --- | --- |
| `Person` | 17 | 9 | emails, téléphones, profils sociaux, autres pseudos, contacts d’urgence, représentants légaux (dans les deux sens), passages | Fiche personne, version optimiste ; le statut « Dans la structure » n’est pas une colonne, il se calcule depuis les passages en cours (9 novembre 2026) ; `nationality`, code ISO à deux lettres en capitales (contrainte `Person_nationality_check`, 10 novembre 2026) |
| `PersonEmail` | 10 | 3 | `Person` | Emails, un principal |
| `PersonPhone` | 10 | 3 | `Person` | Téléphones, un principal |
| `PersonSocialProfile` | 14 | 5 | `Person` | Réseaux sociaux, propriétaire protégé (REP-20) |
| `PersonOtherNickname` | 10 | 3 | `Person` (`ON DELETE CASCADE`) | Un autre pseudo de la fiche (10 novembre 2026) : ancien, compte secondaire, en jeu ou surnom ; forme de recherche unique par fiche, index trigrammes et préfixe comme le pseudo principal, précision et date de fin facultatives (`untilOn` au dernier jour de sa période, `DatePrecision`), version propre ; contrainte `PersonOtherNickname_values_check` et déclencheur de propriétaire, absents de `schema.prisma` |
| `PersonEmergencyContact` | 9 | 1 | `Person` (`ON DELETE CASCADE`) | Qui appeler en cas d’urgence (10 novembre 2026) : nom, lien facultatif, numéro et sa forme internationale ; contrainte `PersonEmergencyContact_values_check` et déclencheur de propriétaire `PersonEmergencyContact_prevent_person_reassignment`, absents de `schema.prisma` |
| `PersonLegalGuardian` | 7 | 2 | `person` (`ON DELETE CASCADE`), `guardian` (`ON DELETE RESTRICT`) | Un représentant légal (10 novembre 2026) : une autre fiche, liée avec son lien `LegalGuardianRelation` (`PARENT`, `TUTOR`, `OTHER`), un lien unique par paire ; contrainte `PersonLegalGuardian_not_self_check` et déclencheur `PersonLegalGuardian_prevent_reassignment` (les deux bouts ne changent pas), absents de `schema.prisma` |
| `PersonDeletionTombstone` | 3 | 0 | — | Trace minimale d’une fiche supprimée |

### Esport

| Modèle | Champs | Index | Relations | Rôle |
| --- | ---: | ---: | --- | --- |
| `Game` | 11 | 1 | `teams`, `functions` | Un jeu, une section : nom unique (`normalizedName`), nom court, première ouverture avec sa précision `DatePrecision`, actif, version optimiste (8 novembre 2026) ; `position` dans la liste des jeux, actifs ou non, posée par glisser-déposer (positive, hors version, 9 novembre 2026) |
| `Team` | 11 | 2 | `game` (`ON DELETE RESTRICT`) | Une équipe d’un jeu : nom unique dans son jeu (`gameId` + `normalizedName`), création avec sa précision, active, version optimiste (8 novembre 2026), `position` parmi les équipes de son jeu, actives ou non (9 novembre 2026) ; un jeu qui a des équipes ne se supprime pas ; le jeu d’une équipe ne change pas (déclencheur `Team_gameId_immutable`, absent de `schema.prisma`) |
| `PersonPassage` | 12 | 3 | `person`, `team` (facultative), `memberFunction`, toutes en `ON DELETE RESTRICT` | Un passage (9 novembre 2026) : une fiche dans une équipe, ou dans la structure (`teamId` vide, Effectif de Bureau & staff, même jour), avec une fonction, un début (`startOn`, premier jour de sa période) et une fin facultative (`endOn`, dernier jour), chacun avec sa précision, version optimiste ; contraintes `PersonPassage_*_check`, exclusion `PersonPassage_no_overlap` (extension `btree_gist`) et déclencheur `PersonPassage_function_scope`, absents de `schema.prisma` |
| `MemberFunction` | 10 | 2 | `game` (facultatif, `ON DELETE RESTRICT`) | Une fonction d’un jeu (Joueur, Coach…) ou de la structure (`gameId` vide : Président, Graphiste…, Bureau & staff) : nom unique dans son jeu (`gameId` + `normalizedName`), ou dans la structure par l’index partiel `MemberFunction_structure_normalizedName_key`, absent de `schema.prisma` ; type `MemberFunctionKind` (`PLAYER` Joueur et `STAFF` Encadrement dans un jeu ; `BOARD` Bureau et `STAFF` Staff dans la structure, la contrainte `MemberFunction_kind_scope_check` refusant les autres), `position` posée par glisser-déposer dans sa liste et son type (positive, hors version), active, version optimiste (9 novembre 2026) ; un jeu supprimé par erreur emporte ses fonctions par le service, jamais par `CASCADE` |

### Trésorerie

| Modèle | Champs | Index | Relations | Rôle |
| --- | ---: | ---: | --- | --- |
| `LegalEntity` | 17 | 1 | `accounts` | Une entité juridique (10 novembre 2026) : dénomination unique (`normalizedName`), forme `LegalForm` (`NONE` pour la période d’avant l’association, `OTHER` avec `otherForm`), début et fin facultative avec leur précision, numéro RNA, SIRET, siège, entité principale (une au plus, index partiel `LegalEntity_principal_key`), version optimiste ; contraintes `LegalEntity_*_check` (formats RNA et SIRET, période d’avant sans identifiant ni marque principale) et déclencheur `LegalEntity_form_check` (une entité qui tient des comptes garde une forme), absents de `schema.prisma` |
| `FinancialAccount` | 13 | 1 | `entity` (`ON DELETE RESTRICT`) | Un compte bancaire, en ligne ou une caisse (`FinancialAccountKind`, 10 novembre 2026) : nom unique dans son entité, établissement (jamais pour une caisse), solde de départ en centimes d’euro à un jour (`openingOn`), clôture facultative, version optimiste ; contraintes `FinancialAccount_*_check` (dix millions d’euros au plus, caisse jamais négative, clôture après le départ) et déclencheur `FinancialAccount_entity_check` (entité fixée à l’ouverture, jamais sans forme juridique), absents de `schema.prisma` |

### Système et préparation

| Modèle | Champs | Index | Relations | Rôle |
| --- | ---: | ---: | --- | --- |
| `SystemSetting` | 8 | 2 | `User` | Paramètres système versionnés (conservation) |

`InternalAnnouncement` et `ArchivedStaffProfile`, tables sans code, sont retirées
du schéma le 25 octobre 2026 par `20261025120000_remove_orphan_tables` (REV-18).
L’actualité interne redéfinira son stockage à sa reconstruction.

## Énumérations

`UserRole`, `EsportScope`, `LegalForm` et `FinancialAccountKind` (10 novembre 2026), `MfaChallengePurpose`, `MfaAuthenticationMethod`,
`DatePrecision`, `AuditFieldChangeType`, `AuditValueStorageMode`,
`AuditAction`, `AuditCategory`, `AuditEventKind`, `AuditStream`,
`AuditOutcome`, `AuditSeverity`.

## Migrations

**76 migrations** dans `packages/database/prisma/migrations`, de
`20250723121213_init` à `20261110230000_legal_entities_financial_accounts`
(types `LegalForm` et `FinancialAccountKind`, tables `LegalEntity` et
`FinancialAccount`, leurs contraintes, l’index partiel de l’entité principale,
les déclencheurs `FinancialAccount_entity_check` et `LegalEntity_form_check`,
actions `LEGAL_ENTITY_*` et `FINANCIAL_ACCOUNT_*` et leurs catégories du
journal, 10 novembre 2026 ; ajout seul). Avant elle,
`20261110220000_user_esport_scope` (type `EsportScope`,
colonne `User.esportScope` à `ALL` par défaut, contrainte d’administrateur,
table `UserEsportScopeItem` et ses contraintes, 10 novembre 2026 ; ajout seul,
tous les comptes existants gardent tous les jeux). Avant elle,
`20261110180000_person_other_nicknames` (table
`PersonOtherNickname`, ses index de recherche et son déclencheur de
propriétaire, 10 novembre 2026 ; ajout seul). Avant elle,
`20261110120000_person_relatives` (colonne
`Person.nationality`, tables `PersonEmergencyContact` et `PersonLegalGuardian`,
type `LegalGuardianRelation`, contraintes et déclencheurs de propriétaire,
10 novembre 2026 ; ajout seul). Avant elle, `20261109235800_person_status_from_passages` (colonne
`Person.structureStatus`, son type `PersonStructureStatus` et ses trois index
supprimés : le statut se calcule depuis les passages, 9 novembre 2026 ; les
données de travail sont des essais). Avant elle, `20261109235500_structure_staff` (valeur `BOARD` de `MemberFunctionKind` et contrainte `MemberFunction_kind_scope_check`, Bureau & staff, 9 novembre 2026 ; ajout seul, aucune ligne existante touchée). Avant elle, `20261109235000_person_passages` (table `PersonPassage`, extension `btree_gist`, contraintes, déclencheurs `PersonPassage_function_scope` et `MemberFunction_gameId_immutable`, actions `PASSAGE_*` et catégorie `PASSAGE`, 9 novembre 2026). Avant elle, `20261109230000_single_rank` (rangs remis en une seule suite par liste, actifs et inactifs mélangés, dans l’ordre affiché jusque-là, 9 novembre 2026). Avant elle, `20261109190000_game_team_position` (colonnes `position` de `Game` et `Team` reprises de l’ordre affiché, contraintes positives, index par état et rang, actions `GAME_REORDER` et `TEAM_REORDER`, 9 novembre 2026). Avant elle, `20261109160000_member_function_position` (colonne `position` reprise de l’ordre affiché jusque-là, contrainte positive, index par jeu, type et position, action `FUNCTION_REORDER`, 9 novembre 2026). Avant elle, `20261109120000_member_functions` (table `MemberFunction` et type `MemberFunctionKind`, liée au jeu en `ON DELETE RESTRICT`, index partiel des fonctions de la structure, actions `FUNCTION_*` et catégorie `FUNCTION` du journal, 9 novembre 2026). Avant elle, `20261108200000_team_game_immutable` (déclencheur qui refuse de changer le jeu d’une équipe, 8 novembre 2026), puis `20261108180000_teams` (table `Team`, liée au jeu en `ON DELETE RESTRICT`, actions `TEAM_*` et catégorie `TEAM` du journal, même jour), puis `20261108120000_games` (table `Game` et précision de date, actions `GAME_*` et catégorie `GAME`, même jour), puis `20261031140000_shared_search_text` (règle de recherche commune, audit RL du 31 octobre 2026 : fonction `public.search_text`, miroir de `normalizeSearchText`, colonne `AuditLog.searchText` remplie par déclencheur, index trigrammes d’expression des utilisateurs, noms normalisés du Répertoire recalculés ; la garde d’ajout seul du journal n’est levée que dans cette migration, le temps de remplir la colonne des événements passés). Les précédentes, `20261031130000_audit_purge_action` et `20261031120000_audit_attempts_blocked`, ajoutent `AUDIT_PURGE` (« Journal purgé ») et `ATTEMPTS_BLOCKED` (tentatives bloquées par la limitation de débit). Repères :

| Période | Migrations notables |
| --- | --- |
| Janvier–février 2026 | Ancien périmètre financier et sportif (`add_sponsors`, `add_structure`, `float_to_decimal`, `add_fiscal_years`, `add_expense_reports`…), puis réduction aux comptes (`users_only_schema`, juin) |
| Juin–juillet 2026 | Sessions, audit durable, MFA obligatoire, permissions canoniques, suppression irréversible d’un compte, socle Personnes, retrait du worker |
| Juillet 2026 | Module Partenaires (retiré le 21 septembre 2026 par `remove_partner_module`), actualité interne |
| Septembre–octobre 2026 | Retrait des notifications, nom facultatif, propriété des coordonnées, version positive des paramètres, permissions du site actuel, retrait du verrou par compte, retrait des tables sans code, retrait de l’autorisation de provenance des champs, conservation du journal à un an par défaut, types d’événement « Journal consulté » et « Tentatives bloquées », règle de recherche commune |

**Regroupement de l’historique — décision du 25 octobre 2026 (REV-19)** : les
migrations seront regroupées en une migration de base **juste avant la
première mise en production** (point 7 de la [liste d’avant mise en production](../exploitation/operations.md#avant-la-première-mise-en-production)), pas avant : chaque module encore à construire
ajouterait des migrations et la base de travail devrait être réalignée deux
fois. À ce moment : générer la base depuis le schéma, y reporter à la main les
`CHECK`, triggers, fonctions et index partiels ou d’expression absents de `schema.prisma`, comparer le
`pg_dump --schema-only` d’une base issue de l’historique avec celui d’une base
issue du regroupement, puis, après sauvegarde signée, marquer la base de
travail comme alignée et retirer `baseline-existing-database` et
`migration-baseline`.

`20260204_soft_delete_transactions` porte un horodatage court (8 chiffres) ;
il est conservé tel quel car déjà appliqué. Les commentaires SQL de plusieurs
migrations citent d’anciens chemins de documentation ([SYS-05](constats.md)).
Une migration appliquée n’est jamais modifiée.

## Relevé

```bash
grep -cE '^model ' packages/database/prisma/schema.prisma
grep -cE '^enum ' packages/database/prisma/schema.prisma
ls packages/database/prisma/migrations | grep -v toml | wc -l
```
