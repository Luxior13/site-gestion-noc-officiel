# Bureau & staff

[Index des pages](../README.md) · [Espace Structure](README.md) · [Design](../../design/README.md) · [Guide général](../../REFERENCE_GENERALE.md)

## Identité

| Élément | Valeur |
| --- | --- |
| Route | `/structure/bureau-staff` (Effectif), `?section=anciens` (Anciens membres) et `?section=fonctions` |
| Espace | Structure, section « Organisation » ; première page du pôle (9 novembre 2026) |
| Gabarit visé | [B. Fiche à sections](../../design/gabarits.md#b-fiche-à-sections) : la fiche de la structure elle-même, composée comme la [fiche équipe](../esport/equipe.md) |
| État d’harmonisation | Aligné à sa création — voir [Harmonisation](../../design/harmonisation.md#état-par-page) |
| Point d’entrée | [page.tsx](../../../apps/web/src/app/structure/bureau-staff/page.tsx) → [StaffPage](../../../apps/web/src/features/staff/components/StaffPage.tsx) → [RosterSection](../../../apps/web/src/features/passages/components/RosterSection.tsx), [FormerMembersSection](../../../apps/web/src/features/passages/components/FormerMembersSection.tsx) et [MemberFunctionsSection](../../../apps/web/src/features/member-functions/components/MemberFunctionsSection.tsx), partagés avec la fiche équipe et la fiche jeu |
| Contrôle d’accès | `staff:view` pour voir la page ; `staff:manage` pour ajouter, corriger, terminer ou supprimer un passage, chercher une fiche du Répertoire et gérer les fonctions ; droits propres, ni ceux des équipes ni ceux du Répertoire ; le lien vers la fiche d’une personne suit `persons:view`, celui de création d’une fiche `persons:create` ; l’API refait le contrôle dans la transaction ([permissions](../../domaines/permissions.md#page-bureau--staff)) |
| Chargement / erreur dédiés | `loading.tsx` (squelette de fiche) ; « Accès refusé » sans `staff:view` ; « Chargement impossible » avec « Réessayer » ; Effectif et Anciens membres : trois lignes squelettes, puis « L’Effectif ne peut pas être chargé » (« Les anciens membres ne peuvent pas être chargés ») ; titre d’onglet « Bureau & staff · Noctambule » |

## Rôle et tâches principales

Savoir qui fait vivre la structure hors des équipes, depuis 2014 : le bureau
élu (président, trésorier, secrétaire), dont on demande qui était responsable
à telle date (assemblée générale, banque, subventions), et le staff
(graphistes, monteurs, community managers, bénévoles). Décidée le 8 novembre
2026 (une équipe a son effectif, la structure le sien), construite le
9 novembre 2026 (« ok go » sur la proposition : droits propres, Bureau séparé
du Staff).

Où va chacun (question du 9 novembre 2026, « tous ce qui est graphiste,
monteur etc. vont où ? ») : selon pour qui il travaille. Pour toute la
structure, ici ; pour une seule équipe, dans son Roster, avec une fonction
d’encadrement de son jeu. Une même personne peut avoir les deux ; son
[Parcours](../personnes/repertoire/fiche-parcours.md) les lit ensemble.

## Composition actuelle

1. Fil d’Ariane « Structure › Bureau & staff ».
2. En-tête de fiche (`EntityDetailLayout`) : vignette au ton du pôle Structure
   (`StructureAvatar`, mallette), titre « Bureau & staff », phrase « Qui fait
   vivre la structure hors des équipes : le bureau élu, le staff et les
   bénévoles. », puis la barre d’onglets **Effectif** (personnes présentes
   aujourd’hui, chacune une fois), **Anciens membres** (personnes qui ont un
   passage terminé) et **Fonctions** (fonctions de la structure), avec leurs
   nombres lus par `GET /api/structure`, puis tenus à jour par l’onglet ouvert.
3. **Effectif** (`RosterSection`), comme le Roster d’une équipe : la bande
   « 2 membres · 1 à venir » et « Ajouter un membre » ; un tableau par bloc,
   **Bureau** puis **Staff**, aux colonnes Fonction, Statut, Début, Fin et
   Durée ; les actuels puis ceux à venir, dans l’ordre des fonctions ; cartes
   sous 56 rem. Sans fonction : « La structure n’a pas encore de fonctions
   (Président, Graphiste…). Les ajouter dans l’onglet Fonctions ». Vide :
   « Ajoutez le bureau et le staff, actuels ou passés, avec leurs dates : le
   registre se construit tout seul. »
4. **Anciens membres** (`FormerMembersSection`), comme ceux d’une équipe :
   recherche, réinitialisation, « Ajouter un ancien membre » ; filtre
   « Fonction » : Tous, Bureau, Staff ; un tableau par année de fin, la plus
   récente d’abord.
5. **Fonctions** (`MemberFunctionsSection`, liste de la structure) : carte
   « Fonctions », « Ce que fait chaque membre de la structure, hors des
   équipes. » ; blocs **Bureau** et **Staff**, chacun rangé par
   glisser-déposer ; fenêtre d’ajout et de modification (Nom, « Ex.
   Graphiste » ; Type : Bureau ou Staff, « Bureau : les mandats élus
   (président, trésorier, secrétaire…). Staff : graphiste, monteur, community
   manager, bénévole… » ; Active) ; liste vide : « Ajouter les fonctions
   courantes » (Président, Vice-président, Trésorier, Secrétaire, Graphiste,
   Monteur, Community manager, Bénévole).
6. **Fenêtre d’un passage** (`PassageDialog`) : celle du Roster, avec « Une
   personne dans la structure, avec une fonction, depuis une date. », les
   fonctions de la structure (Bureau puis Staff), « Membre ajouté à
   l’Effectif », « Recharger l’Effectif » ; le choix de la fonction est le
   menu des listes du site (`SearchSelect`) : titres « Bureau » et « Staff »,
   hauteur bornée qui défile, recherche en tête dès 8 fonctions (demande du
   9 novembre 2026 sur ce menu) ; même fonction déjà tenue :
   « Cette personne a déjà cette fonction dans la structure sur cette
   période. »

Un lecteur (`staff:view` seul) voit les trois onglets sans action ni poignée.

Données : passages sans équipe et fonctions sans jeu des tables
`PersonPassage` et `MemberFunction` ([données](../../systeme/donnees.md)) ;
`GET /api/structure`, `GET/POST /api/structure/effectif`,
`PATCH/DELETE /api/structure/effectif/[passageId]`,
`POST …/[passageId]/changement`, `GET/POST /api/structure/fonctions`,
`PATCH/DELETE /api/structure/fonctions/[functionId]`,
`POST /api/structure/fonctions/courantes`, `PUT /api/structure/fonctions/ordre`
([API](../../systeme/api.md)). Traces dans la même transaction, rangées sous
« Structure › Bureau & staff » : « Passage ajouté / modifié / supprimé » sur la
fiche de la personne, sujet « Passage : Trésorier, Bureau & staff », champs
Fonction, Début, Fin, jamais le nom de la personne ; « Fonction ajoutée /
modifiée / supprimée », sujet « Fonction : Trésorier (Bureau & staff) », champs
Nom, Type (Bureau, Staff), Active ; « Ordre des fonctions modifié », sujet
« Fonctions : Bureau (Bureau & staff) ».

## Décisions retenues

- 9 novembre 2026, « ok go » : deux types de fonctions de la structure,
  **Bureau** (mandats élus) et **Staff**, en deux blocs comme Joueurs et
  Encadrement, pour que le bureau ne se perde pas parmi les graphistes sur
  dix ans. La base refuse le type Bureau dans un jeu et le type Joueur dans la
  structure (`MemberFunction_kind_scope_check`).
- Même jour : droits propres `staff:view` et `staff:manage`, délégables, fournis
  aux Administrateurs ; un manager ne voit pas le bureau, gérer les équipes ne
  donne pas les mandats.
- « Effectif », jamais « Roster », pour la structure (8 novembre 2026) ;
  Anciens membres en onglet à part, comme une équipe (règle du 9 novembre 2026
  appliquée au même gabarit).
- Composants partagés avec la fiche équipe et la fiche jeu, sans copie : le
  lieu d’un passage (équipe ou structure) et la liste d’une fonction (jeu ou
  structure) sont des paramètres.

## Points ouverts

- Le statut « Dans la structure » sera calculé depuis les passages des équipes
  et de la structure, une fois les membres actuels saisis.
- Une passation du bureau (accès, comptes, dossiers) et les décisions
  d’assemblée qui élisent le bureau viendront avec leurs chantiers ; les
  mandats se lisent ici.

## Références

- [Registre historique](../../domaines/registre-historique.md),
  [fiche équipe](../esport/equipe.md), [fiche jeu](../esport/jeu.md),
  [Parcours](../personnes/repertoire/fiche-parcours.md),
  [cadrage des étapes 1 et 2](../../propositions/membres-equipes-parcours.md).

## Preuves et limites

Le 9 novembre 2026 : `member-functions` (types par liste : Bureau et Staff pour
la structure, Joueur et Encadrement pour un jeu ; mots des groupes ; ordre ;
fonctions courantes ; sujets du journal) ; `passages` (mots de l’Effectif,
sujet « Passage : Trésorier, Bureau & staff », sources du Parcours) ;
`staff-postgres`, base `staff_service_test` : fonction du bureau tracée sous
Bureau & staff, unique dans la structure seulement, Joueur refusé par l’API et
la base, Bureau refusé dans un jeu, fonction d’un jeu introuvable ici,
fonctions courantes une fois puis 409, ordre tracé, passage gardé à part des
équipes et tracé sans le nom, fonction d’un jeu refusée par le service et la
base, même fonction sur la même période refusée, correction sous version,
changement de fonction, suppression, fonction utilisée protégée, nombres des
onglets, droits propres (ni les équipes ni le Répertoire n’ouvrent la page,
lecture sans écriture, recherche de personnes), Parcours limité aux listes
visibles ; 17 suites et 292 tests SQL. Banc client à 1 440, 1 024, 768, 390
et 320 px : onglets « Effectif 3 », « Anciens membres 3 », « Fonctions 7 » ;
Effectif en blocs Bureau puis Staff (« 3 membres · 1 à venir », Pixel à
venir), cartes sous 56 rem ; fenêtre « Une personne dans la structure… »,
fonctions proposées Bureau puis Staff, l’inactive en dernier ; ajout
d’Orion, Secrétaire (« 4 membres · 1 à venir ») ; anciens membres par année
de fin (2023, 2022, 2018), filtres « Tous 3 », « Bureau 2 », « Staff 1 » ;
fonctions en deux blocs avec leurs passages, fenêtre au type Bureau ou Staff
et son aide ; lecture seule sans « Ajouter un membre » ni lien vers les
fiches ; « Accès refusé » sans `staff:view` ; aucun débordement, aucune
erreur JavaScript ; page à 260 241 octets compressés, fiche personne à
271 182.

Le 9 novembre 2026, menu des fonctions : `search-select` (groupes gardés,
recherche sans accents ni casse et par mots, seuil de 8, bouton nommé par son
libellé puis sa valeur) ; banc à 1 440 et 390 px : titres « Bureau » et
« Staff », 8 fonctions et la recherche qui prend le focus, menu de 274 px qui
défile, « secr » ne laisse que Secrétaire, « Aucune fonction trouvée », Entrée
choisit et ferme ; liste courte (« Nouvelle fonction », 7) sans recherche,
flèches et Entrée, focus rendu au champ ; jeu d’une nouvelle équipe au clavier ;
aucune erreur JavaScript ; page Jeux à 286 943 octets compressés.

Le 9 novembre 2026, molette et pied de la fenêtre : banc à 1 440 et 390 px,
la molette fait défiler le menu des fonctions jusqu’au bout (58 px et 138 px,
aucun avant la correction), un clic sur la dernière fonction la choisit, un
clic à côté ferme le menu et garde la fenêtre ; banc à 1 440, 768, 390 et
320 px : pied « Supprimer », « Annuler », « Enregistrer » sur une ligne (66 px
de haut à 1 440 px, empilé sur téléphone), « Changer de fonction » sous le
champ Fonction, mode changement avec « Retour » et « Changer de fonction » ;
aucune erreur JavaScript.

Limites : E2E non rejoués ; base de développement non migrée par moi.
