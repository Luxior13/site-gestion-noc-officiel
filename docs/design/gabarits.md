# Gabarits de page

[Système de design](README.md) · [Composants](composants.md) · [Comportements](comportements.md)

Compositions validées. Choisir le gabarit selon la tâche principale de la page,
puis adapter sections, colonnes et actions. La fiche de page consigne
l’adaptation retenue ; la [hiérarchie d’une page](#hiérarchie-dune-page) vaut
pour tous les gabarits du cadre privé.

| Gabarit | Tâche principale | Référence |
| --- | --- | --- |
| [A. Liste de gestion](#a-liste-de-gestion) | Retrouver, comparer, filtrer, ouvrir | `/personnes/repertoire`, complété par `/systeme/utilisateurs` |
| [B. Fiche à sections](#b-fiche-à-sections) | Comprendre une entité et la modifier sans perte | `/systeme/utilisateurs/[id]` ; aussi `/personnes/repertoire/[id]`, `/mon-compte` |
| [C. Formulaire de création](#c-formulaire-de-création) | Créer une entité avec le minimum utile | `/systeme/utilisateurs/nouveau`, `/personnes/repertoire/nouveau` |
| [D. Page de réglages](#d-page-de-réglages) | Comprendre la valeur effective et la changer en connaissance de cause | `/systeme/parametres` |
| [E. Page de lecture](#e-page-de-lecture) | Lire, filtrer et retrouver une information | `/systeme/feuille-de-route` |
| [F. Accueil personnel](#f-accueil-personnel) | Savoir quoi faire maintenant | `/` |
| [G. Écran hors cadre](#g-écran-hors-cadre) | Se connecter ou sortir d’une erreur | `/login`, erreur racine, page introuvable |

## A. Liste de gestion

```text
Cadre privé (sidebar 264 px, header 56 px)
└─ PageShell (76 rem) · PageCanvas
   ├─ PageIdentityHero : icône · titre · description · action principale
   └─ DataTableSection (directory.module.css, rayon 10 px)
      ├─ Barre de filtres : recherche · réinitialisation · menus compacts 38 px · tri (au bord droit)
      ├─ Filtres rapides à bascule avec compteurs, un groupe libellé par dimension · nombre de résultats
      ├─ En-tête de colonnes (surface-table-head)
      ├─ Lignes alternées (cartes sous 740 px de conteneur)
      └─ ListPagination (25 lignes, curseur ou numéro selon le contrat)
```

- Ni bandeau ni carte de synthèse ne portent de statistiques : les compteurs
  sont dans les filtres rapides, affichés seulement s’ils égalent le résultat
  (décision du 20 octobre 2026). Pas de rail sur une liste.
- Le dernier contrôle de la barre affleure le bord droit de la liste, aligné
  sur le nombre de résultats et l’action du bandeau : la réinitialisation,
  dont la place reste réservée quand elle est masquée, vient avant les menus.
- Une ligne : identité à gauche (avatar, nom, contexte en dessous), puis
  colonnes de données autorisées, statut en badge à pastille, date.
- Les colonnes dépendent des droits ; leurs seuils de passage en cartes sont
  propres à la liste (Utilisateurs : 48, 52, 56 ou 64 rem).
- Quand on vient surtout pour les éléments d’une ligne, ils s’affichent sur des
  lignes sous elle, chacune ouvrant sa fiche : les équipes sous chaque jeu de la
  page Jeux (8 novembre 2026). Chaque élément est une vraie ligne, cliquable
  sur toute sa largeur, avec sa vignette (28 px), son nom et ses colonnes ; un
  guide fin (`border-strong`) descend de la vignette du parent et mène à
  chacune, comme une arborescence, coupé à mi-hauteur sur la dernière. Un
  `tbody` par parent (`groupedTable`) : la couleur alterne par parent comme le
  Répertoire alterne par fiche, sans trait à l’intérieur d’un groupe. Un parent
  sans élément le dit sous son nom (« Aucune équipe »). Sur téléphone, la carte
  du parent puis une ligne par élément, avec le même guide, de 44 px au moins.
  La recherche trouve aussi les éléments ; un élément trouvé s’affiche seul sous
  son parent. Écartés le même jour : lignes en retrait sans vignette, bande de
  couleur par groupe, étiquettes sous le nom (petites cibles, et un clic à côté
  ouvrait le parent).
- Retour de fiche avec contexte restauré ([comportements](comportements.md#listes-recherche-et-pagination)).

Pages adoptant ce gabarit : voir [Harmonisation](harmonisation.md#état-par-page).

## B. Fiche à sections

```text
PageShell · PageCanvas (EntityDetailLayout ou composition équivalente)
├─ EntityHeader : une carte
│  ├─ PageIdentityHero compact : avatar · nom · états en pastilles · identifiant et dates · rôle à droite
│  └─ Onglets en pied (PageSectionNavigation « embedded ») : vrais liens, section active soulignée, point de brouillon
├─ Fil d’Ariane : avatar · nom · accès, en permanence (avatar et nom sur téléphone)
├─ Fiches d’un compte (Mon compte, utilisateur) : mêmes onglets, mêmes noms, même ordre, mêmes icônes — Profil · Autorisations · Sécurité ; seules les actions diffèrent
├─ Au défilement : barre réduite collée (mêmes onglets seuls)
│  └─ Onglets nombreux : « Plus ▾ » sur ordinateur, sélecteur de section sur téléphone
└─ Section active (chargée à la demande)
   ├─ Titre h2 pour les lecteurs d’écran, puis une carte titrée par rubrique (RubricCard : bandeau, tuile d’icône teintée)
   ├─ Champs aux primitives communes (40/44 px, rayon 8 px)
   └─ SectionActionBar (collante avec un brouillon)
```

- Une section par sujet ; elle possède sa propre URL (`?section=`).
- Pas de carte de synthèse ni de rail (décision du 20 octobre 2026) : les
  états utiles (compte, mot de passe, double authentification) sont des
  pastilles à côté du nom, l’identifiant et les dates sous le titre ; un
  compteur propre à une section vit dans cette section.
- Le haut d’une section n’a pas de titre visible qui répète son lien ; il
  commence par sa première rubrique (titre de section réservé aux lecteurs
  d’écran).
- Les réglages répétitifs (autorisations) sont des cartes compactes avec aide
  en popover ; les conséquences critiques restent visibles.
- Les volets d’une section se choisissent dans l’en-tête de sa carte, pas dans
  une barre isolée ; ils partagent en-tête et lignes (26 octobre 2026).
- Exception à « pas de rail » : un éditeur dont les réglages se comptent par
  dizaines sur plusieurs pôles (autorisations) a une **navigation** à gauche
  (recherche sur tous les pôles, menu déroulant « Pôle », pages de ce pôle avec
  compteur) et le détail à droite ; les filtres « Toutes / Accordées » sont dans
  l’en-tête de la carte, tenu sur une ligne. Une colonne de navigation suit
  toujours ce qu’affiche le détail : un filtre restreint ses menus et listes à
  ce qu’il retient ; une recherche sur tous les pôles la transforme en
  sommaire des résultats. Sur ordinateur (au moins 1 024 px de large et deux
  colonnes, portables compris), la carte occupe le reste de l’écran : la page ne défile plus,
  l’en-tête reste visible, chaque colonne défile seule et la barre
  d’enregistrement est ancrée en bas de la carte. Si la place restante tombe
  sous 300 px (fenêtre très basse, zoom fort), la navigation est collante et le contenu garde le défilement de la page. Sur
  une largeur réduite, la liste puis la page, avec
  « Toutes les pages ». Ce n’est pas une synthèse : elle ne répète aucune
  donnée du contenu (décision du 26 octobre 2026).
- La suppression vit dans sa section (Sécurité, Identité) avec
  `EntityDangerZone` ou une carte dédiée, toujours intitulée « Zone dangereuse »
  avec la même icône et le même en-tête teinté.

Détail et preuves : [Utilisateurs](../pages/systeme/utilisateurs/README.md).

### Onglets d’une fiche

Règles du 7 novembre 2026, vérifiées par `roadmap-site-plan.test.ts` sur le
[plan des pages](../propositions/feuille-de-route.md#pages-et-onglets-prévus) :

- **Un onglet est un lieu, un filtre est une requête** : actuels et anciens, recettes
  et dépenses sont des filtres, pas des onglets.
- **Deux à huit onglets**, les moins utilisés dans « Plus ▾ ». Une page d’un seul
  contenu n’a pas d’onglet.
- **Ordre** : ce qu’est l’objet, puis ses liens, puis ses pièces. Une fiche équipe
  commence par son Roster : c’est ce qu’est une équipe.
- **Jamais d’onglet vide** : il apparaît une fois livré et pour les comptes qui y
  ont droit, sans mention « à venir ».
- **Un mot par idée, sur toutes les pages** : « Identité » pour une personne, une
  organisation ou une entité ; « Profil » pour un compte ; « Coordonnées » ;
  « Roster » pour une équipe, le mot de l’esport, et « Effectif » pour Bureau & staff,
  où « roster » sonnerait faux (8 novembre 2026) ; « Suivi » pour les notes, problèmes et bans, et
  rien d’autre (« Entraînement » pour le travail d’une équipe, « Réalisé » pour
  un budget, 8 novembre 2026) ;
  « Règlements » pour l’argent lié à l’objet, « règles » pour celles d’un tournoi ;
  « Documents » pour les pièces, « Justificatifs » pour celles des Finances.
- **Pas d’onglet Historique** : le bouton de l’en-tête ouvre le journal, filtré.
- **Un onglet en lecture le signale** (8 novembre 2026) : quand rien ne s’y modifie et que son contenu se gère sur une autre page (Adhésions ou Finances d’une fiche personne), l’onglet garde le même style, suivi d’une flèche ↗ et du texte accessible « se modifie dans … ». Dedans, une ligne en tête nomme la page source avec un bouton pour l’ouvrir, chaque ligne ouvre son dossier, sans action de modification. Un onglet mixte (Suivi d’une fiche personne, Gains d’une fiche tournoi) reste un onglet normal : ses lignes venues d’ailleurs portent leur source et un lien.
- **Créer** : en fenêtre pour quelques champs, sur une page pour un long formulaire.
  Un élément qui a sa fiche s’ouvre sur elle, jamais dans une fenêtre : la fenêtre
  ne sert qu’à le créer, puis sa fiche s’ouvre (équipe, 8 novembre 2026).
- **Ce que demande une création** (8 novembre 2026, pensé pour le long terme) :
  seulement ce sans quoi l’élément n’existe pas, et ce qui ne changera plus
  (le jeu d’une équipe). Le reste se complète dans la fiche qui s’ouvre
  aussitôt : ce qui est automatique (anciens noms), daté (roster, rattachement
  à une entité), géré ailleurs (finances, partenaires), facultatif (logo, tag,
  réseaux) ou une action après coup (publication). Le choix entre fenêtre et
  page se fait sur cet inventaire de tout ce qui est prévu, pas sur les seuls
  champs du jour ; une page de création ne se justifie que si ce minimum reste
  long. Équipe : jeu, nom, création, active, en fenêtre.
- **Ajouter un élément à un parent** (8 novembre 2026) : un seul bouton dans le
  bandeau de la liste (« Ajouter une équipe », en secondaire à côté de l’action
  principale), jamais une ligne d’ajout sous chaque parent. La fenêtre demande le
  parent, obligatoire et sans valeur par défaut (sauf s’il n’y en a qu’un),
  puisqu’il ne changera plus ; elle propose tous les parents, actifs d’abord,
  les inactifs marqués « (inactif) » et toujours choisissables, et rappelle que
  le choix est définitif. Le bouton n’apparaît pas tant qu’aucun parent n’existe.
- **Avant le deuxième onglet** : une fiche d’un seul contenu garde l’en-tête de
  fiche sans barre d’onglets (`EntityDetailLayout` sans `sections`), comme la
  fiche équipe avant son Roster.

## C. Formulaire de création

`PageShell` en largeur `form` (52 rem), `PageIdentityHero` compact, titre
`h2` réservé aux lecteurs d’écran, puis **une carte de rubrique par groupe,
comme sur la fiche que la création ouvre** (`RubricCard` : Nouvelle fiche
« Pseudo et nom » et « Statut », Nouvel utilisateur « Identité », « Connexion
et contact » et « Rôle »), `SectionActionBar` **en ligne sous les cartes**
(`placement="inline"`, alignée sur leur largeur) en soumission native,
confirmation après succès (secret à copier une seule fois pour un compte),
reprise explicite après réponse perdue, garde de départ jusqu’au chargement.
Composition commune décidée le 31 octobre 2026 (AC-30 de l’[audit complet](../audits/2026-10-31-audit-complet.md)),
qui remplace les rubriques en petites capitales et la barre dans la carte.

- Le bandeau explique le déroulé ; chaque règle de saisie n’est écrite qu’une
  fois, près de son champ (décision du 23 octobre 2026).
- La barre d’enregistrement n’affiche pas « Modifications non enregistrées »
  sur un formulaire de création (`status={null}`) ; elle garde un message
  seulement pour un état utile, par exemple un résultat à vérifier.

Détail : [Nouvel utilisateur](../pages/systeme/utilisateurs/creation.md),
[Nouvelle fiche personne](../pages/personnes/repertoire/creation.md).

## D. Page de réglages

Bandeau compact, une carte par groupe de réglages (portée, champ, aide unique),
choix rapides pour les valeurs courantes (défaut marqué) et saisie directe,
valeur lisible dans l’unité courante (« soit 3 ans »), bornes visibles une
seule fois, avertissements encadrés, barre
commune seulement avec un brouillon, une réparation, une attente, une erreur ou
un conflit. Une réduction risquée demande une confirmation et une preuve récente.

Détail : [Paramètres système](../pages/systeme/parametres.md).

## E. Page de lecture

Bandeau, puis une carte de liste : recherche et filtres rapides partagés,
contenu en lignes dépliables sur place (bloc ouvert comme au Journal
d’activité), détails accessibles au clavier. Quand un même plan se lit de
plusieurs façons, chaque façon est une vue en onglet (`PageSectionNavigation`
en barre, paramètre d’URL, changement par l’historique sans requête) ; un
filtre n’est pas une vue ni un onglet. La vue par défaut range le plan par
pôle, comme le site ; un ordre suggéré reste une indication de ligne et une
vue secondaire, sans étape « prochaine » imposée. Le plan ne montre que ce qui
reste à faire : rien de ce qui existe déjà (8 novembre 2026). Un renvoi interne
(prérequis, page liée) ouvre la vue de sa cible, la déplie et y place le focus
(préférences du 7 novembre 2026).

Détail : [Feuille de route](../pages/systeme/feuille-de-route.md).

## F. Accueil personnel

Bandeau de salutation lisant l’identité courante, lien vers Mon compte ;
aucun widget futur affiché pour le décor. Les vues personnelles métier
s’ajouteront quand leurs modules seront livrés.

Détail : [Accueil](../pages/accueil.md).

## G. Écran hors cadre

Hors sidebar et header : colonne de fond `site-background-column`, carte
centrée (`surface-panel`, rayon 10 px), titre `h1`, une seule action principale,
erreurs focalisées et annoncées. Les états racines sont autonomes (langue,
styles, viewport) et proposent une reprise par rechargement ou un retour à l’accueil.

Détail : [Connexion](../pages/connexion.md), [états techniques](../pages/transverse/etats-techniques.md).

## Hiérarchie d'une page

De haut en bas :

1. **En-tête** : fil d'Ariane, recherche ; bouton de menu sur mobile.
   Reprendre le header partagé, sa hauteur, ses surfaces et son focus intérieur.
   La sidebar reste ouverte à 264 px sur ordinateur.
2. **Héro de page** : titre, description, éventuellement une action principale.
3. **Toile de page** : `PageShell` puis `PageCanvas`, largeur bornée.
4. **Sections** : une carte par section ou par rubrique d’actions, sans titre
   visible qui répète le lien de section.
5. **Listes** : `DataTableSection` avec recherche, filtres, tri et pagination.
6. **Fiche** : identité compacte, navigation par sections, contenu de la section
   active ; les états utiles vivent dans le bandeau.

Pagination : partir de **25 éléments**, via `PAGINATION.DEFAULT_LIMIT` partagé
entre client et serveur. Une page peut définir une exception justifiée par sa
densité et son usage ; conserver ses plafonds de requête côté serveur. Le nombre
de lignes ne relève pas des paramètres système administrateur. Ajouter un choix
local et sa mémorisation par utilisateur/page seulement si le besoin est établi,
sans imposer ce contrôle à toutes les listes.

Pour des réglages globaux, la page des Paramètres a remplacé le 14 octobre 2026
l’ancien mode « valeur appliquée puis Modifier » par une saisie directe dans une
carte, avec la barre commune seulement en cas de brouillon ou de reprise
([gabarit D](#d-page-de-réglages)). Un formulaire de création reste directement
en saisie.

Règles : une page n'a qu'un héro ; une action globale vit dans le héro, une
action locale dans sa section ; un retour contextuel ramène à la liste avec ses
filtres.

`PageIdentityHero` est la référence d'en-tête de toutes les pages actuelles,
en variante compacte pour une fiche ou un formulaire. L’ancien `PageHero` a été
retiré le 20 octobre 2026 ([SYS-01](../systeme/constats.md)). L'ancien `PageHeader`, inutilisé, a
été supprimé. Les bordures des cartes appartiennent à `CardHeader` et
`CardFooter` : ne pas les redoubler sur le contenu adjacent.
