# Feuille de route — priorités de construction

Référence produit révisée le 7 novembre 2026. La page `/systeme/feuille-de-route` présente **30 chantiers, 6 pôles cibles et 5 étapes**. Un chantier peut être un module, une extension, une vue partagée ou une intégration ; ce nombre ne représente pas 30 nouvelles pages.

Le catalogue exécutable se trouve dans [features/roadmap](../../apps/web/src/features/roadmap/roadmap.constants.ts). Ce document fixe les décisions ; la [matrice](intentions/pages/MATRICE_PREPARATION.md) conserve la correspondance avec les anciens projets de pages. Lors d’une modification de priorité ou de périmètre, mettre ces trois références à jour ensemble.

## À quoi sert le site

Décisions du propriétaire du 7 novembre 2026, qui remplacent le plan du 9 octobre :

- **Le site sert d’abord à la trésorerie et à la traçabilité** de tout ce qui concerne la structure, tant qu’elle existe : savoir qui est passé, à quelle fonction, dans quelle équipe et à quelles dates ([registre historique](../domaines/registre-historique.md)).
- **Il s’adresse au bureau et aux managers d’équipe.** Un manager ne voit que son équipe, sans les autres pôles. Joueurs, coachs et autres membres sont des fiches, sans compte ([public du site](../domaines/roles-metier.md#public-du-site--décision-du-7-novembre-2026)).
- **Le site public [noctambule.gg](https://noctambule.gg/) garde ce qui se montre** : jeux, maps, modes, rencontres, résultats, palmarès, calendrier. Ce site-ci garde le passage dans l’équipe, pas le détail du jeu. Rien n’est récupéré de l’un vers l’autre : les utilisateurs saisissent tout à la main, et une information présente sur les deux sites est saisie deux fois, pour le moment.

## État réel et lecture du plan

Les comptes et leur sécurité, le répertoire, les paramètres techniques et le journal d’activité existent. Les paramètres actuels ne constituent pas un profil juridique métier. La navigation rapide de l’en-tête donne un accès direct aux pages autorisées ; elle ne parcourt pas encore de dossiers métier. Le module partenaires a été retiré le 21 septembre 2026 et le module notifications le 9 octobre 2026. Les migrations historiques ne prouvent pas qu’un modèle ou un écran est encore présent.

- **À cadrer** : nouveau périmètre, non livré.
- **À compléter** : une base existe ; la carte précise ce qui reste à construire.
- Les étapes sont un ordre de priorité, sans dates promises. Les prérequis d’une carte doivent être traités, y compris ceux de la même étape.
- Un besoin urgent déjà réel peut modifier cet ordre : échéance documentaire, suivi des mineurs ou paiement à traiter.
- La présente révision organise le plan ; elle ne livre aucun de ces nouveaux modules métier.

## Décisions structurantes

1. **Le registre d’abord, la trésorerie ensuite** : les deux raisons d’être du site passent avant le reste.
2. **Six pôles** : Aujourd’hui, Membres, Relations, Structure, Finances, Système. Le menu n’affiche que les pôles ayant des fonctions livrées et accessibles. Esport rejoint Membres ; Activité se répartit entre Aujourd’hui, Structure et Relations.
3. **Personne et compte restent distincts**. Presque toutes les fiches n’auront jamais de compte. Les adhésions, mandats, contrats et passages sont des relations datées, pas un statut unique. Aucun rapprochement automatique par email.
4. **La portée par équipe ne sert qu’aux managers.** Les modules du bureau utilisent les autorisations actuelles et n’attendent pas ce chantier.
5. **Une page seulement si elle sert** : une donnée se modifie là où on la lit, sans page dédiée inutile ([règles de placement](../domaines/navigation.md#règles-de-placement)).
6. **Les listes de choix se gèrent sur le site** : jeux, fonctions et autres valeurs évoluent sans développement ([listes de référence](../domaines/registre-historique.md#listes-de-référence)).
7. **Préparer plusieurs entités juridiques**, avec leurs dossiers et historiques propres, tout en commençant par l’association réellement utilisée. Une évolution vers une société ne renomme pas les anciens engagements. Un passage n’exige pas d’entité : l’histoire de la structure précède l’association.
8. **Distinguer facture, paiement, note de frais et budget** : ils ont leurs propres états et liens. Un PDF ne remplace pas le cycle de vie d’une facture.
9. **Une source par donnée, plusieurs vues possibles** : les vues personnelles consultent les données du module d’origine.
10. **Livrer le contrôle d’accès avec chaque module** : politique serveur, confidentialité, audit, états d’erreur et tests pertinents.
11. **L’espace personnel évolue avec les modules**, sans construire un tableau de bord rempli de fonctions indisponibles.

## Retraits et regroupements du 7 novembre 2026

| Chantier | Décision | Raison ou déclencheur de reprise |
| --- | --- | --- |
| Planning & disponibilités, Calendrier commun | Retirés | Joueurs sans compte, calendrier tenu sur le site public ; à rouvrir si le bureau ou les managers en ont un besoin réel |
| Compétitions & inscriptions | Retiré | Rencontres, résultats et palmarès restent sur le site public |
| Débriefs, Préparation & analyse vidéo, Performance & objectifs | Retirés | Outils de coachs et de joueurs, sans compte |
| Actualité interne & audiences | Retiré | Annonces destinées à des personnes sans compte |
| À valider | Retiré | Une file globale n’aide pas quelques personnes ; la validation reste dans son module |
| Équipes & saisons, rôles d’Adhésions et rôles | Fusionnés dans **Équipes & parcours** | Pas de saisons : les dates suffisent |
| Gouvernance & décisions, Réunions & décisions de séance | Fusionnés dans **Réunions & décisions** | Les mandats se lisent dans le parcours |
| Notifications personnelles, Rappels & automatisations | Fusionnés dans **Rappels & notifications** | Peu de destinataires, un seul besoin |
| Listes de référence | Ajouté | Ne pas être bloqué par une liste figée |

Regroupements toujours valables :

| Ancienne présentation | Décision |
| --- | --- |
| Membres, adhérents, contacts, staff | Une identité au Répertoire ; relations et historiques dédiés, vues filtrées |
| Mes tâches et tâches internes | Même source, vues personnelles et collectives |
| Prochaines réunions, rappels, alertes | Vues de Mon travail ; la source garde son échéance |
| Recettes et dépenses | Filtres des règlements ; factures et demandes de remboursement restent distinctes |
| Cotisations | Adhésion/campagne chez Membres, montant attendu et règlement côté Finances |
| Sponsoring | Accord et livrables chez Relations, factures et règlements côté Finances |
| Archives, exports, modèles | Dans les modules propriétaires ; outils transverses limités à leur responsabilité |
| Incidents | Structure, dossier confidentiel ; seuls les effets autorisés remontent dans les fiches |
| Matériel et accès confiés | Structure, avec attributions et restitutions ; ne contient pas de mots de passe |
| Accueils de pôle vides | Pas de page autonome sans synthèse utile |
| Messagerie interne | Pas de chantier dédié actuellement |

## 1. Registre historique

Savoir qui est passé dans la structure et le garder dans la durée.

- **Listes de référence** (Système) : Une page avec un onglet par liste (jeux, fonctions), ajout direct depuis un champ et champ à choix multiples réutilisable.
- **Équipes & parcours** (Membres) : Équipes par jeu, passages datés (équipe ou structure, fonction, début, fin, dates approximatives admises), onglet Parcours de la fiche, membres actuels et anciens de chaque équipe, anciens pseudos.
- **Accès & responsabilités métier** (Système, **à compléter**) : Liaison explicite entre un compte et une fiche, et portée par équipe, pour qu’un manager ne voie que son équipe. Partie utile du modèle retenu le 25 octobre 2026 ([décision](../domaines/roles-metier.md#décision-du-25-octobre-2026--modèle-dautorisation-retenu-rev-15)).
- **Confidentialité & conservation** (Structure) : Règles de conservation écrites et validées, purge des coordonnées après le départ, anonymisation à la demande.
- **Données, exports & sauvegardes** (Système, **à compléter**) : Export lisible du registre, suivi des sauvegardes et restauration essayée.

## 2. Trésorerie

Suivre l’argent de la structure et ce qui le justifie.

- **Identité juridique & périmètres** (Structure) : Entité porteuse, identifiants, règles datées, assurances et responsabilités ; prérequis des comptes.
- **Comptes & rapprochement** (Finances) : Exercices, comptes bancaires et caisses, titulaire, devise, soldes initiaux et relevés.
- **Organisations & contacts** (Relations) : Identité de l’organisation, interlocuteurs du répertoire et relations datées.
- **Opérations & règlements** (Finances) : Encaissements, décaissements, virements, justificatifs et affectations aux sommes dues. Premier consommateur du dépôt de pièces.
- **Adhésions & cotisations** (Membres, **à compléter**) : Campagnes d’adhésion, adhésions datées et état de cotisation.
- **Facturation & achats** (Finances) : Factures clients/fournisseurs, pièces, échéances et règlements ; émission ou import selon l’outil retenu.
- **Notes de frais & remboursements** (Finances) : Dossier, lignes de frais, justificatifs, décision et règlement.
- **Contrôles & clôtures** (Finances) : Validations, pièces manquantes, historique, exports et clôture d’exercice.

## 3. Vie de la structure

Garder la mémoire des décisions, des documents et des actions.

- **Projets & tâches** (Aujourd’hui) : Tâches assignées, échéances, statuts et liens vers le dossier source ; vue personnelle.
- **Réunions & décisions** (Structure) : Instances, participants du répertoire, ordre du jour, compte rendu, décisions et tâches liées.
- **Documents & acceptations** (Structure) : Bibliothèque, versions, modèles et acceptations saisies par le bureau.
- **Contrats & obligations** (Structure) : Parties, entité signataire, période, obligations, avenants, échéances et pièces.
- **Partenariats & opportunités** (Relations) : Opportunités, responsables, engagements, livrables et échéances liés aux contrats.
- **Incidents & sanctions** (Structure) : Signalement, faits, preuves, instruction, décision, recours et durée.
- **Mon travail & espace personnel** (Aujourd’hui, **à compléter**) : Mes tâches, mes réunions à venir, les documents en attente et les échéances proches.
- **Journal d’activité** (Système, **à compléter**) : Livré le 30 octobre 2026 : vue filtrable, recherche par auteur ou compte, suivi des consultations ; reste l’export autorisé.

## 4. Pilotage

Exploiter des données fiables pour décider.

- **Budget & pilotage** (Finances) : Budgets versionnés, enveloppes par équipe/projet, écarts et prévisions de trésorerie.
- **Recherche dans les dossiers** (Système, **à compléter**) : Recherche métier progressive, extraits limités et liens vers les fiches.

## 5. Selon les besoins

Ajouter ce qui répond à un usage réel, sans le construire d’avance.

- **Rappels & notifications** (Système) : Boîte personnelle, rappels métier liés à leur source et règles limitées avec historique d’exécution.
- **Intégrations & publication publique** (Système) : Publication validée des équipes et des parcours vers noctambule.gg, avec des identifiants stables, si la double saisie devient trop lourde.
- **Arrivées et départs** (Membres) : Checklists datées, responsables, étapes et vue collective des dossiers ouverts.
- **Recrutement** (Membres) : Poste ou équipe visée, essais, évaluations confidentielles et décision.
- **Ressources & logistique** (Structure) : Inventaire, prêts, retours, maintenance, déplacements, LAN et bootcamps.
- **Communication & contenus** (Relations) : Calendrier éditorial, ressources graphiques, audience et validation avant publication.
- **Gains de compétition & primes** (Finances) : Montants annoncés, confirmés et reçus ; parts contractuelles et versements.

## Pages et onglets prévus

Toutes les pages visées, avec leurs onglets et leur contenu. Ce plan s’affiche aussi sur la page Feuille de route, depuis [roadmap-site-plan.data.ts](../../apps/web/src/features/roadmap/roadmap-site-plan.data.ts) : les modifier ensemble. Il suit les [règles des onglets](../design/gabarits.md#onglets-dune-fiche). L’état d’un onglet n’est jamais antérieur à celui de sa page ; un onglet n’apparaît qu’une fois livré et pour les comptes qui y ont droit.

Quatre chantiers n’ont pas de page à eux, pour ne pas en créer d’inutile : **Accès & responsabilités métier** vit sur la fiche utilisateur et dans la liste des fonctions, **Confidentialité & conservation** dans Paramètres système, **Recherche dans les dossiers** dans la recherche de l’en-tête, **Intégrations & publication publique** n’a pas d’écran propre tant qu’elle n’est pas cadrée.

### Aujourd’hui

| Page | Onglet | Contenu | État |
| --- | --- | --- | --- |
| **Mon travail** | — | Accueil, sans onglet. Accueillera mes tâches, mes réunions à venir, les documents en attente et les échéances proches. | Livré |
| **Tâches** | — | Liste, sans onglet : les tâches du bureau, avec le filtre « Mes tâches ». Détail en fenêtre. | Étape 3 |
| **Mon compte** | — | Depuis le menu du compte, pas dans un pôle. | Livré |
|  | Profil | Prénom, nom, identifiant, email de contact. | Livré |
|  | Autorisations | Ce que mon compte permet, en lecture seule. | Livré |
|  | Sécurité | Mot de passe, double authentification, sessions. | Livré |

### Membres

| Page | Onglet | Contenu | État |
| --- | --- | --- | --- |
| **Répertoire** | — | Liste, sans onglet : toutes les fiches, avec recherche et filtres. | Livré |
| **Fiche personne** | Identité | Pseudo, nom, naissance, statut, jeux pratiqués (étape 1), zone dangereuse. | Livré |
|  | Coordonnées | Emails, téléphones, réseaux sociaux. | Livré |
|  | Parcours | Passages datés : équipe ou structure, fonction, début, fin ; anciens pseudos. | Étape 1 |
|  | Adhésions | Adhésions par campagne et état de cotisation. | Étape 2 |
|  | Documents | Pièces liées à la personne. | Étape 3 |
|  | Sanctions | Sanctions et bans datés, réservés aux personnes habilitées. | Étape 3 |
| **Équipes** | — | Liste, sans onglet : les équipes par jeu, actives ou archivées. Création en fenêtre. | Étape 1 |
| **Fiche équipe** | Effectif | Membres actuels et anciens, composition à une date. Seul onglet d’un manager. | Étape 1 |
|  | Informations | Nom, jeu, archivage. | Étape 1 |
| **Adhésions** | Adhérents | Adhésions de la campagne choisie et état de cotisation. | Étape 2 |
|  | Campagnes | Périodes d’adhésion et leurs conditions. | Étape 2 |
| **Recrutement** | — | Onglets définis à son cadrage. | Étape 5 |
| **Arrivées et départs** | — | Onglets définis à son cadrage. | Étape 5 |

### Relations

| Page | Onglet | Contenu | État |
| --- | --- | --- | --- |
| **Organisations** | — | Liste, sans onglet : partenaires, sponsors, clients et fournisseurs. | Étape 2 |
| **Fiche organisation** | Identité | Nom, type, adresse, identifiants. | Étape 2 |
|  | Contacts | Interlocuteurs, liés aux fiches du Répertoire. | Étape 2 |
|  | Règlements | Factures et opérations liées. | Étape 2 |
|  | Contrats | Contrats et partenariats en cours et passés. | Étape 3 |
| **Partenariats** | — | Liste, sans onglet : opportunités et accords. | Étape 3 |
| **Fiche partenariat** | Accord | Parties, période, contreparties, état. | Étape 3 |
|  | Livrables | Ce qui est promis, livré ou à renouveler. | Étape 3 |
|  | Documents | Pièces liées à l’accord. | Étape 3 |
| **Communication** | — | Onglets définis à son cadrage. | Étape 5 |

### Structure

| Page | Onglet | Contenu | État |
| --- | --- | --- | --- |
| **Identité juridique** | Identité | Dénomination, forme, identifiants, adresse. | Étape 2 |
|  | Mandats | Qui occupe quelle fonction, lu depuis les parcours. | Étape 2 |
|  | Assurances | Assurances, affiliations, licences et leurs échéances. | Étape 2 |
|  | Documents | Statuts et pièces officielles. | Étape 3 |
| **Réunions** | Réunions | Réunions passées et à venir. | Étape 3 |
|  | Décisions | Toutes les décisions, retrouvables sans ouvrir chaque réunion. | Étape 3 |
| **Fiche réunion** | Préparation | Instance, date, participants, ordre du jour. | Étape 3 |
|  | Compte rendu | Ce qui a été dit. | Étape 3 |
|  | Décisions | Décisions prises, avec portée et preuve. | Étape 3 |
|  | Tâches | Actions issues de la réunion. | Étape 3 |
| **Documents** | — | Liste, sans onglet : la bibliothèque de la structure. | Étape 3 |
| **Fiche document** | Document | Titre, nature, état, version en vigueur. | Étape 3 |
|  | Versions | Toutes les versions et leurs dates. | Étape 3 |
|  | Acceptations | Qui a accepté quelle version, saisi par le bureau. | Étape 3 |
| **Contrats** | — | Liste, sans onglet : contrats en cours et passés. | Étape 3 |
| **Fiche contrat** | Contrat | Parties, entité signataire, période, état. | Étape 3 |
|  | Obligations | Obligations, échéances et avenants. | Étape 3 |
|  | Règlements | Factures et opérations liées. | Étape 3 |
|  | Documents | Pièces signées. | Étape 3 |
| **Incidents** | — | Liste, sans onglet, réservée aux personnes habilitées. | Étape 3 |
| **Fiche incident** | Faits | Signalement, personnes concernées, dates. | Étape 3 |
|  | Instruction | Preuves et échanges. | Étape 3 |
|  | Décision | Décision, recours et durée. | Étape 3 |
|  | Documents | Pièces du dossier. | Étape 3 |
| **Ressources & logistique** | — | Onglets définis à son cadrage. | Étape 5 |

### Finances

| Page | Onglet | Contenu | État |
| --- | --- | --- | --- |
| **Comptes** | Comptes | Comptes bancaires et caisses, avec leur solde. | Étape 2 |
|  | Exercices | Exercices ouverts et clôturés ; la clôture se fait ici. | Étape 2 |
| **Fiche compte** | Mouvements | Opérations de ce compte. | Étape 2 |
|  | Relevés | Relevés et rapprochement. | Étape 2 |
|  | Informations | Titulaire, devise, solde initial. | Étape 2 |
| **Opérations** | — | Liste, sans onglet : encaissements, décaissements et virements. Recettes et dépenses sont des filtres. | Étape 2 |
| **Fiche opération** | Opération | Date, montant, compte, catégorie, tiers. | Étape 2 |
|  | Affectations | À quelles sommes dues elle se rapporte. | Étape 2 |
|  | Justificatifs | Pièces de l’opération. | Étape 2 |
| **Factures** | — | Liste, sans onglet : ventes et achats, avec leur échéance. | Étape 2 |
| **Fiche facture** | Facture | Lignes, montants, échéance, état. | Étape 2 |
|  | Règlements | Paiements reçus ou versés, même partiels. | Étape 2 |
|  | Justificatifs | Pièces de la facture. | Étape 2 |
| **Notes de frais** | — | Liste, sans onglet : demandes de remboursement et leur état. | Étape 2 |
| **Fiche note de frais** | Demande | Demandeur, lignes de frais, total. | Étape 2 |
|  | Justificatifs | Pièces de la demande. | Étape 2 |
|  | Règlements | Décision et remboursement. | Étape 2 |
| **Contrôles** | Pièces manquantes | Opérations et factures sans justificatif. | Étape 2 |
|  | Validations | Ce qui attend une validation. | Étape 2 |
|  | Exports | Exports par exercice. | Étape 2 |
| **Budget** | — | Liste, sans onglet : les budgets, par version. | Étape 4 |
| **Fiche budget** | Prévisions | Enveloppes par équipe ou par projet. | Étape 4 |
|  | Suivi | Réalisé, écarts et trésorerie prévue. | Étape 4 |
| **Gains & primes** | — | Onglets définis à son cadrage. | Étape 5 |

### Système

| Page | Onglet | Contenu | État |
| --- | --- | --- | --- |
| **Utilisateurs** | — | Liste, sans onglet : les comptes, avec recherche et filtres. | Livré |
| **Fiche utilisateur** | Profil | Identité, connexion, contact ; fiche Répertoire liée (étape 1). | Livré |
|  | Autorisations | Rôle et autorisations du compte. | Livré |
|  | Sécurité | État du compte, mot de passe, double authentification, sessions. | Livré |
| **Journal d’activité** | — | Liste, sans onglet : qui a fait quoi. Export à venir (étape 3). | Livré |
| **Paramètres système** | — | Réglages, sans onglet. Accueillera la conservation des coordonnées (étape 1). | Livré |
| **Listes de référence** | Jeux | Ajouter, renommer, archiver. | Étape 1 |
|  | Fonctions | Ajouter, renommer, archiver ; réglage « Donne accès à son équipe ». | Étape 1 |
| **Données** | Exports | Export lisible du registre. | Étape 1 |
|  | Sauvegardes | État des sauvegardes et dernière restauration essayée. | Étape 1 |
| **Rappels & notifications** | — | Onglets définis à son cadrage. | Étape 5 |
| **Feuille de route** | — | Lecture, sans onglet : chantiers, pages et onglets prévus. | Livré |

## Passage d’un chantier au menu

Avant livraison : préciser le responsable métier, les objets sources, le premier parcours utile, les permissions et périmètres, les documents conservés, les règles d’archivage et les critères de réussite. Les noms de modèles futurs restent indicatifs jusqu’à leur conception.

À la livraison : déclarer la fonctionnalité active, vérifier ses routes et politiques serveur, ajouter sa navigation, couvrir ses états vide/chargement/erreur/refus/conflit et mettre à jour le catalogue. Une ancienne URL planifiée ne devient pas disponible par simple ajout au menu.

Les automatisations, statistiques et connexions externes restent conditionnées aux usages, à la qualité des données et à un mode d’exploitation viable. La feuille de route n’engage aucun fournisseur ni changement d’infrastructure.

## Références

- [Registre historique et parcours](../domaines/registre-historique.md)
- [Navigation](../domaines/navigation.md)
- [Structure et entités juridiques](../domaines/structure-juridique.md)
- [Rôles et périmètres](../domaines/roles-metier.md)
- [Permissions actives](../domaines/permissions.md)
- [Audit du 22 septembre](../audits/2026-09-22-feuille-de-route-long-terme.md), photographie avant la refonte du 9 octobre
