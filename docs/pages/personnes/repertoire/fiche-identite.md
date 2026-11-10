# Personne — Identité

[Index des pages](../../README.md) · [Répertoire](README.md) · [Design](../../../design/README.md) · [Guide général](../../../REFERENCE_GENERALE.md)

## Identité

| Élément | Valeur |
| --- | --- |
| Route | `/personnes/repertoire/[id]` |
| Section | Identité, par défaut (`?section=identite`) |
| Espace | Personnes |
| Gabarit visé | [B. Fiche à sections](../../../design/gabarits.md#b-fiche-à-sections) |
| État d’harmonisation | Aligné ; champs adoucis du 17 octobre 2026 — voir [Harmonisation](../../../design/harmonisation.md#état-par-page) |
| Point d’entrée | [page.tsx](../../../../apps/web/src/app/personnes/repertoire/[id]/page.tsx) → [PersonIdentitySection](../../../../apps/web/src/features/persons/components/PersonIdentitySection.tsx) |
| Contrôle d’accès | `persons:view` ; modification `persons:update` ; suppression `persons:delete` |
| Chargement / erreur dédiés | oui, squelette de fiche / commune à l’application |

## Rôle et tâches principales

Consulter et corriger l’identité d’une personne : pseudo principal, prénom, nom,
date de naissance civile facultative et nationalité facultative (10 novembre
2026). Les autres pseudos sont dans l’onglet [En ligne](fiche-en-ligne.md). Le statut dans la structure se lit dans le bandeau sans se choisir : il
se calcule depuis les passages (9 novembre 2026). La date de naissance se
choisit dans le calendrier du site (`DatePicker`, au jour, de 1900 à l’année en
cours, avec « Effacer »), plus le sélecteur natif du navigateur (9 novembre
2026). La nationalité se choisit dans le menu du site (`SearchSelect`) : France
en tête, puis tous les pays par leur nom, chacun avec son drapeau, avec
recherche, et « Non renseignée » pour l’effacer ; le champ montre le drapeau du
pays choisi.

## Composition actuelle

Titre « Identité » réservé aux lecteurs d’écran, puis deux cartes titrées
(`RubricCard`) : « Pseudo et nom » (pseudo, prénom, nom sur une ligne en grand
écran) et « Naissance et nationalité » (deux champs côte à côte dès 640 px) ; champs partagés `PersonIdentityFields`
(option `part`), sans icône d’historique de champ (retirée le 27 octobre 2026), `SectionActionBar` avec
soumission native et reprise de conflit ; puis « Zone dangereuse »
(`PersonDangerZone` sur `EntityDangerZone`). Les dates de la fiche sont dans
le bandeau, pas en pied de carte.

## Décisions retenues

- Revue de la fiche du 12 octobre 2026 : [Fiche personne](README.md#fiche-personne--revue-du-12-octobre-2026).
- Champs : [décision du 17 octobre 2026](README.md#champs--décision-courante-du-17-octobre-2026).
- 22 octobre 2026 : composition alignée sur la fiche utilisateur
  ([reprise](#reprise--22-octobre-2026)).
- 25 octobre 2026 : la suppression exige un mot de passe de 30 minutes au
  plus, comme celle d’un compte. Sans preuve, la zone dangereuse ouvre
  « Confirmer la suppression » puis reprend la même demande, sans nouvelle
  confirmation ([DRT-06](../../../audits/2026-10-25-coherence-des-droits.md)).
- 9 novembre 2026 : le choix du statut quitte l’onglet et la carte
  « Naissance et statut » devient « Naissance » ; le statut se calcule depuis
  les passages en cours ([registre](../../../domaines/registre-historique.md#le-passage)).
  L’API refuse un statut envoyé et le journal n’en trace plus.
- 10 novembre 2026 (« fais la 2B d’abord et la nationalité ») : la carte
  devient « Naissance et nationalité ». Une seule nationalité, code ISO à deux
  lettres (`Person.nationality`, contrôlé par la base), choisie parmi les pays
  habités et le Kosovo ; la liste vit dans `countries.constants.ts`, hors de la
  bibliothèque des téléphones (AC-49). Même droits que l’identité
  (`persons:view`, `persons:update`) ; tracée « Identité · Nationalité » dans
  le journal, valeur chiffrée. La création ne la demande pas (règle « Ce que
  demande une création ») ; l’API l’accepte. Le même jour (« possible d’avoir
  les drapeaux à l’intérieur ? »), chaque pays porte son drapeau
  ([préférence](../../../design/preferences.md)).

- 10 novembre 2026 (« pourquoi ancien pseudo et pas juste autre pseudo ? »,
  puis « ok go ») : carte « Autres pseudos » sous « Pseudo et nom » ; le même
  jour, elle rejoint l’onglet [En ligne](fiche-en-ligne.md), avec le droit des
  coordonnées, pour laisser à Identité ses champs principaux (« ok go » sur
  trois onglets). Décision d’origine : Un autre
  pseudo couvre l’ancien, le compte secondaire (celui d’un banni qui revient)
  et le surnom : pseudo, précision facultative (suggestions « Ancien pseudo »,
  « Compte secondaire », « Surnom » ; « Pseudo en jeu » retiré le même jour,
  un nom en jeu étant un compte de jeu dans Coordonnées) et
  « Utilisé jusqu’à » facultatif, à l’année, au mois ou au jour. Saisis à la
  main, y compris ceux d’avant le site ; un changement de pseudo n’en crée pas
  (le journal garde déjà l’ancien). Vingt au plus, jamais deux fois le même ni
  le pseudo principal. Ils ont leur propre version : en ajouter un ne met pas
  en conflit une identité en cours de modification. Lus avec `persons:view`,
  écrits avec `persons:update`. La recherche du Répertoire les trouve et la
  ligne dit « Autre pseudo : … » ; le choix d’une fiche (passage,
  représentant) aussi.
- 27 octobre 2026 : le propriétaire demande une revue de l’onglet, puis « ok
  go » sur quatre points. Deux cartes titrées nommées d’après leurs champs
  (aucune ne répète l’onglet) ; pseudo, prénom et nom sur une ligne à partir de
  1 024 px ; l’icône « i » des champs, qui ouvrait l’historique (qui et quand),
  devient une horloge, libellé « Historique : Prénom » ; le statut de la
  personne rejoint son avatar dans le fil d’Ariane, comme le rôle sur la fiche
  utilisateur. Le formulaire de création garde sa grille unique. Banc client
  31/31, création 28/28 ; le fil d’Ariane n’est pas simulé dans ce banc.
- 27 octobre 2026 : sur demande du propriétaire (« retire toutes les icônes qui au survol montrent qui a renseigné la donnée », puis « aucune page ne devrait avoir ça, on mettra en place les logs plus tard »), l’historique de champ disparaît de toute l’interface : horloges d’Identité, icônes des fenêtres de coordonnées, bouton « Consulter … et son origine » des lecteurs sans droit de modification, composant `PersonFieldProvenanceHint` et appel client. Le même jour (« fais ce que tu veux » du propriétaire), l’autorisation `audit:view_field_history`, la route `/api/personnes/[id]/historique-champ` et son service sont retirés ; la migration `20261027120000_remove_field_history_permission` efface la clé des autorisations individuelles enregistrées (vérifiée sur PostgreSQL local jetable, puis appliquée par le propriétaire sur la base de travail le 27 octobre 2026). Les événements d’audit et les changements de champ sont conservés pour le futur journal d’activité.

## Points ouverts

Aucun point propre à cette section : REP-D01 à REP-D10 sont clos au périmètre vérifié.
Une double nationalité n’est pas prévue : à rouvrir si un tournoi ou une
licence en a besoin.

## Traces dans le journal

« Fiche modifiée », rubrique Identité : pseudo, prénom, nom, date de naissance
et nationalité ; valeurs chiffrées, lues avec `persons:view`. Les autres
pseudos sont tracés sous « En ligne » ([fiche](fiche-en-ligne.md)).

## Références

- [Page Répertoire](../../../domaines/permissions.md#page-répertoire), fiche [Confidentialité](../../../references/confidentialite.md)
- Audit : [12 octobre 2026](../../../audits/2026-10-12-fiche-personne.md)

## Historique

- 19 octobre 2026 : création de la fiche lors de la réorganisation documentaire.
- 10 novembre 2026 : nationalité ajoutée (carte « Naissance et nationalité »),
  puis carte « Autres pseudos », déplacée le même jour dans l’onglet En ligne.

## Reprise — 22 octobre 2026

Dernière fiche du gabarit B, après la fiche utilisateur et Mon compte (« ok go
la suite »). Les décisions déjà validées s’appliquent par défaut au même
gabarit.

- **Avant** : banc client du 12 octobre rejoué, 29 scénarios sur 30. L’échec
  (`lecture-seule-copie-coordonnees`) était une attente périmée : le lecteur
  simulé n’avait pas `persons:view_contact`, exigé depuis le 15 octobre pour
  voir les coordonnées.

| ID | Nature / priorité | État | Point et traitement |
| --- | --- | --- | --- |
| REP-D11 | Composition, P2 | Clos | Bandeau « Informations personnelles · Identité civile… » en tête d’Identité : titre réservé aux lecteurs d’écran, la carte commence par ses champs |
| REP-D12 | Composition, P2 | Clos | « Dernière modification … par … » répété en pied d’Identité et sous Coordonnées : remplacé par « Créée le … · Modifiée le … par … » une seule fois dans le bandeau (`heroDescription` d’`EntityDetailLayout`) |
| REP-D13 | Harmonisation, P3 | Clos | Zones de suppression divergentes (« Zone danger » sur la fiche utilisateur, autre en-tête ici) : même libellé « Zone dangereuse », même icône et même en-tête teinté dans `EntityDangerZone` et `UserDeletionCard` |
| REP-D14 | Preuve, P3 | Clos | [Banc client du 22 octobre](../../../audits/fiche-personne-2026-10-22/banc-client/README.md) : attente périmée corrigée, contrôles de la nouvelle composition, 30 scénarios sur 30 |

- **Vérifié** : types, lint, Vitest complet (contrats mis à jour), banc client.
- **Non vérifié** : session et serveur réels, lecteur d’écran réel.
