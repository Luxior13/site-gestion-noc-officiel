# Matrice de préparation — état réel et projets

Référence révisée le 7 novembre 2026. Les chantiers proviennent du [catalogue de la feuille de route](../../../../apps/web/src/features/roadmap/roadmap.constants.ts). L’ordre et les décisions sont décrits dans [Feuille de route](../../feuille-de-route.md).

## Pages actuellement disponibles

| Route ou famille | État | Placement |
| --- | --- | --- |
| `/` | Accueil livré, vues métier à enrichir | Aujourd’hui |
| `/mes-notifications` | Module retiré le 9 octobre 2026 ; redirige vers la feuille de route | — |
| `/mon-compte` | Profil, autorisations et sécurité du compte livrés | Outils globaux |
| `/recherche` | Page retirée le 9 octobre 2026 ; navigation rapide conservée ; redirige vers l’accueil | Outils globaux |
| `/personnes/repertoire`, `/nouveau`, `/[id]` sous ce chemin | Liste, création et fiche Personne livrées ; `/membres/repertoire/*` y redirige depuis le 8 novembre 2026 | Personnes |
| `/activite/actualites` | Ancienne page ; redirige vers la feuille de route | — |
| `/systeme/utilisateurs`, `/nouveau`, `/[id]` sous ce chemin | Liste, création et fiche Utilisateur livrées | Système |
| `/systeme/journal-activite` | Vue globale reconstruite le 30 octobre 2026 | Système |
| `/systeme/parametres` | Paramètres techniques livrés | Système |
| `/systeme/feuille-de-route` | Catalogue de projets livré | Système |
| `/login` | Connexion | Authentification |
| `/administration`, `/tableau-de-bord`, `/mes-notifications`, `/tableau-de-bord/mes-notifications`, `/systeme` | Accès de compatibilité, redirection ou entrée de pôle | Routes d’appui |

Les libellés de familles ci-dessus ne créent pas des routes racines `/nouveau` ou `/[id]`. Les écrans d’erreur, chargement et refus sont des états de parcours, pas des modules supplémentaires.

Les anciennes routes prévues ne sont pas des « squelettes disponibles » : elles aboutissent à la page introuvable. Les organisations partenaires sont à reconstruire ; les anciens modèles supprimés ne sont pas comptés comme existants.

## Lecture des chantiers

- Le catalogue ne décrit que ce qui reste à construire (décision du 8 novembre 2026) : un chantier livré est retiré ou réduit à son reste à faire, avec une mise à jour de cette matrice.
- Chaque ligne de l’interface précise première version, prérequis, critère de livraison et suite éventuelle. Les étapes sont un ordre suggéré, pas des échéances ; le propriétaire choisit le prochain chantier.

## Les 38 chantiers

