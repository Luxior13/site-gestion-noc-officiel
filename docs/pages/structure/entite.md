# Fiche entité

[Index des pages](../README.md) · [Espace Structure](README.md) · [Entités](entites.md) · [Design](../../design/README.md) · [Guide général](../../REFERENCE_GENERALE.md)

## Identité

| Élément | Valeur |
| --- | --- |
| Route | `/structure/entites/[id]` |
| Espace | Structure ; « Entités » reste l’entrée courante de la navigation |
| Gabarit visé | [B. Fiche à sections](../../design/gabarits.md#b-fiche-à-sections), sans barre d’onglets tant que seule l’identité est en place (comme la fiche équipe à son ouverture) |
| État d’harmonisation | Aligné — voir [Harmonisation](../../design/harmonisation.md#état-par-page) |
| Point d’entrée | [page.tsx](../../../apps/web/src/app/structure/entites/%5Bid%5D/page.tsx) → [EntityDetailPage](../../../apps/web/src/features/entities/components/EntityDetailPage.tsx) → [EntityInformationSection](../../../apps/web/src/features/entities/components/EntityInformationSection.tsx) |
| Contrôle d’accès | `entities:view` pour la lire ; `entities:manage` pour la modifier, la rendre principale ou la supprimer ; l’API refait le contrôle dans la transaction, sous un verrou de toutes les entités ([permissions](../../domaines/permissions.md#entités-et-comptes)) |
| Chargement / erreur dédiés | `loading.tsx` ; « Entité introuvable » ; « Chargement impossible » avec « Réessayer » ; « Accès refusé » avec retour aux entités ; titre d’onglet « Fiche entité · Entités · Noctambule » |

## Composition actuelle

Livrée le 10 novembre 2026 :

1. En-tête de fiche : icône, dénomination, pastilles d’état et « Principale »,
   ligne « Association loi 1901 · depuis octobre 2025 ».
2. Carte **Identité** : Dénomination, Forme juridique, Nom de la forme pour
   « Autre », Début, « Existe toujours » et Fin. « Sans forme juridique » est
   grisée pour l’entité principale et pour une entité qui a des comptes, avec
   la phrase qui le dit.
3. Carte **Identifiants et siège** : Numéro RNA (« W suivi de 9 chiffres »,
   espaces et minuscules acceptés), SIRET (14 chiffres), Siège (zone de texte).
4. Carte **Entité principale** : interrupteur, désactivé pour l’entité
   principale (« Pour en changer, rendez principale une autre entité ») ;
   l’allumer sur une autre entité lui passe la marque.
5. Pour la période d’avant : seule la carte Identité, puis « La période sans
   forme juridique n’a ni identifiant, ni siège, ni compte. »
6. Zone dangereuse pour qui gère ; avec des comptes, elle dit « Cette entité a
   2 comptes : indiquez sa date de fin plutôt que de la supprimer. »
7. Barre d’enregistrement commune dès qu’une valeur change ; conflit de
   version avec « Actualiser » qui garde la saisie.

## Traces dans le journal

« Entité modifiée » (`LEGAL_ENTITY_UPDATE`) avec les seuls champs changés en
clair (Dénomination, Forme, Début, Fin, Numéro RNA, SIRET, Siège, Entité
principale) ; un changement d’entité principale écrit deux événements dans la
même transaction, l’un sur l’ancienne (« n’est plus l’entité principale »),
l’autre sur la nouvelle (« entité principale à la place de … »). « Entité
supprimée » (`LEGAL_ENTITY_DELETE`, avertissement) avec ses valeurs.

## Décisions retenues

- 10 novembre 2026 : l’entité principale ne se retire jamais seule ; une autre
  la remplace. Elle ne se supprime que si aucune autre entité avec une forme
  juridique ne peut prendre sa place.
- Une entité qui tient des comptes garde une forme juridique et une période
  qui couvre leur date de départ ; le service le dit sur le champ, la base le
  garde (`FinancialAccount_entity_check`, `LegalEntity_form_check`).
- Paramètres fiscaux datés, dirigeants ↗, assurances et finances ↗ viennent
  ensuite ([feuille de route](../../propositions/feuille-de-route.md)).

## Points ouverts

Aucun.

## Vérifications et prochaine reprise

10 novembre 2026 : suite `treasury-postgres` ; parcours réel sur build de
production (identifiants saisis à l’écran puis enregistrés et relus, période
d’avant, entité tenant deux comptes), captures relues à 1440 et 390 px, sans
débordement ni erreur. Reprise avec les paramètres fiscaux.

## Historique

- 10 novembre 2026 : création de la fiche.
