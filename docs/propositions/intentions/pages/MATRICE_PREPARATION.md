# Matrice de préparation — état réel et projets

Référence révisée le 7 novembre 2026. Les chantiers proviennent du [catalogue de la feuille de route](../../../../apps/web/src/features/roadmap/roadmap.constants.ts). L’ordre et les décisions sont décrits dans [Feuille de route](../../feuille-de-route.md).

## Pages actuellement disponibles

| Route ou famille | État | Placement |
| --- | --- | --- |
| `/` | Accueil livré, vues métier à enrichir | Aujourd’hui |
| `/mes-notifications` | Module retiré le 9 octobre 2026 ; redirige vers la feuille de route | — |
| `/mon-compte` | Profil, autorisations et sécurité du compte livrés | Outils globaux |
| `/recherche` | Page retirée le 9 octobre 2026 ; navigation rapide conservée ; redirige vers l’accueil | Outils globaux |
| `/membres/repertoire`, `/nouveau`, `/[id]` sous ce chemin | Liste, création et fiche Personne livrées | Membres |
| `/activite/actualites` | Chantier retiré le 7 novembre 2026 ; redirige vers la feuille de route | — |
| `/systeme/utilisateurs`, `/nouveau`, `/[id]` sous ce chemin | Liste, création et fiche Utilisateur livrées | Système |
| `/systeme/journal-activite` | Vue globale reconstruite le 30 octobre 2026 | Système |
| `/systeme/parametres` | Paramètres techniques livrés | Système |
| `/systeme/feuille-de-route` | Catalogue de projets livré | Système |
| `/login` | Connexion | Authentification |
| `/administration`, `/tableau-de-bord`, `/mes-notifications`, `/tableau-de-bord/mes-notifications`, `/systeme` | Accès de compatibilité, redirection ou entrée de pôle | Routes d’appui |

Les libellés de familles ci-dessus ne créent pas des routes racines `/nouveau` ou `/[id]`. Les écrans d’erreur, chargement et refus sont des états de parcours, pas des modules supplémentaires.

Les anciennes routes prévues ne sont pas des « squelettes disponibles » : elles aboutissent à la page introuvable. Les organisations partenaires sont à reconstruire ; les anciens modèles supprimés ne sont pas comptés comme existants.

## Statuts des projets

- **À cadrer** : périmètre nouveau, à concevoir puis construire.
- **À compléter** : socle existant décrit dans la carte, extension à réaliser.
- Une carte livrée devra être retirée ou recentrée sur son reste à faire, avec une mise à jour de cette matrice.
- Chaque carte de l’interface précise public, première version, prérequis, critère de livraison et suite éventuelle. Les étapes ne sont pas des échéances.

## Les 30 chantiers