| Identifiant stable | Chantier | Pôle cible | Étape | Prérequis |
| --- | --- | --- | --- | --- |
| `sport-teams` | Équipes & parcours | Personnes | 1 | Listes de choix |
| `reference-lists` | Listes de choix | Personnes | 1 | — |
| `access-scopes` | Accès & responsabilités métier | Système | 2 | Équipes & parcours |
| `compliance` | Confidentialité & conservation | Structure | 2 | Équipes & parcours |
| `data` | Données, exports & sauvegardes | Système | 2 | Équipes & parcours |
| `legal-entities` | Identité juridique & périmètres | Structure | 3 | — |
| `organizations` | Organisations & contacts | Relations | 3 | — |
| `accounts` | Comptes & rapprochement | Finances | 3 | Identité juridique & périmètres |
| `payments` | Opérations & règlements | Finances | 3 | Comptes & rapprochement ; Organisations & contacts |
| `person-relationships` | Adhésions & cotisations | Personnes | 4 | Identité juridique & périmètres ; Équipes & parcours |
| `invoices` | Facturation & achats | Finances | 4 | Opérations & règlements |
| `expenses` | Notes de frais & remboursements | Finances | 4 | Opérations & règlements |
| `finance-controls` | Contrôles & clôtures | Finances | 4 | Opérations & règlements |
| `grants` | Subventions & dons | Finances | 4 | Organisations & contacts ; Opérations & règlements |
| `competitions` | Tournois | Esport | 5 | Équipes & parcours |
| `incidents` | Suivi, incidents & sanctions | Structure | 5 | Équipes & parcours ; Confidentialité & conservation ; Tournois |
| `prizes` | Gains de compétition & primes | Finances | 5 | Tournois ; Opérations & règlements |
| `tasks` | Projets & tâches | Aujourd’hui | 6 | — |
| `meetings` | Réunions & décisions | Structure | 6 | Identité juridique & périmètres ; Projets & tâches |
| `calendar` | Calendrier du bureau | Aujourd’hui | 6 | Projets & tâches |
| `personal-work` | Mon travail & espace personnel | Aujourd’hui | 7 | Projets & tâches ; Documents & acceptations |
| `documents` | Documents & acceptations | Structure | 7 | Identité juridique & périmètres |
| `contracts` | Contrats & obligations | Structure | 7 | Documents & acceptations ; Identité juridique & périmètres |
| `activity-journal` | Export du journal d’activité | Système | 7 | — |
| `partnerships` | Partenariats & opportunités | Relations | 7 | Organisations & contacts ; Contrats & obligations ; Projets & tâches |
| `onboarding` | Arrivées, départs & passations | Personnes | 8 | Équipes & parcours ; Documents & acceptations ; Projets & tâches |
| `logistics` | Matériel & abonnements | Structure | 8 | — |
| `internal-news` | Chronologie de la structure | Structure | 8 | Équipes & parcours |
| `budget` | Budget & pilotage | Finances | 9 | Opérations & règlements ; Facturation & achats |
| `business-search` | Recherche dans les dossiers | Système | 9 | Documents & acceptations |
| `annual-report` | Bilan annuel | Structure | 9 | Opérations & règlements ; Réunions & décisions |
| `recruitment` | Recrutement | Personnes | 10 | Équipes & parcours |
| `automations` | Rappels & notifications | Aujourd’hui | 10 | Projets & tâches ; Documents & acceptations |
| `integrations` | Intégrations & publication publique | Système | 10 | Équipes & parcours ; Données, exports & sauvegardes |
| `communication` | Communication & contenus | Relations | 10 | Projets & tâches ; Confidentialité & conservation ; Partenariats & opportunités |
| `sports-follow-up` | Entraînement | Esport | 10 | Équipes & parcours |
| `events` | Déplacements | Esport | 10 | Projets & tâches ; Opérations & règlements |
| `hr` | Salariés & paie | Personnes | 10 | Contrats & obligations |

