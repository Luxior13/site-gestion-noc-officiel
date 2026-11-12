# Fiche tournoi

[Index des pages](../README.md) · [Espace Esport](README.md) · [Tournois](tournois.md) · [Design](../../design/README.md) · [Guide général](../../REFERENCE_GENERALE.md)

## Identité

| Élément | Valeur |
| --- | --- |
| Route | `/esport/tournois/[id]` (Informations), `?section=participants` et `?section=finances` |
| Espace | Esport ; « Tournois » reste l’entrée courante de la navigation |
| Gabarit visé | [B. Fiche à sections](../../design/gabarits.md#b-fiche-à-sections) : Informations modifiées sur place, Participants en cartes, Finances ↗ en lecture ([onglet en lecture](../../design/gabarits.md#onglets-dune-fiche)) |
| État d’harmonisation | Aligné — voir [Harmonisation](../../design/harmonisation.md#état-par-page) |
| Point d’entrée | [page.tsx](../../../apps/web/src/app/esport/tournois/%5Bid%5D/page.tsx) → [TournamentDetailPage](../../../apps/web/src/features/tournaments/components/TournamentDetailPage.tsx) → [TournamentInformationSection](../../../apps/web/src/features/tournaments/components/TournamentInformationSection.tsx), [TournamentParticipantsSection](../../../apps/web/src/features/tournaments/components/TournamentParticipantsSection.tsx) et [TournamentEntryDialog](../../../apps/web/src/features/tournaments/components/TournamentEntryDialog.tsx), [FinancesTab](../../../apps/web/src/features/operations/components/FinancesTab.tsx) |
| Contrôle d’accès | `tournaments:view` pour lire ; `tournaments:manage` pour modifier, supprimer, engager une équipe et tenir son line-up ; hors de la [portée Esport](../../domaines/permissions.md#portée-esport) du compte, « introuvable » ; Finances ↗ avec `operations:view` ; le nom d’une fiche du line-up est un lien avec `persons:view`, celui d’une équipe avec `teams:view`, celui de l’organisateur avec `organizations:view` ([permissions](../../domaines/permissions.md#tournois)) |
| Chargement / erreur dédiés | `loading.tsx` (squelette de fiche) ; « Tournoi introuvable » ; « Chargement impossible » avec « Réessayer » ; « Accès refusé » avec retour aux tournois ; titre d’onglet « Fiche tournoi · Tournois · Noctambule » |

## Composition actuelle

Livrée le 11 novembre 2026 (« ok go » sur le lot 1 et ses trois choix) :

1. Fil d’Ariane « Esport › Tournois › Lyon e-Sport 2027 ».
2. En-tête (`EntityDetailLayout`) : coupe au ton du pôle (`TournamentAvatar`),
   nom, pastille d’état calculé, ligne « Valorant · 15 → 17 mars 2027 · LAN,
   Lyon » (« Date à fixer » sans date), puis les onglets **Informations**, **Participants** (avec le
   nombre d’équipes engagées) et **Finances ↗** (avec le nombre
   d’opérations, pour qui lit les opérations).
3. **Informations** (`TournamentInformationSection`), modifiées sur place,
   barre d’enregistrement commune, seulement ce qui aide à préparer le
   tournoi (12 novembre 2026), en deux cartes :
   - « Tournoi » : Nom, Édition (facultative : « Saison 2 », « Split 1 »,
     « 2027 », ce qui distingue deux tournois du même nom), Organisateur (sur
     toute la largeur ; on tape son nom : les organisations de type
     Organisateur trouvées, l’actuel toujours proposé, puis, pour qui gère
     les organisations, « Ajouter « X » aux organisateurs », qui crée sa
     fiche ou ajoute ce type à l’organisation de ce nom, sans quitter la
     page, « X ajouté aux organisations » dit dessous ; « Ouvrir sa fiche »
     pour qui voit les organisations), Format (En ligne ou LAN), Lieu (seulement
     pour une LAN), Premier jour ou Mois (facultatif : le sélecteur du site,
     au jour ou au mois ; vide, « Date à fixer »), Dernier jour (facultatif,
     seulement avec un premier jour précis) ;
   - « Préparation » : Fin des inscriptions (« pour ne pas la rater »), Frais
     d’inscription (en euros par équipe, 0 si gratuit), Lien du tournoi (sa
     page d’inscription, de règlement ou de bracket, start.gg, Toornament… ;
     lu comme on le dit, « Ouvrir la page » dans un nouvel onglet).
   Le jeu, fixé à la création, est dans l’en-tête. Quand des opérations
   nomment le tournoi, ou qu’il est annulé, une ligne **« Annuler le
   tournoi »** (`TournamentCancelAction`) : confirmation « Annuler le tournoi
   … ? » (« Il reste dans la liste et l’historique, marqué « Annulé »… Vous
   pourrez le rétablir. »), puis « Tournoi annulé » et « Rétablir le
   tournoi ». Zone dangereuse pour qui gère : un tournoi ajouté par erreur se
   supprime avec ses équipes engagées ; avec des opérations, à la place du
   bouton, « Ce tournoi a 2 opérations : il reste… Annulez-le plutôt que de
   le supprimer. ».
4. **Participants** (`TournamentParticipantsSection`) : « 2 équipes
   engagées » et « Engager une équipe » ; une carte par équipe (titre lien
   vers sa fiche, pastille du classement « 3e–4e » ou « Classement à venir »,
   « Modifier ») ; dessous, le line-up : avatar, nom (lien vers la fiche pour
   qui lit le Répertoire), et à droite la fonction tenue dans le Roster de
   l’équipe aux dates du tournoi, ou « Hors Roster » pour un remplaçant
   ponctuel. Vide : « Aucune équipe engagée » avec « Engager une équipe ».
5. **Fenêtre d’une équipe engagée** (`TournamentEntryDialog`) : Équipe (les
   équipes du jeu pas encore engagées, à l’engagement seulement), **Line-up**
   (les membres du Roster aux dates du tournoi, cases à cocher par blocs
   Joueurs, Encadrement, Remplaçants ponctuels ; les joueurs cochés d’office
   à l’engagement), « Ajouter un remplaçant ponctuel » (recherche d’une fiche
   du Répertoire, comme pour un Roster), **Classement final** : Place et « à
   la place » (« 3 à 4 pour 3e–4e, 5 à 8 pour un Top 8 ; vide tant que le
   tournoi n’est pas fini »). « Retirer l’équipe » à gauche, confirmé à part.
   Version dépassée : le message et « Actualiser le tournoi ».
6. **Finances ↗** (`FinancesTab`) : les opérations qui nomment le tournoi,
   avec « Entrées · Sorties · Résultat », en lecture, comme les fiches jeu et
   équipe.

Données : tables `Tournament`, `TournamentEntry`, `TournamentLineupMember`,
colonne `FinancialOperation.tournamentId` ([données](../../systeme/donnees.md)) ;
`GET/POST /api/tournois`, `GET/PATCH/DELETE /api/tournois/[id]`,
`POST /api/tournois/[id]/participants`,
`PATCH/DELETE /api/tournois/[id]/participants/[entryId]`,
`GET /api/tournois/[id]/candidats`, `GET /api/tournois/choix`,
`GET /api/tournois/personnes` ([API](../../systeme/api.md)).

## Traces dans le journal

Type « Tournois ». « Tournoi ajouté / modifié / supprimé », sujet « Tournoi :
Lyon e-Sport · Saison 2 (Valorant) », champs Nom, Édition, Jeu,
Organisateur, Format, Lieu, Dates (« Date à fixer », « mai 2027 », « 15 → 17
mars 2027 »), Lien du tournoi, Frais d’inscription, Fin des inscriptions,
Annulé. « Équipe engagée »,
« Participation modifiée », « Équipe retirée d’un tournoi », sujet
« Participation : Noctambule Valorant, Lyon e-Sport 2027 », champs Équipe,
Line-up (les noms, masqués à qui ne lit ni les tournois ni le Répertoire),
Classement. Tout dans la transaction de l’écriture. Un organisateur ajouté
depuis le champ se lit sous le type « Organisations » : « Organisation
ajoutée » (Nom, Types) ou « Organisation modifiée » (Types : « Sponsor » →
« Sponsor, Organisateur »).

## Décisions retenues

- 11 novembre 2026, « ok go » sur trois choix :
  - **classement en fourchette** : une place, ou une place partagée
    (« 3e–4e », « 5e–8e » pour un Top 8), deux nombres en base ;
  - **line-up pris dans le Roster** aux dates du tournoi (un passage commencé
    avant la fin et pas fini avant le début), plus un **remplaçant ponctuel**
    choisi dans le Répertoire, marqué « Hors Roster » ; la fonction affichée
    se lit dans le Roster, jamais recopiée ;
  - **« Annulé »** plutôt qu’un état de plus : l’état reste calculé
    depuis les dates.
- 12 novembre 2026 (« le but est de mettre le moins d’informations… le
  reste pour le staff », puis « ok go sans la note ») : un tournoi ne garde
  que ce qui aide à le préparer avant de l’annoncer, le site public gardant
  le reste. Seuls le nom et le jeu sont demandés ; les dates deviennent
  facultatives, au jour ou au mois (« mars 2027 », gardé au premier du mois),
  et sans date le tournoi est « Date à fixer », en tête de liste ; le circuit,
  le dépôt du roster et le check-in sont retirés ; « Annulé » quitte les
  champs pour une action « Annuler le tournoi », proposée seulement quand le
  tournoi ne se supprime plus (des opérations le nomment). Sans date, le
  line-up se choisit dans le Roster du jour ; au mois, dans celui du mois.
  La note interne du staff est à discuter.
- 12 novembre 2026 (« il faut bien les reconnaître », « deux tournois peuvent
  avoir le même nom, saison 1 et saison 2 », puis « ok go ») : une **Édition**
  facultative distingue deux tournois du même nom ; dans un même jeu, le nom
  et l’édition ne se répètent jamais (casse et accents ignorés, index unique
  `Tournament_gameId_normalizedName_normalizedEdition_key`) : un deuxième
  « Lyon e-Sport » sans édition est refusé avec « précisez l’édition (Saison 2,
  Split 1, 2027…) ». Le tournoi se nomme partout « Lyon e-Sport · Saison 2 »
  (liste, fiche, menu des opérations, historique d’une équipe, Parcours,
  journal). Le même nom permettra de retrouver les éditions d’un tournoi.
  « Édition » plutôt que « Saison », qui se confondrait avec la saison de la
  structure. L’année se lit dans les dates : le filtre reste par année
  civile. Le même jour, un seul **Lien du tournoi** (inscription, règlement,
  bracket) remplace le lien des règles.
- 12 novembre 2026 (« au lieu d’aller à chaque fois sur la page des
  relations, un champ où je peux écrire ; si la fiche existe elle est
  proposée, sinon […] créer la fiche avec le type organisateur ») :
  l’**Organisateur se tape** ; un nom absent des organisateurs propose
  « Ajouter « X » aux organisateurs ». L’organisation de ce nom (casse et
  accents ignorés) reçoit le type Organisateur, sinon elle est créée de ce
  type, dans sa propre transaction et tracée
  (`POST /api/relations/organisations/organisateurs`) ; le tournoi, lui,
  s’enregistre comme d’habitude. Proposé seulement à qui gère aussi les
  organisations : lui seul pourrait corriger une faute de frappe dans la
  fiche ajoutée ; un manager des tournois choisit parmi les organisateurs
  existants (question PREF-Q13).
- Ordre des onglets : ce qu’est le tournoi (Informations), puis nos équipes,
  puis son argent ; Gains et Suivi s’ajouteront (lot 2).
- Le jeu d’un tournoi est fixé à sa création, comme celui d’une équipe
  (`Tournament_gameId_immutable`) ; une équipe engagée est une équipe de ce
  jeu (`TournamentEntry_team_check`), une fois par tournoi.
- Ce qu’un tournoi nomme reste : une fiche d’un line-up, une équipe engagée,
  un jeu, un organisateur ne se suppriment plus (`ON DELETE RESTRICT`, et le
  service le dit) ; un tournoi qui a des opérations reste aussi.
- Portée Esport : un compte qui ne voit que des équipes choisies voit les
  tournois où l’une d’elles est engagée, et seulement ces équipes ; il ne
  supprime un tournoi que si toutes ses équipes engagées sont les siennes.
- Une opération peut nommer un tournoi, du jeu de son équipe ou de son jeu
  (`FinancialOperation_tournament_check`).

## Points ouverts

- Lot 2 : onglet Gains (annoncé, confirmé, répartition) et onglet Suivi
  (problèmes et bans), puis le refus d’inscrire une personne sanctionnée.
- Le déplacement lié à une LAN, le règlement en pièce jointe et la fin des
  inscriptions au calendrier viendront avec leurs modules.
- Une note interne pour le staff (logistique, contact, rappels) : proposée
  le 12 novembre 2026, à discuter (« on en parle après »).
- Pas de bouton « Historique » (le journal filtre par type « Tournois »).

## Vérifications et prochaine reprise

11 novembre 2026 : `tournaments` (schémas : dates, lieu d’une LAN,
échéances, lien des règles, frais, fourchette, line-up sans doublon ;
libellés : « 1er », « 3e–4e », état calculé, « Gratuit » ; droits ; journal
et line-up masqué) ; `tournaments-postgres`, base `tournaments_test` :
création avec l’équipe engagée, Roster aux dates (le parti avant exclu),
remplaçant ponctuel, fourchette, version dépassée 409, informations
modifiées et lien lu, équipe déjà engagée 409, équipe d’un autre jeu 400,
listes d’une équipe et d’une fiche (cette dernière refusée sans le
Répertoire), journal dans l’ordre ; refus de la base (jeu figé, équipe d’un
autre jeu, lieu hors LAN, fourchette inversée, fiche, équipe, jeu et
organisateur gardés), opération d’un tournoi d’un autre jeu refusée par le
service et la base, suppression refusée avec opération puis permise avec
ses équipes ; portée d’équipes (liste et équipes filtrées, 404 hors portée,
équipe obligatoire à la création, suppression refusée avec une autre
équipe), refus sans `tournaments:view`. Captures réelles à 1 440 et 390 px.

12 novembre 2026, moins de champs : `tournaments` (création sans date, mois
gardé au premier jour, dernier jour refusé sans premier jour précis ou avec
un mois, fin des inscriptions jusqu’à la fin du mois, libellés « Date à
fixer » et « mars 2027 », état « à fixer » et « à venir » jusqu’à la fin du
mois) ; `tournaments-postgres` : tournoi sans date en tête de liste, line-up
lu dans le Roster du jour, passage au mois tracé (« Date à fixer » → « mai
2027 »), refus de la base d’un mois avec un dernier jour
(`Tournament_dates_check`) ; 23 suites et 333 tests SQL. Captures réelles à
1 440 et 390 px.

12 novembre 2026, édition et lien : `tournaments` (titre « Lyon e-Sport ·
Saison 2 ») ; `tournaments-postgres` : même nom refusé sans édition (casse et
accents ignorés, détail sur le champ Édition), accepté avec « Saison 2 »,
même édition refusée, même nom accepté dans un autre jeu, renommage vers un
couple pris refusé, journal « Tournoi ajouté : Lyon e-Sport · Saison 2
(Valorant) » ; 23 suites et 334 tests SQL ; E2E rejoués. Captures réelles
à 1 440 et 390 px (liste avec Saison 1 et Saison 2, fiche, fenêtre) ; le
message de doublon dans la fenêtre n’a pas été capturé, il est vérifié par
la suite SQL.

12 novembre 2026, organisateur tapé : `tournaments` (seul qui gère aussi les
organisations ajoute un organisateur) ; `organizations-postgres` : nom
nouveau créé de type Organisateur (201), même nom sans casse repris sans
trace, sponsor du même nom qui gagne le type (« Sponsor, Organisateur »,
version 2, journal des Types), nom vide refusé, 403 sans
`organizations:manage` ; 23 suites et 335 tests SQL ; E2E rejoués. Captures
réelles à 1 440 et 390 px : nom tapé dans la fenêtre, ligne « Ajouter
« Gamers Assembly » aux organisateurs » prise à Entrée, message dessous,
tournoi créé avec son organisateur ; lettre tapée sur le champ fermé ; sur la
fiche, « ldlc » qui donne le type au sponsor LDLC, barre d’enregistrement
ouverte ; journal des organisations.

## Historique

- 11 novembre 2026 : création de la fiche (lot 1 des tournois).
- 12 novembre 2026 : moins de champs, dates facultatives, « Annuler le
  tournoi » en action ; puis l’Édition et le Lien du tournoi ; puis
  l’Organisateur tapé, ajouté sans quitter le tournoi.
