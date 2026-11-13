# Tournois

[Index des pages](../README.md) · [Espace Esport](README.md) · [Fiche tournoi](tournoi.md) · [Design](../../design/README.md) · [Guide général](../../REFERENCE_GENERALE.md)

## Identité

| Élément | Valeur |
| --- | --- |
| Route | `/esport/tournois` |
| Espace | Esport, section « Compétition », après Jeux |
| Gabarit visé | [A. Liste de gestion](../../design/gabarits.md#a-liste-de-gestion) : recherche, menu Année, filtres rapides « État » et « Jeu » avec leurs nombres, sans pagination (quelques centaines de tournois au fil des années, filtrés dans la page) |
| État d’harmonisation | Aligné — voir [Harmonisation](../../design/harmonisation.md#état-par-page) |
| Point d’entrée | [page.tsx](../../../apps/web/src/app/esport/tournois/page.tsx) → [TournamentsPage](../../../apps/web/src/features/tournaments/components/TournamentsPage.tsx), [TournamentDialog](../../../apps/web/src/features/tournaments/components/TournamentDialog.tsx) |
| Contrôle d’accès | `tournaments:view` pour la liste ; `tournaments:manage` pour « Ajouter un tournoi » ; la [portée Esport](../../domaines/permissions.md#portée-esport) du compte dit lesquels ; l’API refait le contrôle dans la transaction ([permissions](../../domaines/permissions.md#tournois)) |
| Chargement / erreur dédiés | `loading.tsx` ; squelette de liste ; « Chargement impossible » avec « Réessayer » ; « Accès refusé » ; titre d’onglet « Tournois · Noctambule » |

## Rôle et tâches principales

Le bureau et les managers y retrouvent chaque tournoi de la structure, à venir
ou passé, avec nos équipes engagées et leur classement, et en ajoutent un.
Demandé le 11 novembre 2026 (« je voudrais ajouter les tournois », puis
« ok go » sur le lot 1 et les trois choix proposés).

## Composition actuelle

Livrée le 11 novembre 2026 :

1. Bandeau : « Tournois », la phrase « Les tournois de la structure, le plus
   récent en premier : nos équipes engagées et leur classement. », et
   « Ajouter un tournoi » pour qui gère.
2. Barre de la liste : recherche (nom, organisateur, lieu ou équipe),
   réinitialisation, menu « Toutes les années » ; filtres rapides **État**
   (Tous, Date à fixer, À venir, En cours, Terminés, Annulés) et **Jeu** (dès
   deux jeux), chacun avec son nombre, puis « 12 tournois ». L’état se
   calcule depuis les dates (« Date à fixer » sans date, « À venir » jusqu’à
   la fin d’un mois connu seul), ou « Annulé » ; les tournois sans date
   viennent en tête.
3. Tableau : Dates sur deux lignes, au rythme de la cellule Tournoi
   (`TournamentDates`, 13 novembre 2026) : les jours, mois abrégés, « 29 oct.
   → 6 nov. », « 15 → 17 mars », puis en discret l’année et la durée,
   « 2026 · 9 jours », « 2026 → 2027 · 7 jours » ; au mois, « Septembre » et
   « 2027 · jours à fixer » ; sans date, « Date à fixer » seul, en discret.
   Tournoi (coupe au ton du pôle,
   nom et édition, « Lyon e-Sport · Saison 2 », qui ouvrent la fiche, toute
   la ligne étant la cible, et dessous
   « Lyon e-Sport · LAN, Lyon »), Jeu, Nos équipes (une ligne par équipe
   engagée, « Noctambule Valorant · 3e–4e », deux au plus : les mieux
   classées d’abord, puis « +1 » ou « +2 » en discret, « et 1 autre équipe »
   pour un lecteur d’écran ; `listedEntries`, 13 novembre 2026), État (pastille Date à fixer en
   gris, À venir en bleu, En cours en vert, Terminé en gris, Annulé en
   orange). Un
   compte qui ne voit que des équipes choisies ne voit que les siennes.
4. Sous 56 rem, les cartes du Répertoire : nom, puis jeu et lieu
   (« Valorant · En ligne »), les dates sur une ligne à elles, mois abrégés
   (« 29 oct. → 6 nov. 2026 », l’année jamais seule à la ligne), équipes,
   état.
5. Vide : « Aucun tournoi pour l’instant » ; filtré : « Aucun tournoi
   trouvé » avec « Réinitialiser ».
6. Fenêtre « Ajouter un tournoi » (`TournamentDialog`), « Seuls le nom et
   le jeu sont demandés » (12 novembre 2026) : Nom et Édition (facultative,
   « Saison 2 », côte à côte ; un nom déjà pris dans le jeu demande une
   édition), Jeu (un seul jeu se
   choisit seul), Équipe engagée (facultative, obligatoire pour un compte qui
   ne voit que ses équipes, avec l’aide qui le dit), Premier jour ou Mois
   (facultatif, « Date à fixer »), Dernier jour (facultatif, avec un premier
   jour précis), Organisateur (on tape son nom ; pour qui gère les
   organisations, un organisateur absent s’y ajoute par « Ajouter « X » aux
   organisateurs », avec l’aide « Facultatif : tapez son nom ; un
   organisateur absent s’ajoute aux organisations. »). La fiche s’ouvre
   ensuite pour le reste.

## Traces dans le journal

« Tournoi ajouté », sujet « Tournoi : Lyon e-Sport 2027 (Valorant) », champs
Nom, Jeu, Organisateur, Dates ; avec une équipe choisie, « Équipe engagée »
dans la même transaction. Type « Tournois » du journal.

## Décisions retenues

- 11 novembre 2026 (« ok go ») : la liste suit le registre du 8 novembre
  (filtres par état, jeu et année ; l’équipe par la recherche et par l’onglet
  Tournois ↗ de sa fiche) ; un manager crée les tournois de son équipe,
  l’équipe engagée étant demandée à la création pour qu’il les voie.
- Création en fenêtre : ce sans quoi le tournoi n’existe pas (nom et jeu,
  12 novembre 2026 : les dates deviennent facultatives) et ce qu’on connaît
  déjà, le reste dans la fiche
  ([règle du 8 novembre 2026](../../design/preferences.md)).
- 13 novembre 2026 (« parfait », puis « améliorer le rendu de la colonne
  dates ») : « 29 octobre → 6 novembre 2026 » laissait l’année seule sur
  une deuxième ligne. La colonne passe sur deux lignes voulues, les jours
  puis l’année et la durée en discret ; les cartes du téléphone gardent une
  ligne, mois abrégés, et le jeu rejoint le lieu. Même rendu dans l’onglet
  Tournois ↗ d’une équipe et le Parcours (`TournamentHistory`).
- 13 novembre 2026 (« chaque équipe en plus fait augmenter la hauteur »,
  puis « ok go ») : deux équipes au plus par ligne, les mieux classées
  d’abord, les autres comptées « +1 » ; toutes les lignes gardent la hauteur
  des deux lignes de Dates et Tournoi. La liste complète reste dans
  Participants, et la recherche trouve un tournoi par toutes ses équipes.
  Écarté : une seule ligne « 3 équipes · meilleur 4e–6e », qui cache
  quelles équipes ont joué.

## Points ouverts

- Les gains et le Suivi (problèmes, bans) arrivent avec le lot 2 ; les
  échéances au calendrier du bureau, avec lui.

## Vérifications et prochaine reprise

11 novembre 2026 : suites `tournaments` et `tournaments-postgres` (voir la
[fiche tournoi](tournoi.md#vérifications-et-prochaine-reprise)) ; captures
réelles relues à 1 440 et 390 px ; E2E rejoués, `/esport/tournois` ajoutée à
la vérification mobile (`e2e/mobile-layout.checks.ts`). Reprise avec les gains.

13 novembre 2026, colonne Dates : `tournaments` (`tournamentDatesCell` et
`tournamentDatesShortLabel` : deux mois, même mois, deux années, un seul
jour, au mois, sans date) ; captures réelles relues de la liste à 1 440,
1 024 et 390 px, de l’onglet Tournois d’une équipe à 1 440 et 390 px et du
Parcours à 1 440 px, sans débordement ; E2E non rejoués. Puis Nos équipes :
`listedEntries` (ordre par classement, « +2 ») ; banc réel avec des tournois
à 0, 1, 2, 3 et 4 équipes, hauteurs des lignes mesurées égales (58,5 à
59 px), captures à 1 440 et 390 px relues.

## Historique

- 11 novembre 2026 : création de la page.
- 12 novembre 2026 : l’Organisateur se tape et s’ajoute depuis la fenêtre.
- 13 novembre 2026 : colonne Dates sur deux lignes, cartes en mois abrégés ;
  Nos équipes limitée à deux équipes et « +N ».
