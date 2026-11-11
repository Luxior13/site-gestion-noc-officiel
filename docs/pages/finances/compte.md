# Fiche compte

[Index des pages](../README.md) · [Espace Finances](README.md) · [Comptes](comptes.md) · [Design](../../design/README.md) · [Guide général](../../REFERENCE_GENERALE.md)

## Identité

| Élément | Valeur |
| --- | --- |
| Route | `/finances/comptes/[id]` |
| Espace | Finances ; « Comptes » reste l’entrée courante de la navigation |
| Gabarit visé | [B. Fiche à sections](../../design/gabarits.md#b-fiche-à-sections), sans barre d’onglets tant que seules les informations sont en place |
| État d’harmonisation | Aligné — voir [Harmonisation](../../design/harmonisation.md#état-par-page) |
| Point d’entrée | [page.tsx](../../../apps/web/src/app/finances/comptes/%5Bid%5D/page.tsx) → [FinancialAccountDetailPage](../../../apps/web/src/features/financial-accounts/components/FinancialAccountDetailPage.tsx) → [FinancialAccountInformationSection](../../../apps/web/src/features/financial-accounts/components/FinancialAccountInformationSection.tsx), champs de [AccountFields](../../../apps/web/src/features/financial-accounts/components/AccountFields.tsx) |
| Contrôle d’accès | `financial_accounts:view` pour la lire ; `financial_accounts:manage` pour la modifier, la clôturer ou la supprimer ; l’API refait le contrôle dans la transaction ([permissions](../../domaines/permissions.md#entités-et-comptes)) |
| Chargement / erreur dédiés | `loading.tsx` ; « Compte introuvable » ; « Chargement impossible » avec « Réessayer » ; « Accès refusé » avec retour aux comptes ; titre d’onglet « Fiche compte · Comptes · Noctambule » |

## Composition actuelle

Livrée le 10 novembre 2026 :

1. En-tête : icône de son type, comme dans la liste (banque, portefeuille pour
   un compte en ligne, billets pour une caisse, 11 novembre 2026), nom,
   pastille « Ouvert » ou « Clôturé », ligne « Compte
   bancaire · Crédit Agricole · 1 250,00 € au 10 novembre 2026 », le montant
   en rouge s’il est négatif (11 novembre 2026).
2. Carte **Compte** : Nom, Type, Établissement (pas pour une caisse), puis
   l’Entité titulaire en lecture : « Fixée à l’ouverture : un compte reste à
   l’entité qui l’a ouvert. »
3. Carte **Solde de départ** : montant (« 1 250 », suffixe €) et « À la date
   du », reliés à la phrase « Le solde réel du compte ce jour-là : les
   opérations partiront de lui. »
4. Carte **Clôture** : interrupteur « Ouvert » ; le retirer découvre « Clôturé
   le » (aujourd’hui par défaut, jamais avant le solde de départ).
5. Zone dangereuse pour qui gère : « Seul un compte ajouté par erreur se
   supprime ; un compte fermé se clôture à sa date. »
6. Barre d’enregistrement commune ; conflit de version avec « Actualiser ».

## Traces dans le journal

« Compte modifié » (`FINANCIAL_ACCOUNT_UPDATE`) avec les seuls champs changés
en clair (Nom, Type, Établissement, Solde de départ en euros, Date du solde de
départ, Clôture) ; « Compte supprimé » (`FINANCIAL_ACCOUNT_DELETE`,
avertissement). Valeurs masquées à qui n’a pas `financial_accounts:view`.

## Décisions retenues

- L’entité d’un compte ne change jamais (cadrage, règle 2) : la base le refuse
  (`FinancialAccount_entityId_immutable`) ; son jour de départ reste dans la
  période de l’entité.
- Une caisse n’a pas d’établissement et n’est jamais en dessous de zéro.
- Mouvements (avec les opérations) et Relevés (rapprochement) viendront en
  onglets ; une fois les opérations là, un compte qui en a se clôturera au lieu
  d’être supprimé.

## Points ouverts

Aucun.

## Vérifications et prochaine reprise

10 novembre 2026 : suite `treasury-postgres` (modification, clôture, version
périmée refusée, suppression, journal, caisse négative refusée) ; parcours réel
sur build de production, captures relues à 1440 et 390 px, sans débordement ni
erreur. Reprise avec les opérations.

## Historique

- 10 novembre 2026 : création de la fiche.
- 11 novembre 2026 : solde de départ négatif en rouge dans l’en-tête ; icône
  de son type, partagée avec la liste (`AccountKindIcon`).
