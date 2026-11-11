# Entités

[Index des pages](../README.md) · [Espace Structure](README.md) · [Fiche entité](entite.md) · [Design](../../design/README.md) · [Guide général](../../REFERENCE_GENERALE.md)

## Identité

| Élément | Valeur |
| --- | --- |
| Route | `/structure/entites` |
| Espace | Structure, section « Organisation », après Bureau & staff |
| Gabarit visé | [A. Liste de gestion](../../design/gabarits.md#a-liste-de-gestion), sans recherche ni filtre (quelques lignes dans toute la vie de la structure) |
| État d’harmonisation | Aligné — voir [Harmonisation](../../design/harmonisation.md#état-par-page) |
| Point d’entrée | [page.tsx](../../../apps/web/src/app/structure/entites/page.tsx) → [EntitiesPage](../../../apps/web/src/features/entities/components/EntitiesPage.tsx), [EntityDialog](../../../apps/web/src/features/entities/components/EntityDialog.tsx) |
| Contrôle d’accès | `entities:view` pour la liste ; `entities:manage` pour « Ajouter une entité » ; l’API refait le contrôle dans la transaction ([permissions](../../domaines/permissions.md#entités-et-comptes)) |
| Chargement / erreur dédiés | `loading.tsx` ; squelette de liste ; « Chargement impossible » avec « Réessayer » ; « Accès refusé » ; titre d’onglet « Entités · Noctambule » |

## Rôle et tâches principales

Le bureau y lit la suite des formes juridiques de la structure dans le temps et
y ajoute une entité, quelques fois dans la vie de la structure : la période
d’avant l’association, l’association, demain peut-être une société. Chaque
compte appartient à l’une d’elles ([cadrage des entités](../../propositions/structure-entites-juridiques.md)).

## Composition actuelle

Livrée le 10 novembre 2026 (« ok pour moi ») :

1. Bandeau `PageIdentityHero` : « Entités », la phrase « Les formes juridiques
   de la structure dans le temps : la période d’avant, l’association, demain
   peut-être une société. Chaque compte appartient à l’une d’elles. », et
   « Ajouter une entité » pour qui gère.
2. Liste (`DataTableSection`), la plus ancienne en premier, sous la légende
   « 2 entités, de la plus ancienne à la plus récente » (« Aucune entité »
   vide) : colonnes Entité (nom, lien vers sa fiche sur toute la ligne), Forme,
   Période (« 2014 → septembre 2025 », « depuis octobre 2025 »), État. L’état
   se calcule à la lecture, jamais stocké : « À venir », « Active » (« En
   cours » pour la période d’avant), « Dissoute » (« Terminée »), plus la
   pastille « Principale ». Sur téléphone, une carte par entité : nom, « Forme ·
   période », pastilles.
3. Vide : « Aucune entité pour l’instant », « Commencez par l’association ; la
   période d’avant se saisit avec la forme « Sans forme juridique ». », et
   « Ajouter une entité » pour qui gère.
4. Fenêtre « Ajouter une entité » (plein écran sur téléphone) : Dénomination,
   Forme juridique (liste fixe : Association loi 1901, SAS, SASU, SARL, EURL,
   Autre, Sans forme juridique), Nom de la forme pour « Autre », Début (date
   au jour, au mois ou à l’année), interrupteur « Existe toujours » qui
   découvre la Fin. Identifiants et siège se saisissent ensuite dans la fiche,
   qui s’ouvre aussitôt.

## Traces dans le journal

« Entité ajoutée » (`LEGAL_ENTITY_CREATE`, catégorie `LEGAL_ENTITY`, filtre
« Entités »), avec Dénomination, Forme, Début, Fin et Entité principale en
clair.

## Décisions retenues

- 10 novembre 2026 : la période d’avant l’association est une ligne comme les
  autres, de forme « Sans forme juridique » : ni identifiant, ni siège, ni
  compte, jamais principale (contraintes en base). La première entité avec une
  forme juridique devient principale d’elle-même : avec une seule, personne ne
  choisit jamais (cadrage, règle 3).
- Pas de recherche ni de filtre : quelques lignes dans toute la vie de la
  structure, rangées dans le temps.

## Points ouverts

Aucun.

## Vérifications et prochaine reprise

10 novembre 2026 : suite `treasury-postgres` (base jetable, routes réelles) ;
parcours réel sur build de production, captures relues à 1440 et 390 px (liste
vide, fenêtre, liste de deux entités), sans débordement ni erreur ; contrôle
mobile de l’E2E. Reprise à l’arrivée d’une société.

## Références

[Cadrage des entités](../../propositions/structure-entites-juridiques.md),
[domaine Structure](../../domaines/structure-juridique.md#décisions-du-9-novembre-2026).

## Historique

- 10 novembre 2026 : création de la page.
