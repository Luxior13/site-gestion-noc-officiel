# Cadrage — Listes, équipes, parcours et accès manager

[Propositions](README.md) · [Registre historique](../domaines/registre-historique.md) ·
[Public du site](../domaines/roles-metier.md#public-du-site--décision-du-7-novembre-2026) ·
[Feuille de route](feuille-de-route.md)

- **Date** : 7 novembre 2026. **Demandeur** : le propriétaire.
- **Périmètre** : chantiers Listes de choix, Équipes & parcours, Accès &
  responsabilités métier (étapes 1 et 2).
- **Statut** : en cours. Lots 1 et 2 livrés pour l’essentiel du 8 au
  9 novembre 2026 (jeux, fonctions des jeux et de la structure, équipes,
  Roster, Parcours, Bureau & staff, statut calculé ; sauvegarde v11 du
  registre) ; nationalité, contacts d’urgence et représentants légaux livrés
  le 10 novembre 2026, puis les autres pseudos et l’ID du compte Discord le
  même jour, et les comptes de jeu ; restent les jeux pratiqués et l’adresse,
  puis le lot 3. Les choix techniques non livrés restent à
  valider au moment de leur lot.
- **Décisions déjà données** : [registre historique](../domaines/registre-historique.md)
  et [public du site](../domaines/roles-metier.md#public-du-site--décision-du-7-novembre-2026).
  Ce document ne les répète pas.

**Risque : sensible.** Ces lots touchent l’accès, des données personnelles et une
migration. Ils demandent des scénarios d’abus et une validation sur base isolée.

## Ordre de construction

| Lot | Contenu | Résultat visible |
| --- | --- | --- |
| 1 | Listes de choix | Champ « Jeux » sur la fiche, avec ajout direct ; la page Jeux (8 novembre 2026) et l’onglet Fonctions de chaque fiche jeu (9 novembre 2026) sont livrés |
| 2 | Équipes & parcours | Page Jeux, fiches jeu et équipe, page Bureau & staff (Effectif, Anciens membres, Fonctions ; livrée le 9 novembre 2026), onglet Parcours en lecture (livré le même jour), autres pseudos dans Identité (10 novembre 2026) |
| 3 | Accès manager | Un manager se connecte et ne voit que son équipe |

Confidentialité & conservation et Données, exports & sauvegardes complètent l’étape 2. Le lot 1 introduit TanStack Query, prévu avec son premier consommateur
([décision REV-20](../references/architecture-fonctionnalite.md#5-états-ux-obligatoires)).

## Lot 1 — Listes de choix

**Données** : les jeux ont leur table `Game`, livrée le 8 novembre 2026 avec la page Jeux (nom unique, nom court, première ouverture et sa précision, actif) ; une table `ReferenceValue` pour les autres listes (`list`, `label`,
libellé normalisé, actif, `version`) ; les fonctions ont leur table `MemberFunction`, livrée le 9 novembre 2026 (nom unique par jeu, type Joueur ou Encadrement, position posée par glisser-déposer dans chaque type, active, `version`, `gameId` vide pour les fonctions de la structure, uniques entre elles par un index partiel, de type Bureau ou Staff depuis le même jour avec Bureau & staff),
unique par liste (et jeu) et libellé normalisé,
et une table de liaison `PersonGame`. Une table commune évite une page, une API et
une migration par liste. Pour qu’une fonction ne puisse pas remplir un champ
« jeu », la base contrôle la liste de chaque référence ; une contrainte vaut mieux
qu’une vérification du seul formulaire.

**Écrans** (décision du 8 novembre 2026) : chaque liste en onglet à côté de ce
qu’elle classe, au [gabarit A](../design/gabarits.md#a-liste-de-gestion) :
Jeux sur `/esport/jeux` et fonctions de chaque jeu dans sa fiche (lot 2), fonctions de la structure sur Bureau & staff (lot 2). Aucune liste
dans Système. Deux listes de fonctions : un passage dans une équipe ne propose
que les fonctions de son jeu, un passage dans la structure que celles de la
structure, et la base le contrôle. Ajout et renommage en fenêtre. Une colonne indique le
nombre d’usages, pour comprendre pourquoi une valeur se rend inactive sans se
supprimer : elle arrive avec les passages, qui créent les usages.

**Composant** : `MultiSelect` dans `components/ui`, composé de `Popover` et
`Command` déjà présents, sans nouvelle dépendance. Il propose « Ajouter … » quand
la valeur manque et que le compte a le droit de le faire.

**Droits** : `reference_lists:update` (délégable, fourni aux Administrateurs). La
lecture des valeurs suit la page qui les affiche.

**Valeurs de départ** : aucune. Les listes démarrent vides et le bureau les remplit.

## Lot 2 — Équipes & parcours

**Données** :

| Modèle | Contenu |
| --- | --- |
| `Team` | Livré le 8 novembre 2026 : jeu (`ON DELETE RESTRICT`, fixé à la création, déclencheur `Team_gameId_immutable`), nom unique dans son jeu, création avec sa précision, active, `version` ; anciens noms à venir avec la fiche équipe |
| `PersonPassage` | Livré le 9 novembre 2026 pour les équipes : fiche, équipe facultative (vide pour une fonction de structure, à venir), fonction, début au premier jour de sa période, fin au dernier, précision de chaque date, `version` ; exclusion des passages identiques qui se chevauchent, fonction du jeu de l’équipe vérifiée par la base |
| `PersonOtherNickname` | Livré le 10 novembre 2026 (remplace l’ancien pseudo prévu ici) : un autre pseudo de la fiche (ancien, compte secondaire, en jeu, surnom), une précision et une date de fin facultatives, version propre ; saisi à la main dans l’onglet Identité, cherché par le Répertoire et le choix d’une fiche. Pas d’écriture automatique au changement de pseudo : le journal d’activité garde déjà l’ancien |

**Compléments de la fiche personne** : nationalité, adresse postale, identifiants de jeu (par jeu), contact d’urgence et représentants légaux, ces derniers étant des fiches du Répertoire liées explicitement. Les coordonnées nouvelles suivent `persons:view_contact`. **Livré le 10 novembre 2026** (« fais la 2B d’abord et la nationalité ») : la nationalité dans Identité (une seule, code ISO), les contacts d’urgence (nom, lien, numéro, sans fiche) et les représentants légaux (fiches liées, lien Parent, Tuteur ou tutrice, Autre) dans Coordonnées, avec la carte « Représentant légal de » sur la fiche du représentant ; la fiche d’un représentant ne se supprime pas tant qu’elle représente quelqu’un ([fiche Coordonnées](../pages/personnes/repertoire/fiche-coordonnees.md)). Les identifiants de jeu sont livrés le même jour comme **comptes de jeu par plateforme** (Riot, Steam…), pas par jeu, sur la remarque du propriétaire ([fiche Coordonnées](../pages/personnes/repertoire/fiche-coordonnees.md)). L’adresse reste à faire, avec les adhésions.

**Dates approximatives** : une date est stockée avec sa précision (année, mois,
jour). Un début se range au premier jour de la période et une fin au dernier :
« 2024 » couvre toute l’année, et « qui était là à telle date » reste une simple
comparaison. L’affichage suit la précision, sans inventer de jour.

**Statut dans la structure** : calculé à la lecture, jamais saisi ni stocké (décision du 7 novembre 2026). Un passage est en cours si son début est passé et s’il n’a pas de fin, ou une fin à venir. Aucune tâche planifiée : une date de fin atteinte le clôt toute seule. Le choix du statut disparaît de la création et de l’onglet Identité, et le filtre du Répertoire lit ce calcul. Une fiche sans passage en cours est « Hors structure » : le bureau saisit les passages des membres actuels à la livraison. **Livré le 9 novembre 2026** : un passage d’équipe ou de la structure compte, le jour se lit dans le fuseau du site (Europe/Paris), une fin datée du jour compte encore ; la colonne, son type et ses trois index sont supprimés par `20261109235800_person_status_from_passages`, et le journal ne trace plus de statut (les événements passés gardent leur libellé).

**Règles serveur** : la fin ne précède pas le début (contrainte en base). Deux
passages identiques (fiche, équipe, fonction) ne se chevauchent pas. Une fiche qui
a un passage ne se supprime pas : la base le refuse et l’interface l’explique.
De même, toute table qui référence un jeu (équipes, fonctions, puis tournois,
identifiants de jeu, finances) le fait en `ON DELETE RESTRICT`, jamais en
`CASCADE` comme l’ancien schéma de janvier 2026 : le service traduit le refus en
« Ce jeu a des équipes : rendez-le inactif », et une suite SQL le vérifie
(demande du propriétaire du 8 novembre 2026).

**Écrans** :

- `/esport/jeux` (livrée le 8 novembre 2026, avec les équipes sous chaque jeu le même jour ; le nom d’une équipe ouvre sa fiche) : accueil d’Esport, au gabarit A, sans onglet : les sections,
  actives ou archivées, chacune avec ses équipes en dessous ; une équipe ouvre sa
  fiche en un clic, le nom du jeu ouvre la fiche jeu (décision du 8 novembre 2026).
- `/esport/jeux/[id]` (ouverte le 8 novembre 2026, onglets Fonctions et Informations le 9) : fiche jeu, onglets Fonctions (livré ; réglage « Donne accès à son équipe » à l’étape 3), Finances ↗ (celles de ce
  jeu) et Informations ; l’onglet Équipes est retiré le
  8 novembre 2026, les équipes s’affichent et s’ajoutent sous chaque jeu de la
  page Jeux.
- `/esport/equipes/[id]` (ouverte le 8 novembre 2026 avec ses informations seules, sans barre d’onglets) : fiche équipe, sous son jeu, onglets Roster (membres
  actuels et à venir), Anciens membres (passages terminés, par année de fin ;
  séparés le 9 novembre 2026, sans sélecteur « À une date »), Tournois ↗,
  Entraînements,
  Finances ↗ (invisible pour un manager), Partenaires ↗ et Informations (nom, anciens noms,
  archivage).
- Page Bureau & staff (pôle Structure, `/structure/bureau-staff`, livrée le
  9 novembre 2026, [fiche](../pages/structure/bureau-staff.md)) : onglet
  Effectif, le roster de la structure (bureau, staff, bénévoles, depuis 2014),
  onglet Anciens membres, à part comme pour une équipe, et onglet Fonctions,
  de type Bureau ou Staff (CAD-Q4).
- Onglet Parcours de la fiche personne (`?section=parcours`), en lecture ↗ :
  chaque ligne ouvre son équipe ou Bureau & staff ([onglet en lecture](../design/gabarits.md#onglets-dune-fiche)) ;
  livré le 9 novembre 2026 pour les équipes ([fiche](../pages/personnes/repertoire/fiche-parcours.md)).
- Une seule fenêtre de passage, ouverte depuis le Roster d’une équipe ou
  l’Effectif de Bureau & staff. Début et fin s’y saisissent, sans motif de fin.

**API** : `/api/jeux`, `/api/jeux/[id]`, `/api/equipes`, `/api/equipes/[id]`,
`/api/equipes/[id]/passages` (et `/[passageId]`, `/[passageId]/changement`),
`/api/passages/personnes`, `/api/personnes/[id]/parcours`, `/api/structure`
et ses routes `effectif` et `fonctions` (livrés le 9 novembre 2026), selon le
[contrat d’une fonctionnalité](../references/architecture-fonctionnalite.md).

**Droits** : `teams:view`, `teams:manage` (livrés le 8 novembre 2026) couvrent
aussi le Roster depuis le 9 novembre 2026 (décision du propriétaire, « ok go ») :
`persons:view_journey` et `persons:update_journey` ne sont pas créés. Le
Parcours d’une fiche demande `persons:view` et le droit de chaque liste qu’il
lit (9 novembre 2026 : `teams:view` pour les Rosters, `staff:view` pour
l’Effectif, au moins l’un des deux) ; Bureau & staff a ses droits propres,
`staff:view` et `staff:manage` (même jour, « ok go »).

**Journal** : chaque écriture suit la
[liste de contrôle Q15](../references/audit-historique.md#règle--toute-action-est-lisible-dans-le-journal-dactivité) :
actions, filtre « Équipes », libellés des champs et fiches de page.

## Lot 3 — Accès manager

**Données** : `UserPersonLink` (compte, fiche, auteur, dates), créé par une action
explicite et tracée depuis la fiche utilisateur, jamais par rapprochement d’email.

**Une fonction ne donne pas d’accès par son nom.** Les fonctions se renomment, donc
le code ne peut pas chercher le mot « Manager ». Une fonction d’équipe porte un réglage
« Donne accès à son équipe » ; une fonction de la structure n’en a pas. Il ouvre des données personnelles : il exige un droit critique
réservé aux Administrateurs et laisse une trace. Renommer une fonction n’y change rien.

**Politique** : `features/teams/server/policy.ts` expose `canViewTeam(acteur, équipe)`,
vraie avec `teams:view`, ou avec une liaison active et un passage ouvert donnant
accès. Elle est évaluée à chaque requête et dans chaque liste.

**Ce que voit un manager** : ses équipes en lecture seule, chaque membre avec pseudo,
fonction et dates. Il n’a ni `persons:view` ni accès au Répertoire : le serveur lui
renvoie uniquement cette projection, sans coordonnées et sans lien vers la fiche. La
navigation n’affiche que son équipe : sa fiche (Roster en lecture, Tournois sans les
gains ni le Suivi) et, à l’étape 5, les tournois de son équipe, qu’il crée et
remplit ; Mon compte reste accessible.

**Scénarios à vérifier** : adresse d’une autre équipe, identifiant deviné, API
appelée sans passer par l’écran, passage clôturé pendant la session, liaison retirée,
réglage retiré de la fonction, compte désactivé, recherche rapide, totaux des listes.

## Effets sur l’existant

| Élément | Effet |
| --- | --- |
| Statut du Répertoire | Colonne `structureStatus` remplacée par le calcul (fait le 9 novembre 2026 : la liste, son filtre et la fiche le calculent) |
| Suppression d’une fiche | Refus si la fiche a un passage ; [règle du Répertoire](../pages/personnes/repertoire/README.md) à actualiser |
| Sauvegarde | Nouvelles tables dans le manifeste, format v11 (fait le 9 novembre 2026, aller-retour éprouvé ; un test refuse désormais toute table oubliée), puis v12 avec les contacts d’urgence et représentants légaux et v13 avec les autres pseudos (10 novembre 2026) |
| Journal d’activité | Nouvelles actions et nouveau filtre |
| Registre, navigation, recherche rapide | Entrées et mots-clés de Listes et d’Équipes |
| Contrôle mobile E2E | Nouvelles pages à ajouter à `mobile-layout.checks.ts` |
| Fiches de page, cartographie | Une fiche par page et par onglet ; routes, API et données actualisées |

**Points examinés** : Q01–Q07, Q09–Q17, Q19, Q22, Q25, Q27, Q29, Q30, Q33–Q36.
Non applicables : Q08, Q20, Q21, Q23, Q24, Q26 (ni notification, ni fichier, ni
import, ni traitement différé, ni gouvernance, ni montant). Hors impact : Q18, Q28.

## Questions tranchées

| ID | Question | Décision | Date |
| --- | --- | --- | --- |
| CAD-Q4 | Où vont graphistes, monteurs et autres soutiens, et l’Effectif sépare-t-il le bureau du staff ? | « ok go » sur la recommandation : selon pour qui ils travaillent, toute la structure dans l’Effectif de Bureau & staff, une seule équipe dans son Roster avec une fonction d’encadrement du jeu ; les fonctions de la structure ont deux types, Bureau (mandats élus) et Staff, en deux groupes comme Joueurs et Encadrement ; droits propres à Bureau & staff ([fiche](../pages/structure/bureau-staff.md)) | 9 novembre 2026 |

## Questions au propriétaire

| ID | Question | Recommandation | Bloque |
| --- | --- | --- | --- |
| CAD-Q3 | Quel délai avant la purge des coordonnées, et qui le valide ? | À faire valider par une personne compétente | Confidentialité & conservation |
