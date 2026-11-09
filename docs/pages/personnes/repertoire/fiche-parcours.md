# Personne — Parcours

[Index des pages](../../README.md) · [Répertoire](README.md) · [Design](../../../design/README.md) · [Guide général](../../../REFERENCE_GENERALE.md)

## Identité

| Élément | Valeur |
| --- | --- |
| Route | `/personnes/repertoire/[id]` |
| Section | `?section=parcours` |
| Espace | Personnes |
| Gabarit visé | [B. Fiche à sections](../../../design/gabarits.md#b-fiche-à-sections), [onglet en lecture](../../../design/gabarits.md#onglets-dune-fiche) |
| État d’harmonisation | Aligné à sa création le 9 novembre 2026 — voir [Harmonisation](../../../design/harmonisation.md#état-par-page) |
| Point d’entrée | [PersonDetailPage](../../../../apps/web/src/features/persons/components/PersonDetailPage.tsx) → [PersonJourneySection](../../../../apps/web/src/features/passages/components/PersonJourneySection.tsx), sur `GET /api/personnes/[id]/parcours` ([service](../../../../apps/web/src/features/passages/server/person-journey.service.ts)) |
| Contrôle d’accès | `persons:view` (la fiche) et `teams:view` (les Rosters d’où il se lit) : sans `teams:view`, l’onglet n’apparaît pas et l’API répond 403 ; aucun droit propre au parcours ([permissions](../../../domaines/permissions.md#page-répertoire)) |
| Chargement / erreur dédiés | section chargée à la demande ; trois lignes squelettes, puis « Le parcours ne peut pas être chargé » avec « Réessayer » ; fiche absente : 404 |

## Rôle et tâches principales

Voir tout ce qu’une personne a fait dans la structure : dans quelles équipes,
de quels jeux, à quelle fonction, depuis quand et pour combien de temps.
Demandé le 9 novembre 2026 (« sur la page Répertoire, il faut ajouter l’onglet
Parcours, du coup, maintenant, par rapport au Roster »). Rien ne s’y modifie :
un passage se tient dans le Roster de son équipe.

## Composition actuelle

- Troisième onglet de la fiche, après Identité et Coordonnées, avec la flèche
  ↗ (icône `ArrowUpRight`) des onglets en lecture et, pour les technologies
  d’assistance, « se modifie dans le Roster de chaque équipe » (`managedIn`
  de `PageSection`). Premier onglet en lecture du site.
- Bande en tête : « Le parcours se tient dans le Roster de chaque équipe :
  chaque ligne ouvre son équipe. » et « Ouvrir les jeux » au bord droit.
- Deux blocs, jamais mélangés, comme le Roster et ses anciens membres :
  **En cours et à venir** (les passages en cours par leur début, puis ceux à
  venir), puis **Terminés** (la fin la plus récente d’abord). Un tableau du
  Répertoire chacun, aux mêmes colonnes : l’équipe (écusson, nom, et dessous
  son jeu, « · équipe inactive » au besoin), Fonction, Statut (Actuel, À
  venir, Ancien), Début, Fin, Durée (règle des
  [fondations](../../../design/fondations.md#rédaction-des-textes-visibles)).
- Chaque ligne ouvre son équipe : le Roster pour un passage en cours ou à
  venir, ses anciens membres (`?section=anciens`) pour un passage terminé.
  Un passage de la structure (Bureau & staff, à venir) s’affichera « La
  structure », sans lien.
- Sous 56 rem de liste, les cartes du Répertoire, un bandeau par bloc, la
  période et la durée en toutes lettres.
- Vide : « Aucun passage pour l’instant » (« Un passage s’ajoute dans le
  Roster d’une équipe ; il s’affiche ici. »).

## Décisions retenues

- 9 novembre 2026 : le parcours se lit ici et se modifie dans le Roster de
  chaque équipe (onglet en lecture ↗, règle du 8 novembre 2026) ; pas de page
  « Parcours » séparée ([registre historique](../../../domaines/registre-historique.md)).
- Droits : `persons:view` et `teams:view`, sans droit nouveau. Le parcours
  montre les Rosters d’où il vient : un lecteur du Répertoire qui ne voit pas
  les équipes ne le voit pas (choix du 9 novembre 2026, qui précise
  « le Parcours suivra `persons:view` » du cadrage).
- En cours et à venir d’un côté, terminés de l’autre, comme la fiche équipe
  (« je ne veux pas mélanger les anciens avec les en cours et à venir »,
  9 novembre 2026).

## Points ouverts

- Les tournois joués (étape 5) et les passages de Bureau & staff (étape 1,
  page à venir) s’y ajouteront.
- Le statut « Dans la structure » sera calculé depuis ces passages, une fois
  les membres actuels saisis.

## Références

- [Registre historique](../../../domaines/registre-historique.md),
  [fiche équipe](../../esport/equipe.md),
  [cadrage des étapes 1 et 2](../../../propositions/membres-equipes-parcours.md).

## Preuves et limites

Le 9 novembre 2026 : `passages` (deux blocs : en cours puis à venir, terminés
à part) ; `passages-postgres` : le parcours rend chaque passage avec son
équipe et son jeu, le début le plus ancien d’abord, dates au début de leur
période ; une fiche sans passage rend une liste vide, une fiche absente 404 ;
refusé (403) avec `persons:view` seul et avec `teams:view` seul, accordé avec
les deux ; 16 suites et 283 tests SQL. Banc client à 1 440, 1 024, 768, 390 et
320 px : onglet « Parcours » avec sa flèche et le texte accessible, quatre
lignes (Academy en cours, Noctambule à venir, deux terminés dont une équipe
inactive), liens vers le Roster ou les anciens membres, colonnes alignées
entre les blocs, cartes en dessous ; sans `teams:view`, ni onglet ni contenu ;
fiche sans passage ; aucun débordement, aucune erreur JavaScript ; fiche
personne à 270 399 octets compressés.

Limites : E2E non rejoués ; base de développement non migrée par moi.
