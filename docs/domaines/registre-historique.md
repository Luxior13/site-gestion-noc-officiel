# Registre historique et parcours

[Règles métier](README.md) · [Public du site](roles-metier.md#public-du-site--décision-du-7-novembre-2026) ·
[Navigation](navigation.md#règles-de-placement) · [Feuille de route](../propositions/feuille-de-route.md)

Décisions du propriétaire du 7 novembre 2026. **Livré en partie** : les jeux,
les équipes, les fonctions de chaque jeu et les passages d’une équipe (Roster de
la [fiche équipe](../pages/esport/equipe.md), 9 novembre 2026) ; restent la
structure (Bureau & staff), le Parcours d’une fiche et le statut calculé.

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
| Fonction | Valeur d’une liste de choix selon le rattachement (8 novembre 2026) : fonctions du jeu pour une équipe (Joueur, Coach, Manager… ou postes propres au jeu, gérées dans sa fiche), fonctions de la structure pour la structure (Président, Trésorier, Secrétaire, bénévole…). Le mot « rôle » reste réservé à Utilisateur et Administrateur |
| Début et fin | Une fin vide signifie « en cours ». Plusieurs passages simultanés sont possibles |
| Statut dans la structure | Calculé, jamais saisi : une fiche est dans la structure si un passage est en cours à la date du jour. Sans date de fin, il reste en cours ; une date de fin atteinte le clôt toute seule |
| Dates approximatives | Année, mois ou jour : une date connue à l’année se saisit à l’année, sans inventer de jour |
| Entité juridique | Aucune exigée : l’histoire commence en 2014, la structure en 2023 et l’association en octobre 2025 |
| Roster à une date | Se déduit des passages ; aucune composition d’équipe n’est stockée à part |
| Anciens pseudos | Conservés, pour retrouver une personne sous le nom qu’elle portait ; affichés et complétés dans l’onglet Identité |
| Anciens noms d’équipe | Conservés de la même façon : une équipe change de nom sans changer d’histoire |

Le passage d’une équipe est livré le 9 novembre 2026 (table `PersonPassage`) :
un début se range au premier jour de sa période, une fin au dernier ; la même
personne ne tient pas deux fois la même fonction dans la même équipe sur une
même période (contrainte d’exclusion de la base) ; la fonction appartient au
jeu de l’équipe (déclencheur) ; une fiche, une équipe ou une fonction qui a des
passages ne se supprime plus. Chaque écriture est tracée sur la fiche de la
personne (type « Parcours » du journal), sans son nom dans la trace. Droits :
ceux des équipes.

Un passage n’a pas de motif de fin (décision du 8 novembre 2026) : la fin se
saisit à son endroit, dans le Roster de l’équipe ou l’Effectif de Bureau & staff. Un changement
d’équipe ou de fonction se voit au passage suivant, une exclusion a son dossier
d’incident, une fin de contrat se lit dans le contrat.

Une correction modifie le passage ; elle ne crée pas une nouvelle identité. Toute
écriture est tracée dans le [journal d’activité](../references/audit-historique.md).

## Tournois et suivi d’une personne

Un **tournoi** est un dossier de la structure : qui y a participé, ce qu’il a
rapporté, ce qui s’y est mal passé. Line-up, classement final et gains se notent
par équipe engagée ; l’organisateur est une fiche organisation ; l’état (à venir,
en cours, terminé) se calcule depuis les dates (décision du 8 novembre 2026). Rencontres et résultats restent sur le site
public. Les gains se lisent sur la fiche tournoi ; l’argent reçu vit dans les
[Finances](../propositions/feuille-de-route.md#3-socle-de-trésorerie), et un résultat sportif
ne déclenche aucun encaissement.

Le **suivi** réunit ce que le bureau sait d’une personne : notes, problèmes et bans.

- Chaque entrée est datée, signée et rattachée à une fiche. Elle se saisit à son
  endroit (décision du 8 novembre 2026) : un problème ou un ban survenu pendant un
  tournoi, dans la fiche tournoi, et il se lit aussi sur la fiche personne ; sur la
  fiche personne, les notes, les sanctions de la structure (par exemple « exclu de
  tous les futurs tournois ») et les bans externes qui dépassent un tournoi (un
  éditeur ou un organisateur qui bannit d’un circuit ou d’un jeu).
- Un ban ou une sanction est une relation datée (type : sanction de la structure ou
  ban externe ; portée : tous les tournois de la structure, un jeu, un tournoi ou un
  circuit ; période ou « jusqu’à levée » ; motif ; source ou preuve ; auteur ;
  lien facultatif vers un dossier d’incident ou une décision du bureau ; levée),
  jamais une case « banni » sur la fiche. Lever un ban ne l’efface pas.
- Une sanction de la structure en cours refuse l’inscription de la personne à un
  tournoi concerné, avec son motif : il faut d’abord la lever, et la levée est
  tracée. Un ban externe sur le même jeu, le même organisateur ou le même circuit
  avertit sans bloquer.
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
  listes de gestion (décision du 8 novembre 2026) : Jeux dans la page Jeux (livrée
  le 8 novembre 2026, [fiche](../pages/esport/jeux.md)) et
  Fonctions de chaque jeu dans sa fiche (Esport, livrées le 9 novembre 2026,
  [fiche jeu](../pages/esport/jeu.md)), Fonctions de la structure dans Bureau & staff (Structure),
  Catégories et Moyens de paiement dans Comptes (Finances), Types de matériel
  dans Matériel & abonnements (Structure). Aucune liste ne se gère dans Système.
- **Renommer** corrige une faute et met à jour la valeur partout. Quand la
  chose change vraiment (CS:GO devenu Counter-Strike 2, une fonction qui change
  de nature), on crée une nouvelle valeur et on rend l’ancienne inactive ; elle
  reste sur les anciens passages : l’histoire n’est pas réécrite (décision du
  8 novembre 2026).
- **Rendre inactive** une valeur (plutôt que l’« archiver », mot retiré le
  9 novembre 2026, comme pour les jeux et les équipes) la fait passer après les
  valeurs actives dans les choix, marquée « (inactive) » ; elle reste
  choisissable pour saisir un fait ancien et affichée sur les anciens passages
  (PREF-Q10 tranchée le 9 novembre 2026, « ok go tes recommandations »). Une
  valeur utilisée ne se supprime pas ; une valeur jamais utilisée, créée par
  erreur, si.
- **Inactif ne verrouille rien** (décisions des 8 et 9 novembre 2026 : « un
  site de gestion ne doit pas bloquer ») : un élément inactif ne bloque jamais
  rien ; son seul effet est d’être marqué « Inactif » (« (inactif) » dans les
  menus déroulants) et placé après les actifs. Le site sert sur
  le très long terme, en interne ; un élément inactif n’est simplement pas en
  activité en ce moment. Un jeu inactif reçoit encore des équipes, pour saisir
  l’historique ou préparer une reprise ; une équipe inactive gardera de même son
  Roster à compléter. Seuls les choix courants mettent les éléments actifs en
  tête.
- Les jeux, les équipes de chaque jeu et les fonctions de chaque type se
  rangent par glisser-déposer, pour leur importance (9 novembre 2026) : un
  seul ordre, actifs et inactifs mélangés ; cet ordre est repris partout,
  l’historique n’en dépend pas.
- La base le garantit : toute table qui référence un jeu (équipes depuis le
  8 novembre 2026, fonctions depuis le 9, puis tournois, finances) le fait en
  `ON DELETE RESTRICT`, jamais en `CASCADE` ; le service explique le refus
  (« Ce jeu a 3 équipes : rendez-le inactif plutôt que de le supprimer ») et
  l’interface ne propose pas la suppression ([Jeux](../pages/esport/jeux.md)).
  Un jeu sans équipe n’a aucun passage, donc aucune fonction utilisée : le
  supprimer retire ses fonctions explicitement, dans la même transaction, et la
  trace les nomme (9 novembre 2026).
- Une équipe garde le jeu de sa création (8 novembre 2026) : un autre jeu, c’est
  une autre équipe, et ses passages utilisent les fonctions de ce jeu. L’API et
  la base refusent de le changer ([fiche équipe](../pages/esport/equipe.md)).
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
| Ajouter ou terminer un passage dans une équipe | Fiche de l’équipe (sous son jeu), onglet Roster (début et fin), en fenêtre |
| Ajouter ou terminer un passage dans la structure (bureau, staff, bénévoles) | Page Bureau & staff, onglet Effectif, avec la même fenêtre |
| Voir tout le parcours d’une personne | Onglet Parcours de sa fiche, en lecture ↗ (livré le 9 novembre 2026) : en cours et à venir, puis terminés ; chaque ligne ouvre son équipe, ses anciens membres pour un passage terminé, ou Bureau & staff (à venir) |
| Ajouter un ancien pseudo | Onglet Identité de la fiche, y compris un pseudo d’avant le site |
| Voir les membres actuels et anciens d’une équipe | Fiche de l’équipe : onglet Roster pour les actuels et ceux à venir, onglet Anciens membres pour les passages terminés, jamais mélangés (9 novembre 2026) |
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
