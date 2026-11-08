# Fiche jeu

[Index des pages](../README.md) · [Espace Esport](README.md) · [Jeux](jeux.md) · [Design](../../design/README.md) · [Guide général](../../REFERENCE_GENERALE.md)

## Identité

| Élément | Valeur |
| --- | --- |
| Route | `/esport/jeux/[id]` |
| Espace | Esport ; « Jeux » reste l’entrée courante de la navigation (préfixe `/esport/jeux`) |
| Gabarit visé | [B. Fiche à sections](../../design/gabarits.md#b-fiche-à-sections), sans barre d’onglets tant qu’elle n’a qu’un contenu |
| État d’harmonisation | Aligné à sa création — voir [Harmonisation](../../design/harmonisation.md#état-par-page) |
| Point d’entrée | [page.tsx](../../../apps/web/src/app/esport/jeux/%5Bid%5D/page.tsx) → [GameDetailPage](../../../apps/web/src/features/games/components/GameDetailPage.tsx) → [GameInformationSection](../../../apps/web/src/features/games/components/GameInformationSection.tsx) |
| Contrôle d’accès | `games:view` pour voir ; `games:manage` pour modifier et supprimer ; le nombre d’équipes s’affiche avec `teams:view` ; l’API refait le contrôle dans la transaction ([permissions](../../domaines/permissions.md#page-jeux)) |
| Chargement / erreur dédiés | `loading.tsx` (squelette de fiche) ; « Jeu introuvable » ; « Chargement impossible » avec « Réessayer » ; « Accès refusé » avec retour aux jeux ; titre d’onglet « Fiche jeu · Jeux · Noctambule » |

## État courant — création du 8 novembre 2026

Question du propriétaire : « quand je clique sur un jeu, j’ouvre un modal ;
penses-tu que ça doit rester comme ça ou faire une page ? », puis « ok go » sur
la recommandation : un jeu aura des onglets (Fonctions, Finances ↗), il s’ouvre
donc sur sa fiche, comme une équipe. Le nom d’un jeu, sur la page
[Jeux](jeux.md), est un lien vers sa fiche, pour tout lecteur ; un jeu ajouté en
fenêtre ouvre aussitôt sa fiche.

Composition, de haut en bas :

1. Fil d’Ariane « Esport › Jeux › Valorant ». Sur une [fiche équipe](equipe.md),
   le nom du jeu y devient un lien vers cette fiche.
2. En-tête de fiche (`EntityDetailLayout`, sans `sections`) : manette au ton du
   pôle (`GameAvatar`, en attendant l’image du jeu), nom, pastille « Actif » ou
   « Inactif », ligne « VAL · depuis le 15 mars 2021 · 3 équipes » (le nombre
   d’équipes pour qui les voit). Pas de barre d’onglets : elle apparaîtra avec
   l’onglet Fonctions, à l’étape Roster.
3. Section Informations (titre réservé aux lecteurs d’écran), modifiée sur place
   comme celle d’une équipe : carte « Jeu » avec Nom (aide « Renommer sert à
   corriger une faute ; un nouveau jeu (CS2 après CS:GO) s’ajoute à part. »),
   Nom court, Première ouverture (au jour, au mois ou à l’année) et Actif
   (« Un jeu inactif reste dans l’historique et reçoit encore des équipes. »).
   Barre d’enregistrement commune dès qu’une valeur change ; version dépassée :
   actualiser en gardant la saisie ; quitter avec un brouillon : confirmation.
4. Zone dangereuse (`EntityDangerZone`) pour qui a `games:manage` : « Supprimer
   le jeu » avec sa confirmation quand le jeu n’a pas d’équipe ; sinon, à la
   place du bouton, « Ce jeu a 3 équipes : rendez-le inactif plutôt que de le
   supprimer. » (`unavailableReason`). Le service et la base refusent de toute
   façon.

Un lecteur (`games:view` seul) voit la même carte, champs désactivés, sans
zone dangereuse.

Données : `GET /api/jeux/[id]` rend le jeu avec son nombre d’équipes ;
écritures tracées comme sur la page Jeux (« Jeu modifié », « Jeu supprimé »).

## Décisions courantes

- Un jeu s’ouvre sur sa fiche, jamais dans une fenêtre ; la fenêtre ne sert qu’à
  le créer (8 novembre 2026, règle « élément qui aura des onglets »).
- Onglets prévus, dans l’ordre : Fonctions, Finances ↗, puis Informations, comme
  la fiche équipe garde ses informations en dernier
  ([feuille de route](../../propositions/feuille-de-route.md)).
- L’ancienne fenêtre « Modifier le jeu » est retirée : la modification et la
  suppression vivent dans la fiche.

## Preuves et limites

Le 8 novembre 2026 : lint, types, suite web, 14 suites SQL et 254 tests (dont la
lecture d’un jeu : avec son nombre d’équipes, introuvable, refusée sans
`games:view`) ; banc client (composant réel, session et API simulées) à 1 440,
768, 390 et 320 px : clic sur un jeu vers `/esport/jeux/…`, ajout d’un jeu puis
ouverture de sa fiche, fiche avec équipes (suppression remplacée par
l’explication), fiche sans équipe (confirmation de suppression), brouillon et
enregistrement du nom court, lecture seule, introuvable ; aucun débordement,
aucune erreur JavaScript.

Limites : pas de bouton « Historique » (le journal filtre par type « Jeux », pas
encore par jeu) ; E2E non rejoués.
