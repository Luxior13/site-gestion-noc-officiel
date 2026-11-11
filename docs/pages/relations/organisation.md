# Fiche organisation

[Index des pages](../README.md) · [Espace Relations](README.md) · [Organisations](organisations.md) · [Design](../../design/README.md) · [Guide général](../../REFERENCE_GENERALE.md)

## Identité

| Élément | Valeur |
| --- | --- |
| Route | `/relations/organisations/[id]`, `?section=contacts` pour l’onglet Contacts |
| Espace | Relations ; « Organisations » reste l’entrée courante de la navigation |
| Gabarit visé | [B. Fiche à sections](../../design/gabarits.md#b-fiche-à-sections), onglets Identité et Contacts |
| État d’harmonisation | Aligné — voir [Harmonisation](../../design/harmonisation.md#état-par-page) |
| Point d’entrée | [page.tsx](../../../apps/web/src/app/relations/organisations/%5Bid%5D/page.tsx) → [OrganizationDetailPage](../../../apps/web/src/features/organizations/components/OrganizationDetailPage.tsx) → [OrganizationIdentitySection](../../../apps/web/src/features/organizations/components/OrganizationIdentitySection.tsx), [OrganizationContactsSection](../../../apps/web/src/features/organizations/components/OrganizationContactsSection.tsx), [OrganizationContactDialog](../../../apps/web/src/features/organizations/components/OrganizationContactDialog.tsx) |
| Contrôle d’accès | `organizations:view` pour la lire ; `organizations:manage` pour la modifier, la supprimer et gérer ses contacts ; relier un contact à une fiche du Répertoire, et la voir, demande aussi `persons:view` ; l’API refait le contrôle dans la transaction ([permissions](../../domaines/permissions.md#organisations)) |
| Chargement / erreur dédiés | `loading.tsx` ; « Organisation introuvable » ; « Chargement impossible » avec « Réessayer » ; « Accès refusé » avec retour aux organisations ; titre d’onglet « Fiche organisation · Organisations · Noctambule » |

## Composition actuelle

Livrée le 11 novembre 2026 :

1. En-tête : tuile, nom, pastilles des types, ligne « ldlc.com · 2 contacts »
   (« Aucun contact » sans site) ; onglets **Identité** puis **Contacts**
   (avec leur nombre), point de brouillon sur Identité.
2. **Identité**, modifiée sur place avec la barre d’enregistrement commune :
   carte « Identité » (Nom, Types en cases avec leur sens, au moins un) ;
   carte « Site, identifiants et adresse » (Site web, saisi « ldlc.com » et
   enregistré « https://ldlc.com » ; SIRET, 14 chiffres, espaces ignorés ;
   Adresse sur deux lignes) ; zone dangereuse « Supprimer l’organisation »
   pour une organisation ajoutée par erreur ou en double, ses contacts avec
   elle.
3. **Contacts** : carte « Contacts » avec son nombre et « Ajouter » pour qui
   gère ; une ligne par contact, par nom : l’avatar de sa fiche du Répertoire
   et son nom qui l’ouvre, ou une icône et le nom saisi ; dessous la
   fonction, puis l’email et le téléphone en liens ; « Modifier » au bout de
   la ligne. Vide : « Aucun contact pour l’instant. ».
4. Fenêtre d’un contact : Nom ; Fiche du Répertoire, facultative, pour qui
   lit le Répertoire (« seulement pour une personne qui a déjà une fiche, un
   membre qui travaille chez un sponsor par exemple ») : le nom devient alors
   celui de la fiche ; Fonction ; Email ; Pays du numéro et Téléphone,
   enregistré au format international. Supprimer à gauche, confirmé à part.
   Une fiche déjà reliée à l’organisation n’est pas proposée une seconde fois.

## Traces dans le journal

« Organisation modifiée » / « supprimée » (gravité Avertissement, « avec ses
2 contacts ») ; « Contact ajouté », « modifié », « supprimé »
(`ORGANIZATION_CONTACT_*`) avec Fiche du Répertoire (« Liée », jamais son
nom), Nom, Fonction, Email, Téléphone. Le sujet « Contact : Léa Martin
(LDLC) » et les valeurs ne se lisent qu’avec `organizations:view`.

## Décisions retenues

- 11 novembre 2026 (proposition acceptée, « oui go ») : un contact est un nom,
  une fonction, un email et un téléphone sur la fiche de l’organisation ; une
  fiche du Répertoire ne se relie que si la personne en a déjà une, pour ne
  pas remplir le Répertoire de personnes extérieures. L’ancien plan
  (contacts choisis seulement dans le Répertoire) est écarté.
- Une fiche reliée donne son nom au contact ; le nom reste enregistré pour qui
  ne lit pas le Répertoire et après la suppression de la fiche (le lien
  tombe, le contact reste). Modifier un contact sans `persons:view` garde son
  lien ; le créer ou le retirer demande ce droit.
- Pas de relation datée sur la fiche : les dates d’un sponsoring sont celles
  de son accord, dans Partenariats (étape 7), et les échanges d’argent se
  liront dans l’onglet Règlements ↗ avec les opérations.
- 50 contacts au plus par organisation, pour borner ce que charge la fiche.

## Points ouverts

- Une fiche du Répertoire ne montre pas encore de quelle organisation elle est
  le contact ; à ajouter si le besoin apparaît.

## Vérifications et prochaine reprise

11 novembre 2026 : suite `organizations-postgres` (contact par nom ou par
fiche, jamais deux fois la même, lien gardé sans le Répertoire, fiche
supprimée, 50 contacts au plus, suppression en cascade et journal) ; parcours
réel sur build de production : identité complétée sur place, contact par nom
puis par fiche choisie dans les suggestions, numéro refusé sur son champ,
journal filtré « Organisations » ; captures relues à 1 440 et 390 px, sans
débordement ni erreur. Reprise avec l’onglet Règlements ↗ des opérations.

## Historique

- 11 novembre 2026 : création de la page.
