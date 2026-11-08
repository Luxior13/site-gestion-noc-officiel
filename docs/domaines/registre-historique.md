# Registre historique et parcours

[Règles métier](README.md) · [Public du site](roles-metier.md#public-du-site--décision-du-7-novembre-2026) ·
[Navigation](navigation.md#règles-de-placement) · [Feuille de route](../propositions/feuille-de-route.md)

Décisions du propriétaire du 7 novembre 2026. **Cible, pas encore livrée** : le
cadrage des premiers chantiers fixera les tables, les routes et les droits.

## Rôle du site

Le site sert d’abord à la trésorerie et à la traçabilité de tout ce qui concerne
la structure, tant qu’elle existe : savoir qui est passé, à quelle fonction, dans
quelle équipe et à quelles dates.

Le site public [noctambule.gg](https://noctambule.gg/) garde ce qui se montre :
jeux, maps, modes, rencontres, résultats, palmarès, calendrier. Ce site-ci ne gère
ni maps, ni modes, ni matchs, ni statistiques, ni saisons. Un jeu y est
une simple valeur de liste.

## Le passage

Un seul objet central : le **passage**, une relation datée entre une fiche du
[Répertoire](../pages/personnes/repertoire/README.md) et la structure.

| Élément | Règle |
| --- | --- |
| Rattachement | Une équipe, ou la structure elle-même pour une fonction de bureau ou de staff |
| Fonction | Valeur d’une liste de choix selon le rattachement (8 novembre 2026) : fonctions d’équipe pour une équipe (Joueur, Remplaçant, Coach, Manager…, communes à tous les jeux), fonctions de la structure pour la structure (Président, Trésorier, Secrétaire, bénévole…). Le mot « rôle » reste réservé à Utilisateur et Administrateur |
| Début et fin | Une fin vide signifie « en cours ». Plusieurs passages simultanés sont possibles |
| Statut dans la structure | Calculé, jamais saisi : une fiche est dans la structure si un passage est en cours à la date du jour. Sans date de fin, il reste en cours ; une date de fin atteinte le clôt toute seule |
| Dates approximatives | Année, mois ou jour : une date connue à l’année se saisit à l’année, sans inventer de jour |
| Entité juridique | Aucune exigée : l’histoire commence en 2014, la structure en 2023 et l’association en octobre 2025 |
| Roster à une date | Se déduit des passages ; aucune composition d’équipe n’est stockée à part |
| Anciens pseudos | Conservés, pour retrouver une personne sous le nom qu’elle portait |
| Anciens noms d’équipe | Conservés de la même façon : une équipe change de nom sans changer d’histoire |

Un passage n’a pas de motif de fin (décision du 8 novembre 2026) : la fin se
saisit à son endroit, dans le roster de l’équipe ou les Mandats. Un changement
d’équipe ou de fonction se voit au passage suivant, une exclusion a son dossier
d’incident, une fin de contrat se lit dans le contrat.

Une correction modifie le passage ; elle ne crée pas une nouvelle identité. Toute
écriture est tracée dans le [journal d’activité](../references/audit-historique.md).

## Tournois et suivi d’une personne

Un **tournoi** est un dossier de la structure : qui y a participé, ce qu’il a
rapporté, ce qui s’y est mal passé. Rencontres et résultats restent sur le site
public. Les gains se lisent sur la fiche tournoi ; l’argent reçu vit dans les
[Finances](../propositions/feuille-de-route.md#3-socle-de-trésorerie), et un résultat sportif
ne déclenche aucun encaissement.

Le **suivi** réunit ce que le bureau sait d’une personne : notes, problèmes et bans.

- Chaque entrée est datée, signée et rattachée à une fiche, et si besoin à un tournoi
  ou à un jeu. Une même entrée se lit sur la fiche personne et sur la fiche tournoi.
- Un ban est une relation datée (type, jeu ou tournoi, période, motif, source ou
  preuve, auteur, levée), jamais une case « banni » sur la fiche. Lever un ban ne
  l’efface pas.
- Le suivi est réservé aux personnes habilitées, par une autorisation dédiée. Un
  manager n’y a pas accès.
- Une note libre peut contenir trop de choses : s’en tenir aux faits utiles, sans
  santé ni vie privée. Sa conservation suit les règles de Confidentialité & conservation.

## Mémoire de la structure

La **chronologie** raconte la vie de la structure depuis ses débuts : arrivées,
départs, changements de roster, sponsors, décisions, titres. Les faits viennent des
modules, sans copie, et le bureau en saisit d’autres à la main, notamment ceux
antérieurs au site. Le **bilan annuel** présente une année pour l’assemblée
générale ; une année clôturée ne change plus.

Quand le bureau change, une **passation** transmet accès, comptes et dossiers en
cours : la mémoire ne doit pas dépendre d’une personne.

## Ce qui dure, ce qui se purge

- **Le journal ne porte pas cette traçabilité** : il est purgé après un an.
  L’historique vit dans les passages eux-mêmes.
- **Une fiche qui a un parcours ne se supprime pas.** La suppression définitive
  reste réservée aux fiches créées par erreur. La règle actuelle du Répertoire
  évoluera avec ce chantier.
- **Tout ne se garde pas indéfiniment.** Pseudo, fonction, équipe et dates forment
  la mémoire de la structure. Email, téléphone et date de naissance d’un ancien
  membre se purgent après un délai. Ce délai et la justification de la conservation
  sont à faire valider par une personne compétente
  ([confidentialité](../references/confidentialite.md)). Une demande d’effacement
  anonymise la fiche et garde le passage.
- **Le registre doit survivre à l’outil** : un export lisible le reprend en entier,
  indépendamment du format des sauvegardes.

## Listes de choix

Une liste de choix qui peut évoluer (jeux, fonctions…) se gère sur le site, sans
développement. Une liste fixée par une règle (statut, rôle) reste dans le code.

- Chaque liste se gère en onglet, à côté de ce qu’elle classe, au gabarit des
  listes de gestion (décision du 8 novembre 2026) : Jeux et Fonctions d’équipe
  dans Équipes (Esport), Fonctions de la structure dans Identité juridique (Structure),
  Catégories et Moyens de paiement dans Comptes (Finances), Types de matériel
  dans Matériel & abonnements (Structure). Aucune liste ne se gère dans Système.
  Les fonctions de la structure s’ajoutent depuis le champ du passage tant
  qu’Identité juridique n’est pas livrée.
- **Renommer** corrige une faute et met à jour la valeur partout. Quand la
  chose change vraiment (CS:GO devenu Counter-Strike 2, une fonction qui change
  de nature), on crée une nouvelle valeur et on archive l’ancienne, qui reste sur
  les anciens passages : l’histoire n’est pas réécrite (décision du 8 novembre 2026).
- **Archiver** retire la valeur des choix ; elle reste affichée sur les anciens
  passages. Une valeur utilisée ne se supprime pas.
- **Ajouter depuis le champ** : un champ à choix multiples propose de créer la
  valeur manquante, pour ne pas quitter la fiche. L’ajout suit les droits de la liste.
- Le champ à choix multiples est un nouveau composant partagé de `components/ui`,
  créé avec son premier consommateur. Ni moteur de formulaires ni champs dynamiques.
  Premier usage : les jeux d’une personne sur sa fiche, un champ distinct de ses
  passages, puisqu’on peut pratiquer un jeu sans y avoir d’équipe.

## Où modifier

Une donnée se modifie là où on la lit.

| Besoin | Où |
| --- | --- |
| Changer le parcours d’un membre | Onglet Parcours de sa fiche, en fenêtre, comme les coordonnées |
| Ajouter ou retirer quelqu’un d’une équipe | Fiche de l’équipe, onglet Effectif (le roster : début et fin), avec la même fenêtre, équipe déjà remplie |
| Ajouter ou terminer un mandat du bureau | Identité juridique, onglet Mandats, avec la même fenêtre, structure déjà remplie |
| Voir les membres actuels et anciens d’une équipe | Fiche de l’équipe |
| Changer une liste de choix | Onglet de la liste, à côté de ce qu’elle classe, ou ajout direct depuis le champ |

Pas de page « Parcours » séparée : elle dupliquerait les fiches. Les équipes
forment, avec les jeux et les tournois, le pôle Esport.

## Source des données

Les utilisateurs saisissent tout à la main, pour le moment. Rien n’est récupéré du
site public : une information présente sur les deux sites est saisie deux fois, et
c’est accepté. Une liaison entre les deux sites reste un chantier de l’étape 10, si
la double saisie devient trop lourde.

## À cadrer

- Quelle date de départ déclenche la purge : fin du dernier passage, ou décision
  du bureau ?

Modèle de données, routes, droits et ordre de construction :
[cadrage des étapes 1 et 2](../propositions/membres-equipes-parcours.md).
