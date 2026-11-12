# Organisations

[Index des pages](../README.md) · [Espace Relations](README.md) · [Fiche organisation](organisation.md) · [Design](../../design/README.md) · [Guide général](../../REFERENCE_GENERALE.md)

## Identité

| Élément | Valeur |
| --- | --- |
| Route | `/relations/organisations` |
| Espace | Relations, section « Annuaire », première page du pôle |
| Gabarit visé | [A. Liste de gestion](../../design/gabarits.md#a-liste-de-gestion) : recherche et filtres rapides « Type » avec leurs nombres, sans pagination (quelques centaines d’organisations au plus, filtrées dans la page) |
| État d’harmonisation | Aligné — voir [Harmonisation](../../design/harmonisation.md#état-par-page) |
| Point d’entrée | [page.tsx](../../../apps/web/src/app/relations/organisations/page.tsx) → [OrganizationsPage](../../../apps/web/src/features/organizations/components/OrganizationsPage.tsx), [OrganizationDialog](../../../apps/web/src/features/organizations/components/OrganizationDialog.tsx), [OrganizationKindsField](../../../apps/web/src/features/organizations/components/OrganizationKindsField.tsx) |
| Contrôle d’accès | `organizations:view` pour la liste ; `organizations:manage` pour « Ajouter une organisation » ; l’API refait le contrôle dans la transaction ([permissions](../../domaines/permissions.md#organisations)) |
| Chargement / erreur dédiés | `loading.tsx` ; squelette de liste ; « Chargement impossible » avec « Réessayer » ; « Accès refusé » ; titre d’onglet « Organisations · Noctambule » |

## Rôle et tâches principales

Le bureau y retrouve toute organisation avec laquelle la structure travaille,
quel que soit son rôle, et en ajoute une. Les opérations la choisiront comme
celle qui paie ou qui reçoit ; les tournois, comme leur organisateur. Un
organisateur tapé dans un tournoi s’ajoute ici sans passer par cette page
(12 novembre 2026).

## Composition actuelle

Livrée le 11 novembre 2026 (« oui go ») :

1. Bandeau : « Organisations », la phrase « Les organisations avec lesquelles
   la structure travaille, dans une seule liste : une organisation peut être à
   la fois sponsor et fournisseur. », et « Ajouter une organisation » pour qui
   gère.
2. Barre : recherche « Nom, site ou SIRET… » (règle commune de recherche),
   puis le groupe « Type » : Toutes, Sponsors, Partenaires, Fournisseurs,
   Clients, Organisateurs, Financeurs publics, chacun avec son nombre ; une
   organisation à deux types compte dans les deux. Légende « 3
   organisations », « trouvées » avec un critère.
3. Liste par nom : Organisation (tuile, nom qui ouvre la fiche sur toute la
   ligne, site en clair dessous, « ldlc.com »), Types (une pastille neutre par
   type), Contacts (« Aucun » ou leur nombre). Sur téléphone, une carte : nom,
   site, pastilles, « 2 contacts ».
4. Vide : « Aucune organisation pour l’instant » et « Ajouter une
   organisation » ; filtrée sans résultat : « Aucune organisation trouvée » et
   « Réinitialiser ».
5. Fenêtre « Ajouter une organisation » : Nom, puis Types, une case par type
   avec ce qu’il veut dire (« Soutient la structure, en argent ou en
   matériel. »), au moins un ; la fiche s’ouvre ensuite pour le site,
   l’adresse, le SIRET et les contacts.

## Traces dans le journal

« Organisation ajoutée » (`ORGANIZATION_CREATE`, catégorie `ORGANIZATION`,
filtre « Organisations ») avec Nom et Types. Le nom et les valeurs ne se lisent
dans le journal qu’avec `organizations:view` ; sinon « Organisation » et
« Valeur masquée ». Un organisateur tapé dans un tournoi laisse la même
« Organisation ajoutée » (Types « Organisateur »), ou « Organisation
modifiée » quand une organisation de ce nom reçoit le type.

## Décisions retenues

- 11 novembre 2026 (« les partenaires devraient être tous mélangés avec les
  clients, fournisseurs etc ? », puis « oui go ») : une seule liste, un filtre
  par type, plusieurs types par fiche ; l’accord d’un partenariat vivra dans
  Partenariats.
- Types fixés dans le code (une liste courte qui ne change pas avec la vie de
  la structure), choisis par cases dans la fenêtre et la fiche.
- Pas de pagination : la liste est chargée en entier et filtrée dans la page ;
  à revoir au-delà de quelques centaines d’organisations.
- 12 novembre 2026 : un organisateur s’ajoute aussi depuis le champ
  Organisateur d’un tournoi, pour qui gère les organisations ; une
  organisation du même nom reçoit le type au lieu d’un doublon
  ([fiche tournoi](../esport/tournoi.md#décisions-retenues)).

## Points ouverts

Aucun.

## Vérifications et prochaine reprise

11 novembre 2026 : suite `organizations-postgres` (nom unique sans casse ni
accents, types rangés et uniques, refus de la base, journal) ; tests de
`organizations.test.ts` (schémas, site lu comme on le dit, masquage du
journal) ; parcours réel sur build de production (liste vide, fenêtre refusée
puis remplie, cinq organisations, filtre « Sponsors », recherche sans
résultat), captures relues à 1 440 et 390 px, sans débordement ni erreur ;
contrôle mobile de l’E2E. Reprise avec les opérations.

## Historique

- 11 novembre 2026 : création de la page.
- 12 novembre 2026 : ajout d’un organisateur depuis un tournoi.
