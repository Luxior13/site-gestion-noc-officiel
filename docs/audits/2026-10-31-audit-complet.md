# Audit complet de toutes les pages — 31 octobre 2026

[Index des audits](README.md) · [Méthode d’audit](../methode/audit.md) ·
[Fiches des pages](../pages/README.md) · [Préférences](../design/preferences.md)

## Question, périmètre et état examiné

- **Demande du propriétaire** : lire la documentation, puis analyser toutes les
  pages et leurs fonctions, vérifier chaque détail pour que rien ne soit oublié,
  « parfait sur tous les points », dans une logique de très long terme.
- **Type** : audit complet et transverse des 12 pages (19 vues et onglets), des
  32 routes API, du cadre partagé, des services serveur sensibles, du schéma et
  de la documentation.
- **État examiné** : branche `main`, commit `8a8045b` (arbre propre au départ),
  Next 15.5, Bun 1.4.2 sur le poste (le manifeste fixe 1.3.10), PostgreSQL 17.
- **Données** : aucune donnée réelle. Un PostgreSQL 17 jetable a été démarré dans
  le dossier temporaire de la session (`127.0.0.1:5433`, `initdb --auth=trust`),
  avec trois bases : suites SQL, `carnet_e2e` (E2E) et `carnet_audit_test`
  (banc). La base distante partagée n’a jamais été utilisée.
- **Rôles exercés** : superadmin ; compte Administrateur ; compte Utilisateur délégué
  (Répertoire : consulter, modifier les fiches, consulter les coordonnées) avec
  sa première connexion complète ; compte désactivé ; compte au nom très long ;
  33 fiches du Répertoire (mineur, pseudo de 56 caractères, nom composé,
  coordonnées multiples) créées par les vraies API.
