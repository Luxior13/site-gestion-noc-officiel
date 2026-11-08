# Jeux

[Index des pages](../README.md) · [Espace Esport](README.md) · [Design](../../design/README.md) · [Guide général](../../REFERENCE_GENERALE.md)

## Identité

| Élément | Valeur |
| --- | --- |
| Route | `/esport/jeux` |
| Espace | Esport |
| Gabarit visé | [A. Liste de gestion](../../design/gabarits.md#a-liste-de-gestion), éléments sous leur parent, création et modification en fenêtre |
| État d’harmonisation | Aligné à sa création — voir [Harmonisation](../../design/harmonisation.md#état-par-page) |
| Point d’entrée | [page.tsx](../../../apps/web/src/app/esport/jeux/page.tsx) → [GamesPage](../../../apps/web/src/features/games/components/GamesPage.tsx) ; équipes : [TeamDialog](../../../apps/web/src/features/teams/components/TeamDialog.tsx) et [service](../../../apps/web/src/features/teams/server/team.service.ts) |
| Contrôle d’accès | `games:view` pour voir ; `games:manage` pour ajouter, modifier et supprimer un jeu ; `teams:view` pour voir les équipes, `teams:manage` pour les gérer ; l’API refait le contrôle dans la transaction ([permissions](../../domaines/permissions.md#page-jeux)) |
| Chargement / erreur dédiés | squelette et erreur avec « Réessayer » dans la page ; titre d’onglet déclaré par `page.tsx` |

## État courant — jeux et équipes, 8 novembre 2026

Première page du pôle Esport, demandée par le propriétaire (« je voudrais faire
la page jeux maintenant »), puis complétée le même jour par les équipes (« fais
les équipes », champs validés par « ok go »). Un jeu est une section de la
structure ; ses équipes s’affichent sous lui, sans page Équipes séparée.

Champs d’un jeu (décision : « un jeu n’est pas forcément ouvert ou fermé, juste
une date de la première ouverture suffit avec la date du jour préremplie à la
création, un champ actif ou non seulement, nom ok, nom court ok ») :

| Champ | Règle |
| --- | --- |
| Nom | Obligatoire, 60 caractères ; unique quels que soient la casse et les accents (`normalizedName`, forme de la recherche du site) ; renommer sert à corriger une faute, un jeu qui change vraiment devient un nouveau jeu ([registre](../../domaines/registre-historique.md#listes-de-choix)) |
| Nom court | Facultatif, 12 caractères, pour les affichages serrés (VAL, LoL, CS2) |
| Première ouverture | Obligatoire, préremplie avec la date du jour ; précision jour, mois ou année, sans jour inventé ; affichée « 15 mars 2021 », « mars 2021 » ou « 2019 » |
| Actif | Oui ou non, choisi à la main ; un jeu inactif reste dans l’historique |

Champs d’une équipe :

| Champ | Règle |
| --- | --- |
| Jeu | Obligatoire, choisi dans la fenêtre, sans valeur par défaut (sauf s’il n’y a qu’un jeu) puisqu’il ne changera plus ; tous les jeux, actifs d’abord, les inactifs marqués « (inactif) » et choisissables (une équipe passée ou à venir) ; la fenêtre rappelle « Le jeu ne change plus une fois l’équipe créée : un autre jeu, c’est une autre équipe. » ; l’API et la base refusent de le changer |
| Nom | Obligatoire, 60 caractères ; unique **dans son jeu** quels que soient la casse et les accents : chaque jeu peut avoir sa « Noctambule » ; renommer corrige une faute, les anciens noms viendront avec la fiche équipe |
| Création | Obligatoire, préremplie avec la date du jour, même précision que la première ouverture d’un jeu ; affichée « depuis 2023 », « depuis mars 2023 », « depuis le 15 mars 2023 » sur téléphone |
| Active | Oui ou non ; une équipe inactive reste dans l’historique |

Écartés pour une équipe : nom court (le jeu a le sien), type « principale,
académie… » (le nom le dit), logo (avec les vraies images des jeux), joueurs et
encadrement (le Roster, étape suivante).

Composition, de haut en bas :

1. `PageIdentityHero` : titre « Jeux », « Les sections de la structure, une par
   jeu, et leurs équipes. » (sans « et leurs équipes » pour qui ne les voit
   pas) ; bouton « Ajouter une équipe » (secondaire, `secondaryButton`) pour qui
   a `teams:manage` dès qu’un jeu existe, puis « Ajouter un jeu » pour qui a
   `games:manage`.
2. Carte de liste du Répertoire : recherche « Jeu ou équipe… » sur le nom et le
   nom court d’un jeu et le nom de ses équipes (une équipe trouvée s’affiche
   seule sous son jeu), filtres rapides « État » des jeux (Tous · Actifs ·
   Inactifs, avec compteurs), nombre de jeux.
3. Tableau « Jeu et équipes · Depuis · État » sur ordinateur, dans l’esprit du
   Répertoire (« prends exemple sur la page /personnes/repertoire » ; « des
   lignes en dessous, c’est bien, mais ça doit être réfléchi », 8 novembre
   2026) : chaque jeu, puis ses équipes sur des lignes entières et cliquables,
   avec leur écusson (28 px), leur création et leur état ; un guide fin descend
   de la manette du jeu jusqu’à chaque équipe. La couleur alterne par jeu
   (`groupedTable`), sans trait à l’intérieur d’un jeu ; « Aucune équipe » sous
   un jeu vide. Sur téléphone, une carte par jeu puis une ligne par équipe avec
   le même guide (nom et « depuis … » à gauche, pastille à droite, 44 px au
   moins). Jeux et équipes : actifs d’abord, puis par nom ; sans pagination (une
   section par jeu).
4. Chaque jeu porte, à la place d’un avatar, une vignette de 36 px
   (`GameAvatar`, `rounded-tile`) avec une manette au ton du pôle Esport, en
   attendant les vraies images ; sur téléphone, elle se centre sur le nom, dont
   le bouton garde sa cible de 44 px. Le nom court ne se coupe jamais.
5. Le nom d’un jeu est un lien vers sa [fiche](jeu.md), pour tout lecteur
   (8 novembre 2026). Le nom d’une équipe est un lien vers sa
   [fiche](equipe.md), pour tout lecteur des équipes (« une page équipe et non
   juste un modal », 8 novembre 2026). Sans `teams:view`, la liste reste celle
   des jeux seuls (colonne « Première ouverture »).

Fenêtre « Ajouter un jeu », pour la création seulement (« Une section de la
structure ; sa fiche s’ouvre ensuite, pour la compléter. ») : Nom, Nom court,
Première ouverture (précision, puis date, ou mois et année, ou année), Actif. Un
nom déjà pris s’affiche sous le champ. Une fois ajouté, le jeu ouvre sa
[fiche](jeu.md), où il se modifie et se supprime ; un jeu qui a des équipes y
affiche, à la place du bouton de suppression, « Ce jeu a 3 équipes :
rendez-le inactif plutôt que de le supprimer. »

Fenêtre « Ajouter une équipe » (« Sa fiche s’ouvre ensuite, pour la
compléter. »), pour la création seulement : Jeu (« Choisir un jeu », focus
initial ; « Choisissez un jeu » s’il manque ; pour un jeu inactif, « Ce jeu est
inactif : l’équipe s’ajoute à son historique, passée ou à venir. »), Nom,
Création (champ de date partagé `ApproximateDateField`), Active. Un nom déjà
pris dans le jeu s’affiche sous le champ. Une fois ajoutée,
l’équipe ouvre sa [fiche](equipe.md), où elle se modifie et se supprime.

Suppression, protégée en trois endroits (demande du propriétaire : « il faut y
penser maintenant ») : la fenêtre ne propose pas de supprimer un jeu qui a des
équipes ; le service le refuse avec le nombre d’équipes (409) ; la base aussi,
même pour une requête directe (`Team_gameId_fkey`, `ON DELETE RESTRICT`, jamais
`CASCADE`). Une équipe se supprime tant que rien ne la référence ; le Roster la
référencera de la même façon, et le service traduit déjà ce refus en « rendez-la
inactive ».

Données et traçabilité : tables `Game` (migration `20261108120000_games`) et
`Team` (migration `20261108180000_teams` : nom unique par jeu, précision de la
date de création, version) ; chaque ajout, modification et suppression est tracé
dans la même transaction (« Jeu ajouté / modifié / supprimé », « Équipe
ajoutée / modifiée / supprimée », champs Jeu, Nom, Nom court, Première
ouverture, Création, Actif, Active), filtres « Jeux » et « Équipes » du
[journal](../systeme/journal-activite.md), sujet « Équipe : Noctambule Academy
(Valorant) ».

Hors de cette version : la fiche équipe (Roster, Tournois, Informations…), la
fiche jeu (Finances, Fonctions), les anciens noms d’une équipe, l’image de
chaque jeu et les jeux pratiqués sur la fiche personne
([feuille de route](../../propositions/feuille-de-route.md)).

## Décisions courantes

- Une première ouverture et un état actif choisi à la main, sans dates
  d’ouverture et de fermeture (8 novembre 2026) ; de même pour une équipe, avec
  sa création.
- Les équipes s’affichent sous chaque jeu de cette page ; l’onglet « Équipes »
  prévu sur la fiche jeu est retiré, il ferait doublon (8 novembre 2026).
- Une équipe : jeu, nom unique dans son jeu, création, active (« ok go »,
  8 novembre 2026).
- Une équipe s’ouvre sur sa fiche, jamais dans une fenêtre ; la fenêtre ne sert
  qu’à la créer (8 novembre 2026). De même pour un jeu, qui aura ses onglets
  ([fiche jeu](jeu.md), même jour).
- Le jeu d’une équipe est fixé à sa création ; il ne change plus (8 novembre
  2026, [fiche équipe](equipe.md#décisions-courantes)).
- Un seul bouton « Ajouter une équipe » dans le bandeau ; le jeu se choisit dans
  la fenêtre, sans valeur par défaut (8 novembre 2026, à la place d’une ligne
  d’ajout sous chaque jeu, essayée le même jour). Liste sans bandes alternées.
- Un jeu inactif reçoit encore des équipes, passées ou à venir : inactif veut
  dire « pas en activité en ce moment », jamais « verrouillé » (8 novembre 2026,
  [registre](../../domaines/registre-historique.md#listes-de-choix)).
- Un jeu qui a des équipes ne se supprime pas : il devient inactif.
- Couleur du pôle : violet (`--nav-esport`), proposée et appliquée sans objection.
- Quatre autorisations délégables, `games:view`, `games:manage`, `teams:view`
  (qui suppose `games:view`) et `teams:manage`, que les administrateurs ont
  par leur rôle.
- Une icône par défaut sur chaque jeu, de vraies images plus tard
  (« ajoute un icône sur les jeux par défaut, plus tard on mettra des vraies
  images », 8 novembre 2026).
- Les jeux actifs d’abord, puis par nom (« le tri actif / inactif doit être pris
  en compte en premier », 8 novembre 2026), au chargement comme après un ajout
  ou une modification (`compareActiveThenName`, aussi pour les équipes).

## Preuves et limites

Le 8 novembre 2026, page Jeux : lint, types, suite web (dont `games.test.ts` :
dates, validation, droits, journal, ordre), knip, budget d’architecture, build et
budget de performance ; suites SQL sur PostgreSQL 17 jetable ; rendu relu sur
banc client (composant réel ; session et API simulées) à 1 440, 768, 390 et
320 px.

Le même jour, équipes : lint, types, suite web (1 309 tests, dont `teams.test.ts`
: validation, droits et leur dépendance, journal), knip, budget d’architecture ;
14 suites SQL et 251 tests, dont `teams-postgres` (ajout tracé avec le nom du
jeu, nom unique par jeu seulement, jeu inexistant refusé sans trace, version,
jeu d’une équipe inchangeable, suppression, **jeu qui a des équipes refusé par l’API et
par la base**, droits, retour arrière si le journal échoue, contraintes) ;
`prisma migrate diff` sans écart sur `Game` et `Team`. Banc relu aux quatre
largeurs : liste groupée, recherche d’une équipe, jeu avec équipes sans
« Supprimer », ajout, doublon, création à l’année,
suppression, liste vide, lecture seule, jeux seuls ; aucun débordement, aucune
erreur JavaScript, cibles tactiles de 44 px mesurées sur la zone cliquable.

Non rejoués : E2E et parcours connecté sur le vrai serveur. Les migrations ne
sont pas appliquées à la base de développement distante : le propriétaire les
lance avec `bun run db:migrate:deploy` ([procédure](../../../packages/database/prisma/README.md)).