| Identifiant stable | Chantier | Pôle cible | Étape | État | Prérequis |
| --- | --- | --- | --- | --- | --- |
| `reference-lists` | Listes de référence | Système | 1 | À cadrer | — |
| `sport-teams` | Équipes & parcours | Membres | 1 | À cadrer | Listes de référence |
| `access-scopes` | Accès & responsabilités métier | Système | 1 | À compléter | Équipes & parcours |
| `compliance` | Confidentialité & conservation | Structure | 1 | À cadrer | Équipes & parcours |
| `data` | Données, exports & sauvegardes | Système | 1 | À compléter | Équipes & parcours |
| `legal-entities` | Identité juridique & périmètres | Structure | 2 | À cadrer | — |
| `accounts` | Comptes & rapprochement | Finances | 2 | À cadrer | Identité juridique & périmètres |
| `organizations` | Organisations & contacts | Relations | 2 | À cadrer | — |
| `payments` | Opérations & règlements | Finances | 2 | À cadrer | Comptes & rapprochement ; Organisations & contacts |
| `person-relationships` | Adhésions & cotisations | Membres | 2 | À compléter | Identité juridique & périmètres ; Équipes & parcours |
| `invoices` | Facturation & achats | Finances | 2 | À cadrer | Opérations & règlements |
| `expenses` | Notes de frais & remboursements | Finances | 2 | À cadrer | Opérations & règlements |
| `finance-controls` | Contrôles & clôtures | Finances | 2 | À cadrer | Opérations & règlements |
| `tasks` | Projets & tâches | Aujourd’hui | 3 | À cadrer | — |
| `meetings` | Réunions & décisions | Structure | 3 | À cadrer | Identité juridique & périmètres ; Projets & tâches |
| `documents` | Documents & acceptations | Structure | 3 | À cadrer | Identité juridique & périmètres |
| `contracts` | Contrats & obligations | Structure | 3 | À cadrer | Documents & acceptations ; Identité juridique & périmètres |
| `partnerships` | Partenariats & opportunités | Relations | 3 | À cadrer | Organisations & contacts ; Contrats & obligations ; Projets & tâches |
| `incidents` | Incidents & sanctions | Structure | 3 | À cadrer | Équipes & parcours ; Confidentialité & conservation |
| `personal-work` | Mon travail & espace personnel | Aujourd’hui | 3 | À compléter | Projets & tâches ; Documents & acceptations |
| `activity-journal` | Journal d’activité | Système | 3 | À compléter | — |
| `budget` | Budget & pilotage | Finances | 4 | À cadrer | Opérations & règlements ; Facturation & achats |
| `business-search` | Recherche dans les dossiers | Système | 4 | À compléter | Documents & acceptations |
| `automations` | Rappels & notifications | Système | 5 | À cadrer | Projets & tâches ; Documents & acceptations |
| `integrations` | Intégrations & publication publique | Système | 5 | À cadrer | Équipes & parcours ; Données, exports & sauvegardes |
| `onboarding` | Arrivées et départs | Membres | 5 | À cadrer | Équipes & parcours ; Documents & acceptations ; Projets & tâches |
| `recruitment` | Recrutement | Membres | 5 | À cadrer | Équipes & parcours |
| `logistics` | Ressources & logistique | Structure | 5 | À cadrer | Projets & tâches |
| `communication` | Communication & contenus | Relations | 5 | À cadrer | Projets & tâches ; Confidentialité & conservation ; Partenariats & opportunités |
| `prizes` | Gains de compétition & primes | Finances | 5 | À cadrer | Contrats & obligations ; Opérations & règlements |

