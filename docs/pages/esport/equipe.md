# Fiche équipe

[Index des pages](../README.md) · [Espace Esport](README.md) · [Jeux](jeux.md) · [Design](../../design/README.md) · [Guide général](../../REFERENCE_GENERALE.md)

## Identité

| Élément | Valeur |
| --- | --- |
| Route | `/esport/equipes/[id]` |
| Espace | Esport ; « Jeux » reste l’entrée courante de la navigation (`matchHrefs` de la fonctionnalité `games`) |
| Gabarit visé | [B. Fiche à sections](../../design/gabarits.md#b-fiche-à-sections), sans barre d’onglets tant qu’elle n’a qu’un contenu |
| État d’harmonisation | Aligné à sa création — voir [Harmonisation](../../design/harmonisation.md#état-par-page) |
| Point d’entrée | [page.tsx](../../../apps/web/src/app/esport/equipes/%5Bid%5D/page.tsx) → [TeamDetailPage](../../../apps/web/src/features/teams/components/TeamDetailPage.tsx) → [TeamInformationSection](../../../apps/web/src/features/teams/components/TeamInformationSection.tsx) |
| Contrôle d’accès | `teams:view` pour voir ; `teams:manage` pour modifier et supprimer ; l’API refait le contrôle dans la transaction ([permissions](../../domaines/permissions.md#page-jeux)) |
| Chargement / erreur dédiés | `loading.tsx` (squelette de fiche) ; « Équipe introuvable » ; « Chargement impossible » avec « Réessayer » ; « Accès refusé » avec retour aux jeux ; titre d’onglet « Fiche équipe · Jeux · Noctambule » |

## État courant — création du 8 novembre 2026

Demande du propriétaire : « lorsque je clique, je dois avoir une page équipe et
non juste un modal, donc une fiche, car on aura des onglets ». Le nom d’une
équipe, sur la page [Jeux](jeux.md), est un lien vers sa fiche, pour tout
lecteur des équipes ; une équipe ajoutée en fenêtre ouvre aussitôt sa fiche.

Composition, de haut en bas :

1. Fil d’Ariane « Esport › Jeux › Valorant › Noctambule Academy » : « Jeux »
   ramène à la liste, le nom du jeu ouvre sa [fiche](jeu.md).
2. En-tête de fiche (`EntityDetailLayout`) : écusson au ton du pôle Esport
   (`TeamAvatar`, en attendant le logo), nom, pastille « Active » ou
   « Inactive », ligne « Valorant · depuis septembre 2023 ». **Pas de barre
   d’onglets** : la fiche n’a qu’un contenu (« une page d’un seul contenu n’a
   pas d’onglet ») ; elle apparaîtra avec le Roster, premier onglet.
3. Section Informations (titre réservé aux lecteurs d’écran), modifiée sur
   place comme l’identité d’une personne : une carte « Équipe » avec Nom,
   Création (au jour, au mois ou à l’année) et Active. Le jeu n’y figure pas :
   fixé à la création, il est dans l’en-tête et ne change plus.
   La barre d’enregistrement commune apparaît dès qu’une valeur change ; une
   version dépassée demande d’actualiser en gardant la saisie ; quitter la page
   avec un brouillon demande confirmation.
4. Zone dangereuse (`EntityDangerZone`) pour qui a `teams:manage` : « Supprimer
   l’équipe », confirmation « Supprimer définitivement l’équipe … ? », retour
   à la page Jeux.

Un lecteur (`teams:view` seul) voit les mêmes cartes, champs désactivés, sans
zone dangereuse.

Données : `GET /api/equipes/[id]` rend l’équipe avec son jeu (nom, actif) ;
`PATCH` et la création rendent la même forme. Écritures tracées comme sur la
page Jeux (« Équipe modifiée », « Équipe supprimée »).

## Décisions courantes

- Une équipe s’ouvre sur sa fiche, jamais dans une fenêtre ; la fenêtre ne
  sert qu’à la créer (8 novembre 2026).
- Le jeu d’une équipe est fixé à sa création (« Le jeu ne doit pas être modifiable, je pense, une fois que l’équipe est créée, non ? », approuvé le
  8 novembre 2026) : un autre jeu, c’est une autre équipe, et le Roster
  utilisera les fonctions de ce jeu. L’API refuse un jeu dans une modification
  (400) et la base refuse de le changer (déclencheur `Team_gameId_immutable`,
  migration `20261108200000_team_game_immutable`). Une erreur de jeu se répare
  en supprimant l’équipe tant que rien n’y est rattaché.
- La création reste en fenêtre, même à long terme (8 novembre 2026, « ok pour
  moi ») : de tout ce qu’une équipe portera, seuls le jeu, le nom, la création et
  l’état se demandent à la création. Anciens noms : automatiques ; joueurs,
  coach et manager : Roster ; budget : Finances ↗ ; partenaires : Partenaires ↗ ;
  logo, publication sur noctambule.gg : Informations, après coup. Plausibles
  sans être prévus : un tag d’équipe pour les inscriptions en tournoi, des
  réseaux sociaux (facultatifs, Informations), un rattachement daté à une
  entité juridique si la structure devient société.
- Pas d’onglet seul : la barre d’onglets apparaît avec le Roster ; ordre prévu
  Roster, Tournois ↗, Entraînements, Finances ↗, Partenaires ↗, Informations
  ([feuille de route](../../propositions/feuille-de-route.md)).
- La suppression vit dans la fiche ; une équipe qui aura des joueurs ne se
  supprimera plus (base en `ON DELETE RESTRICT`) et la zone dangereuse devra
  alors dire « rendez-la inactive » au lieu de proposer la suppression.

## Preuves et limites

Le 8 novembre 2026 : lint, types, suite web, 14 suites SQL et 253 tests (dont
la lecture d’une équipe : avec son jeu, introuvable, refusée sans
`teams:view` ; le jeu inchangeable par l’API et par la base) ; banc client (composant réel, session et API simulées) à 1 440,
768, 390 et 320 px : clic sur une équipe vers `/esport/equipes/…`, ajout puis
ouverture de la fiche, fiche, brouillon et barre d’enregistrement, changement de
nom et d’état enregistré, confirmation de suppression, lecture seule,
introuvable, accès refusé ; aucun débordement, aucune erreur JavaScript.

Limites : pas de bouton « Historique » (le journal ne filtre pas encore par
équipe, seulement par type « Équipes ») ; la notification « Équipe mise à
jour » et le vrai fil d’Ariane ne sont pas rendus par le banc ; E2E non
rejoués.