- **Largeurs** : 1 440, 1 024, 768, 390 et 320 px.
- **Exclusions** : lecteur d’écran humain, Safari/iOS, appareils physiques,
  charge concurrente, restauration de sauvegarde, exploitation réelle
  (planificateur de maintenance) : non exercés, voir [Limites](#limites).

## Contrôles exécutés

| Contrôle | Commande ou protocole | Résultat |
| --- | --- | --- |
| Chaîne CI complète | `bun run check` au départ | Réussie : documentation, lint, knip, types, budget d’architecture, 1 266 tests web (227 SQL ignorés faute de base), build et budget de performance |
| Suites SQL | `bun run test:postgres` sur le PostgreSQL jetable | **227 / 227** réussis (12 suites), au départ |
| Parcours E2E | `bun run test:e2e` sur `carnet_e2e` (build de production) | Réussi au départ (création et fiche utilisateur, paramètres, journal, contrôle mobile, CSP) ; rejoué après corrections, voir [Vérification](#vérification-des-corrections) |
| Banc réel | Serveur de production local, connexion avec double authentification réelle, 19 vues × 5 largeurs, axe-core 4 (WCAG 2.2 AA et bonnes pratiques), console et réponses HTTP relevées | 95 captures relues ; aucun débordement horizontal ; constats ci-dessous |
| Parcours interactifs | Connexion en erreur, étape du code, première connexion d’un membre (double authentification obligatoire, codes de secours, mot de passe temporaire), vues d’un compte limité, journal déplié et filtré, fenêtres de la fiche personne et de la fiche utilisateur, recherche rapide, menus | 43 captures relues |
| Lecture du code | Pages, cadre, journal, routes API, middleware, limitation de débit, authentification, catalogue des autorisations, navigation | Constats ci-dessous |
| Relevés automatiques | Chaînes visibles (apostrophes, « … », deux-points, vocabulaire), TODO, `console`, couleurs codées, exceptions de lint, BOM | 0 TODO, 0 couleur codée, exceptions de lint justifiées ; écarts typographiques ci-dessous |

Les bancs utilisent des scripts et des mots de passe jetables de la session ;
ils ne sont pas conservés dans le dépôt. Aucune capture contenant un secret
(QR, clé, codes de secours) n’est conservée.

## Verdict

**Socle solide, corrections nécessaires appliquées.** Dans le périmètre exercé
(tests, SQL, E2E, banc réel et lecture ciblée du code), les contrôles d’accès,
les transactions, la traçabilité et la qualité du code tiennent : aucun accès
indu ni perte de données constatés, chaîne de contrôle et tests au vert. L’audit a trouvé
**un défaut P1** (le Répertoire se déclarait « indisponible » et bloquait la
saisie dès que la limitation de débit refusait son contrôle de disponibilité),
plusieurs défauts P2 de justesse et d’accessibilité, du code mort et une
documentation en retard. Tous les défauts qui ne demandaient aucune décision
sont **corrigés et vérifiés** (tableau suivant). Restent des **propositions
d’interface et de vocabulaire** à valider par le propriétaire et des
simplifications d’architecture, listées plus bas.

## Corrigé et vérifié

| ID | Nature / priorité | Constat (attendu / observé) | Correction | Vérification |
| --- | --- | --- | --- | --- |
| AC-01 | Défaut, **P1** | `/api/health/ready` est limité à 12 appels par minute et par adresse, et chaque onglet l’appelle au chargement puis toutes les 30 s. Sur un 429, l’état restait inconnu mais la page le traitait comme « non prêt » : création de fiche, fiche et coordonnées affichaient « temporairement indisponible », champs et suppression désactivés. Reproduit sur le banc ; le test E2E contournait déjà ce défaut (attente puis « Revérifier ») | Seul un « non prêt » explicite rend le Répertoire indisponible ; les deux ensembles « navigable » et « opérationnel », devenus identiques, sont fusionnés (`availableFeatureIds`, `isPersonsFeatureAvailable`) ; le contournement E2E est remplacé par l’assertion du bon comportement | Test `feature-readiness` (429 au premier chargement) ; banc : 429 dès le 11ᵉ appel, puis création, fiche et coordonnées utilisables ; E2E rejoué |
| AC-02 | Défaut, P2 | La confirmation d’un changement d’identifiant annonçait « ferme toutes les sessions de l’utilisateur », celle des autorisations « et fermer ses sessions » : faux depuis la décision du 25 octobre 2026 (seule la désactivation déconnecte) | Textes réécrits (`user-detail-saves.ts`) : nouvel identifiant à la prochaine connexion, sessions conservées ; changement de rôle appliqué sans déconnexion ; désactivation, seule à déconnecter | Lecture du service (`user-update.service.ts`), types et tests |
| AC-03 | Défaut, P2 | Page de connexion : « La récupération est gérée par le propriétaire superadmin », alors qu’un administrateur réinitialise mot de passe et double authentification | « Mot de passe oublié ou application d’authentification perdue ? Un administrateur de Noctambule peut réinitialiser votre accès. » | Test de contrat mis à jour |
| AC-04 | Défaut, P2 (axe « grave ») | Mon compte › Profil : la liste de descriptions contenait des `div` imbriqués et un bouton (`definition-list`, `dlitem`) | Groupe en grille, bouton dans son propre `dd`, rendu identique | axe sans violation sur Mon compte, capture comparée |
| AC-05 | Défaut, P2 (règle du 25 octobre) | « Identifiant racine permanent… » visible dans Mon compte ; « Ce compte protégé ne peut pas être géré » renvoyé quand un administrateur vise les sessions d’un autre administrateur (qui n’est pas le compte protégé) | « Identifiant du superadmin, permanent… » ; « Seul le superadmin peut gérer les sessions d’un administrateur » ; nouveau test de garde `visible-wording-contracts` (plus de « racine », « super-administrateur » ni « compte protégé » visibles) | Test de garde ; banc |
| AC-06 | Défaut, P2 | Codes de secours (24 caractères en 6 groupes) coupés au milieu d’un groupe (« …-MYO / W-… »), source d’erreurs de recopie | Retour à la ligne aux seuls tirets | Banc : codes renouvelés, coupure aux tirets à 1 440 et 390 px |
| AC-07 | Défaut, P2 (WCAG 2.4.2) | Six vues avaient pour titre d’onglet « Noctambule » (création et fiche du Répertoire, journal, paramètres, feuille de route) ; liste, création et fiche des utilisateurs partageaient « Utilisateurs · Noctambule » | Titre propre à chaque vue (layouts de titre, `generateMetadata` des paramètres) | Banc : 11 titres distincts relevés |
| AC-08 | Défaut, P2 | Journal : un code de double authentification refusé affichait « Motif : Autre motif » ; un état incohérent aussi | Motifs `MFA_INVALID` et `MFA_STATE_INCONSISTENT` ; en plus, motif des confirmations d’identité échouées, nombre de sessions fermées, « Application d’authentification remplacée » distinguée de l’activation | Tests `audit-journal` ; banc : motif affiché après un vrai code refusé |
| AC-09 | Défaut, P3 | Journal filtré par compte ou fiche : « Compte : introuvable » affiché pendant le chargement | « … » tant qu’aucune réponse ne l’établit | Lecture du code ; types |
| AC-10 | Défaut, P3 (axe) | En-tête de la barre latérale hors de tout repère (`region`, toutes les pages) | La barre latérale d’ordinateur devient `aside` « Barre latérale » | axe sans `region` |
| AC-11 | Code mort, P2 | Le mode réduit de la barre latérale, retiré le 27 septembre 2026, gardait sa préférence stockée (clé `team-control:…`), son mode icône, ses infobulles et ses branches ; `ui/sidebar.tsx` (812 lignes) vivait sous une exception de 815 lignes ; le test de contrat exigeait ce code mort | Retiré de la primitive, de la barre, du menu Rubriques et des styles ; 616 lignes, exception supprimée du contrôle d’architecture ; contrat réécrit | Budget d’architecture, tests, build (environ 1,3 Ko compressés de moins par page) ; banc : volet mobile, focus de fermeture et menu du compte |
| AC-12 | Code mort, P3 | `canOpenNavigationHref`, `getNavigationItemByHref`, la liste de 46 adresses réservées, `getVisibleNavSections`, `NAV_SECTIONS` et `getFeatureByHref` n’étaient appelés que par des tests ; la navigation décrivait un « refus d’ouverture » qui n’était branché nulle part | Retirés ; tests adaptés en gardant leurs vérifications utiles (registre ↔ navigation, catalogue de la feuille de route) | Tests et knip |
| AC-13 | Code mort, P3 | Restes de l’historique de champ retiré le 27 octobre : schéma de requête, plafond `fieldHistory`, message `INVALID_PERSON_HISTORY_FIELD` jamais levé | Retirés avec leurs assertions | Tests |
| AC-14 | Typographie, P3 | Points de suspension écrits « ... » (connexion, chargement, recherche rapide, dialogues) | « … » partout ; garde dans `visible-wording-contracts` | Test de garde |
| AC-15 | Hygiène, P3 | Marque d’ordre d’octets (BOM) en tête de trois fichiers source | Retirée | Lint et types |
| AC-16 | Documentation, P3 | Permissions (27/25 au lieu de 28/26, provenance et journal décrits comme prévus, section des anciennes clés contradictoire), navigation (cinq entrées, adresses réservées, titres, onglets des fiches), inventaires (11 pages, 33 routes, 19 modèles, 115 tests), en-tête du journal | Documents corrigés ; constats SYS-11 à SYS-14 ouverts | `bun run docs:check` |

## À décider par le propriétaire

Propositions d’interface et de vocabulaire, à valider (« ok go ») avant
application, conformément à la [boucle des préférences](../design/README.md#boucle-des-préférences).

| ID | Priorité | Constat | Proposition |
| --- | --- | --- | --- |
| AC-20 | P2 | Confirmations qui ne nomment pas leur cible : « Supprimer définitivement cette fiche ? », « Réinitialiser le mot de passe ? » ; la règle du 27 octobre exige déjà l’élément nommé dans la confirmation de suppression d’une coordonnée | Nommer la fiche ou le compte dans le titre de chaque confirmation (« Supprimer définitivement la fiche de Kami · Camille Durand-Lefèvre ? ») |
| AC-21 | P3 | Deux écrans « Accès refusé » différents (Utilisateurs : « Vous n’avez pas la permission… » et « Retour à l’accueil » ; Paramètres : « réservée aux administrateurs autorisés » et « Retour au pôle Système ») ; une vingtaine de messages disent « permission » alors que l’interface dit « autorisation » ou « accès » | Une formule commune (« Vous n’avez pas l’autorisation de… », retour à l’accueil) et le mot « autorisation » dans tous les messages |
| AC-22 | P3 | 94 chaînes visibles à apostrophe droite (et 31 `&apos;`) contre environ 193 typographiques, parfois dans la même phrase | Normaliser en « ’ » et l’ajouter au test de garde |
| AC-23 | P3 | Descriptions d’audit stockées : deux-points sans espace (« Connexion échouée: x »), « MFA », « code de récupération », « confirmation renforcée » ; le journal affiche ces phrases comme sujet quand aucun compte n’est visé, d’où « Connexion échouée · Connexion échouée: jdoe » et « Journal consulté · Journal d’activité consulté » | Pour les nouveaux événements : typographie et vocabulaire du site ; dans le journal, sujet construit (« Identifiant : jdoe ») au lieu de la phrase stockée |
| AC-24 | P3 | Sécurité : « Mot de passe : À jour » et « Dernier changement : Jamais » pour un mot de passe défini à la création | « Défini à la création du compte » quand aucun changement n’est connu |
| AC-25 | P3 | Adresse « ::ffff:127.0.0.1 » (IPv4 dans IPv6) affichée brute dans les sessions et le journal | Afficher « 127.0.0.1 » |
| AC-26 | P3 | Sur une même page, en-têtes de cartes de deux hauteurs (rubriques à 60 px, « Droits d’administration » et « Sessions actives » à 68 px) | Aligner ces deux cartes sur `RubricCard` |
| AC-27 | P3 | « SESSION ACTUELLE » (rubrique) et pastille « Session actuelle » dans la même carte | Garder l’une des deux |
| AC-28 | P3 | Double authentification non configurée : « à configurer » (bandeau) et « Configuration obligatoire » (carte) sur la même fiche | Même libellé partout |
| AC-29 | P3 | Champ de contact nommé « Adresse de contact » (création, exemple « Contact ») et « Email de contact » (fiche, exemple « Non renseigné » dans un champ modifiable, Mon compte) ; « underscore » dans l’aide de l’identifiant ; « scope », « payload » dans des messages | Un seul nom, un exemple d’adresse, « tiret bas », messages en français |
| AC-30 | P3 | Créations divergentes : Nouvel utilisateur en rubriques à petites capitales, barre d’actions dans la carte ; Nouvelle fiche sans rubrique, barre sous la carte et décalée de 12 px | Une composition commune pour le gabarit C (cartes de rubrique comme les fiches qu’elles ouvrent) |
| AC-31 | P3 | Le rôle s’appelle « Accès » (colonne de liste, rubrique de création) et « Rôle » (éditeur d’autorisations) | Un seul nom |
| AC-32 | P3 | Journal : « Compte désactivé · À surveiller · Compte actif » paraît contradictoire ; paramètre nommé « Journal d’activité » avec « Valeur par défaut » au lieu de « 365 jours (1 an, défaut) » ; « Rattachement » au lieu de « Statut dans la structure » ; auteur « Aucun compte reconnu » quand le compte visé est connu ; motif « Identifiant ou mot de passe incorrect » alors que le journal, réservé aux administrateurs, pourrait dire « Mot de passe incorrect » | Pas de résumé de champ pour activation/désactivation ; « Conservation du journal d’activité » avec la valeur par défaut chiffrée ; vocabulaire de la fiche ; « Personne non connectée » ; motif précis quand le compte est trouvé |
| AC-33 | P3 | Pagination « Page 1 » (Utilisateurs, journal) contre « Page 1 sur 2 » (Répertoire) ; « 33 fiches trouvées » sans recherche | Même forme partout ; « 33 fiches » sans critère |
| AC-34 | P3 | Changement de mot de passe : une règle non respectée (nom, identifiant) reste un cercle neutre, bouton désactivé sans explication | Règle en échec signalée comme telle |
| AC-35 | P3 | Toast « Connexion réussie » alors que l’arrivée sur l’accueil suffit ([politique des retours](../references/feedback.md)) | Retirer le toast |
| AC-36 | P3 | Tri « Nom (A–Z) » : trie par nom affiché (pseudo, sinon prénom) | « Nom affiché (A–Z) » ou tri par nom de famille |
| AC-37 | P3 | Connexion : « Vérification en deux étapes » au lieu de « double authentification » ; aide « Rester connecté… » non reliée à la case (`aria-describedby`) ; description « …aux comptes et à l’administration » pour tout membre | Vocabulaire commun, aide reliée sans la déplacer, description neutre |
| AC-38 | P3 | Menu du compte : « Mon compte — Profil et sécurité » alors que Mon compte a trois onglets | « Profil, autorisations et sécurité » |
| AC-39 | P3 | Autorisation `dashboard:view` libellée « Consulter le tableau de bord » (la page s’appelle « Mon travail ») ; pied « adressez-vous à un administrateur » montré à un Administrateur | Libellé aligné ; pied adapté ou masqué pour un Administrateur |
| AC-40 | P3 | Ordre des titres (axe) : « Droits d’administration » en `h3` sans `h2`, titres de cartes mobiles des listes, création d’utilisateur | Titre de section masqué en `h2`, cartes en `h2`/`h3` cohérents |
| AC-41 | P3 | Journal : au-delà de 200 pages, le total annonce plus d’événements qu’il n’en laisse atteindre, sans explication | Phrase « Affinez la recherche ou la période pour voir les plus anciens » |

## Traçabilité et sécurité (propositions)

| ID | Priorité | Constat | Proposition |
| --- | --- | --- | --- |
| AC-42 | P3 | Activation de la double authentification (première connexion, remplacement) : un code faux n’écrit aucun échec (seul le blocage final est tracé) | Écrire un échec de connexion ou de confirmation avec son motif |
| AC-43 | P3 | La purge de maintenance supprime des événements du journal et des sessions sans trace | Un événement « Journal purgé : N événements de plus de X jours » (règle OWASP de journalisation des suppressions de journaux) |
| AC-44 | Info | Deux lectures simultanées du journal peuvent écrire deux « Journal consulté » | Sans gravité ; à garder en tête si la trace devient une alerte |

## Architecture et dette (propositions)

| ID | Priorité | Constat | Proposition |
| --- | --- | --- | --- |
| AC-45 | P2 | ~1 480 lignes d’introspection du schéma pour la disponibilité du Répertoire, sondage client toutes les 30 s ([SYS-11](../systeme/constats.md)) | Vérification au démarrage, plus de sondage client |
| AC-46 | P3 | `withPrivateNoStore` sur 9 routes sur 32 ([SYS-12](../systeme/constats.md)) | Une seule règle |
| AC-47 | P3 | Modules rangés de deux façons ([SYS-13](../systeme/constats.md)) | Ranger à la prochaine reprise |
| AC-48 | P3 | Paramètres servis par une route générique ([SYS-14](../systeme/constats.md)) | Route explicite |
| AC-49 | P3 | La page de création de fiche est la plus lourde (318 Ko compressés) : le formulaire, qui ne saisit que l’identité, importe le schéma complet et donc la bibliothèque des numéros de téléphone | Schéma d’identité séparé côté navigateur |
| AC-50 | P3 | Paramètres : « Dernière modification le… » sans auteur ni lien (PAR-S-06), alors que le journal existe | Lien « Voir dans le journal » (type Paramètres, 1 an) |
| AC-51 | Produit | L’accueil reste un bandeau (ACC-02) | À cadrer avec le chantier « Mon travail » |
| AC-52 | Poste | Bun 1.4.2 installé (manifeste 1.3.10) ; navigateurs Playwright 1243 pour un `playwright-core` qui attend 1248 hors suite E2E ; `.env` local avec `SEED_SUPERADMIN_EMAIL`, encore accepté en repli par la graine ; dossier local ignoré `apps/web/ignore/` de septembre | Aligner le poste ; renommer la variable puis retirer le repli |

## Vérification des corrections

- Suites SQL rejouées après corrections : **227 / 227**.
- Suite web complète après corrections : **109 fichiers et 1 268 tests
  réussis** (227 SQL ignorés sans base), lint, knip, types et budget
  d’architecture sans erreur ; build de production et budget de performance
  réussis.
- Banc réel sur le build corrigé : disponibilité après 429 (trois pages), titres,
  axe de Mon compte (`definition-list`, `dlitem`, `region` absents), texte du
  superadmin, motif du journal, codes de secours, volet mobile et menu du compte :
  tous conformes.
- E2E : la première relance a échoué sur le contournement du défaut AC-01
  (bouton « Revérifier » attendu après un 429) ; le test vérifie désormais que la
  fiche reste utilisable. Relance sur une base `carnet_e2e` neuve : **réussie**
  en 1,0 min au lieu de 1,7 min, le test n’attendant plus la levée du 429.

## Suivi — propositions appliquées le 31 octobre 2026

Retour du propriétaire : « go tous corriger ce que tu recommandes »
([journal des préférences](../design/preferences.md#journal)). Chaque
recommandation ci-dessus est appliquée, sauf ce qui n’est pas du code (AC-51) ou
touche le poste lui-même (version de Bun).

| ID | Décision appliquée |
| --- | --- |
| AC-20 | Toutes les confirmations nomment leur cible : fiche, compte (mot de passe, sessions, suppression, identifiant, double authentification, email de contact), session, paramètre ; AUD-Q1 tranchée |
| AC-21 | Un seul écran « Accès refusé » (`AccessDeniedState` : `action`, `back`, `note`) ; « autorisation » dans tous les messages, serveur compris |
| AC-22 | 116 chaînes converties en « ’ », `&apos;` retiré ; garde ajoutée à `visible-wording-contracts` |
| AC-23 | Descriptions enregistrées au vocabulaire du site (« Connexion échouée : x », « Code de secours utilisé », « Identité confirmée »…) ; sujet construit dans le journal (identifiant tapé, paramètre, nombre d’événements purgés) |
| AC-24 | « Défini à la création du compte » ou « Mot de passe temporaire, à changer » au lieu de « Dernier changement : Jamais » |
| AC-25 | Adresse IPv4 dans IPv6 enregistrée et affichée sous sa forme IPv4 (limitation de débit, journal, sessions) |
| AC-26, AC-27 | En-tête commun `RUBRIC_HEADER_CLASS` ; rubrique « Session actuelle » retirée, la ligne garde sa pastille |
| AC-28 | « À configurer » partout pour la double authentification |
| AC-29 | « Email de contact » partout (champs, fenêtres, messages, autorisations), exemple « nom@exemple.fr », « tiret bas », messages sans « scope » ni « payload » |
| AC-30 | Pages de création en cartes de rubrique de la fiche ouverte, barre en ligne sous les cartes ([gabarit C](../design/gabarits.md#c-formulaire-de-création)) |
| AC-31 | « Rôle » dans la liste, la création et le récapitulatif |
| AC-32 | Journal : activation et désactivation sans résumé de champ, « Conservation du journal d’activité » et valeur par défaut chiffrée, « Statut dans la structure », « Personne non connectée », motifs « Identifiant inconnu » et « Mot de passe incorrect » |
| AC-33 | « Page X sur Y » toujours ; « 33 fiches » sans critère, « trouvées » avec |
| AC-34 | Règle de mot de passe enfreinte en rouge, « non respectée » pour les lecteurs d’écran |
| AC-35 | Toast « Connexion réussie » retiré |
| AC-36 | Tri « Nom affiché (A–Z) » |
| AC-37 | « Double authentification », aide reliée par `aria-describedby`, description neutre |
| AC-38 | « Profil, autorisations et sécurité » |
| AC-39 | « Consulter Mon travail » ; pied « adressez-vous à un administrateur » masqué pour un Administrateur |
| AC-40 | Titre `h2` de l’onglet Autorisations de Mon compte et des créations ; titres des cartes mobiles des listes en `h2` |
| AC-41 | Phrase « Seuls les 10 000 plus récents s’affichent : affinez la recherche ou la période… » |
| AC-42 | Toute preuve refusée laisse « Confirmation d’identité échouée » avec étape et motif (`recordRefusedProof` : email de contact, mot de passe, gestion, activation et réinitialisation de la double authentification) ; code faux à l’activation obligatoire : `LOGIN_FAILED` motif `MFA_SETUP_INVALID` |
| AC-43 | « Journal purgé » (`AUDIT_PURGE`, migration `20261031130000_audit_purge_action`) écrit par la purge dans sa transaction, avec événements, conservation et sessions expirées |
| AC-45 | Sondage client et introspection (~1 480 lignes) retirés ; sonde de déploiement légère ; 503 explicite de l’API du Répertoire ([SYS-11](../systeme/constats.md)) |
| AC-46 | Une règle de cache : `apiSuccess` et `apiError` marquent chaque réponse ([SYS-12](../systeme/constats.md)) |
| AC-47 | 27 fichiers d’`audit`, `users`, `settings` et `roadmap` rangés ([SYS-13](../systeme/constats.md)) |
| AC-48 | Routes explicites `/systeme` et `/systeme/parametres`, route générique retirée ([SYS-14](../systeme/constats.md)) |
| AC-49 | Schéma d’identité séparé (`person-identity.schemas.ts`) pour la création et l’onglet Identité |
| AC-50 | Lien « Voir dans le journal » sous la date de modification d’un paramètre |
| AC-51 | Non applicable au code : reste à cadrer avec le chantier « Mon travail » |
| AC-52 | Variable `SEED_SUPERADMIN_EMAIL` renommée dans les deux `.env` locaux (clé seulement), anciens noms retirés de la graine ; navigateurs Playwright alignés (Chromium déjà conforme, WebKit installé). Bun 1.4.2 reste installé : changer la version du poste relève du propriétaire. Dossier `apps/web/ignore/` laissé en place (contenu local non relu) |

## Limites

Pas de lecteur d’écran humain, de Safari/iOS ni d’appareil physique ; pas de
charge concurrente ; pas d’exercice de purge, de restauration ni de rotation de
clés ; base jetable, pas d’environnement exploité. Les constats AC-20 à AC-52 sont
des propositions ou des dettes, pas des corrections livrées. Les audits datés
précédents gardent leur portée.

## Suivi

Fiches mises à jour : [journal d’activité](../pages/systeme/journal-activite.md),
[connexion](../pages/connexion.md), [Mon compte — Profil](../pages/mon-compte/profil.md),
[Mon compte — Sécurité](../pages/mon-compte/securite.md),
[fiche utilisateur](../pages/systeme/utilisateurs/README.md),
[Répertoire](../pages/membres/repertoire/README.md),
[navigation générale](../pages/transverse/navigation-generale.md) ;
écarts de design dans l’[harmonisation](../design/harmonisation.md)
(HARMO-08 à HARMO-11) ; constats d’architecture SYS-11 à SYS-14. Réexamen : à la
validation des propositions, ou si la limitation de débit, la disponibilité du
Répertoire ou le cadre de navigation changent.

## Historique

- 31 octobre 2026 : audit, corrections AC-01 à AC-16, vérifications ci-dessus ;
  suite web 1 268/1 268, SQL 227/227 et E2E réussis avant et après corrections.
