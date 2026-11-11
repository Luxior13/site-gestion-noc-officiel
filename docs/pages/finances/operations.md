# Opérations

[Index des pages](../README.md) · [Espace Finances](README.md) · [Fiche opération](operation.md) · [Comptes](comptes.md) · [Design](../../design/README.md) · [Guide général](../../REFERENCE_GENERALE.md)

## Identité

| Élément | Valeur |
| --- | --- |
| Route | `/finances/operations` |
| Espace | Finances, section « Trésorerie », après Comptes |
| Gabarit visé | [A. Liste de gestion](../../design/gabarits.md#a-liste-de-gestion) : recherche, filtres rapides « Sens » avec leurs nombres, 25 par page côté serveur |
| État d’harmonisation | Aligné — voir [Harmonisation](../../design/harmonisation.md#état-par-page) |
| Point d’entrée | [page.tsx](../../../apps/web/src/app/finances/operations/page.tsx) → [OperationsPage](../../../apps/web/src/features/operations/components/OperationsPage.tsx), [OperationsList](../../../apps/web/src/features/operations/components/OperationsList.tsx) (partagée avec l’onglet Mouvements d’un compte et Règlements ↗ d’une organisation), [OperationDialog](../../../apps/web/src/features/operations/components/OperationDialog.tsx), [OperationFields](../../../apps/web/src/features/operations/components/OperationFields.tsx) |
| Contrôle d’accès | `operations:view` pour la liste ; `operations:manage` pour « Ajouter une opération » ; `persons:view` en plus pour choisir ou voir une fiche du Répertoire qui a payé ou reçu ; l’API refait le contrôle dans la transaction ([permissions](../../domaines/permissions.md#opérations)) |
| Chargement / erreur dédiés | `loading.tsx` ; squelette de liste ; « Chargement impossible » avec « Réessayer » ; « Accès refusé » ; titre d’onglet « Opérations · Noctambule » |

## Rôle et tâches principales

Le bureau y saisit l’argent réellement reçu ou versé, et le passage d’un
compte à l’autre ; il retrouve une opération par son libellé ou son sens.
Chaque opération fait bouger le solde du jour de son compte.

## Composition actuelle

Livrée le 11 novembre 2026 (« ok go » sur les champs et l’exemple du
tournoi) :

1. Bandeau : « Opérations », la phrase « L’argent reçu, versé ou passé d’un
   compte à l’autre, le plus récent en premier. Le solde du jour de chaque
   compte est dans Comptes. », et « Ajouter une opération » pour qui gère.
2. Barre : recherche « Libellé ou note… » (règle commune de recherche, sur
   une colonne normalisée), puis le groupe « Sens » : Toutes, Entrées,
   Sorties, Virements, avec leurs nombres sous la recherche ; légende
   « 5 opérations », « trouvées » avec un critère.
3. Liste, la plus récente en premier : Date, Opération (libellé qui ouvre la
   fiche sur toute la ligne, dessous catégorie · qui a payé ou reçu · équipe
   ou jeu), Compte (« Compte courant → PayPal » pour un virement, dont le
   titre dit seulement « Virement »), Montant aligné à droite : « + 600,00 € »
   en vert pour une entrée, « − 50,00 € » dans la couleur du texte pour une
   sortie, sans signe pour un virement ([couleur des
   montants](../../design/fondations.md#hiérarchie-de-couleurs)). Sur
   téléphone, une carte : titre et montant, puis date, compte et détails.
   Pagination « Page X sur Y » au-delà de 25.
4. Fenêtre « Ajouter une opération » : Sens (Entrée, Sortie, Virement, Sortie
   par défaut), Date (aujourd’hui, jamais à venir), Montant (toujours
   positif : « le sens donne le signe »), Compte (choisi d’office s’il n’y en
   a qu’un d’ouvert). Pour une entrée ou une sortie : Libellé, Catégorie (de
   ce sens), Moyen de paiement (« Non précisé »), Payé par / Payé à : une
   organisation ou une fiche du Répertoire, l’une ou l’autre, Équipe ou jeu
   concerné, Note. Pour un virement : Compte d’arrivée (de la même entité) et
   Note. La fenêtre se ferme sur « Opération ajoutée » et la liste se
   recharge, prête pour la suivante.

## Traces dans le journal

« Opération ajoutée » (`FINANCIAL_OPERATION_CREATE`, catégorie
`FINANCIAL_OPERATION`, filtre « Trésorerie ») avec Sens, Date, Montant,
Compte, Vers le compte, Libellé, Catégorie, Moyen de paiement, Organisation,
Fiche du Répertoire (son nom), Équipe ou jeu, Note en clair. Le libellé et
les valeurs ne se lisent qu’avec `operations:view` ; sinon « Opération » et
« Valeur masquée ».

## Décisions retenues

- 11 novembre 2026 (« ok go ») : l’argent se saisit à un seul endroit, ici ;
  les fiches qui le lisent (compte, organisation, puis équipe, jeu, personne,
  tournoi) le montrent en lecture ; libellé et catégorie obligatoires, moyen
  de paiement facultatif ; pas de validation par le trésorier, le journal dit
  qui a saisi quoi ; justificatifs plus tard, avec le stockage des fichiers.
- Adaptation : la fenêtre laisse la liste en place au lieu d’ouvrir la fiche,
  parce que tout ce qu’une opération contient tient dans la fenêtre et
  qu’on en saisit plusieurs à la suite ; la fiche s’ouvre depuis la ligne
  pour corriger.
- Un virement relie deux comptes de la même entité ; il n’est ni une entrée
  ni une sortie ; une opération ne précède pas l’ouverture de son compte ni
  ne suit sa clôture.

## Points ouverts

- Une caisse peut passer sous zéro par les opérations (son solde s’affiche
  alors en rouge) : à refuser si le besoin apparaît.
- Les recettes et dépenses par catégorie ou par équipe sur une période (bilan)
  viendront avec Contrôles & clôtures et Budget & pilotage.

## Vérifications et prochaine reprise

11 novembre 2026 : suites `operations` et `operations-postgres` (solde du
jour, filtres et nombres, recherche, refus du service et de la base, ce
qu’une opération nomme reste, Répertoire réservé à qui le lit) ; parcours
réel sur build de production (listes courantes, fenêtre refusée puis
remplie, sortie et virement saisis, filtre Entrées, fiche modifiée), captures
relues à 1 440 et 390 px. Reprise avec les justificatifs.

## Historique

- 11 novembre 2026 : création de la page.
