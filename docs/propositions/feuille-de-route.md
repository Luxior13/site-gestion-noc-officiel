# Feuille de route — priorités de construction

Référence produit révisée le 7 novembre 2026. La page `/systeme/feuille-de-route` présente **31 chantiers, 6 pôles cibles et 5 étapes**. Un chantier peut être un module, une extension, une vue partagée ou une intégration ; ce nombre ne représente pas 31 nouvelles pages.

Le catalogue exécutable se trouve dans [features/roadmap](../../apps/web/src/features/roadmap/roadmap.constants.ts). Ce document fixe les décisions ; la [matrice](intentions/pages/MATRICE_PREPARATION.md) conserve la correspondance avec les anciens projets de pages. Lors d’une modification de priorité ou de périmètre, mettre ces trois références à jour ensemble.

## À quoi sert le site

Décisions du propriétaire du 7 novembre 2026, qui remplacent le plan du 9 octobre :

- **Le site sert d’abord à la trésorerie et à la traçabilité** de tout ce qui concerne la structure, tant qu’elle existe : savoir qui est passé, à quelle fonction, dans quelle équipe et à quelles dates ([registre historique](../domaines/registre-historique.md)).
- **Il s’adresse au bureau et aux managers d’équipe.** Un manager ne voit que son équipe, sans les autres pôles. Joueurs, coachs et autres membres sont des fiches, sans compte ([public du site](../domaines/roles-metier.md#public-du-site--décision-du-7-novembre-2026)).
- **Le site public [noctambule.gg](https://noctambule.gg/) garde ce qui se montre** : jeux, maps, modes, rencontres, résultats, palmarès, calendrier. Ce site-ci garde le passage dans l’équipe, pas le détail du jeu.

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
| Listes de référence, Reprise de l’historique | Ajoutés | Ne pas être bloqué par une liste figée ; reprendre l’existant de noctambule.gg |

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
- **Reprise de l’historique** (Membres) : Reprise unique depuis noctambule.gg, avec prévisualisation et rapprochement explicite, puis complément à la main des passages anciens.
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
- **Intégrations & publication publique** (Système) : Publication validée des équipes et des parcours vers noctambule.gg, avec des identifiants stables.
- **Arrivées et départs** (Membres) : Checklists datées, responsables, étapes et vue collective des dossiers ouverts.
- **Recrutement** (Membres) : Poste ou équipe visée, essais, évaluations confidentielles et décision.
- **Ressources & logistique** (Structure) : Inventaire, prêts, retours, maintenance, déplacements, LAN et bootcamps.
- **Communication & contenus** (Relations) : Calendrier éditorial, ressources graphiques, audience et validation avant publication.
- **Gains de compétition & primes** (Finances) : Montants annoncés, confirmés et reçus ; parts contractuelles et versements.

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
