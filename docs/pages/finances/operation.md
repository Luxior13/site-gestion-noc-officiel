# Fiche opération

[Index des pages](../README.md) · [Espace Finances](README.md) · [Opérations](operations.md) · [Design](../../design/README.md) · [Guide général](../../REFERENCE_GENERALE.md)

## Identité

| Élément | Valeur |
| --- | --- |
| Route | `/finances/operations/[id]` |
| Espace | Finances ; « Opérations » reste l’entrée courante de la navigation |
| Gabarit visé | [B. Fiche à sections](../../design/gabarits.md#b-fiche-à-sections), sans barre d’onglets tant que seule l’opération est en place |
| État d’harmonisation | Aligné — voir [Harmonisation](../../design/harmonisation.md#état-par-page) |
| Point d’entrée | [page.tsx](../../../apps/web/src/app/finances/operations/%5Bid%5D/page.tsx) → [OperationDetailPage](../../../apps/web/src/features/operations/components/OperationDetailPage.tsx) → [OperationEditSection](../../../apps/web/src/features/operations/components/OperationEditSection.tsx), champs de [OperationFields](../../../apps/web/src/features/operations/components/OperationFields.tsx) |
| Contrôle d’accès | `operations:view` pour la lire ; `operations:manage` pour la modifier ou la supprimer ; `persons:view` pour voir ou changer la fiche du Répertoire qui a payé ou reçu ; l’API refait le contrôle dans la transaction ([permissions](../../domaines/permissions.md#opérations)) |
| Chargement / erreur dédiés | `loading.tsx` ; « Opération introuvable » ; « Chargement impossible » avec « Réessayer » ; « Accès refusé » avec retour aux opérations ; titre d’onglet « Fiche opération · Opérations · Noctambule » |

## Composition actuelle

Livrée le 11 novembre 2026 :

1. En-tête : flèche entrante verte (entrée), sortante (sortie) ou double
   (virement), le libellé ou « Virement : Compte courant → PayPal », pastille
   du sens, ligne « 9 novembre 2026 · Compte courant · + 600,00 € ».
2. Pour qui gère, carte **Opération** modifiée sur place avec les champs de la
   fenêtre, sauf le sens, fixé à la saisie ; barre d’enregistrement commune.
   Une fiche du Répertoire liée mais cachée à qui ne lit pas le Répertoire
   est dite « Une fiche du Répertoire est liée » et garde son lien.
3. Pour qui consulte seulement, la même carte en lecture : Date, Montant,
   Compte (lien vers sa fiche), Libellé, Catégorie, Moyen de paiement, Payé
   par / Payé à (lien vers la fiche du Répertoire), Équipe ou jeu, Tournoi
   (11 novembre 2026), Note.
4. Zone dangereuse « Supprimer l’opération » : une opération saisie par
   erreur, ou dans le mauvais sens, se supprime puis se saisit à nouveau.

## Traces dans le journal

« Opération modifiée » avec les seuls champs changés, avant et après ;
« Opération supprimée » (gravité Avertissement) avec ses valeurs. Masquées
sans `operations:view`.

## Décisions retenues

- 11 novembre 2026 : le sens ne change pas après la saisie, ce qui garde la
  catégorie cohérente avec lui ; une modification sans changement ne crée ni
  version ni trace.

## Points ouverts

Aucun.

## Vérifications et prochaine reprise

11 novembre 2026 : suite `operations-postgres` (sens fixé, version
périmée refusée, lien gardé sans le Répertoire) ; montant modifié sur un
build de production, captures relues à 1 440 et 390 px. Reprise avec les
onglets Justificatifs, puis Affectations avec les factures.

## Historique

- 11 novembre 2026 : création de la fiche.
