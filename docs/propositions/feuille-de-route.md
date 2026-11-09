# Feuille de route — priorités de construction

Référence produit révisée le 7 novembre 2026. La page `/systeme/feuille-de-route` présente **38 chantiers, rangés dans 7 pôles cibles, avec un ordre suggéré en 10 étapes**. Un chantier peut être un module, une extension, une vue partagée ou une intégration ; ce nombre ne représente pas 38 nouvelles pages.

Le catalogue exécutable se trouve dans [features/roadmap](../../apps/web/src/features/roadmap/roadmap.constants.ts). Ce document fixe les décisions ; la [matrice](intentions/pages/MATRICE_PREPARATION.md) conserve la correspondance avec les anciens projets de pages. Lors d’une modification de priorité ou de périmètre, mettre ces trois références à jour ensemble.

## À quoi sert le site

Décisions du propriétaire du 7 novembre 2026, qui remplacent le plan du 9 octobre :

- **Le site sert d’abord à la trésorerie et à la traçabilité** de tout ce qui concerne la structure, tant qu’elle existe : savoir qui est passé, à quelle fonction, dans quelle équipe et à quelles dates ([registre historique](../domaines/registre-historique.md)).
- **Il s’adresse au bureau et aux managers d’équipe.** Un manager ne voit que son équipe, sans les autres pôles. Joueurs, coachs et autres membres sont des fiches, sans compte ([public du site](../domaines/roles-metier.md#public-du-site--décision-du-7-novembre-2026)).
- **Le site public [noctambule.gg](https://noctambule.gg/) garde ce qui se montre** : jeux, maps, modes, rencontres, résultats, palmarès, calendrier. Ce site-ci garde le passage dans l’équipe et le dossier de chaque tournoi (gains, problèmes, bans), pas le détail du jeu. Rien n’est récupéré de l’un vers l’autre : les utilisateurs saisissent tout à la main, et une information présente sur les deux sites est saisie deux fois, pour le moment.

## État réel et lecture du plan

Les comptes et leur sécurité, le répertoire, les paramètres techniques, le journal d’activité et la page Jeux, la fiche de chaque jeu, les équipes de chaque jeu et leur fiche (pôle Esport, 8 novembre 2026) existent. Les paramètres actuels ne constituent pas un profil juridique métier. La navigation rapide de l’en-tête donne un accès direct aux pages autorisées ; elle ne parcourt pas encore de dossiers métier. Le module partenaires a été retiré le 21 septembre 2026 et le module notifications le 9 octobre 2026. Les migrations historiques ne prouvent pas qu’un modèle ou un écran est encore présent.

- La feuille de route ne décrit que **ce qui reste à construire** (décision du propriétaire du 8 novembre 2026 : « tout ce qui est déjà en place peut être retiré »). Un chantier sur un module existant ne nomme que son reste à faire ; une page ou un onglet déjà livrés n’apparaissent sur la page que pour ce qu’un chantier doit encore leur ajouter.
- Le plan se lit par pôle. Les étapes sont un **ordre suggéré** pour aider à l’implémentation, sans dates promises : **le propriétaire choisit le prochain chantier** (décision du 7 novembre 2026 : « je ne veux pas que ce soit par étape mais par pôle ; les étapes, c’est plus pour aider à l’implémentation, mais c’est moi qui choisirais »). Chaque étape reste courte et livre un ensemble utilisable.
- Les prérequis d’un chantier doivent être livrés avant lui, quelle que soit leur étape. Un besoin urgent déjà réel (échéance documentaire, suivi des mineurs, paiement à traiter) est une bonne raison de s’écarter de l’ordre suggéré.
- La présente révision organise le plan ; elle ne livre aucun de ces nouveaux modules métier.

## Décisions structurantes

1. **Le registre d’abord, la trésorerie ensuite** : les deux raisons d’être du site passent avant le reste.
2. **Sept pôles, chacun répond à une question** (décision du propriétaire du 8 novembre 2026) : Aujourd’hui (ce qui m’attend), Personnes (qui est passé par la structure), Esport (quelles équipes, quels tournois), Finances (où en est l’argent), Relations (avec qui à l’extérieur), Structure (l’association et sa mémoire), Système (le fonctionnement de l’outil). Le menu n’affiche que les pôles ayant des fonctions livrées et accessibles. Activité se répartit entre Aujourd’hui, Structure et Relations.
3. **Personne et compte restent distincts**. Presque toutes les fiches n’auront jamais de compte. Les adhésions, mandats, contrats et passages sont des relations datées, pas un statut unique. Aucun rapprochement automatique par email.
4. **La portée par équipe ne sert qu’aux managers.** Les modules du bureau utilisent les autorisations actuelles et n’attendent pas ce chantier.
5. **Une page seulement si elle sert** : une donnée se modifie là où on la lit, sans page dédiée inutile ([règles de placement](../domaines/navigation.md#règles-de-placement)).
6. **Les listes de choix se gèrent sur le site, à côté de ce qu’elles classent** : jeux, fonctions et autres valeurs évoluent sans développement, jamais depuis Système ([listes de choix](../domaines/registre-historique.md#listes-de-choix)).
7. **Préparer plusieurs entités juridiques**, avec leurs dossiers et historiques propres, tout en commençant par l’association réellement utilisée. Une évolution vers une société ne renomme pas les anciens engagements. Un passage n’exige pas d’entité : l’histoire de la structure précède l’association.
8. **Distinguer facture, paiement, note de frais et budget** : ils ont leurs propres états et liens. Un PDF ne remplace pas le cycle de vie d’une facture.
9. **Une source par donnée, plusieurs vues possibles** : les vues personnelles consultent les données du module d’origine.
10. **Livrer le contrôle d’accès avec chaque module** : politique serveur, confidentialité, audit, états d’erreur et tests pertinents.
11. **L’espace personnel évolue avec les modules**, sans construire un tableau de bord rempli de fonctions indisponibles.
12. **Un mot, un sens** : « Suivi » désigne seulement les notes, problèmes et bans ; le travail d’une équipe s’appelle Entraînement, et le réalisé d’un budget Réalisé.

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

## Réorganisation du 8 novembre 2026

Sur décision du propriétaire (« on peut encore tout changer, mais il faut que tout soit logique » ; « ok pour tes reco »), après le constat que « Membres » mêlait les personnes et l’activité sportive :

| Avant | Après | Raison |
| --- | --- | --- |
| Pôle Membres (`/membres/…`) | Pôle **Personnes** (`/personnes/…`), l’ancienne adresse redirige | Le Répertoire contient aussi candidats, anciens et contacts ; la page s’appelle déjà Fiche personne |
| Équipes, tournois et jeux dans Membres | Pôle **Esport** | Ce ne sont pas des personnes ; c’est le pôle d’un manager |
| Page Listes de référence (Système) | **Listes de choix**, chaque liste en onglet à côté de ce qu’elle classe | Les jeux ne se gèrent pas dans Système |
| Une liste unique de fonctions | **Fonctions de chaque jeu** (onglet de sa fiche jeu, Esport) et **fonctions de la structure** (onglet de Bureau & staff, Structure) | Un joueur appartient à une équipe, un trésorier à la structure ; chaque passage ne propose que les fonctions de son rattachement |
| Motif de fin d’un passage | **Retiré** : début et fin se saisissent dans le Roster d’une équipe ou l’Effectif de Bureau & staff | Un changement se voit au passage suivant, une exclusion a son dossier d’incident, une fin de contrat se lit dans le contrat |
| Mandats et fonctions de la structure dans Identité juridique (étape 3) | Page **Bureau & staff** (Structure, étape 1) : Effectif de la structure et Fonctions ; Identité juridique garde Identité, Assurances, Documents | Une équipe a son effectif, la structure le sien ; le bureau se saisit dès l’étape 1, sans dépendre d’une entité juridique, et un graphiste n’a pas de mandat |
| Parcours modifiable sur la fiche | **Parcours en lecture ↗** ; anciens pseudos dans Identité | La fiche lit les deux effectifs, chaque passage se saisit à son endroit |
| Page Équipes et fiche équipe | Page **Jeux**, accueil d’Esport, avec les équipes sous chaque jeu ; **fiche jeu** : Finances ↗, Fonctions (celles de ce jeu), sans onglet Équipes qui ferait doublon (précisé le même jour) ; **fiche équipe**, sous son jeu : Roster, Tournois ↗, Informations | Une structure esport s’organise par jeu, puis par équipe ; le roster vit dans son équipe, sans doublon au niveau du jeu |
| Fiche équipe sans partenaires ni contrats | Onglet **Partenaires ↗** (partenaires de l’équipe et ce qu’elle leur doit ; le manager les voit sans les montants) ; **date de fin de contrat** affichée seule dans le Roster | Une équipe honore ses livrables ; les départs se préparent avant la fin des contrats, dont les conditions restent confidentielles |
| Argent d’une section introuvable | Onglet **Finances ↗** de la fiche jeu (total de la section) et de la fiche équipe (son coût, ses gains, son budget, invisible pour un manager) ; une opération se lie à un jeu ou à une équipe | Le site sert d’abord à la trésorerie : savoir ce qu’une section coûte et rapporte |
| Fiche tournoi à classement unique | **Line-up et classement par équipe** dans Participants, gains par équipe ; organisateur relié à sa fiche organisation ; « règles du tournoi » ; en ligne ou LAN ; état calculé ; le manager crée et remplit les tournois de son équipe | Deux équipes d’un même jeu ne finissent pas à la même place ; « Règlements » désigne l’argent |
| Page Entraînement | Onglet **Entraînements** de la fiche équipe : séances et présents ; le manager remplit celles de son équipe | Un entraînement appartient à une équipe ; il sert surtout à la traçabilité (bilan, subventions) |
| Déplacements sans contenu | Page et **fiche déplacement** : Informations, Participants (mineurs sans autorisation signalés), Logistique, Budget (prévu face au réel), Documents | Responsabilité de l’association envers les mineurs ; argent d’une LAN suivi sans double saisie |
| Suivi d’une personne, tout sur la fiche | Problèmes et bans d’un tournoi saisis dans **sa fiche tournoi** ; sur la personne : notes, **sanctions de la structure** (tous ses tournois ou un jeu) et bans externes ; une sanction en cours **refuse l’inscription** à un tournoi | Chaque chose se saisit à son endroit, et une sanction agit là où l’on inscrit |
| Étiquettes des fiches | **Retirées** ; le Répertoire reste une liste sans onglet, et le chantier Listes de choix passe dans Esport | Tout ce qu’on y mettrait a déjà sa place : fonction, statut calculé, jeux pratiqués, adhésion, contact d’organisation, Suivi, tâche |
| Suivi sportif | **Entraînement** (Esport) | « Suivi » garde un seul sens : notes, problèmes et bans |
| Événements & déplacements (Structure) | **Déplacements** (Esport) | Surtout LAN et bootcamps ; un événement de l’association est une réunion |
| Page Rappels & notifications (Système) | Rappels dans **Mon travail**, règles dans **Paramètres** | Une page seulement si elle sert |
| Onglet Suivi d’une fiche budget | **Réalisé** | Un mot, un sens |

Regroupements toujours valables :

| Ancienne présentation | Décision |
| --- | --- |
| Membres, adhérents, contacts, staff | Une identité au Répertoire ; relations et historiques dédiés, vues filtrées |
| Mes tâches et tâches internes | Même source, vues personnelles et collectives |
| Prochaines réunions, rappels, alertes | Vues de Mon travail ; la source garde son échéance |
| Recettes et dépenses | Filtres des règlements ; factures et demandes de remboursement restent distinctes |
| Cotisations | Adhésion/campagne chez Personnes, montant attendu et règlement côté Finances |
| Sponsoring | Accord et livrables chez Relations, factures et règlements côté Finances |
| Archives, exports, modèles | Dans les modules propriétaires ; outils transverses limités à leur responsabilité |
| Incidents | Structure, dossier confidentiel ; seuls les effets autorisés remontent dans les fiches |
| Matériel et accès confiés | Structure, avec attributions et restitutions ; ne contient pas de mots de passe |
| Accueils de pôle vides | Pas de page autonome sans synthèse utile |
| Messagerie interne | Pas de chantier dédié actuellement |

## 1. Listes & parcours

Savoir qui est passé dans la structure, à quelle fonction et dans quelle équipe.

- **Listes de choix** (Esport) : Chaque liste à côté de ce qu’elle classe : fonctions de chaque jeu en onglet de sa fiche (la page Jeux est livrée, les fonctions de chaque jeu aussi), jeux pratiqués choisis sur la fiche ; ajout direct depuis un champ et champ à choix multiples réutilisable. Renommer corrige une faute ; une chose qui change vraiment devient une nouvelle valeur.
- **Équipes & parcours** (Personnes) : Page Jeux, fiche de chaque jeu (ses équipes) et de chaque équipe (Roster, anciens noms), page Bureau & staff ; passages datés (équipe ou structure, fonction, début, fin, dates approximatives admises) saisis dans le Roster d’une équipe ou l’Effectif de Bureau & staff, lus dans l’onglet Parcours de la fiche, membres actuels et anciens, anciens pseudos. Fiche complétée : nationalité, adresse, identifiants de jeu, contact d’urgence, représentants légaux.

## 2. Accès & conservation

Ouvrir le site aux managers et garder le registre dans la durée.

- **Accès & responsabilités métier** (Système) : Liaison explicite entre un compte et une fiche, et portée par équipe.
- **Confidentialité & conservation** (Structure) : Règles de conservation écrites, purge des coordonnées après le départ et anonymisation à la demande.
- **Données, exports & sauvegardes** (Système) : Export lisible du registre, suivi des sauvegardes et restauration essayée.

## 3. Socle de trésorerie

Suivre les comptes et l’argent réellement reçu ou versé.

- **Identité juridique & périmètres** (Structure) : Entité porteuse, identifiants, règles datées, assurances et responsabilités.
- **Comptes & rapprochement** (Finances) : Exercices, comptes bancaires et caisses, titulaire, devise, soldes initiaux et relevés.
- **Organisations & contacts** (Relations) : Identité de l’organisation, interlocuteurs du répertoire et relations datées.
- **Opérations & règlements** (Finances) : Encaissements, décaissements, virements, catégories, moyens de paiement, justificatifs et affectations aux sommes dues ; lien vers une personne, une organisation, un tournoi ou une adhésion.

## 4. Trésorerie complète

Couvrir factures, frais, subventions, adhésions et contrôles.

- **Adhésions & cotisations** (Personnes) : Campagnes d’adhésion, adhésions datées et état de cotisation, rattachés aux fiches du répertoire.
- **Facturation & achats** (Finances) : Factures clients/fournisseurs, pièces, échéances et règlements ; émission ou import selon l’outil retenu.
- **Notes de frais & remboursements** (Finances) : Dossier, lignes de frais, justificatifs, décision et règlement.
- **Subventions & dons** (Finances) : Dossiers de subvention, échéances et versements ; dons et reçus.
- **Contrôles & clôtures** (Finances) : Validations, pièces manquantes, historique, exports et clôture d’exercice.

## 5. Tournois & suivi

Garder le dossier de chaque tournoi et le suivi des personnes.

- **Tournois** (Esport) : Liste filtrable (jeu, équipe, année, état calculé) ; fiche avec organisateur relié à sa fiche, circuit, en ligne ou LAN, règles, frais et échéances ; line-up et classement par équipe ; gains et suivi. Un manager crée et remplit les tournois de son équipe. Les rencontres restent sur le site public.
- **Gains de compétition & primes** (Finances) : Par équipe : montants annoncés et confirmés, répartition prévue entre les joueurs ; argent reçu et parts versées lus dans les opérations.
- **Suivi, incidents & sanctions** (Structure) : Onglet Suivi de la fiche : notes, sanctions de la structure (tous ses tournois ou un jeu) et bans externes ; les problèmes et bans d’un tournoi se saisissent dans sa fiche et se lisent sur la personne ; contrôle à l’inscription des participants. Dossiers d’incident : faits, preuves, instruction, décision, recours et durée.

## 6. Vie du bureau

Suivre les tâches, les dates et les décisions.

- **Projets & tâches** (Aujourd’hui) : Tâches assignées, échéances, statuts et liens vers le dossier source ; vue personnelle.
- **Calendrier du bureau** (Aujourd’hui) : Réunions, échéances, renouvellements et dates limites de tournois, lus depuis leurs modules ; événements privés.
- **Réunions & décisions** (Structure) : Instances, participants du répertoire, ordre du jour, compte rendu, décisions et tâches liées ; les mandats se lisent dans le parcours.

## 7. Documents & engagements

Retrouver les pièces et ce que la structure a promis.

- **Documents & acceptations** (Structure) : Bibliothèque, versions, modèles et acceptations saisies par le bureau.
- **Contrats & obligations** (Structure) : Parties, entité signataire, période, obligations, avenants, échéances et pièces ; la date de fin d’un contrat de joueur s’affiche seule dans le Roster de son équipe.
- **Partenariats & opportunités** (Relations) : Opportunités, responsables, engagements, livrables et échéances liés aux contrats ; un partenariat peut soutenir une équipe ou un jeu précis, et apparaît alors sur sa fiche.
- **Mon travail & espace personnel** (Aujourd’hui) : Mes tâches, mes réunions à venir, les documents en attente et les échéances proches.
- **Export du journal d’activité** (Système) : Export CSV ou JSON des résultats filtrés du journal d’activité.

## 8. Mémoire & continuité

Transmettre le matériel, les accès et l’histoire de la structure.

- **Matériel & abonnements** (Structure) : Inventaire, prêts, maillots et stock ; services, domaines et licences avec titulaire, coût et échéance, jamais de mot de passe.
- **Arrivées, départs & passations** (Personnes) : Checklists datées, responsables, étapes et vue collective des dossiers ouverts ; passation d’un mandat.
- **Chronologie de la structure** (Structure) : Faits datés saisis par le bureau ou tirés des modules : arrivée, départ, changement de roster, sponsor, décision, titre.

## 9. Pilotage

Exploiter des données fiables pour décider.

- **Budget & pilotage** (Finances) : Budgets versionnés, enveloppes par équipe/projet, écarts, prévisions de trésorerie et bilan par mois ou par année.
- **Bilan annuel** (Structure) : Par année : membres et mouvements, tournois et gains, finances, décisions ; prêt pour l’assemblée générale.
- **Recherche dans les dossiers** (Système) : Recherche métier progressive, extraits limités et liens vers les fiches.

## 10. Selon les besoins

Ajouter ce qui répond à un usage réel, sans le construire d’avance.

- **Rappels & notifications** (Aujourd’hui) : Mes rappels dans Mon travail, liés à leur source ; règles limitées dans Paramètres système, avec historique d’exécution.
- **Intégrations & publication publique** (Système) : Publication validée des équipes et des parcours vers noctambule.gg, avec des identifiants stables.
- **Entraînement** (Esport) : Onglet Entraînements de la fiche équipe : séances (date, type, présents, objectif ou débrief court), comptées par saison pour le bilan et les subventions ; le manager remplit celles de son équipe.
- **Déplacements** (Esport) : Page et fiche déplacement : motif (tournoi en LAN ou bootcamp), lieu, dates, équipe ; participants, mineur sans autorisation parentale signalé ; logistique ; budget prévu face aux dépenses réelles des Finances ; documents.
- **Salariés & paie** (Personnes) : Contrats de travail, périodes et pièces, à cadrer avec la forme juridique.
- **Recrutement** (Personnes) : Poste ou équipe visée, essais, évaluations confidentielles et décision.
- **Communication & contenus** (Relations) : Calendrier éditorial, ressources graphiques, audience et validation avant publication.

## Couverture d’une structure esport

Relecture du 7 novembre 2026 : chaque sujet qu’une structure esport rencontre sur la durée, et l’endroit qui le prend en charge. Le tableau s’affiche dans la vue Couverture de la page Feuille de route, depuis [roadmap-coverage.data.ts](../../apps/web/src/features/roadmap/roadmap-coverage.data.ts), qui relie chaque sujet à ses chantiers : les modifier ensemble. Elle confronte le plan aux [intentions historiques](intentions/README.md) et à la vie d’une structure ; un sujet absent s’ajoute ici avant de devenir un chantier. Les obligations légales citées restent à qualifier pour la situation réelle.

| Sujet | Pris en charge par |
| --- | --- |
| Identité d’une personne, nationalité, adresse, identifiants de jeu, contact d’urgence | Fiche personne |
| Mineurs : représentants légaux, autorisations, droit à l’image | Fiche personne, Confidentialité & conservation |
| Qui a été où, à quelle fonction, de quand à quand | Effectifs des équipes et de Bureau & staff, lus dans le Parcours |
| Roster et anciens noms des équipes de chaque jeu | Fiche équipe (Roster, Informations) |
| Tournois : frais, classement, participants, gains | Tournois, Gains de compétition & primes |
| Notes, problèmes, bans, sanctions, signalements | Suivi, Incidents |
| Adhésions et cotisations | Adhésions & cotisations |
| Recettes, dépenses, comptes, factures, frais, clôtures | Trésorerie (étapes 3 et 4) |
| Sponsoring, subventions, dons | Partenariats, Subventions & dons |
| Ventes de la boutique | Catégorie d’opération ; le stock dans Matériel & abonnements |
| Contrats de joueurs, de staff, de partenaires | Contrats & obligations |
| Salariat et paie, si la structure emploie | Salariés & paie, avec un outil de paie |
| Bénévolat et valorisation des heures | À cadrer avec Subventions & dons |
| Assemblées, bureau, mandats, votes, statuts | Bureau & staff, Identité juridique, Réunions & décisions |
| Assurances, affiliations, licences, marque | Identité juridique |
| Changement de forme juridique | Identité juridique, relations datées |
| Matériel, maillots, prêts | Matériel & abonnements |
| Comptes, domaines et abonnements de la structure | Matériel & abonnements |
| Changement de bureau, passation | Arrivées, départs & passations |
| LAN, bootcamps, déplacements | Déplacements |
| Recrutement et essais | Recrutement |
| Travail quotidien d’une équipe | Entraînement, en réserve |
| Communication et visibilité | Communication & contenus |
| Mémoire de la structure, bilan pour l’assemblée | Chronologie, Bilan annuel |
| Échéances et rappels | Calendrier, Rappels & notifications |
| Données personnelles, durées, effacement | Confidentialité & conservation |
| Survie des données, export, sauvegardes | Données, exports & sauvegardes |
| Rencontres, résultats, palmarès, calendrier sportif, boutique | Site public, hors de ce site |
| Échanges quotidiens | Discord, hors de ce site |

## Pages et onglets prévus

Toutes les pages visées, avec leurs onglets et leur contenu. Ce plan s’affiche aussi dans la vue Pages et onglets de la page Feuille de route, sans ce qui est déjà livré (seul le reste à faire d’une page existante, `upcoming`, y figure), depuis [roadmap-site-plan.data.ts](../../apps/web/src/features/roadmap/roadmap-site-plan.data.ts), où chaque page ou onglet nomme le chantier qui le construit : les modifier ensemble. Un test vérifie que chaque page à venir a un chantier et que chaque chantier a une page ou un onglet, sauf Rappels & notifications, Recherche dans les dossiers et Intégrations & publication publique. Il suit les [règles des onglets](../design/gabarits.md#onglets-dune-fiche). Un onglet marqué ↗ se lit sur sa page et se modifie sur la page nommée dans son contenu ; la vue Pages et onglets le montre de la même façon. L’état d’un onglet n’est jamais antérieur à celui de sa page ; un onglet n’apparaît qu’une fois livré et pour les comptes qui y ont droit.

Six chantiers n’ont pas de page à eux, pour ne pas en créer d’inutile : **Rappels & notifications** vit dans Mon travail et Paramètres système, **Listes de choix** en onglets des pages qui utilisent chaque liste, **Accès & responsabilités métier** vit sur la fiche utilisateur et dans la liste des fonctions, **Confidentialité & conservation** dans Paramètres système, **Gains de compétition & primes** sur la fiche tournoi, **Recherche dans les dossiers** dans la recherche de l’en-tête, **Intégrations & publication publique** n’a pas d’écran propre tant qu’elle n’est pas cadrée.

### Aujourd’hui

| Page | Onglet | Contenu | État |
| --- | --- | --- | --- |
| **Mon travail** | — | Accueil, sans onglet. À venir (étape 7) : mes tâches, mes réunions à venir, les documents en attente et les échéances proches. | Livré |
| **Tâches** | — | Liste, sans onglet : les tâches du bureau, avec le filtre « Mes tâches ». Détail en fenêtre. | Étape 6 |
| **Calendrier** | — | Lecture, sans onglet : réunions, échéances, renouvellements et dates limites, lus depuis leurs modules. | Étape 6 |
| **Mon compte** | — | Depuis le menu du compte, pas dans un pôle. | Livré |
|  | Profil | Prénom, nom, identifiant, email de contact. | Livré |
|  | Autorisations | Ce que mon compte permet, en lecture seule. | Livré |
|  | Sécurité | Mot de passe, double authentification, sessions. | Livré |

### Personnes

| Page | Onglet | Contenu | État |
| --- | --- | --- | --- |
| **Répertoire** | — | Liste, sans onglet : toutes les fiches, avec recherche et filtres. À venir (étape 1) : filtres par équipe, jeu et anciens membres. | Livré |
| **Fiche personne** | Identité | Pseudo, nom, naissance, zone dangereuse. À venir (étape 1) : statut calculé depuis le parcours, nationalité, jeux pratiqués et anciens pseudos, y compris ceux d’avant le site. | Livré |
|  | Coordonnées | Emails, téléphones, réseaux sociaux. À venir (étape 1) : adresse, identifiants de jeu, contact d’urgence et représentants légaux. | Livré |
|  | Parcours ↗ | En lecture : chaque passage dans une équipe, en cours et à venir puis terminés, avec le jeu, la fonction, le statut, le début, la fin et la durée. Chaque ligne ouvre son équipe, ses anciens membres pour un passage terminé. À venir (étape 1) : les passages de Bureau & staff, avec leur page ; puis les tournois joués (étape 5). Lu ici, se modifie dans le Roster de chaque équipe et l’Effectif de Bureau & staff. | Livré |
|  | Adhésions ↗ | Adhésions par campagne et état de cotisation. Lu ici, se modifie dans Adhésions. | Étape 4 |
|  | Finances ↗ | Cotisations réglées, remboursements et gains versés. Lu ici, se modifie dans Finances. | Étape 4 |
|  | Documents ↗ | Contrats, autorisations et chartes acceptées. Lu ici, se modifie dans Documents et Contrats. | Étape 7 |
|  | Matériel ↗ | Prêts et restitutions, taille de maillot. Lu ici, se modifie dans Matériel & abonnements. | Étape 8 |
|  | Suivi | Notes, sanctions de la structure (tous ses tournois ou un jeu, motif, durée, levée) et bans externes qui dépassent un tournoi ; les problèmes et bans d’un tournoi y figurent aussi, saisis dans sa fiche. Réservé aux personnes habilitées. | Étape 5 |
| **Adhésions** | Adhérents | Adhésions de la campagne choisie et état de cotisation. | Étape 4 |
|  | Campagnes | Périodes d’adhésion et leurs conditions. | Étape 4 |
| **Recrutement** | — | Onglets définis à son cadrage. | Étape 10 |
| **Salariés & paie** | — | Onglets définis à son cadrage. | Étape 10 |
| **Arrivées, départs & passations** | Dossiers | Arrivées, départs et passations en cours, avec leur checklist. | Étape 8 |
|  | Modèles | Checklists types. | Étape 8 |

### Esport

| Page | Onglet | Contenu | État |
| --- | --- | --- | --- |
| **Jeux** | — | Liste, sans onglet, sur le modèle du Répertoire : chaque jeu et, sur des lignes dessous reliées par un guide, ses équipes, en bandes alternées par jeu, dans l’ordre posé par glisser-déposer, actifs et inactifs mélangés (jeux, et équipes dans leur jeu), une icône de manette par défaut, une recherche sur les jeux et les équipes et un filtre ; ajout et modification en fenêtre d’un jeu (nom, nom court, première ouverture, actif) ; un bouton « Ajouter une équipe » : jeu choisi dans la fenêtre, actif ou non, nom unique dans le jeu, création, active, puis sa fiche s’ouvre ; le nom d’un jeu ou d’une équipe ouvre sa fiche ; renommer corrige une faute ; un jeu qui a des équipes ne se supprime pas, il devient inactif. C’est aussi la liste de choix des jeux. À venir (étape 1) : l’image de chaque jeu à la place de la manette. | Livré |
| **Fiche jeu** | — | Ouverte par le nom d’un jeu sur la page Jeux, ou juste après son ajout. À venir (étape 1) : avec le Roster, le nombre de passages de chaque fonction ; puis l’onglet Finances ↗, entre Fonctions et Informations. | Livré |
|  | Fonctions | Premier onglet : les fonctions de ce jeu (Joueur, Remplaçant, Coach…), type Joueur ou Encadrement, active ou non ; rangées par glisser-déposer selon leur importance, actives ou non, ordre repris partout ; ajout et modification en fenêtre, fonctions courantes en un clic quand la liste est vide ; une fonction inactive reste choisissable pour un passage ancien. À venir (étape 1) : le nombre de passages de chaque fonction avec le Roster ; le réglage « Donne accès à son équipe » viendra avec l’accès des managers. | Livré |
|  | Finances ↗ | Total de la section : ses équipes, plus les opérations liées au jeu lui-même (licence, matériel commun) ; détaillé par équipe. Lu ici, se modifie dans Finances. | Étape 3 |
|  | Informations | Dernier onglet : nom, nom court, première ouverture, actif, modifiés sur place ; zone dangereuse, qui explique « rendez-le inactif » quand le jeu a des équipes. | Livré |
| **Fiche équipe** | — | Ouverte par le nom d’une équipe sur la page Jeux, ou juste après son ajout. À venir (étape 1) : le statut de chaque membre dans la structure, calculé depuis les passages. | Livré |
|  | Roster | Premier onglet : ce qui est là et ce qui arrive, joueurs puis encadrement, dans l’ordre des fonctions, avec statut (Actuel, À venir), début, fin et durée ; un passage s’ajoute, se corrige, se termine ou change de fonction en fenêtre ; la personne se cherche dans le Répertoire. À venir (étape 2) : le manager lira le Roster de son équipe, sans le modifier ; la date de fin de contrat s’y lira, venue des contrats (étape 7). | Livré |
|  | Anciens membres | Les passages terminés, jamais mêlés au Roster : par année de fin, la plus récente d’abord, avec début, fin et durée ; recherche et filtre Joueurs ou Encadrement ; un ancien membre s’ajoute ici avec ses deux dates. À venir (étape 2) : le manager les lira pour son équipe, sans les modifier. | Livré |
|  | Tournois ↗ | Tournois joués par cette équipe, avec son classement. Un manager les voit et crée ceux de son équipe, sans les gains ni le Suivi. Lu ici, se modifie dans Tournois. | Étape 5 |
|  | Entraînements | Séances : date, type (entraînement, scrim, bootcamp), présents, objectif ou débrief court ; nombre de séances et de présents par saison, pour le bilan et les subventions. Un manager remplit celles de son équipe. | Étape 10 |
|  | Finances ↗ | Ce que l’équipe coûte et rapporte : inscriptions, gains, déplacements et autres opérations liées à l’équipe ; enveloppe de budget comparée au réalisé. Invisible pour un manager. Lu ici, se modifie dans Finances. | Étape 3 |
|  | Partenaires ↗ | Les partenaires qui soutiennent cette équipe et ce qu’elle leur doit (logo sur le maillot, publications, présence). Un manager les voit, sans les montants. Lu ici, se modifie dans Partenariats. | Étape 7 |
|  | Informations | Dernier onglet : nom, création, active, modifiés sur place ; le jeu, fixé à la création, figure dans l’en-tête ; zone dangereuse, qui explique « rendez-la inactive » quand le Roster a des passages. À venir (étape 1) : anciens noms gardés au renommage. | Livré |
| **Tournois** | — | Liste, sans onglet : les tournois, filtrés par jeu, équipe, année et état (à venir, en cours, terminé, calculé depuis les dates) ; chaque ligne : nom, jeu, équipes, dates, état, classement. Création en fenêtre : nom, jeu, dates, organisateur. Un manager crée ceux de son équipe. | Étape 5 |
| **Fiche tournoi** | Informations | Nom, jeu, organisateur (sa fiche organisation), circuit ou ligue facultatif, en ligne ou LAN (lieu et déplacement lié), dates, règles du tournoi (lien ou pièce), frais d’inscription, échéances (inscription, dépôt du roster, check-in) reprises au calendrier ; état calculé depuis les dates. | Étape 5 |
|  | Participants | Pour chacune de nos équipes engagées : line-up (membres engagés, remplaçants compris) et classement final. Une sanction de la structure en cours refuse l’inscription, avec son motif ; un ban externe du même jeu, organisateur ou circuit avertit. Un manager remplit ceux de son équipe. | Étape 5 |
|  | Gains | Par équipe : montant annoncé, montant confirmé et répartition prévue entre les joueurs, saisis ici ; argent reçu et parts versées lus dans les Finances, avec un lien. Un résultat ne crée aucun encaissement. | Étape 5 |
|  | Suivi | Problèmes et bans survenus pendant ce tournoi, saisis ici et visibles sur la fiche de chaque personne. Réservé aux personnes habilitées. | Étape 5 |
| **Déplacements** | — | Liste, sans onglet : les déplacements à venir et passés, filtrés par jeu et par équipe ; création en fenêtre. | Étape 10 |
| **Fiche déplacement** | Informations | Motif (tournoi en LAN lié ou bootcamp), lieu, dates, équipe ; dates reprises au calendrier du bureau. | Étape 10 |
|  | Participants | Personnes du Répertoire ; un mineur sans autorisation parentale valide est signalé. | Étape 10 |
|  | Logistique | Transport, hébergement, horaires. | Étape 10 |
|  | Budget | Budget prévu, saisi ici ; dépenses réelles lues dans les Finances (opérations, notes de frais), avec un lien. | Étape 10 |
|  | Documents | Billets, réservations, autorisations parentales. | Étape 10 |

### Finances

| Page | Onglet | Contenu | État |
| --- | --- | --- | --- |
| **Comptes** | Comptes | Comptes bancaires et caisses, avec leur solde. | Étape 3 |
|  | Exercices | Exercices ouverts et clôturés ; la clôture se fait ici. | Étape 3 |
|  | Catégories | Catégories d’opération : cotisations, sponsoring, cashprize… | Étape 3 |
|  | Moyens de paiement | Virement, espèces, carte… | Étape 3 |
| **Fiche compte** | Mouvements | Opérations de ce compte. | Étape 3 |
|  | Relevés | Relevés et rapprochement. | Étape 3 |
|  | Informations | Titulaire, devise, solde initial. | Étape 3 |
| **Opérations** | — | Liste, sans onglet : encaissements, décaissements et virements. Recettes et dépenses sont des filtres. | Étape 3 |
| **Fiche opération** | Opération | Date, montant, moyen de paiement, compte, catégorie ; lien vers une personne, un jeu ou une équipe, une organisation, un tournoi ou une adhésion. | Étape 3 |
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
|  | Réalisé ↗ | Dépenses et recettes réelles, écarts et trésorerie prévue. Lu ici, se modifie dans Opérations. | Étape 9 |

### Relations

| Page | Onglet | Contenu | État |
| --- | --- | --- | --- |
| **Organisations** | — | Liste, sans onglet : partenaires, sponsors, clients et fournisseurs. | Étape 3 |
| **Fiche organisation** | Identité | Nom, type, adresse, identifiants. | Étape 3 |
|  | Contacts | Interlocuteurs, liés aux fiches du Répertoire. | Étape 3 |
|  | Règlements ↗ | Factures et opérations liées. Lu ici, se modifie dans Finances. | Étape 3 |
|  | Contrats ↗ | Contrats et partenariats en cours et passés. Lu ici, se modifie dans Contrats et Partenariats. | Étape 7 |
| **Partenariats** | — | Liste, sans onglet : opportunités et accords. | Étape 7 |
| **Fiche partenariat** | Accord | Parties, équipe ou jeu soutenu (facultatif), période, contreparties, état. | Étape 7 |
|  | Livrables | Ce qui est promis, livré ou à renouveler. | Étape 7 |
|  | Documents | Pièces liées à l’accord. | Étape 7 |
| **Communication** | — | Onglets définis à son cadrage. | Étape 10 |

### Structure

| Page | Onglet | Contenu | État |
| --- | --- | --- | --- |
| **Bureau & staff** | Effectif | Le roster de la structure : qui occupe quelle fonction (bureau, staff, bénévoles), avec début et fin, depuis 2014 ; on y ajoute ou termine un passage, avec la même fenêtre que dans le Roster d’une équipe. | Étape 1 |
|  | Fonctions | Fonctions de la structure : président, trésorier, secrétaire, graphiste, bénévole… ; ajouter, renommer, rendre inactive, comme les fonctions d’un jeu. | Étape 1 |
| **Identité juridique** | Identité | Dénomination, forme, identifiants, adresse. | Étape 3 |
|  | Assurances | Assurances, affiliations, licences, marque, et leurs échéances. | Étape 3 |
|  | Documents | Statuts et pièces officielles. | Étape 7 |
| **Chronologie** | — | Lecture, sans onglet : les grands faits de la structure depuis ses débuts, saisis ou tirés des modules. | Étape 8 |
| **Réunions** | Réunions | Réunions passées et à venir. | Étape 6 |
|  | Décisions ↗ | Toutes les décisions, retrouvables sans ouvrir chaque réunion. Lu ici, se modifie dans Fiche réunion. | Étape 6 |
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
|  | Règlements ↗ | Factures et opérations liées. Lu ici, se modifie dans Finances. | Étape 7 |
|  | Documents | Pièces signées. | Étape 7 |
| **Incidents** | — | Liste, sans onglet, réservée aux personnes habilitées. | Étape 5 |
| **Fiche incident** | Faits | Signalement, personnes concernées, dates. | Étape 5 |
|  | Instruction | Preuves et échanges. | Étape 5 |
|  | Décision | Décision, recours et durée. | Étape 5 |
|  | Documents | Pièces du dossier. | Étape 7 |
| **Bilan annuel** | Membres ↗ | Effectifs, arrivées et départs de l’année. Lu ici, se modifie dans les Rosters des équipes et l’Effectif de Bureau & staff. | Étape 9 |
|  | Activité ↗ | Tournois, gains, décisions et événements. Lu ici, se modifie dans Tournois, Réunions et Déplacements. | Étape 9 |
|  | Finances ↗ | Recettes, dépenses et résultat de l’exercice. Lu ici, se modifie dans Finances. | Étape 9 |
| **Matériel & abonnements** | Matériel | Inventaire, prêts, maillots et stock. | Étape 8 |
|  | Abonnements | Services, domaines et licences : titulaire, coût, échéance, jamais de mot de passe. | Étape 8 |
|  | Types de matériel | Maillot, périphérique, licence… | Étape 8 |

### Système

| Page | Onglet | Contenu | État |
| --- | --- | --- | --- |
| **Utilisateurs** | — | Liste, sans onglet : les comptes, avec recherche et filtres. | Livré |
| **Fiche utilisateur** | Profil | Identité, connexion, contact. À venir (étape 2) : fiche du répertoire liée au compte. | Livré |
|  | Autorisations | Rôle et autorisations du compte. | Livré |
|  | Sécurité | État du compte, mot de passe, double authentification, sessions. | Livré |
| **Journal d’activité** | — | Liste, sans onglet : qui a fait quoi. À venir (étape 7) : export CSV ou JSON des résultats filtrés. | Livré |
| **Paramètres système** | — | Réglages, sans onglet. À venir (étape 2) : conservation des coordonnées après le départ d’une personne. | Livré |
| **Données** | Exports | Export lisible du registre. | Étape 2 |
|  | Sauvegardes | État des sauvegardes et dernière restauration essayée. | Étape 2 |
| **Feuille de route** | Chantiers | Chantiers par pôle avec leur étape suggérée, dépliés sur place : première version, critère de livraison, prérequis et pages. | Livré |
|  | Pages et onglets | Les pages visées par pôle, leurs onglets et leur étape. | Livré |
|  | Couverture | Les sujets d’une structure esport et les chantiers qui les traitent. | Livré |
|  | Ordre suggéré | Les mêmes chantiers rangés par étape, pour aider à choisir le prochain. | Livré |

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
