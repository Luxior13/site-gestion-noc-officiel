# Registre historique et parcours

[Règles métier](README.md) · [Public du site](roles-metier.md#public-du-site--décision-du-7-novembre-2026) ·
[Navigation](navigation.md#règles-de-placement) · [Feuille de route](../propositions/feuille-de-route.md)

Décisions du propriétaire du 7 novembre 2026. **Cible, pas encore livrée** : le
cadrage des chantiers de l’étape 1 fixera les tables, les routes et les droits.

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
[Répertoire](../pages/membres/repertoire/README.md) et la structure.

| Élément | Règle |
| --- | --- |
| Rattachement | Une équipe, ou la structure elle-même pour une fonction de bureau ou de staff |
| Fonction | Valeur d’une liste de référence (Joueur, Remplaçant, Manager, Président…). Le mot « rôle » reste réservé à Utilisateur et Administrateur |
| Début et fin | Une fin vide signifie « en cours ». Plusieurs passages simultanés sont possibles |
| Dates approximatives | Année, mois ou jour : une date connue à l’année se saisit à l’année, sans inventer de jour |
| Entité juridique | Aucune exigée : l’histoire commence en 2014, la structure en 2023 et l’association en octobre 2025 |
| Roster à une date | Se déduit des passages ; aucune composition d’équipe n’est stockée à part |
| Anciens pseudos | Conservés, pour retrouver une personne sous le nom qu’elle portait |

Une correction modifie le passage ; elle ne crée pas une nouvelle identité. Toute
écriture est tracée dans le [journal d’activité](../references/audit-historique.md).

## Tournois et suivi d’une personne

Un **tournoi** est un dossier de la structure : qui y a participé, ce qu’il a
rapporté, ce qui s’y est mal passé. Rencontres et résultats restent sur le site
public. Les gains se lisent sur la fiche tournoi ; l’argent reçu vit dans les
[Finances](../propositions/feuille-de-route.md#2-trésorerie), et un résultat sportif
ne déclenche aucun encaissement.

Le **suivi** réunit ce que le bureau sait d’une personne : notes, problèmes et bans.

- Chaque entrée est datée, signée et rattachée à une fiche, et si besoin à un tournoi
  ou à un jeu. Une même entrée se lit sur la fiche personne et sur la fiche tournoi.
- Un ban est une relation datée (période, motif, auteur, levée), jamais une case
  « banni » sur la fiche. Lever un ban ne l’efface pas.
- Le suivi est réservé aux personnes habilitées, par une autorisation dédiée. Un
  manager n’y a pas accès.
- Une note libre peut contenir trop de choses : s’en tenir aux faits utiles, sans
  santé ni vie privée. Sa conservation suit les règles de Confidentialité & conservation.

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

## Listes de référence

Une liste de choix qui peut évoluer (jeux, fonctions…) se gère sur le site, sans
développement. Une liste fixée par une règle (statut, rôle) reste dans le code.

- Une seule page, un onglet par liste, au gabarit des listes de gestion.
- **Renommer** met à jour la valeur partout.
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
| Ajouter ou retirer quelqu’un d’une équipe | Fiche de l’équipe, avec la même fenêtre, équipe déjà remplie |
| Voir les membres actuels et anciens d’une équipe | Fiche de l’équipe |
| Changer une liste de choix | Page Listes de référence, ou ajout direct depuis le champ |

Pas de page « Parcours » séparée : elle dupliquerait les fiches. Les équipes
rejoignent le pôle Membres, à côté du Répertoire.

## Source des données

Les utilisateurs saisissent tout à la main, pour le moment. Rien n’est récupéré du
site public : une information présente sur les deux sites est saisie deux fois, et
c’est accepté. Une liaison entre les deux sites reste un chantier de l’étape 5, si
la double saisie devient trop lourde.

## À cadrer

- Quelle date de départ déclenche la purge : fin du dernier passage, ou décision
  du bureau ?

Modèle de données, routes, droits et ordre de construction :
[cadrage de l’étape 1](../propositions/membres-equipes-parcours.md).
