# Recherche rapide de l’en-tête — audit ciblé du 31 octobre 2026

[Index des audits](README.md) · [Méthode](../methode/audit.md) ·
[Fiche de la navigation générale](../pages/transverse/navigation-generale.md)

## Question, périmètre et état examiné

- **Demande du propriétaire** : « la barre d’onglet, dis-moi si toutes les
  recherches sont bonnes », analyse complète. Lue comme la barre d’en-tête
  (fil d’Ariane et recherche rapide « Rechercher une page »), complétée par la
  concordance des noms avec la barre latérale, le titre de page et le titre
  d’onglet du navigateur. Les barres de sections des fiches n’ont pas de
  recherche : hors périmètre.
- **Attendu** : la recherche trouve, pour les mots qu’un membre emploie, la page
  autorisée qui y répond, et rien d’autre ; elle reste utilisable au clavier et
  sur téléphone. Portée fixée le 27 septembre 2026 : pages autorisées seulement,
  pas de personnes ni de dossiers, pas de recherche approximative, alias utiles
  « selon les usages » ([analyse du 27 septembre](../pages/transverse/navigation-generale.md#analyse-de-la-recherche-rapide--27-septembre-2026)).
- **Type** : audit ciblé du contrat partagé (`QuickNavigation`, catalogue,
  classement) et de ses consommateurs (toutes les pages privées).
- **État** : `main` à `8a8045b` avec des changements locaux non commités (audit
  complet du 31 octobre). Build de production, base jetable locale.
- **Rôles** : superadmin réel dans le navigateur ; superadmin, administrateur,
  membre, lecteur du journal et lecteur du Répertoire dans la sonde du catalogue.

## Preuves

| Preuve | Contenu | Limite |
| --- | --- | --- |
| Lecture du code | [GlobalSearch](../../apps/web/src/components/layout/GlobalSearch.tsx), [classement](../../apps/web/src/components/layout/global-search.utils.ts), [catalogue](../../apps/web/src/features/search/search-catalog.ts), [navigation](../../apps/web/src/shared/constants/app.constants.ts), [fonctionnalités](../../apps/web/src/shared/constants/feature-registry.constants.ts), titres des `layout.tsx` | Aucun parcours exécuté |
| Sonde du catalogue réel | Fonctions de la page (`buildSearchCatalog`, `rankSearchResults`, `getSuggestedSearchItems`), 5 profils, 90 requêtes, suggestions sur 5 adresses ; test Vitest temporaire, retiré après relevé | Logique client seule, sans rendu |
| Navigateur, build de production | Connexion réelle avec double authentification, 17 adresses (titre d’onglet, titre de page, fil d’Ariane, entrée active, suggestions, focus après Échap), 15 requêtes saisies, clavier, 1 440, 768, 390 et 320 px ; 11 captures relues, non conservées | Profils limités non rejoués dans le navigateur ; Chromium seul ; pas de lecteur d’écran réel |

La sonde navigateur tournait sur le port 3002 : le build de production écrit
dans `.next-build`, distinct du `.next-dev` du serveur de développement.

## Ce qui est conforme

| Élément | Observé |
| --- | --- |
| Droits | Aucune page non autorisée ni planifiée dans le catalogue des cinq profils. Membre : Mon travail, Feuille de route, Mon compte. Lecteur du journal : en plus Journal d’activité. Lecteur du Répertoire : en plus Répertoire |
| Normalisation | Accents, casse, espaces, ligatures, apostrophe droite ou typographique (« journal d'activité » = « journal d’activité ») ; saisie bornée à 160 caractères |
| Classement | Le nom prime : « compte » → Mon compte puis Utilisateurs ; « système » → Paramètres système puis les trois autres pages du pôle ; « journ » → Journal d’activité |
| Suggestions | Pages de la rubrique active en tête ; page exacte marquée « Page actuelle » (`aria-current="page"`), page parente « Section actuelle » (`location`) sur les 17 adresses |
| Clavier | Entrée ouvre le premier résultat et ferme la fenêtre ; flèches avec bouclage ; Entrée sur la page actuelle ferme sans recharger ; Échap rend le focus au déclencheur (17 sur 17) ; Ctrl + K inactif (décision) |
| Annonce | Groupe « Pages suggérées » ou « Résultats », nombre de résultats annoncé, état vide « Aucune page trouvée » |
| Téléphone | Plein écran à 390 × 844 et 320 × 568, effacer et fermer à 44 px, aucun débordement ; icône de 44 px à 768 px |
| Anciennes adresses | `/tableau-de-bord` et `/recherche` → accueil, `/personnes` → Répertoire |
| Concordance des noms | Barre latérale, résultat, titre de page et titre d’onglet identiques pour Répertoire, Utilisateurs, Journal d’activité, Paramètres système, Feuille de route, Nouvelle fiche et Nouvel utilisateur. Sur une page enfant, le fil d’Ariane replie le pôle dans « … », conformément à « Membres → Répertoire → fiche » |

## Constats

| ID | Nature / priorité | Reproduction : attendu / observé | Impact | Action proposée | État |
| --- | --- | --- | --- | --- | --- |
| RR-01 | Défaut, P2 | « personne » : attendu Répertoire ; observé Mon compte (sélectionné) puis Mon travail, par correspondance avec « personnel » (« Compte personnel », « espace personnel »). « personnes » : aucun résultat | Entrée ouvre Mon compte pour qui cherche les personnes, sujet du Répertoire et de son ancienne adresse `/personnes` | Alias « personnes » sur le Répertoire, classé au-dessus d’une correspondance fortuite dans une description | Corrigé et vérifié |
| RR-02 | Défaut, P3 | Description de Mon compte dans la recherche : « Profil, sécurité et sessions de connexion. » ; menu du compte et onglets : « Profil, autorisations et sécurité » (AC-38). « autorisations » ne trouve pas Mon compte (aucun résultat pour un membre) | Libellé en retard sur l’audit complet ; l’onglet Autorisations est introuvable | Reprendre « Profil, autorisations et sécurité » ; adapter le test qui attend aucun résultat pour « autorisations » côté membre, en gardant Utilisateurs caché | Corrigé et vérifié |
| RR-03 | Défaut, P3 | « administration », « projet » : sections visibles dans la barre latérale ; aucun résultat, alors que l’état vide invite à essayer « une rubrique » | Le vocabulaire affiché à côté de la recherche ne la sert pas | Ajouter le nom de section au texte cherché, classé comme le nom de rubrique | Corrigé et vérifié |
| RR-04 | Suggestion, P2 | Sans résultat : « logs », « historique », « audit », « traces » (Journal) ; « mot de passe », « double authentification », « 2fa », « mfa » (Mon compte) ; « droits », « permissions », « accès » (Utilisateurs, Mon compte) ; « réglages » (Paramètres) ; « tableau de bord », « dashboard » (Mon travail) ; « roadmap » (Feuille de route) ; « annuaire », « fiches » (Répertoire) | Les mots les plus probables pour trouver ces pages échouent ; la recherche ne connaît que le nom, la rubrique et une phrase | Liste fermée de mots-clés par fonctionnalité dans le registre, comparée comme la description, sans recherche approximative | Corrigé et vérifié |
| RR-05 | Suggestion, P3 | Le sous-titre de la page et la description de recherche diffèrent : Répertoire « Profils, coordonnées et rattachement… » / « Membres et contacts… » ; Utilisateurs « Gérez les comptes et leurs accès » / « Comptes, rôles et autorisations… » ; Paramètres « Réglages globaux… » / « Configuration globale… » | Un mot lu sur la page ne la retrouve pas | Couvert par RR-04 (mots-clés reprenant le sous-titre) | Corrigé et vérifié avec RR-04 |
| RR-06 | Suggestion, P3 | « ajouter », « créer », « nouvel utilisateur » : aucun résultat ; les pages Nouvelle fiche et Nouvel utilisateur ne sont pas dans le catalogue | Raccourci absent vers les deux créations | Les ajouter sous leur droit de création, rangées sous leur liste | Non retenu (« Ajouter une fiche » est sur la liste) |
| RR-07 | Suggestion, P3 | Onglets Sécurité et Autorisations de Mon compte non adressables : la recherche ouvre Profil | Un chemin de plus vers le mot de passe et la double authentification | Résultats « Sécurité · Mon compte » et « Autorisations · Mon compte » vers l’onglet | Corrigé et vérifié |
| RR-08 | Défaut, P3 | Annonce lecteur d’écran « 0 résultats affichés » ; convention du site : singulier jusqu’à un (`count > 1`) | Accord faux, isolé | « Aucun résultat affiché » ou « 0 résultat affiché » | Corrigé et vérifié |
| RR-09 | Suggestion, P3 | À 1 440 × 900, liste plafonnée à 384 px : sur sept suggestions, « Répertoire » coupé et « Mon compte » caché ; la fenêtre peut atteindre 608 px | Défilement pour un élément et demi | Hauteur de liste pour huit lignes quand la fenêtre le permet | Corrigé et vérifié |
| RR-10 | Défaut, P3 (WCAG 2.4.2) | Titre d’onglet « Noctambule » seul sur l’accueil et la page introuvable ; « Fiche · Répertoire » face à « Fiche utilisateur · Utilisateurs » ; en développement, « · Dev » ne s’affiche que sur ces deux pages, chaque page réécrivant le titre complet | Deux vues sans nom ; marque de développement perdue | Gabarit de titre racine (« %s · Noctambule », « · Dev » en développement), « Mon travail », « Page introuvable », « Fiche personne » | Corrigé et vérifié |
| RR-11 | Dette, P3 | Champs `id`, `source`, `sourceLabel` du catalogue sans lecteur depuis le retrait de la recherche complète ; `matchHrefs` `/tableau-de-bord` et `/administration` jamais atteints (redirigés avant l’application), `PAGE_PATHS.roadmap` redondant sous `/systeme` ; chemin par défaut `/tableau-de-bord` de `getDesktopSidebarSections` | Code mort qui suggère des chemins inexistants | Retirer | Corrigé |
| RR-12 | Observation | Fautes de frappe (« jounral ») et élisions collées (« aujourdhui », « journal dactivite ») : aucun résultat | Conforme à la décision du 27 septembre : pas de recherche approximative | Aucune | Clos |

## Suivi — corrections du 31 octobre 2026

« Ok go » du propriétaire sur les recommandations : défauts nets et mots-clés.

| Constat | Correction | Contrôle |
| --- | --- | --- |
| RR-01, RR-03 à RR-05 | Mots-clés fermés par fonctionnalité dans le [registre](../../apps/web/src/shared/constants/feature-registry.constants.ts) (`keywords`), Mon compte dans le [catalogue](../../apps/web/src/features/search/search-catalog.ts) ; nom de section cherché ; un mot-clé (30) passe devant la rubrique ou la section (20) dans le [classement](../../apps/web/src/components/layout/global-search.utils.ts) | Navigateur : « personne » → Répertoire en tête, Entrée l’ouvre ; « logs », « historique » → Journal ; « mot de passe » → Mon compte ; « Administration » → ses trois pages ; « projet », « réglages », « tableau de bord », « droits » → la page attendue ; « compte » et « système » inchangés. Membre : rien par « logs », « personnes », « administration » ; « droits » → Mon compte seul |
| RR-02 | « Profil, autorisations et sécurité. » ; test « autorisations » côté membre → Mon compte, Utilisateurs toujours absent | Navigateur et Vitest |
| RR-08 | Singulier jusqu’à un | Navigateur : « 0 résultat affiché », « 1 résultat affiché », « 3 résultats affichés » |
| RR-10 | [`pageTitle`](../../apps/web/src/shared/utils/page-title.utils.ts) compose chaque titre (« Vue · Parente · Noctambule », « · Dev » en développement) ; l’accueil devient une route serveur autour de [HomePage](../../apps/web/src/features/dashboard/components/HomePage.tsx) ; la page introuvable déclare son titre ; fiche du Répertoire « Fiche personne ». Un gabarit de titre Next ne convenait pas : il ne s’applique pas à la page de son propre segment (documentation Next 15) | Navigateur : 12 titres distincts, une seule balise `title`, « Mon travail · Noctambule » et « Page introuvable · Noctambule » ; Vitest, dont la marque de développement |
| RR-11 | Champs `id`, `source`, `sourceLabel` retirés ; `matchHrefs` réduit à `/systeme` pour Système (nécessaire : l’adresse du pôle suit la première page visible), retiré pour Aujourd’hui ; chemin du panneau latéral obligatoire | Vitest, types, knip |

Contrôles du 31 octobre 2026 : lint, knip, types, budget d’architecture, Vitest
1 236 réussis (14 nouveaux) et 227 ignorés, tests de la base, build de
production et budget de performance réussis ; navigation et titres rejoués sur
build de production et base jetable (captures relues à 1 440 et 390 px).
`bun run check` s’est arrêté à la génération Prisma, verrouillée sous Windows
par le serveur de développement ouvert : étapes suivantes lancées séparément.
Options, sur « si tu recommandes fais, sinon non » du propriétaire :

| Constat | Correction | Contrôle |
| --- | --- | --- |
| RR-07 | Résultats « Sécurité » (`?section=security`) et « Autorisations » (`?section=access`) sous « Mon compte », trouvés par leurs seuls mots (« compte » nomme toujours la page), jamais suggérés seuls ; l’onglet Sécurité suit [`canSeeAccountSecurity`](../../apps/web/src/features/account/account-sections.ts), partagé avec la page. Toutes les autorisations de sécurité de son compte sont toujours actives : l’onglet existe pour tout compte | Navigateur : « mot de passe » puis Entrée → onglet Sécurité actif ; depuis Mon compte, « droits » → Autorisations, fenêtre fermée ; suggestions : 7 pages, aucun onglet. Vitest |
| RR-09 | Fenêtre jusqu’à 40rem, liste jusqu’à 34rem ou la hauteur disponible | Navigateur : 7 suggestions sans défilement à 1 440 × 900 et 1 366 × 768 (liste 479 px), léger défilement à 1 280 × 650, fenêtre dans l’écran ; téléphone inchangé |
| RR-06 | Non retenu : le bouton « Ajouter une fiche » est déjà sur la liste | — |

Vitest 1 239 réussis et 227 ignorés, types et lint réussis après ces options.

## Verdict et suivi

**Corrections nécessaires**, apportées et vérifiées le même jour (section
précédente). Le fonctionnement est conforme sur le périmètre
vérifié : droits, clavier, focus, téléphone, anciennes adresses et concordance
des noms. La pertinence ne l’est pas pour des mots courants : « personne »
mène à Mon compte (RR-01), les sections visibles et l’onglet Autorisations sont
introuvables (RR-02, RR-03), et l’essentiel du vocabulaire usuel reste sans
résultat (RR-04). Les points ouverts sont suivis dans la
[fiche de la navigation générale](../pages/transverse/navigation-generale.md#recherche-rapide--audit-ciblé-du-31-octobre-2026).
Réexamen : à la livraison d’une nouvelle page, d’un nouveau pôle ou d’un
changement de libellé.
