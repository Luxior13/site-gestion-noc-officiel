# Personne — Finances

[Index des pages](../../README.md) · [Répertoire](README.md) · [Design](../../../design/README.md) · [Guide général](../../../REFERENCE_GENERALE.md)

## Identité

| Élément | Valeur |
| --- | --- |
| Route | `/personnes/repertoire/[id]` |
| Section | `?section=finances` |
| Espace | Personnes |
| Gabarit visé | [B. Fiche à sections](../../../design/gabarits.md#b-fiche-à-sections), [onglet en lecture](../../../design/gabarits.md#onglets-dune-fiche) |
| État d’harmonisation | Aligné à sa création le 11 novembre 2026 — voir [Harmonisation](../../../design/harmonisation.md#état-par-page) |
| Point d’entrée | [PersonDetailPage](../../../../apps/web/src/features/persons/components/PersonDetailPage.tsx) → [FinancesTab](../../../../apps/web/src/features/operations/components/FinancesTab.tsx) → [OperationsList](../../../../apps/web/src/features/operations/components/OperationsList.tsx), sur `GET /api/finances/operations?personne=[id]` ([service](../../../../apps/web/src/features/operations/server/operation.service.ts)) |
| Contrôle d’accès | `persons:view` (la fiche) et `operations:view` ; sans ce dernier, l’onglet n’apparaît pas, l’adresse `?section=finances` ouvre Identité et l’API répond 403 ; aucun droit propre ([permissions](../../../domaines/permissions.md#opérations)) |
| Chargement / erreur dédiés | section chargée à la demande ; squelette de liste, puis « Chargement impossible » avec « Réessayer » |

## Rôle et tâches principales

Voir l’argent qui nomme la personne : ce qu’elle a payé à la structure
(cotisation, participation) et ce que la structure lui a versé
(remboursement, part d’un gain). Demandé avec les onglets Finances des fiches
jeu et équipe (« passe au 2 des finances », 11 novembre 2026). Rien ne s’y
saisit : une opération se saisit dans [Opérations](../../finances/operations.md).

## Composition actuelle

- Cinquième onglet de la fiche, après Parcours ↗, avec la flèche ↗ et, pour
  les technologies d’assistance, « se modifie dans Finances ».
- La liste partagée des opérations (`OperationsList`), filtrée sur la fiche :
  ligne de tête « Les opérations se saisissent dans Finances › Opérations :
  chaque ligne ouvre son opération. », puis, dès qu’il y a de l’argent, les
  totaux « Reçu de cette personne + 30,00 € · Versé à cette personne
  − 100,00 € » (sans résultat : ce n’est pas un budget), recherche, « Ouvrir
  les opérations » au bord droit, filtres rapides Toutes, Entrées, Sorties
  (pas de Virements : un virement ne nomme personne), 25 par page.
- Les totaux suivent la fiche et ignorent la recherche et le filtre.
- Vide : « Aucune opération pour l’instant » (« Les entrées et sorties
  d’argent qui nomment cette personne, payées par elle ou versées à elle,
  s’affichent ici. »).

## Décisions retenues

- 11 novembre 2026 : l’argent d’une personne se lit ici et se saisit dans
  Opérations (règle « argent saisi à un seul endroit »,
  [préférences](../../../design/preferences.md)).
- Un seul onglet Finances pour l’argent et, plus tard, les adhésions
  (proposition du 10 novembre 2026, huit onglets au plus) : l’onglet se
  modifie aujourd’hui dans Finances, puis dans Adhésions et Finances.

## Points ouverts

- Les adhésions par campagne et l’état de cotisation (étape 4) s’y
  ajouteront.

## Références

- [Opérations](../../finances/operations.md),
  [fiche équipe](../../esport/equipe.md), [fiche jeu](../../esport/jeu.md).

## Preuves et limites

Le 11 novembre 2026 : `operations` (paramètre `personne` lu) ;
`operations-postgres` : les opérations d’une fiche et leurs totaux (reçu
d’elle 30 €, versé à elle 100 €). Banc réel sur build de production : voir la
[fiche Opérations](../../finances/operations.md#vérifications-et-prochaine-reprise).