Retiré le 7 novembre 2026 : `approvals`. Fusionnés : `governance` dans `meetings`, `notifications` dans `automations`, `sport-planning`, `debriefs`, `preparation` et `performance` dans `sports-follow-up`. Raisons : [feuille de route](../../feuille-de-route.md#retraits-et-regroupements-du-7-novembre-2026).

## Correspondance des anciennes destinations

Les références suivantes préservent le périmètre des anciennes propositions. Ce sont des **URL historiques de conception**, pas des liens vers des pages disponibles ni les futures routes canoniques. Plusieurs anciennes pages deviennent des vues du même chantier.

| Ancienne destination | Chantier qui reprend le besoin | Étape |
| --- | --- | --- |
| `/sport-team-control` | Personnes → Équipes & parcours | 1 |
| `/sport-team-control/jeux` | Personnes → Équipes & parcours | 1 |
| `/sport-team-control/rosters` | Personnes → Équipes & parcours | 1 |
| `/sport-team-control/membres-esport` | Personnes → Équipes & parcours | 1 |
| `/systeme/exports-sauvegardes` | Système → Données, exports & sauvegardes | 2 |
| `/systeme/archives` | Système → Données, exports & sauvegardes | 2 |
| `/tresorerie/comptes` | Finances → Comptes & rapprochement | 3 |
| `/bureau-juridique/partenaires` | Relations → Organisations & contacts | 3 |
| `/bureau-juridique/sponsors` | Relations → Organisations & contacts | 3 |
| `/tresorerie/operations` | Finances → Opérations & règlements | 3 |
| `/tresorerie/recettes` | Finances → Opérations & règlements | 3 |
| `/tresorerie/depenses` | Finances → Opérations & règlements | 3 |
| `/tresorerie/cotisations-adherents` | Finances → Opérations & règlements | 3 |
| `/tresorerie/sponsoring-financier` | Finances → Opérations & règlements | 3 |
| `/vie-interne/membres-adherents` | Personnes → Adhésions & cotisations | 4 |
| `/vie-interne/membres` | Personnes → Adhésions & cotisations | 4 |
| `/vie-interne/adherents` | Personnes → Adhésions & cotisations | 4 |
| `/bureau-juridique/personnes-contacts` | Personnes → Adhésions & cotisations | 4 |
| `/tresorerie/factures-justificatifs` | Finances → Facturation & achats | 4 |
| `/tresorerie/remboursements` | Finances → Notes de frais & remboursements | 4 |
| `/systeme/validations` | Finances → Contrôles & clôtures | 4 |
| `/tresorerie/validations-finance` | Finances → Contrôles & clôtures | 4 |
| `/tresorerie/exports-finance` | Finances → Contrôles & clôtures | 4 |
| `/tresorerie/journal-financier` | Finances → Contrôles & clôtures | 4 |
| `/tresorerie/archives-finance` | Finances → Contrôles & clôtures | 4 |
| `/sport-team-control/tournois-matchs` | Esport → Tournois | 5 |
| `/bureau-juridique/incidents-sanctions` | Structure → Suivi, incidents & sanctions | 5 |
| `/vie-interne/calendrier-interne` | Aujourd’hui → Calendrier du bureau | 6 |
| `/vie-interne/reunions` | Structure → Réunions & décisions | 6 |
| `/vie-interne/reunions-suivi` | Structure → Réunions & décisions | 6 |
| `/bureau-juridique/decisions-bureau` | Structure → Réunions & décisions | 6 |
| `/bureau-juridique/documents` | Structure → Documents & acceptations | 7 |
| `/bureau-juridique/documents-officiels` | Structure → Documents & acceptations | 7 |
| `/bureau-juridique/acceptation-chartes` | Structure → Documents & acceptations | 7 |
| `/systeme/modeles-documents` | Structure → Documents & acceptations | 7 |
| `/bureau-juridique/contrats` | Structure → Contrats & obligations | 7 |
| `/tableau-de-bord/mes-taches` | Aujourd’hui → Mon travail & espace personnel | 7 |
| `/tableau-de-bord/prochaines-reunions` | Aujourd’hui → Mon travail & espace personnel | 7 |
| `/tableau-de-bord/documents-a-accepter` | Aujourd’hui → Mon travail & espace personnel | 7 |
| `/tableau-de-bord/alertes-importantes` | Aujourd’hui → Mon travail & espace personnel | 7 |
| `/tableau-de-bord/mes-rappels` | Aujourd’hui → Mon travail & espace personnel | 7 |
| `/bureau-juridique/inventaire-acces` | Structure → Matériel & abonnements | 8 |
| `/vie-interne/onboarding-depart` | Personnes → Arrivées, départs & passations | 8 |
| `/activite/actualites` | Structure → Chronologie de la structure | 8 |
| `/tresorerie/budget` | Finances → Budget & pilotage | 9 |
| `/tresorerie/bilans` | Finances → Budget & pilotage | 9 |
| `/vie-interne/notifications-rappels` | Aujourd’hui → Rappels & notifications | 10 |
| `/systeme/modeles` | Aujourd’hui → Rappels & notifications | 10 |
| `/systeme/modeles-notifications` | Aujourd’hui → Rappels & notifications | 10 |
| `/systeme/automatisations` | Aujourd’hui → Rappels & notifications | 10 |
| `/sport-team-control/scrims` | Esport → Entraînement | 10 |
| `/sport-team-control/calendrier-esport` | Esport → Entraînement | 10 |
| `/sport-team-control/performance` | Esport → Entraînement | 10 |
| `/sport-team-control/debriefs` | Esport → Entraînement | 10 |
| `/vie-interne/debriefs` | Esport → Entraînement | 10 |
| `/vie-interne/recrutement-tryouts` | Personnes → Recrutement | 10 |
| `/sport-team-control/recrutement-tryouts` | Personnes → Recrutement | 10 |

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
