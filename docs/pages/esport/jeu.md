# Fiche jeu

[Index des pages](../README.md) · [Espace Esport](README.md) · [Jeux](jeux.md) · [Design](../../design/README.md) · [Guide général](../../REFERENCE_GENERALE.md)

## Identité

| Élément | Valeur |
| --- | --- |
| Route | `/esport/jeux/[id]` (Fonctions) et `/esport/jeux/[id]?section=informations` |
| Espace | Esport ; « Jeux » reste l’entrée courante de la navigation (préfixe `/esport/jeux`) |
| Gabarit visé | [B. Fiche à sections](../../design/gabarits.md#b-fiche-à-sections), onglets Fonctions puis Informations depuis le 9 novembre 2026 |
| État d’harmonisation | Aligné — voir [Harmonisation](../../design/harmonisation.md#état-par-page) |
| Point d’entrée | [page.tsx](../../../apps/web/src/app/esport/jeux/%5Bid%5D/page.tsx) → [GameDetailPage](../../../apps/web/src/features/games/components/GameDetailPage.tsx) → [MemberFunctionsSection](../../../apps/web/src/features/member-functions/components/MemberFunctionsSection.tsx) et [MemberFunctionDialog](../../../apps/web/src/features/member-functions/components/MemberFunctionDialog.tsx) ; [GameInformationSection](../../../apps/web/src/features/games/components/GameInformationSection.tsx) |
| Contrôle d’accès | `games:view` pour voir le jeu et ses fonctions ; `games:manage` pour modifier et supprimer le jeu, ajouter, modifier et supprimer ses fonctions ; le nombre d’équipes s’affiche avec `teams:view` ; l’API refait le contrôle dans la transaction ([permissions](../../domaines/permissions.md#page-jeux)) |
| Chargement / erreur dédiés | `loading.tsx` (squelette de fiche) ; « Jeu introuvable » ; « Chargement impossible » avec « Réessayer » ; « Accès refusé » avec retour aux jeux ; liste des fonctions : trois lignes squelettes, puis « Les fonctions ne peuvent pas être chargées » avec « Réessayer » ; titre d’onglet « Fiche jeu · Jeux · Noctambule » |

## État courant

Ouverte le 8 novembre 2026 (« quand je clique sur un jeu, j’ouvre un modal ;
penses-tu que ça doit rester comme ça ou faire une page ? », puis « ok go » :
un jeu aura des onglets, il s’ouvre donc sur sa fiche). Le nom d’un jeu, sur la
page [Jeux](jeux.md), est un lien vers sa fiche, pour tout lecteur ; un jeu
ajouté en fenêtre ouvre aussitôt sa fiche. Les fonctions y sont arrivées le
9 novembre 2026, en premier onglet (« ok go tes recommandations »).

Composition, de haut en bas :

1. Fil d’Ariane « Esport › Jeux › Valorant ». Sur une [fiche équipe](equipe.md),
   le nom du jeu y devient un lien vers cette fiche.
2. En-tête de fiche (`EntityDetailLayout`) : manette au ton du pôle
   (`GameAvatar`, en attendant l’image du jeu), nom, pastille « Actif » ou
   « Inactif », ligne « VAL · depuis le 15 mars 2021 · 3 équipes » (le nombre
   d’équipes pour qui les voit), puis la barre d’onglets **Fonctions** (avec
   leur nombre) et **Informations**. Fonctions garde l’adresse simple ;
   Informations ajoute `?section=informations`. Un brouillon des informations
   marque leur onglet. Finances ↗ viendra entre les deux. Chaque onglet charge
   son code à la demande (`next/dynamic`, comme la fiche personne) : le
   glisser-déposer ne pèse que sur Fonctions, et la page passe de 318 à
   276 Kio compressés au budget de performance (9 novembre 2026).
3. **Fonctions** (`MemberFunctionsSection`, partagée avec l’onglet Fonctions
   de [Bureau & staff](../structure/bureau-staff.md) depuis le 9 novembre 2026 :
   la liste, jeu ou structure, est un paramètre) : une carte « Fonctions », avec la
   phrase « Ce que fait chaque membre d’une équipe de Valorant. » (pour un
   lecteur : « …, dans l’ordre de leur importance. ») et, pour qui a
   `games:manage`, « Ajouter une fonction » à droite. Sous la liste, pour qui
   gère, la consigne « Glissez une fonction par sa poignée pour la placer selon
   son importance : cet ordre est repris partout. », en petit texte discret
   précédé de l’icône de la poignée (demande du propriétaire du 9 novembre
   2026 : « en dessous du tableau »). Deux blocs, **Joueurs** puis **Encadrement**, chacun avec son
   nombre ; une ligne par fonction : poignée ⠿, nom, état à droite, dans
   l’ordre posé par ses gestionnaires, actives et inactives mélangées (une
   fonction inactive ne bloque rien). La poignée
   glisse la ligne dans son bloc, à la souris, au doigt ou au clavier
   ([comportements](../../design/comportements.md#listes-recherche-et-pagination)) ;
   le nouvel ordre s’affiche et s’enregistre aussitôt (« Ordre enregistré »).
   Le nom d’une fonction ouvre sa fenêtre de modification (toute la ligne est
   la cible) ; un lecteur voit l’ordre, sans poignée ni action. Même rendu sur
   téléphone, poignée de 44 px.
   Liste vide : « Aucune fonction pour l’instant » ; pour qui gère, « Ajouter
   les fonctions courantes » (Joueur, Remplaçant, Coach, Manager, Analyste, en
   une transaction, chacune tracée) et « Ajouter une fonction ».
4. **Fenêtre d’une fonction** (`MemberFunctionDialog`), une fonction n’ayant pas
   de fiche : Nom (obligatoire, 40 caractères, unique dans le jeu quels que
   soient la casse et les accents ; en modification, l’aide « Renommer sert à
   corriger une faute. Une fonction qui change de nature s’ajoute à part ;
   l’ancienne devient inactive et reste sur les passages qui l’ont eue. »), Type
   (Joueur ou Encadrement, obligatoire, sans valeur par défaut, aide « Joueur :
   sur la feuille de match. Encadrement : coach, manager, analyste… ») et Active
   (« Une fonction inactive n’est plus proposée en premier ; elle reste
   choisissable pour un passage ancien. »). En modification, « Supprimer » à
   gauche ouvre une confirmation « Supprimer la fonction Coach ? » : seule une
   fonction créée par erreur, jamais utilisée, se supprime. Version dépassée,
   fonction disparue ou déjà utilisée : le message du serveur et « Recharger la
   liste » à la place de l’action.
5. **Informations** (`GameInformationSection`, titre réservé aux lecteurs
   d’écran), modifiées sur place comme celles d’une équipe : carte « Jeu » avec
   Nom (aide « Renommer sert à corriger une faute ; un nouveau jeu (CS2 après
   CS:GO) s’ajoute à part. »), Nom court, Première ouverture (au jour, au mois
   ou à l’année) et Actif (« Un jeu inactif reste dans l’historique et reçoit
   encore des équipes. »). Barre d’enregistrement commune dès qu’une valeur
   change ; version dépassée : actualiser en gardant la saisie ; quitter avec un
   brouillon : confirmation.
6. Zone dangereuse (`EntityDangerZone`), sous les informations, pour qui a
   `games:manage` : « Supprimer le jeu » avec sa confirmation quand le jeu n’a
   pas d’équipe ; la confirmation ajoute « Ses 2 fonctions, jamais utilisées,
   sont supprimées avec lui. » quand il en a. Avec des équipes, à la place du
   bouton, « Ce jeu a 3 équipes : rendez-le inactif plutôt que de le
   supprimer. » (`unavailableReason`). Le service et la base refusent de toute
   façon.

Données : `GET /api/jeux/[id]` rend le jeu avec ses nombres d’équipes et de
fonctions ; `GET/POST /api/jeux/[id]/fonctions`, `POST
/api/jeux/[id]/fonctions/courantes`, `PUT /api/jeux/[id]/fonctions/ordre`,
`PATCH/DELETE
/api/jeux/[id]/fonctions/[functionId]` ([API](../../systeme/api.md)), table
`MemberFunction` ([données](../../systeme/donnees.md)). Écritures tracées dans
la même transaction : « Fonction ajoutée / modifiée / supprimée », sujet
« Fonction : Coach (Valorant) », champs Jeu, Nom, Type, Active, type
« Fonctions » du journal ; « Ordre des fonctions modifié », sujet « Fonctions :
Encadrement (Valorant) », champ Ordre avant et après ; « Jeu modifié », « Jeu supprimé » (avec la liste des
fonctions retirées avec lui).

## Décisions courantes

- Un jeu s’ouvre sur sa fiche, jamais dans une fenêtre ; la fenêtre ne sert qu’à
  le créer (8 novembre 2026, règle « élément qui aura des onglets »).
- Onglets, dans l’ordre : Fonctions, Finances ↗ (étape 3), puis Informations,
  comme la fiche équipe garde ses informations en dernier
  ([feuille de route](../../propositions/feuille-de-route.md)).
- Fonctions (9 novembre 2026, « ok go tes recommandations ») : une fonction n’a
  pas de fiche, elle s’ajoute et se modifie en fenêtre ; trois champs (Nom,
  Type, Active) ; types Joueur et Encadrement, liste fixe dans le code ; les
  postes en jeu (Top, Jungle…) ne sont pas des fonctions, un éventuel champ
  « Poste » du passage les accueillera ; les fonctions courantes en un clic
  quand la liste est vide ; droit `games:manage`, sans permission nouvelle.
  Ni description, ni nom court.
- Ordre par glisser-déposer (9 novembre 2026, « on devrait mettre du drag and
  drop sur les placements pour l’importance ? », puis « ok go ») : il remplace
  l’ordre « actives d’abord, puis par nom » décidé le matin. On réordonne les
  fonctions dans un bloc (un Coach ne passe pas devant les joueurs), actives
  et inactives mélangées ; devenir inactive ne déplace pas une fonction (règle
  commune aux jeux et aux équipes, fixée le même jour : « pense long terme »,
  « un jeu inactif ne doit jamais bloquer », « je n’arrive pas à échanger
  deux jeux ») ; dans le choix de la fonction d’un passage, les actives
  d’abord, les inactives ensuite marquées « (inactive) » ; l’ordre est repris partout (Roster, choix
  de la fonction d’un passage, Parcours). Une nouvelle fonction, ou une fonction
  qui change de type, se place en fin de son bloc ; les fonctions courantes
  arrivent dans l’ordre Joueur, Remplaçant, puis Coach, Manager, Analyste.
  L’ordre ne fait pas partie de la version d’une fonction : une fenêtre ouverte
  reste valable après un déplacement ; une liste changée entre-temps refuse le
  déplacement et se recharge.
- Une fonction inactive reste choisissable pour un passage ancien, après les
  actives et marquée « (inactive) » (PREF-Q10 tranchée le 9 novembre 2026) ;
  elle ne se supprime que si elle n’a jamais servi
  ([registre historique](../../domaines/registre-historique.md#listes-de-choix)).
- Un jeu créé par erreur, sans équipe, se supprime avec ses fonctions, qui
  n’ont alors jamais servi : le service les retire explicitement dans la
  transaction tracée ; la clé de la base reste `ON DELETE RESTRICT`, jamais
  `CASCADE`.
- Chaque ligne dit combien de passages l’utilisent (« 5 passages », « aucun
  passage ») depuis l’arrivée du Roster (9 novembre 2026) ; une fonction
  utilisée ne propose plus « Supprimer » : sa fenêtre dit « Utilisée dans
  5 passages : rendez-la inactive plutôt que de la supprimer. ».
- Reportés : le réglage « Donne accès
  à son équipe » arrive avec l’accès des managers (étape 3). L’ancienne fenêtre
  « Modifier le jeu » est retirée : la modification et la suppression vivent
  dans la fiche.

## Preuves et limites

Ordre par glisser-déposer, le 9 novembre 2026 : `sortable-list` (poignées
nommées, annonce en français, lecture sans poignée, poignées inertes pendant
l’enregistrement), contrat du réordonnancement et ligne du journal ;
`member-functions-postgres` : ordre posé et tracé une fois, même ordre sans
trace, versions inchangées, ajout et changement de type en fin de bloc, liste
changée, fonction de l’autre bloc ou d’un autre jeu refusées (409), doublon
refusé (400), lecteur refusé (403), position négative refusée par la base ;
268 tests SQL. Banc client à 1 440, 768, 390 et 320 px : clavier (Espace,
flèche haut, Espace : ordre envoyé, focus resté sur la poignée, annonce
« Manager : nouvelle position 1 sur 3 ») et souris (la ligne reste dans son
bloc) ; aucun débordement, aucune cible sous 44 px, aucune erreur JavaScript.

Le 9 novembre 2026 : lint, types, suite web (dont `member-functions` : contrat
du formulaire, ordre, fonctions courantes, lignes du journal) ; 15 suites SQL et
266 tests sur PostgreSQL 17 jetable, dont `member-functions-postgres` (ajout
tracé, nom unique par jeu, fonctions courantes une seule fois, modification
sous version, aucune fonction atteinte par un autre jeu, suppression, jeu
supprimé avec ses fonctions nommées dans la trace, refus avec une équipe et
refus direct de la base, droits, retour en arrière si la trace échoue,
contraintes et index partiel des fonctions de la structure). Banc client
(composant réel, session et API simulées) à 1 440, 768, 390 et 320 px : liste,
modification, brouillon, ajout avec erreurs et doublon, suppression confirmée,
liste vide puis fonctions courantes, onglet Informations par la barre
d’onglets, brouillon marqué, confirmation de suppression du jeu avec ses
fonctions, lecture seule et liste vide en lecture ; aucun débordement, aucune
cible tactile sous 44 px, aucune erreur JavaScript.

Le 8 novembre 2026 : lecture d’un jeu (avec son nombre d’équipes, introuvable,
refusée sans `games:view`) ; clic sur un jeu vers sa fiche, ajout d’un jeu puis
ouverture de sa fiche, suppression remplacée par l’explication.

Limites : pas de bouton « Historique » (le journal filtre par type « Jeux » ou
« Fonctions », pas encore par jeu) ; E2E non rejoués ; le changement d’onglet
dans le banc se vérifie par l’adresse puis un rechargement (le banc n’a pas de
rendu serveur).