Retirés ou fusionnés le 7 novembre 2026 : `sport-planning`, `calendar`, `competitions`, `debriefs`, `preparation`, `performance`, `internal-news`, `approvals`, `governance` (dans `meetings`) et `notifications` (dans `automations`). Raisons et déclencheurs : [feuille de route](../../feuille-de-route.md#retraits-et-regroupements-du-7-novembre-2026).

## Correspondance des anciennes destinations

Les références suivantes préservent le périmètre des anciennes propositions. Ce sont des **URL historiques de conception**, pas des liens vers des pages disponibles ni les futures routes canoniques. Plusieurs anciennes pages deviennent des vues du même chantier.

| Ancienne destination | Chantier qui reprend le besoin | Étape |
| --- | --- | --- |
| `/tableau-de-bord/mes-taches` | Aujourd’hui → Mon travail & espace personnel | 3 |
| `/tableau-de-bord/prochaines-reunions` | Aujourd’hui → Mon travail & espace personnel | 3 |
| `/tableau-de-bord/documents-a-accepter` | Aujourd’hui → Mon travail & espace personnel | 3 |
| `/tableau-de-bord/alertes-importantes` | Aujourd’hui → Mon travail & espace personnel | 3 |
| `/tableau-de-bord/mes-rappels` | Aujourd’hui → Mon travail & espace personnel | 3 |
| `/vie-interne/membres-adherents` | Membres → Adhésions & cotisations | 2 |
| `/vie-interne/membres` | Membres → Adhésions & cotisations | 2 |
| `/vie-interne/adherents` | Membres → Adhésions & cotisations | 2 |
| `/bureau-juridique/personnes-contacts` | Membres → Adhésions & cotisations | 2 |
| `/vie-interne/recrutement-tryouts` | Membres → Recrutement | 5 |
| `/sport-team-control/recrutement-tryouts` | Membres → Recrutement | 5 |
| `/vie-interne/onboarding-depart` | Membres → Arrivées et départs | 5 |
| `/sport-team-control` | Membres → Équipes & parcours | 1 |
| `/sport-team-control/jeux` | Membres → Équipes & parcours | 1 |
| `/sport-team-control/rosters` | Membres → Équipes & parcours | 1 |
| `/sport-team-control/membres-esport` | Membres → Équipes & parcours | 1 |
| `/sport-team-control/scrims` | Retiré le 7 novembre 2026 | — |
| `/sport-team-control/calendrier-esport` | Retiré le 7 novembre 2026 | — |
| `/sport-team-control/tournois-matchs` | Retiré le 7 novembre 2026 | — |
| `/sport-team-control/performance` | Retiré le 7 novembre 2026 | — |
| `/bureau-juridique/decisions-bureau` | Structure → Réunions & décisions | 3 |
| `/bureau-juridique/documents` | Structure → Documents & acceptations | 3 |
| `/bureau-juridique/documents-officiels` | Structure → Documents & acceptations | 3 |
| `/bureau-juridique/acceptation-chartes` | Structure → Documents & acceptations | 3 |
| `/systeme/modeles-documents` | Structure → Documents & acceptations | 3 |
| `/bureau-juridique/contrats` | Structure → Contrats & obligations | 3 |
| `/bureau-juridique/incidents-sanctions` | Structure → Incidents & sanctions | 3 |
| `/systeme/validations` | Finances → Contrôles & clôtures | 2 |
| `/vie-interne/calendrier-interne` | Retiré le 7 novembre 2026 | — |
| `/vie-interne/reunions` | Structure → Réunions & décisions | 3 |
| `/vie-interne/reunions-suivi` | Structure → Réunions & décisions | 3 |
| `/vie-interne/debriefs` | Retiré le 7 novembre 2026 | — |
| `/sport-team-control/debriefs` | Retiré le 7 novembre 2026 | — |
| `/activite/actualites` | Retiré le 7 novembre 2026 | — |
| `/bureau-juridique/inventaire-acces` | Structure → Ressources & logistique | 5 |
| `/bureau-juridique/partenaires` | Relations → Organisations & contacts | 2 |
| `/bureau-juridique/sponsors` | Relations → Organisations & contacts | 2 |
| `/tresorerie/comptes` | Finances → Comptes & rapprochement | 2 |
| `/tresorerie/operations` | Finances → Opérations & règlements | 2 |
| `/tresorerie/recettes` | Finances → Opérations & règlements | 2 |
| `/tresorerie/depenses` | Finances → Opérations & règlements | 2 |
| `/tresorerie/cotisations-adherents` | Finances → Opérations & règlements | 2 |
| `/tresorerie/sponsoring-financier` | Finances → Opérations & règlements | 2 |
| `/tresorerie/factures-justificatifs` | Finances → Facturation & achats | 2 |
| `/tresorerie/remboursements` | Finances → Notes de frais & remboursements | 2 |
| `/tresorerie/budget` | Finances → Budget & pilotage | 4 |
| `/tresorerie/bilans` | Finances → Budget & pilotage | 4 |
| `/tresorerie/validations-finance` | Finances → Contrôles & clôtures | 2 |
| `/tresorerie/exports-finance` | Finances → Contrôles & clôtures | 2 |
| `/tresorerie/journal-financier` | Finances → Contrôles & clôtures | 2 |
| `/tresorerie/archives-finance` | Finances → Contrôles & clôtures | 2 |
| `/vie-interne/notifications-rappels` | Système → Rappels & notifications | 5 |
| `/systeme/modeles` | Système → Rappels & notifications | 5 |
| `/systeme/modeles-notifications` | Système → Rappels & notifications | 5 |
| `/systeme/automatisations` | Système → Rappels & notifications | 5 |
| `/systeme/exports-sauvegardes` | Système → Données, exports & sauvegardes | 1 |
| `/systeme/archives` | Système → Données, exports & sauvegardes | 1 |

Les accueils de pôles sans synthèse utile ne sont pas recréés. La messagerie interne autonome est écartée du périmètre actuel. Une ancienne fiche qui décrit un besoin plus large doit être relue à la lumière du chantier cible avant développement.

## Contrat de préparation et livraison

1. Identifier la source des données, le responsable métier et un parcours utile de bout en bout.
2. Définir le rattachement à l’entité, la période et les relations nécessaires, sans fusionner des objets aux cycles différents.
3. Décrire les actions autorisées, la confidentialité, les pièces jointes, l’audit, la conservation et les cas de révocation.
4. Concevoir les états vide, chargement, erreur, accès refusé, mobile et conflit de modification lorsqu’il s’applique.
5. Vérifier le critère de livraison de la carte, les dépendances et les politiques serveur.
6. Activer ensemble route, fonctionnalité, permissions et navigation ; actualiser cette matrice et le catalogue.

Le socle visuel existant doit être réutilisé. Une carte de projet ne justifie pas d’ajouter une table dormante, une permission active ou une fausse page métier.

Les anciennes fiches détaillées sont conservées comme historique et matière de conception. Elles ne font plus autorité sur le statut actuel, le découpage ni la navigation.
