# Comptes

[Index des pages](../README.md) · [Espace Finances](README.md) · [Fiche compte](compte.md) · [Design](../../design/README.md) · [Guide général](../../REFERENCE_GENERALE.md)

## Identité

| Élément | Valeur |
| --- | --- |
| Route | `/finances/comptes` |
| Espace | Finances, section « Trésorerie », première page du pôle |
| Gabarit visé | [A. Liste de gestion](../../design/gabarits.md#a-liste-de-gestion), sans recherche ni filtre (quelques comptes) ; un seul onglet livré, donc sans barre d’onglets |
| État d’harmonisation | Aligné — voir [Harmonisation](../../design/harmonisation.md#état-par-page) |
| Point d’entrée | [page.tsx](../../../apps/web/src/app/finances/comptes/page.tsx) → [FinancialAccountsPage](../../../apps/web/src/features/financial-accounts/components/FinancialAccountsPage.tsx), [FinancialAccountDialog](../../../apps/web/src/features/financial-accounts/components/FinancialAccountDialog.tsx) |
| Contrôle d’accès | `financial_accounts:view` pour la liste ; `financial_accounts:manage` pour « Ajouter un compte » ; l’API refait le contrôle dans la transaction ([permissions](../../domaines/permissions.md#entités-et-comptes)). Le lien « Ouvrir les entités » de l’état vide suit `entities:view` |
| Chargement / erreur dédiés | `loading.tsx` ; squelette de liste ; « Chargement impossible » avec « Réessayer » ; « Accès refusé » ; titre d’onglet « Comptes · Noctambule » |

## Rôle et tâches principales

Le bureau y retrouve chaque compte de la structure avec son solde de départ, et
en ouvre un nouveau. Les opérations, qui feront bouger les soldes, viendront
ensuite.

## Composition actuelle

Livrée le 10 novembre 2026 (« ok pour moi ») :

1. Bandeau : « Comptes », la phrase « Les comptes bancaires, comptes en ligne et
   caisses de la structure, avec leur solde au jour où le site commence à les
   suivre. », et « Ajouter un compte » pour qui gère, quand une entité existe.
2. Liste, comptes ouverts d’abord puis par nom, sous la légende « 2 comptes »
   (« Aucun compte » vide) : Compte (nom, lien vers sa fiche, et dessous
   « Compte bancaire · Crédit Agricole », « Caisse »), Entité (seulement quand
   plusieurs entités peuvent tenir un compte), Solde de départ (aligné à
   droite, « 1 250,00 € », en rouge s’il est négatif, et dessous en petit
   texte discret « au 10 novembre 2026 » ; une seule colonne depuis le 11
   novembre 2026), État (« Ouvert »,
   « Clôturé »). Sur
   téléphone, une carte : nom, type, pastille et « 1 250,00 € au 10 novembre
   2026 ».
3. Sans entité : « Aucune entité pour tenir un compte », « Chaque compte
   appartient à une entité : ajoutez d’abord l’association dans Structure ›
   Entités. », et « Ouvrir les entités » pour qui les voit. Avec des entités
   mais sans compte : « Aucun compte pour l’instant ».
4. Fenêtre « Ajouter un compte » : Nom, Type (Compte bancaire, Compte en
   ligne, Caisse), Établissement (pas pour une caisse), Solde de départ (saisi
   comme on l’écrit, « 1 234,56 », suffixe €), « À la date du » (au jour,
   aujourd’hui par défaut), la phrase « Le solde réel du compte ce jour-là,
   relevé ou caisse comptée : le site part de lui, l’historique d’avant reste
   dans votre ancien suivi. », puis l’Entité titulaire **seulement** si
   plusieurs entités existent à cette date, la principale proposée d’abord.

## Traces dans le journal

« Compte ouvert » (`FINANCIAL_ACCOUNT_CREATE`, catégorie `FINANCIAL_ACCOUNT`,
filtre « Trésorerie ») avec Entité, Nom, Type, Établissement, Solde de départ,
Date du solde de départ en clair. Les valeurs et le nom du compte ne se lisent
dans le journal qu’avec `financial_accounts:view` ; sinon « Compte financier »
et « Valeur masquée ».

## Décisions retenues

- 10 novembre 2026 (réponses du propriétaire : plusieurs comptes, le bureau
  saisit, pas pressé de reprendre l’ancien suivi) : un solde de départ à un
  jour choisi plutôt qu’un historique repris ; euro seulement ; pas de colonne
  « Solde » tant qu’aucune opération ne le fait bouger, pour ne pas faire
  passer le solde de départ pour celui du jour.
- 11 novembre 2026 (« la colonne solde de départ est bien comme ça ? », puis
  « ok go » sur la recommandation) : le solde de départ et sa date tiennent
  dans une colonne, la date dessous ; la colonne « Au » est retirée. Avec les
  opérations, cette colonne deviendra « Solde », le solde du jour (départ,
  plus les entrées, moins les sorties), et le solde de départ ne se lira plus
  que sur la fiche du compte.
- Les exercices attendent la clôture de fin d’année (chantier Contrôles &
  clôtures) ; les catégories et moyens de paiement arrivent avec les
  opérations.

## Points ouverts

Aucun.

## Vérifications et prochaine reprise

10 novembre 2026 : suite `treasury-postgres` (entité déduite, demandée entre
plusieurs, refus avant l’association, nom unique par entité, droits) ; parcours
réel sur build de production, compte ouvert par la fenêtre, captures relues à
1440 et 390 px, sans débordement ni erreur ; contrôle mobile de l’E2E. Reprise
avec les opérations.

## Historique

- 10 novembre 2026 : création de la page.
- 11 novembre 2026 : solde de départ et sa date dans une seule colonne ;
  solde négatif en rouge ([couleur des montants](../../design/fondations.md#hiérarchie-de-couleurs)).
