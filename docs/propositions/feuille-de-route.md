# Feuille de route — priorités de construction

Référence produit révisée le 7 novembre 2026. La page `/systeme/feuille-de-route` présente **38 chantiers, 6 pôles cibles et 10 étapes**. Un chantier peut être un module, une extension, une vue partagée ou une intégration ; ce nombre ne représente pas 38 nouvelles pages.

Le catalogue exécutable se trouve dans [features/roadmap](../../apps/web/src/features/roadmap/roadmap.constants.ts). Ce document fixe les décisions ; la [matrice](intentions/pages/MATRICE_PREPARATION.md) conserve la correspondance avec les anciens projets de pages. Lors d’une modification de priorité ou de périmètre, mettre ces trois références à jour ensemble.

## À quoi sert le site

Décisions du propriétaire du 7 novembre 2026, qui remplacent le plan du 9 octobre :

- **Le site sert d’abord à la trésorerie et à la traçabilité** de tout ce qui concerne la structure, tant qu’elle existe : savoir qui est passé, à quelle fonction, dans quelle équipe et à quelles dates ([registre historique](../domaines/registre-historique.md)).
- **Il s’adresse au bureau et aux managers d’équipe.** Un manager ne voit que son équipe, sans les autres pôles. Joueurs, coachs et autres membres sont des fiches, sans compte ([public du site](../domaines/roles-metier.md#public-du-site--décision-du-7-novembre-2026)).
- **Le site public [noctambule.gg](https://noctambule.gg/) garde ce qui se montre** : jeux, maps, modes, rencontres, résultats, palmarès, calendrier. Ce site-ci garde le passage dans l’équipe et le dossier de chaque tournoi (gains, problèmes, bans), pas le détail du jeu. Rien n’est récupéré de l’un vers l’autre : les utilisateurs saisissent tout à la main, et une information présente sur les deux sites est saisie deux fois, pour le moment.

## État réel et lecture du plan

Les comptes et leur sécurité, le répertoire, les paramètres techniques et le journal d’activité existent. Les paramètres actuels ne constituent pas un profil juridique métier. La navigation rapide de l’en-tête donne un accès direct aux pages autorisées ; elle ne parcourt pas encore de dossiers métier. Le module partenaires a été retiré le 21 septembre 2026 et le module notifications le 9 octobre 2026. Les migrations historiques ne prouvent pas qu’un modèle ou un écran est encore présent.

- **À cadrer** : nouveau périmètre, non livré.
- **À compléter** : une base existe ; la carte précise ce qui reste à construire.
- Les étapes sont un ordre de priorité, sans dates promises. Chacune est courte et livre un ensemble utilisable avant de passer à la suivante. Les prérequis d’une carte doivent être traités, y compris ceux de la même étape.
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
| Planning & disponibilités, Débriefs, Préparation & analyse vidéo, Performance & objectifs | Regroupés dans **Suivi sportif**, en réserve | Joueurs sans compte ; à ouvrir pour les managers si le besoin est réel |
| Calendrier commun | Réduit à **Calendrier du bureau** | Réunions, échéances et renouvellements ; le calendrier sportif reste sur le site public |
| Compétitions & inscriptions | Réduit à **Tournois** | Liste, participants, gains, problèmes et bans ; rencontres, résultats et palmarès restent sur le site public |
| Actualité interne & audiences | Transformé en **Chronologie de la structure** | Les grands faits de la structure, sans audience ni annonce |
| À valider | Retiré | Une file globale n’aide pas quelques personnes ; la validation reste dans son module |
| Équipes & saisons, rôles d’Adhésions et rôles | Fusionnés dans **Équipes & parcours** | Pas de saisons : les dates suffisent |
| Gouvernance & décisions, Réunions & décisions de séance | Fusionnés dans **Réunions & décisions** | Les mandats se lisent dans le parcours |
| Notifications personnelles, Rappels & automatisations | Fusionnés dans **Rappels & notifications** | Peu de destinataires, un seul besoin |
| Listes de référence, Subventions & dons, Bilan annuel, Événements & déplacements, Salariés & paie | Ajoutés | Ne pas être bloqué par une liste figée ; couvrir ce qu’une structure rencontre sur la durée |

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

## 1. Listes & parcours

Savoir qui est passé dans la structure, à quelle fonction et dans quelle équipe.

- **Listes de référence** (Système) : Une page avec un onglet par liste (jeux, fonctions, étiquettes, puis catégories et moyens de paiement), ajout direct depuis un champ et champ à choix multiples réutilisable.
- **Équipes & parcours** (Membres) : Équipes par jeu et leurs anciens noms, passages datés (équipe ou structure, fonction, début, fin, motif de fin, dates approximatives admises), onglet Parcours, membres actuels et anciens, anciens pseudos. Fiche complétée : nationalité, étiquettes, adresse, identifiants de jeu, contact d’urgence, représentants légaux.

## 2. Accès & conservation

Ouvrir le site aux managers et garder le registre dans la durée.

- **Accès & responsabilités métier** (Système, **à compléter**) : Liaison explicite entre un compte et une fiche, et portée par équipe.
- **Confidentialité & conservation** (Structure) : Règles de conservation écrites, purge des coordonnées après le départ et anonymisation à la demande.
- **Données, exports & sauvegardes** (Système, **à compléter**) : Export lisible du registre, suivi des sauvegardes et restauration essayée.

## 3. Socle de trésorerie

Suivre les comptes et l’argent réellement reçu ou versé.

- **Identité juridique & périmètres** (Structure) : Entité porteuse, identifiants, règles datées, assurances et responsabilités.
- **Comptes & rapprochement** (Finances) : Exercices, comptes bancaires et caisses, titulaire, devise, soldes initiaux et relevés.
- **Organisations & contacts** (Relations) : Identité de l’organisation, interlocuteurs du répertoire et relations datées.
- **Opérations & règlements** (Finances) : Encaissements, décaissements, virements, catégories, moyens de paiement, justificatifs et affectations aux sommes dues ; lien vers une personne, une organisation, un tournoi ou une adhésion.

## 4. Trésorerie complète

Couvrir factures, frais, subventions, adhésions et contrôles.

- **Adhésions & cotisations** (Membres, **à compléter**) : Campagnes d’adhésion, adhésions datées et état de cotisation, rattachés aux fiches du répertoire.
- **Facturation & achats** (Finances) : Factures clients/fournisseurs, pièces, échéances et règlements ; émission ou import selon l’outil retenu.
- **Notes de frais & remboursements** (Finances) : Dossier, lignes de frais, justificatifs, décision et règlement.
- **Subventions & dons** (Finances) : Dossiers de subvention, échéances et versements ; dons et reçus.
- **Contrôles & clôtures** (Finances) : Validations, pièces manquantes, historique, exports et clôture d’exercice.

## 5. Tournois & suivi

Garder le dossier de chaque tournoi et le suivi des personnes.

- **Tournois** (Membres) : Liste des tournois avec organisateur, règlement, frais, échéances et classement final ; participants, gains, problèmes et bans. Les rencontres restent sur le site public.
- **Gains de compétition & primes** (Finances) : Montants annoncés, confirmés et reçus ; parts contractuelles et versements.
- **Suivi, incidents & sanctions** (Structure) : Onglet Suivi de la fiche : notes, problèmes et bans, par tournoi ou par jeu. Dossiers d’incident : faits, preuves, instruction, décision, recours et durée.

## 6. Vie du bureau

Suivre les tâches, les dates et les décisions.

- **Projets & tâches** (Aujourd’hui) : Tâches assignées, échéances, statuts et liens vers le dossier source ; vue personnelle.
- **Calendrier du bureau** (Aujourd’hui) : Réunions, échéances, renouvellements et dates limites de tournois, lus depuis leurs modules ; événements privés.
- **Réunions & décisions** (Structure) : Instances, participants du répertoire, ordre du jour, compte rendu, décisions et tâches liées ; les mandats se lisent dans le parcours.

## 7. Documents & engagements

Retrouver les pièces et ce que la structure a promis.

- **Documents & acceptations** (Structure) : Bibliothèque, versions, modèles et acceptations saisies par le bureau.
- **Contrats & obligations** (Structure) : Parties, entité signataire, période, obligations, avenants, échéances et pièces.
- **Partenariats & opportunités** (Relations) : Opportunités, responsables, engagements, livrables et échéances liés aux contrats.
- **Mon travail & espace personnel** (Aujourd’hui, **à compléter**) : Mes tâches, mes réunions à venir, les documents en attente et les échéances proches.
- **Journal d’activité** (Système, **à compléter**) : Vue globale filtrable, recherche par acteur et par catégorie, export autorisé et suivi des accès.

## 8. Mémoire & continuité

Transmettre le matériel, les accès et l’histoire de la structure.

- **Matériel & abonnements** (Structure) : Inventaire, prêts, maillots et stock ; services, domaines et licences avec titulaire, coût et échéance, jamais de mot de passe.
- **Arrivées, départs & passations** (Membres) : Checklists datées, responsables, étapes et vue collective des dossiers ouverts ; passation d’un mandat.
- **Chronologie de la structure** (Structure) : Faits datés saisis par le bureau ou tirés des modules : arrivée, départ, changement de roster, sponsor, décision, titre.

## 9. Pilotage

Exploiter des données fiables pour décider.

- **Budget & pilotage** (Finances) : Budgets versionnés, enveloppes par équipe/projet, écarts, prévisions de trésorerie et bilan par mois ou par année.
- **Bilan annuel** (Structure) : Par année : membres et mouvements, tournois et gains, finances, décisions ; prêt pour l’assemblée générale.
- **Recherche dans les dossiers** (Système, **à compléter**) : Recherche métier progressive, extraits limités et liens vers les fiches.

## 10. Selon les besoins

Ajouter ce qui répond à un usage réel, sans le construire d’avance.

- **Rappels & notifications** (Système) : Boîte personnelle, rappels métier liés à leur source et règles limitées avec historique d’exécution.
- **Intégrations & publication publique** (Système) : Publication validée des équipes et des parcours vers noctambule.gg, avec des identifiants stables.
- **Suivi sportif** (Membres) : Entraînements, présences, objectifs, débriefs et préparation, à choisir au cadrage.
- **Événements & déplacements** (Structure) : Participants, hébergement, transport, budget et pièces.
- **Salariés & paie** (Membres) : Contrats de travail, périodes et pièces, à cadrer avec la forme juridique.
- **Recrutement** (Membres) : Poste ou équipe visée, essais, évaluations confidentielles et décision.
- **Communication & contenus** (Relations) : Calendrier éditorial, ressources graphiques, audience et validation avant publication.

## Couverture d’une structure esport

Relecture du 7 novembre 2026 : chaque sujet qu’une structure esport rencontre sur la durée, et l’endroit qui le prend en charge. Elle confronte le plan aux [intentions historiques](intentions/README.md) et à la vie d’une structure ; un sujet absent s’ajoute ici avant de devenir un chantier. Les obligations légales citées restent à qualifier pour la situation réelle.

| Sujet | Pris en charge par |
| --- | --- |
| Identité d’une personne, nationalité, adresse, identifiants de jeu, contact d’urgence | Fiche personne |
| Mineurs : représentants légaux, autorisations, droit à l’image | Fiche personne, Confidentialité & conservation |
| Qui a été où, à quelle fonction, et pourquoi il est parti | Parcours |
| Effectifs et anciens noms d’une équipe | Fiche équipe |
| Tournois : frais, classement, participants, gains | Tournois, Gains de compétition & primes |
| Notes, problèmes, bans, sanctions, signalements | Suivi, Incidents |
| Adhésions et cotisations | Adhésions & cotisations |
| Recettes, dépenses, comptes, factures, frais, clôtures | Trésorerie (étapes 3 et 4) |
| Sponsoring, subventions, dons | Partenariats, Subventions & dons |
| Ventes de la boutique | Catégorie d’opération ; le stock dans Matériel & abonnements |
| Contrats de joueurs, de staff, de partenaires | Contrats & obligations |
| Salariat et paie, si la structure emploie | Salariés & paie, avec un outil de paie |
| Bénévolat et valorisation des heures | À cadrer avec Subventions & dons |
| Assemblées, bureau, mandats, votes, statuts | Identité juridique, Réunions & décisions |
| Assurances, affiliations, licences, marque | Identité juridique |
| Changement de forme juridique | Identité juridique, relations datées |
| Matériel, maillots, prêts | Matériel & abonnements |
| Comptes, domaines et abonnements de la structure | Matériel & abonnements |
| Changement de bureau, passation | Arrivées, départs & passations |
| LAN, bootcamps, déplacements | Événements & déplacements |
| Recrutement et essais | Recrutement |
| Suivi quotidien d’une équipe | Suivi sportif, en réserve |
| Communication et visibilité | Communication & contenus |
| Mémoire de la structure, bilan pour l’assemblée | Chronologie, Bilan annuel |
| Échéances et rappels | Calendrier, Rappels & notifications |
| Données personnelles, durées, effacement | Confidentialité & conservation |
| Survie des données, export, sauvegardes | Données, exports & sauvegardes |
| Rencontres, résultats, palmarès, calendrier sportif, boutique | Site public, hors de ce site |
| Échanges quotidiens | Discord, hors de ce site |

## Pages et onglets prévus

Toutes les pages visées, avec leurs onglets et leur contenu. Ce plan s’affiche aussi sur la page Feuille de route, depuis [roadmap-site-plan.data.ts](../../apps/web/src/features/roadmap/roadmap-site-plan.data.ts) : les modifier ensemble. Il suit les [règles des onglets](../design/gabarits.md#onglets-dune-fiche). L’état d’un onglet n’est jamais antérieur à celui de sa page ; un onglet n’apparaît qu’une fois livré et pour les comptes qui y ont droit.

Cinq chantiers n’ont pas de page à eux, pour ne pas en créer d’inutile : **Accès & responsabilités métier** vit sur la fiche utilisateur et dans la liste des fonctions, **Confidentialité & conservation** dans Paramètres système, **Gains de compétition & primes** sur la fiche tournoi, **Recherche dans les dossiers** dans la recherche de l’en-tête, **Intégrations & publication publique** n’a pas d’écran propre tant qu’elle n’est pas cadrée.

### Aujourd’hui

| Page | Onglet | Contenu | État |
| --- | --- | --- | --- |
| **Mon travail** | — | Accueil, sans onglet. Accueillera mes tâches, mes réunions à venir, les documents en attente et les échéances proches. | Livré |
| **Tâches** | — | Liste, sans onglet : les tâches du bureau, avec le filtre « Mes tâches ». Détail en fenêtre. | Étape 6 |
| **Calendrier** | — | Lecture, sans onglet : réunions, échéances, renouvellements et dates limites, lus depuis leurs modules. | Étape 6 |
| **Mon compte** | — | Depuis le menu du compte, pas dans un pôle. | Livré |
|  | Profil | Prénom, nom, identifiant, email de contact. | Livré |
|  | Autorisations | Ce que mon compte permet, en lecture seule. | Livré |
|  | Sécurité | Mot de passe, double authentification, sessions. | Livré |

### Membres

| Page | Onglet | Contenu | État |
| --- | --- | --- | --- |
| **Répertoire** | — | Liste, sans onglet : toutes les fiches, avec recherche et filtres. À venir (étape 1) : filtres par équipe, jeu, étiquette et anciens membres. | Livré |
| **Fiche personne** | Identité | Pseudo, nom, naissance, zone dangereuse ; statut calculé depuis le parcours, nationalité, jeux pratiqués et étiquettes (étape 1). | Livré |
|  | Coordonnées | Emails, téléphones, réseaux sociaux ; adresse, identifiants de jeu, contact d’urgence et représentants légaux (étape 1). | Livré |
|  | Parcours | Passages datés : équipe ou structure, fonction, début, fin, motif de fin ; tournois joués ; anciens pseudos. | Étape 1 |
|  | Adhésions | Adhésions par campagne et état de cotisation. | Étape 4 |
|  | Finances | Cotisations réglées, remboursements et gains versés. | Étape 4 |
|  | Documents | Contrats, autorisations et chartes acceptées. | Étape 7 |
|  | Matériel | Prêts et restitutions, taille de maillot. | Étape 8 |
|  | Suivi | Notes datées, problèmes et bans, par tournoi ou par jeu, réservés aux personnes habilitées. | Étape 5 |
| **Équipes** | — | Liste, sans onglet : les équipes par jeu, actives ou archivées. Création en fenêtre. | Étape 1 |
| **Fiche équipe** | Effectif | Membres actuels et anciens, composition à une date. Seul onglet d’un manager. | Étape 1 |
|  | Tournois | Tournois joués par cette équipe. | Étape 5 |
|  | Informations | Nom, anciens noms, jeu, archivage. | Étape 1 |
| **Adhésions** | Adhérents | Adhésions de la campagne choisie et état de cotisation. | Étape 4 |
|  | Campagnes | Périodes d’adhésion et leurs conditions. | Étape 4 |
| **Tournois** | — | Liste, sans onglet : les tournois, par jeu et par année. Création en fenêtre. | Étape 5 |
| **Fiche tournoi** | Informations | Nom, jeu, organisateur, dates, règlement, frais, échéances, classement final. | Étape 5 |
|  | Participants | Équipes et membres engagés. | Étape 5 |
|  | Gains | Montants annoncés, confirmés et reçus, et leur répartition. | Étape 5 |
|  | Suivi | Problèmes et bans liés à ce tournoi, réservés aux personnes habilitées. | Étape 5 |
| **Recrutement** | — | Onglets définis à son cadrage. | Étape 10 |
| **Suivi sportif** | — | Onglets définis à son cadrage. | Étape 10 |
| **Salariés & paie** | — | Onglets définis à son cadrage. | Étape 10 |
| **Arrivées, départs & passations** | Dossiers | Arrivées, départs et passations en cours, avec leur checklist. | Étape 8 |
|  | Modèles | Checklists types. | Étape 8 |

### Relations

| Page | Onglet | Contenu | État |
| --- | --- | --- | --- |
| **Organisations** | — | Liste, sans onglet : partenaires, sponsors, clients et fournisseurs. | Étape 3 |
| **Fiche organisation** | Identité | Nom, type, adresse, identifiants. | Étape 3 |
|  | Contacts | Interlocuteurs, liés aux fiches du Répertoire. | Étape 3 |
|  | Règlements | Factures et opérations liées. | Étape 3 |
|  | Contrats | Contrats et partenariats en cours et passés. | Étape 7 |
| **Partenariats** | — | Liste, sans onglet : opportunités et accords. | Étape 7 |
| **Fiche partenariat** | Accord | Parties, période, contreparties, état. | Étape 7 |
|  | Livrables | Ce qui est promis, livré ou à renouveler. | Étape 7 |
|  | Documents | Pièces liées à l’accord. | Étape 7 |
| **Communication** | — | Onglets définis à son cadrage. | Étape 10 |

### Structure

| Page | Onglet | Contenu | État |
| --- | --- | --- | --- |
| **Identité juridique** | Identité | Dénomination, forme, identifiants, adresse. | Étape 3 |
|  | Mandats | Qui occupe quelle fonction, lu depuis les parcours. | Étape 3 |
|  | Assurances | Assurances, affiliations, licences, marque, et leurs échéances. | Étape 3 |
|  | Documents | Statuts et pièces officielles. | Étape 7 |
| **Chronologie** | — | Lecture, sans onglet : les grands faits de la structure depuis ses débuts, saisis ou tirés des modules. | Étape 8 |
| **Réunions** | Réunions | Réunions passées et à venir. | Étape 6 |
|  | Décisions | Toutes les décisions, retrouvables sans ouvrir chaque réunion. | Étape 6 |
| **Fiche réunion** | Préparation | Instance, date, participants, ordre du jour. | Étape 6 |
|  | Compte rendu | Ce qui a été dit. | Étape 6 |
|  | Décisions | Décisions prises, avec portée et preuve. | Étape 6 |
|  | Tâches | Actions issues de la réunion. | Étape 6 |
| **Documents** | — | Liste, sans onglet : la bibliothèque de la structure. | Étape 7 |
| **Fiche document** | Document | Titre, nature, état, version en vigueur. | Étape 7 |
|  | Versions | Toutes les versions et leurs dates. | Étape 7 |
|  | Acceptations | Qui a accepté quelle version, saisi par le bureau. | Étape 7 |
| **Contrats** | — | Liste, sans onglet : contrats en cours et passés. | Étape 7 |
| **Fiche contrat** | Contrat | Parties, entité signataire, période, état. | Étape 7 |
|  | Obligations | Obligations, échéances et avenants. | Étape 7 |
|  | Règlements | Factures et opérations liées. | Étape 7 |
|  | Documents | Pièces signées. | Étape 7 |
| **Incidents** | — | Liste, sans onglet, réservée aux personnes habilitées. | Étape 5 |
| **Fiche incident** | Faits | Signalement, personnes concernées, dates. | Étape 5 |
|  | Instruction | Preuves et échanges. | Étape 5 |
|  | Décision | Décision, recours et durée. | Étape 5 |
|  | Documents | Pièces du dossier. | Étape 7 |
| **Bilan annuel** | Membres | Effectifs, arrivées et départs de l’année. | Étape 9 |
|  | Activité | Tournois, gains, décisions et événements. | Étape 9 |
|  | Finances | Recettes, dépenses et résultat de l’exercice. | Étape 9 |
| **Matériel & abonnements** | Matériel | Inventaire, prêts, maillots et stock. | Étape 8 |
|  | Abonnements | Services, domaines et licences : titulaire, coût, échéance, jamais de mot de passe. | Étape 8 |
| **Événements & déplacements** | — | Onglets définis à son cadrage. | Étape 10 |

### Finances

| Page | Onglet | Contenu | État |
| --- | --- | --- | --- |
| **Comptes** | Comptes | Comptes bancaires et caisses, avec leur solde. | Étape 3 |
|  | Exercices | Exercices ouverts et clôturés ; la clôture se fait ici. | Étape 3 |
| **Fiche compte** | Mouvements | Opérations de ce compte. | Étape 3 |
|  | Relevés | Relevés et rapprochement. | Étape 3 |
|  | Informations | Titulaire, devise, solde initial. | Étape 3 |
| **Opérations** | — | Liste, sans onglet : encaissements, décaissements et virements. Recettes et dépenses sont des filtres. | Étape 3 |
| **Fiche opération** | Opération | Date, montant, moyen de paiement, compte, catégorie ; lien vers une personne, une organisation, un tournoi ou une adhésion. | Étape 3 |
|  | Affectations | À quelles sommes dues elle se rapporte. | Étape 3 |
|  | Justificatifs | Pièces de l’opération. | Étape 3 |
| **Factures** | — | Liste, sans onglet : ventes et achats, avec leur échéance. | Étape 4 |
| **Fiche facture** | Facture | Lignes, montants, échéance, état. | Étape 4 |
|  | Règlements | Paiements reçus ou versés, même partiels. | Étape 4 |
|  | Justificatifs | Pièces de la facture. | Étape 4 |
| **Notes de frais** | — | Liste, sans onglet : demandes de remboursement et leur état. | Étape 4 |
| **Fiche note de frais** | Demande | Demandeur, lignes de frais, total. | Étape 4 |
|  | Justificatifs | Pièces de la demande. | Étape 4 |
|  | Règlements | Décision et remboursement. | Étape 4 |
| **Subventions & dons** | Subventions | Dossiers de subvention et leur état. | Étape 4 |
|  | Dons | Dons reçus et reçus émis. | Étape 4 |
| **Fiche subvention** | Dossier | Financeur, objet, montant demandé et accordé. | Étape 4 |
|  | Échéances | Dates de dépôt, de versement et de justification. | Étape 4 |
|  | Règlements | Versements reçus. | Étape 4 |
|  | Justificatifs | Pièces du dossier. | Étape 4 |
| **Contrôles** | Pièces manquantes | Opérations et factures sans justificatif. | Étape 4 |
|  | Validations | Ce qui attend une validation. | Étape 4 |
|  | Exports | Exports par exercice. | Étape 4 |
| **Budget** | — | Liste, sans onglet : les budgets, par version. | Étape 9 |
| **Fiche budget** | Prévisions | Enveloppes par équipe ou par projet. | Étape 9 |
|  | Suivi | Réalisé, écarts et trésorerie prévue. | Étape 9 |

### Système

| Page | Onglet | Contenu | État |
| --- | --- | --- | --- |
| **Utilisateurs** | — | Liste, sans onglet : les comptes, avec recherche et filtres. | Livré |
| **Fiche utilisateur** | Profil | Identité, connexion, contact ; fiche Répertoire liée (étape 2). | Livré |
|  | Autorisations | Rôle et autorisations du compte. | Livré |
|  | Sécurité | État du compte, mot de passe, double authentification, sessions. | Livré |
| **Journal d’activité** | — | Liste, sans onglet : qui a fait quoi. Export à venir (étape 7). | Livré |
| **Paramètres système** | — | Réglages, sans onglet. Accueillera la conservation des coordonnées (étape 2). | Livré |
| **Listes de référence** | Jeux | Ajouter, renommer, archiver. | Étape 1 |
|  | Fonctions | Ajouter, renommer, archiver ; réglage « Donne accès à son équipe ». | Étape 1 |
|  | Étiquettes | Repères libres pour classer les fiches. | Étape 1 |
|  | Catégories | Catégories d’opération : cotisations, sponsoring, cashprize… | Étape 3 |
|  | Moyens de paiement | Virement, espèces, carte… | Étape 3 |
|  | Types de matériel | Maillot, périphérique, licence… | Étape 8 |
| **Données** | Exports | Export lisible du registre. | Étape 2 |
|  | Sauvegardes | État des sauvegardes et dernière restauration essayée. | Étape 2 |
| **Rappels & notifications** | — | Onglets définis à son cadrage. | Étape 10 |
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
