# Jeux

[Index des pages](../README.md) · [Espace Esport](README.md) · [Design](../../design/README.md) · [Guide général](../../REFERENCE_GENERALE.md)

## Identité

| Élément | Valeur |
| --- | --- |
| Route | `/esport/jeux` |
| Espace | Esport |
| Gabarit visé | [A. Liste de gestion](../../design/gabarits.md#a-liste-de-gestion), création et modification en fenêtre |
| État d’harmonisation | Aligné à sa création — voir [Harmonisation](../../design/harmonisation.md#état-par-page) |
| Point d’entrée | [page.tsx](../../../apps/web/src/app/esport/jeux/page.tsx) → [GamesPage](../../../apps/web/src/features/games/components/GamesPage.tsx) |
| Contrôle d’accès | `games:view` pour voir ; `games:manage` pour ajouter, modifier et supprimer ; l’API refait le contrôle dans la transaction ([permissions](../../domaines/permissions.md#page-jeux)) |
| Chargement / erreur dédiés | squelette et erreur avec « Réessayer » dans la page ; titre d’onglet déclaré par `page.tsx` |

## État courant — création du 8 novembre 2026

Première page du pôle Esport, demandée par le propriétaire (« je voudrais faire
la page jeux maintenant »). Ses décisions sur les champs : « un jeu n’est pas
forcément ouvert ou fermé, juste une date de la première ouverture suffit avec
la date du jour préremplie à la création, un champ actif ou non seulement, nom
ok, nom court ok ».

Un jeu est une section de la structure.

| Champ | Règle |
| --- | --- |
| Nom | Obligatoire, 60 caractères ; unique quels que soient la casse et les accents (`normalizedName`, forme de la recherche du site) ; renommer sert à corriger une faute, un jeu qui change vraiment devient un nouveau jeu ([registre](../../domaines/registre-historique.md#listes-de-choix)) |
| Nom court | Facultatif, 12 caractères, pour les affichages serrés (VAL, LoL, CS2) |
| Première ouverture | Obligatoire, préremplie avec la date du jour ; précision jour, mois ou année, sans jour inventé ; affichée « 15 mars 2021 », « mars 2021 » ou « 2019 » |
| Actif | Oui ou non, choisi à la main ; un jeu inactif reste dans l’historique |

Composition, de haut en bas :

1. `PageIdentityHero` : titre « Jeux », « Les sections de la structure, une par
   jeu. », bouton « Ajouter un jeu » pour qui a `games:manage`.
2. Carte de liste du Répertoire : recherche sur le nom et le nom court, filtres
   rapides « État » (Tous · Actifs · Inactifs, avec compteurs), nombre de jeux.
3. Tableau Jeu · Première ouverture · État sur ordinateur, cartes sur
   téléphone ; les jeux actifs d’abord, puis par nom, sans pagination (une
   section par jeu). Chaque jeu porte, à la place d’un avatar, une vignette de
   36 px (`GameAvatar`, `rounded-tile`) avec une manette au ton du pôle Esport,
   en attendant les vraies images ; sur téléphone, elle se centre sur le nom,
   dont le bouton garde sa cible de 44 px. Le nom d’un jeu ouvre la fenêtre de
   modification pour qui a `games:manage` ; un lecteur voit la liste sans
   action. Le nom court ne se coupe jamais.

Fenêtre « Ajouter un jeu » ou « Modifier le jeu » : Nom, Nom court, Première
ouverture (précision, puis date, ou mois et année, ou année), Actif. En
modification, la description rappelle « Renommer sert à corriger une faute. Pour
un nouveau jeu (CS2 après CS:GO), rendez l’ancien inactif et ajoutez-en un
nouveau. » ; « Supprimer » ouvre une confirmation qui nomme le jeu. Un nom déjà
pris s’affiche sous le champ ; une version dépassée demande de recharger.

Suppression : un jeu créé par erreur se supprime. Rien ne référence encore un
jeu ; les équipes, joueurs et tournois le feront, et la base refusera alors la
suppression d’un jeu qui a servi : il devient inactif.

Données et traçabilité : table `Game` (migration `20261108120000_games`,
contraintes de nom, de nom court, de précision de date et de version) ; ajout,
modification et suppression tracés dans la même transaction (« Jeu ajouté »,
« Jeu modifié », « Jeu supprimé », champs nommés Nom, Nom court, Première
ouverture, Actif), filtre « Jeux » du [journal](../systeme/journal-activite.md).

Hors de cette version : les équipes sous chaque jeu, la fiche jeu (Équipes,
Finances, Fonctions), l’image de chaque jeu et les jeux pratiqués sur la fiche
personne
([feuille de route](../../propositions/feuille-de-route.md)).

## Décisions courantes

- Une première ouverture et un état actif choisi à la main, sans dates
  d’ouverture et de fermeture (8 novembre 2026).
- Couleur du pôle : violet (`--nav-esport`), proposée et appliquée sans objection.
- Deux autorisations délégables, `games:view` et `games:manage`, que les
  administrateurs ont par leur rôle.
- Une icône par défaut sur chaque jeu, de vraies images plus tard
  (« ajoute un icône sur les jeux par défaut, plus tard on mettra des vraies
  images », 8 novembre 2026).
- Les jeux actifs d’abord, puis par nom (« le tri actif / inactif doit être pris
  en compte en premier », 8 novembre 2026) : même ordre au chargement
  (`listGames`) et après un ajout ou une modification (`compareGames`).

## Preuves et limites

Le 8 novembre 2026 : lint, types, suite web (dont `games.test.ts` : dates,
validation, droits, journal), knip, budget d’architecture, build et budget de
performance ; suites SQL sur PostgreSQL 17 jetable, 13 suites et 242 tests, dont
`games-postgres` (ajout tracé, nom en double refusé quelle que soit la casse,
version, suppression, droits, retour arrière si le journal échoue, contraintes
de la base). Rendu relu sur banc client (composant réel ; session et API
simulées) à 1 440, 768, 390 et 320 px : liste, filtres, recherche, ajout,
précision au mois, doublon, modification, suppression, liste vide, lecture
seule ; aucun débordement ni erreur JavaScript. Icône et ordre, le même jour :
lint, types, `games.test.ts` (ordre des jeux), banc relu aux quatre largeurs,
en gestion et en lecture seule.

Non rejoués : E2E et parcours connecté sur le vrai serveur. La migration n’est
pas appliquée à la base de développement distante : le propriétaire la lance
avec `bun run db:migrate:deploy` ([procédure](../../../packages/database/prisma/README.md)).
