# Fiche équipe

[Index des pages](../README.md) · [Espace Esport](README.md) · [Jeux](jeux.md) · [Design](../../design/README.md) · [Guide général](../../REFERENCE_GENERALE.md)

## Identité

| Élément | Valeur |
| --- | --- |
| Route | `/esport/equipes/[id]` (Roster), `?section=anciens` (Anciens membres) et `?section=informations` |
| Espace | Esport ; « Jeux » reste l’entrée courante de la navigation (`matchHrefs` de la fonctionnalité `games`) |
| Gabarit visé | [B. Fiche à sections](../../design/gabarits.md#b-fiche-à-sections), onglets Roster, Anciens membres et Informations depuis le 9 novembre 2026 |
| État d’harmonisation | Aligné — voir [Harmonisation](../../design/harmonisation.md#état-par-page) |
| Point d’entrée | [page.tsx](../../../apps/web/src/app/esport/equipes/%5Bid%5D/page.tsx) → [TeamDetailPage](../../../apps/web/src/features/teams/components/TeamDetailPage.tsx) → [TeamRosterSection](../../../apps/web/src/features/passages/components/TeamRosterSection.tsx), [TeamFormerSection](../../../apps/web/src/features/passages/components/TeamFormerSection.tsx), tous deux sur [PassageLines](../../../apps/web/src/features/passages/components/PassageLines.tsx) et `useTeamRoster`, [PassageDialog](../../../apps/web/src/features/passages/components/PassageDialog.tsx) ; [TeamInformationSection](../../../apps/web/src/features/teams/components/TeamInformationSection.tsx) |
| Contrôle d’accès | `teams:view` pour voir l’équipe et son Roster ; `teams:manage` pour la modifier, la supprimer, ajouter, corriger et supprimer des passages et chercher une fiche du Répertoire à y ajouter ; le lien vers la fiche d’une personne suit `persons:view`, celui de création d’une fiche `persons:create` ; l’API refait le contrôle dans la transaction ([permissions](../../domaines/permissions.md#page-jeux)) |
| Chargement / erreur dédiés | `loading.tsx` (squelette de fiche) ; « Équipe introuvable » ; « Chargement impossible » avec « Réessayer » ; « Accès refusé » avec retour aux jeux ; Roster et Anciens membres : trois lignes squelettes, puis « Le Roster ne peut pas être chargé » (« Les anciens membres ne peuvent pas être chargés ») avec « Réessayer » ; titre d’onglet « Fiche équipe · Jeux · Noctambule » |

## État courant

Ouverte le 8 novembre 2026 (« lorsque je clique, je dois avoir une page équipe
et non juste un modal, donc une fiche, car on aura des onglets »). Le Roster y
est arrivé le 9 novembre 2026, en premier onglet (« ok go » sur la
proposition : lien « Créer la fiche », « Changer de fonction » en un clic,
droits des équipes).

Composition, de haut en bas :

1. Fil d’Ariane « Esport › Jeux › Valorant › Noctambule Academy » : « Jeux »
   ramène à la liste, le nom du jeu ouvre sa [fiche](jeu.md).
2. En-tête de fiche (`EntityDetailLayout`) : écusson au ton du pôle Esport
   (`TeamAvatar`, en attendant le logo), nom, pastille « Active » ou
   « Inactive », ligne « Valorant · depuis septembre 2023 », puis la barre
   d’onglets **Roster** (avec le nombre de personnes présentes aujourd’hui,
   chacune une fois), **Anciens membres** (le nombre de personnes qui ont un
   passage terminé) et **Informations**. Roster garde l’adresse simple ; les
   autres ajoutent `?section=anciens` ou `?section=informations`. Chaque onglet charge son code
   à la demande.
3. **Roster** (`TeamRosterSection`) : ce qui est là et ce qui arrive, jamais
   les anciens (« je ne veux pas mélanger les anciens avec les en cours et à
   venir, car sur le très long terme ça fera bordel ; le but est de voir ce
   qu’il y a actuellement et à venir », 9 novembre 2026). La liste du
   Répertoire, sans titre (l’onglet la nomme).
   - Bande : « 4 membres · 1 à venir » (personnes, chacune une fois) et, pour
     qui gère, « Ajouter un membre » au bord droit ; ni recherche, ni filtre,
     ni date.
   - Un tableau par bloc, **Joueurs** puis **Encadrement** : le premier
     en-tête nomme le bloc et son nombre, puis Fonction, Statut, Début, Fin,
     Durée, aux mêmes largeurs d’un bloc à l’autre. Les membres actuels
     d’abord, ceux à venir ensuite, chacun dans l’ordre des fonctions posé
     dans la fiche du jeu, puis le début le plus ancien. Une ligne : l’avatar
     de la fiche du Répertoire et la personne en gras (« Kaiz · Prénom Nom »,
     coupée par « … » si elle est trop longue, entière au survol), la
     fonction, le statut en badge (Actuel, À venir), le début et la fin comme
     connus (« mars 2024 », « 15 janvier 2025 », « 2023 »), « — » sans fin, la
     durée jusqu’à aujourd’hui (« 2 ans 8 mois », « environ 3 ans »), « — »
     pour un passage à venir. Une fin d’aujourd’hui garde la ligne jusqu’au
     soir.
   - Sous 56 rem de liste, les cartes du Répertoire, un bandeau par bloc :
     avatar, nom, badge et fonction, puis la période et la durée en toutes
     lettres (« depuis mars 2024 · 2 ans 8 mois », « à partir de 2027 » ;
     voir [fondations](../../design/fondations.md#rédaction-des-textes-visibles)).
   - Pour qui gère, le nom ouvre la fenêtre du passage (toute la ligne est la
     cible) ; pour un lecteur qui voit le Répertoire, le nom ouvre la fiche de
     la personne ; sinon, le nom seul.
   - Roster vide : « Aucun membre pour l’instant », avec « Ajouter un membre » ;
     sans membre actuel ni à venir : « Aucun membre actuellement », « Les
     passages terminés sont dans les anciens membres » avec le lien.
     Jeu sans fonction : une ligne dit « Ce jeu n’a pas encore de fonctions »
     avec un lien vers la fiche du jeu.
3. bis **Anciens membres** (`TeamFormerSection`, 9 novembre 2026, « Onglet à
   part » sur la question posée) : chaque passage terminé, y compris une
   fonction quittée pour une autre ; une personne revenue figure aux deux
   onglets, chacun pour son passage.
   - Bande du Répertoire : recherche « Pseudo, nom ou fonction… » (chaque
     mot, sans accents), réinitialisation, et pour qui gère « Ajouter un
     ancien membre » au bord droit ; dessous, « Fonction » : Tous, Joueurs,
     Encadrement, avec leurs nombres, la recherche comprise ; à droite,
     « 4 passages » (« trouvés » pendant une recherche).
   - Un tableau par année de fin, la plus récente d’abord (« Fin en 2025 2 »),
     puis Fonction, Début, Fin, Durée ; dans l’année, la fin la plus récente
     d’abord, puis le nom. Cartes sous 56 rem, comme le Roster.
   - « Ajouter un ancien membre » ouvre la fenêtre sans « En cours » :
     « Une personne passée par Noctambule Academy, avec sa fonction et ses
     dates. » Une fin d’aujourd’hui ou à venir range le passage au Roster ; le
     message le dit (« Ancien membre ajouté », « Membre ajouté au Roster »,
     « Passage terminé : il rejoint les anciens membres »).
   - Vide : « Aucun ancien membre » (« Un passage terminé arrive ici : un
     départ, ou une fonction quittée pour une autre. ») ; « Aucun passage
     trouvé » pendant une recherche.
4. **Fenêtre d’un passage** (`PassageDialog`), un passage n’ayant pas de fiche :
   - **Personne** : une fiche du Répertoire, cherchée par pseudo, prénom ou nom
     (tous les mots tapés) dans un menu déroulant sous le champ : six
     suggestions au plus, chacune avec son avatar, puis « Plus de 6 fiches : précisez la recherche » ;
     flèches et Entrée au clavier (« en afficher moins et faire un menu
     déroulant », 9 novembre 2026) ; absente, le lien « Créer la fiche dans le
     Répertoire » ouvre le formulaire dans un autre onglet, puis on la cherche
     ici. Choisie, la personne s’affiche avec son avatar et « Changer ». Une
     fois le passage créé, elle ne change plus (un passage sur la mauvaise
     personne se supprime) ; la fenêtre la montre avec son avatar et « Ouvrir
     la fiche ».
   - **Fonction** : les fonctions du jeu de l’équipe, joueurs puis
     encadrement, les actives d’abord, les inactives ensuite marquées
     « (inactive) » (PREF-Q10).
   - **Début** : au jour, au mois ou à l’année, aujourd’hui par défaut.
   - **En cours** (interrupteur, coché par défaut) : le retirer fait paraître
     **Fin**, aujourd’hui par défaut : c’est « Terminer ».
   - Pied : « Supprimer » (confirmation à part : « Seul un passage saisi par
     erreur se supprime. Pour un départ, retirez plutôt « En cours » ») et
     « Changer de fonction », qui passe la fenêtre en **Nouvelle fonction** et
     **À partir du** : le passage se termine à cette date et un nouveau
     commence, en une fois.
   - Erreurs sous le champ concerné : même fonction déjà tenue sur la période
     (« Cette personne a déjà cette fonction dans l’équipe sur cette
     période. »), fin avant le début, fonction d’un autre jeu ; version
     dépassée : le message et « Recharger le Roster ».
5. **Informations** (`TeamInformationSection`), modifiées sur place : une
   carte « Équipe » avec Nom, Création et Active ; le jeu, fixé à la création,
   est dans l’en-tête. Barre d’enregistrement commune ; un brouillon marque
   l’onglet ; version dépassée : actualiser en gardant la saisie.
6. Zone dangereuse, sous les informations, pour qui a `teams:manage` :
   « Supprimer l’équipe » tant que son Roster est vide ; sinon, à la place du
   bouton, « Cette équipe a 7 passages dans son Roster : rendez-la inactive
   plutôt que de la supprimer. ». Le service et la base refusent de toute
   façon.

Un lecteur (`teams:view` seul) voit le Roster et les informations, sans
action ni lien vers les fiches s’il ne voit pas le Répertoire.

Données : table `PersonPassage` ([données](../../systeme/donnees.md)) ;
`GET /api/equipes/[id]` rend l’équipe avec son jeu, ses membres du jour et son
nombre de passages ; `GET/POST /api/equipes/[id]/passages`,
`PATCH/DELETE /api/equipes/[id]/passages/[passageId]`,
`POST …/[passageId]/changement` et `GET /api/passages/personnes`
([API](../../systeme/api.md)) ; chaque écriture rend le Roster entier. Traces
dans la même transaction : « Passage ajouté / modifié / supprimé », rattachées à
la fiche de la personne (son historique les montre), type « Parcours » du
journal, sujet « Passage : Joueur, Noctambule Academy (Valorant) », champs
Équipe, Fonction, Début, Fin ; jamais le nom de la personne dans la trace, que
seul un lecteur du Répertoire voit, par la fiche.

## Décisions courantes

- Une équipe s’ouvre sur sa fiche, jamais dans une fenêtre ; la fenêtre ne
  sert qu’à la créer (8 novembre 2026).
- Le jeu d’une équipe est fixé à sa création (8 novembre 2026) : un autre jeu,
  c’est une autre équipe, et le Roster utilise les fonctions de ce jeu. L’API
  et la base refusent de le changer (déclencheur `Team_gameId_immutable`) ; la
  base refuse aussi qu’un passage prenne une fonction d’un autre jeu
  (`PersonPassage_function_scope`) et qu’une fonction change de jeu
  (`MemberFunction_gameId_immutable`).
- La création reste en fenêtre, même à long terme (8 novembre 2026) : seuls le
  jeu, le nom, la création et l’état se demandent.
- Le Roster (9 novembre 2026, « ok go ») : une ligne est un passage, une
  personne avec une fonction, un début et une fin (vide : encore là) ; un
  changement de fonction, ce sont deux passages ; rien n’est écrasé. Un début
  se range au premier jour de sa période, une fin au dernier (« 2024 » couvre
  l’année) : « qui était là à telle date » reste une comparaison simple. La
  même personne ne tient pas deux fois la même fonction dans l’équipe sur la
  même période (contrainte d’exclusion `PersonPassage_no_overlap`) ; deux
  fonctions à la fois, si. Une personne absente du Répertoire se crée dans le
  Répertoire, dans un autre onglet ; « Changer de fonction » en un clic ;
  droits des équipes, sans `persons:view_journey` ni `persons:update_journey`.
- Une équipe, une fonction ou une fiche qui a des passages ne se supprime plus
  (`ON DELETE RESTRICT`) : l’équipe et la fonction le disent à la place du
  bouton (« rendez-la inactive »), la suppression d’une fiche est refusée
  avec « Cette fiche figure dans 2 passages d’un Roster ».
- Ordre prévu des onglets : Roster, Anciens membres, Tournois ↗,
  Entraînements, Finances ↗, Partenaires ↗, Informations ([feuille de route](../../propositions/feuille-de-route.md)).
- Livré le 9 novembre 2026 : l’onglet Parcours de la fiche personne, qui lit
  ces passages ([fiche](../personnes/repertoire/fiche-parcours.md)).
- Reportés : le statut « Dans la structure » calculé depuis les passages (une fois les
  membres actuels saisis), le manager qui lit le Roster de son équipe
  (étape 3), la date de fin de contrat lue dans les contrats (étape 7), le
  poste en jeu.

## Preuves et limites

Le 9 novembre 2026, Roster : `passages` (contrat du formulaire, fin à la fin de
sa période, Roster à une date, membres comptés une fois, libellés des périodes,
lignes du journal et nom masqué sans le droit) ; `passages-postgres`, base
`passages_service_test` : ajout tracé sur la fiche sans le nom, fin stockée au
dernier jour, membres du jour et passages comptés, même fonction sur la même
période refusée (409) mais deux fonctions acceptées, fonction d’un autre jeu,
fiche absente et fin avant le début refusées sans trace, correction sous
version, changement de fonction en deux passages et deux traces, suppression,
équipe, fonction et fiche protégées, droits (lecteur, recherche réservée à qui
gère), retour en arrière si la trace échoue, contraintes de la base ; 16 suites
et 282 tests SQL. Banc client à 1 440, 768, 390 et 320 px : Roster actuel,
anciens, tous ; ajout avec erreurs, recherche « cam », choix de la fonction ;
fin d’un passage ; changement de fonction ; suppression confirmée ;
Informations avec l’explication ; lecture seule ; nombre de passages dans les
fonctions ; aucun débordement, aucune erreur JavaScript.

Le 9 novembre 2026, menu déroulant de la personne : `passages-postgres` (sept
fiches « Essai » : six rendues et `more`) ; banc à 1 440 et 390 px : six
suggestions et « précisez la recherche », flèche puis Entrée choisit sans
envoyer le formulaire, aucune erreur JavaScript.

Le 9 novembre 2026, avatars : `passages-postgres` (la fiche rendue avec
pseudo, prénom et nom, d’où les initiales de repli) ; banc à 1 440, 768, 390
et 320 px : avatar sur chaque ligne du Roster (à côté du nom et de la période
sur téléphone), dans les suggestions, la fiche choisie et la fenêtre de
modification ; aucun débordement, aucune erreur JavaScript ; poids de la fiche
équipe inchangé (282 892 octets compressés, le Roster se charge à la demande).

Le 9 novembre 2026, périodes : `passages` (année dite une fois, « 1er → 5
novembre 2026 », borne à l’année et années différentes gardées entières,
période d’un seul mois) ; banc à 1 440, 768, 390 et 320 px avec la plus longue
période, « 28 septembre 2024 → 30 novembre 2025 » : une ligne à 1 440 px
(colonne de 272 px), deux lignes équilibrées à 768 px, flèche jamais en début
de ligne, aucune erreur JavaScript.

Le 9 novembre 2026, tableau et en-tête du Répertoire : `passages` (filtre
« À venir » et son badge, recherche par mot dans le nom ou la fonction, sans
accents) ; banc à 1 440, 768, 390 et 320 px : un tableau par bloc aux colonnes
alignées, lignes de 59 px, cartes sous 48 rem ; « À venir » ne montre que le
passage à venir, « coach » trouve les deux passages de Coach (« 2 passages
trouvés »), la réinitialisation rend les actuels ; ajout, fin, changement de
fonction, suppression et lecture seule rejoués ; aucun débordement, aucune
erreur JavaScript ; fiche équipe à 283 018 octets compressés.

Le 9 novembre 2026, Roster et anciens membres séparés, durée : `passages`
(Roster sans les passages terminés, actuels puis à venir ; archive par année
de fin, la plus récente d’abord ; personnes comptées une fois par onglet ;
durées « environ 3 ans », « 2 ans 8 mois », « 1 an 2 mois », « 3 jours »,
« moins d’un mois », rien avant le début) ; `passages-postgres` : `formerCount`
de la fiche (0, puis 1 après une fin passée), 16 suites et 282 tests SQL ;
banc à 1 440, 1 024, 768, 390 et 320 px : Roster « 4 membres · 1 à venir »,
onglets « Roster 4 » et « Anciens membres 4 », archive en trois années,
recherche « coach » (« 1 passage trouvé »), filtre Encadrement, fenêtre
« Ajouter un ancien membre » sans « En cours », colonne Durée à 1 024 et
1 440 px, cartes en dessous ; aucun débordement, aucune erreur JavaScript ;
fiche équipe à 283 495 octets compressés.

Le 8 novembre 2026 : lecture d’une équipe (avec son jeu, introuvable, refusée
sans `teams:view`), jeu inchangeable, brouillon et enregistrement, suppression,
lecture seule.

Limites : pas de bouton
« Historique » d’équipe (le journal filtre par type) ; E2E non rejoués.
