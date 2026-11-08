# Cadrage — Listes, équipes, parcours et accès manager

[Propositions](README.md) · [Registre historique](../domaines/registre-historique.md) ·
[Public du site](../domaines/roles-metier.md#public-du-site--décision-du-7-novembre-2026) ·
[Feuille de route](feuille-de-route.md)

- **Date** : 7 novembre 2026. **Demandeur** : le propriétaire.
- **Périmètre** : chantiers Listes de choix, Équipes & parcours, Accès &
  responsabilités métier (étapes 1 et 2).
- **Statut** : proposée. Rien n’est construit ; les choix techniques ci-dessous
  restent à valider au moment de chaque lot.
- **Décisions déjà données** : [registre historique](../domaines/registre-historique.md)
  et [public du site](../domaines/roles-metier.md#public-du-site--décision-du-7-novembre-2026).
  Ce document ne les répète pas.

**Risque : sensible.** Ces lots touchent l’accès, des données personnelles et une
migration. Ils demandent des scénarios d’abus et une validation sur base isolée.

## Ordre de construction

| Lot | Contenu | Résultat visible |
| --- | --- | --- |
| 1 | Listes de choix | Onglets Fonctions et Étiquettes du Répertoire ; champ « Jeux » sur la fiche (l’onglet Jeux de la page Équipes arrive au lot 2) |
| 2 | Équipes & parcours | Page Équipes, onglet Parcours, anciens pseudos |
| 3 | Accès manager | Un manager se connecte et ne voit que son équipe |

Confidentialité & conservation et Données, exports & sauvegardes complètent l’étape 2. Le lot 1 introduit TanStack Query, prévu avec son premier consommateur
([décision REV-20](../references/architecture-fonctionnalite.md#5-états-ux-obligatoires)).

## Lot 1 — Listes de choix

**Données** : une table `ReferenceValue` pour toutes les listes (`list`, `label`,
libellé normalisé, `archivedAt`, `version`), unique par liste et libellé normalisé,
et une table de liaison `PersonGame`. Une table commune évite une page, une API et
une migration par liste. Pour qu’une fonction ne puisse pas remplir un champ
« jeu », la base contrôle la liste de chaque référence ; une contrainte vaut mieux
qu’une vérification du seul formulaire.

**Écrans** (décision du 8 novembre 2026) : chaque liste en onglet à côté de ce
qu’elle classe, au [gabarit A](../design/gabarits.md#a-liste-de-gestion) :
Fonctions et Étiquettes sur `/personnes/repertoire`, Jeux sur `/esport/equipes`
(lot 2). Aucune liste dans Système. Ajout et renommage en fenêtre. Une colonne indique le
nombre d’usages, pour comprendre pourquoi une valeur s’archive sans se supprimer.

**Composant** : `MultiSelect` dans `components/ui`, composé de `Popover` et
`Command` déjà présents, sans nouvelle dépendance. Il propose « Ajouter … » quand
la valeur manque et que le compte a le droit de le faire.

**Droits** : `reference_lists:update` (délégable, fourni aux Administrateurs). La
lecture des valeurs suit la page qui les affiche.

**Valeurs de départ** : aucune. Les listes démarrent vides et le bureau les remplit.

## Lot 2 — Équipes & parcours

**Données** :

| Modèle | Contenu |
| --- | --- |
| `Team` | Nom, anciens noms, jeu (liste Jeux), `archivedAt`, `version` |
| `PersonPassage` | Fiche, équipe facultative (vide pour une fonction de structure), fonction, début, fin, précision de chaque date, motif de fin, `version` |
| `PersonFormerNickname` | Ancien pseudo, date du changement ; écrit par le service quand le pseudo change, et cherché par le Répertoire |

**Compléments de la fiche personne** : nationalité, étiquettes, adresse postale, identifiants de jeu (par jeu), contact d’urgence et représentants légaux, ces derniers étant des fiches du Répertoire liées explicitement. Les coordonnées nouvelles suivent `persons:view_contact`.

**Dates approximatives** : une date est stockée avec sa précision (année, mois,
jour). Un début se range au premier jour de la période et une fin au dernier :
« 2024 » couvre toute l’année, et « qui était là à telle date » reste une simple
comparaison. L’affichage suit la précision, sans inventer de jour.

**Statut dans la structure** : calculé à la lecture, jamais saisi ni stocké (décision du 7 novembre 2026). Un passage est en cours si son début est passé et s’il n’a pas de fin, ou une fin à venir. Aucune tâche planifiée : une date de fin atteinte le clôt toute seule. Le choix du statut disparaît de la création et de l’onglet Identité, et le filtre du Répertoire lit ce calcul. Une fiche sans passage en cours est « Hors structure » : le bureau saisit les passages des membres actuels à la livraison.

**Règles serveur** : la fin ne précède pas le début (contrainte en base). Deux
passages identiques (fiche, équipe, fonction) ne se chevauchent pas. Une fiche qui
a un passage ne se supprime pas : la base le refuse et l’interface l’explique.

**Écrans** :

- `/esport/equipes` : liste au gabarit A, onglets Équipes et Jeux, filtres par jeu et par état. Une équipe
  se crée en fenêtre, sans page dédiée, puisqu’elle a deux champs.
- `/esport/equipes/[id]` : membres actuels et anciens, sélecteur « À une date ».
- Onglet Parcours de la fiche personne (`?section=parcours`), sur le modèle de
  [Coordonnées](../pages/personnes/repertoire/fiche-coordonnees.md).
- Une seule fenêtre de passage, ouverte depuis la fiche ou depuis l’équipe.

**API** : `/api/equipes`, `/api/equipes/[id]`, `/api/personnes/[id]/passages` et
`/api/personnes/[id]/passages/[passageId]`, selon le
[contrat d’une fonctionnalité](../references/architecture-fonctionnalite.md).

**Droits** : `teams:view`, `teams:update`, `persons:view_journey`,
`persons:update_journey`, délégables, fournis aux Administrateurs.

**Journal** : chaque écriture suit la
[liste de contrôle Q15](../references/audit-historique.md#règle--toute-action-est-lisible-dans-le-journal-dactivité) :
actions, filtre « Équipes », libellés des champs et fiches de page.

## Lot 3 — Accès manager

**Données** : `UserPersonLink` (compte, fiche, auteur, dates), créé par une action
explicite et tracée depuis la fiche utilisateur, jamais par rapprochement d’email.

**Une fonction ne donne pas d’accès par son nom.** Les fonctions se renomment, donc
le code ne peut pas chercher le mot « Manager ». Une valeur porte un réglage « Donne
accès à son équipe ». Il ouvre des données personnelles : il exige un droit critique
réservé aux Administrateurs et laisse une trace. Renommer une fonction n’y change rien.

**Politique** : `features/teams/server/policy.ts` expose `canViewTeam(acteur, équipe)`,
vraie avec `teams:view`, ou avec une liaison active et un passage ouvert donnant
accès. Elle est évaluée à chaque requête et dans chaque liste.

**Ce que voit un manager** : ses équipes en lecture seule, chaque membre avec pseudo,
fonction et dates. Il n’a ni `persons:view` ni accès au Répertoire : le serveur lui
renvoie uniquement cette projection, sans coordonnées et sans lien vers la fiche. La
navigation n’affiche que Équipes, et Mon compte reste accessible.

**Scénarios à vérifier** : adresse d’une autre équipe, identifiant deviné, API
appelée sans passer par l’écran, passage clôturé pendant la session, liaison retirée,
réglage retiré de la fonction, compte désactivé, recherche rapide, totaux des listes.

## Effets sur l’existant

| Élément | Effet |
| --- | --- |
| Statut du Répertoire | Colonne `structureStatus` remplacée par le calcul ; 19 fichiers du code la citent |
| Suppression d’une fiche | Refus si la fiche a un passage ; [règle du Répertoire](../pages/personnes/repertoire/README.md) à actualiser |
| Sauvegarde | Nouvelles tables dans le manifeste, format v11 |
| Journal d’activité | Nouvelles actions et nouveau filtre |
| Registre, navigation, recherche rapide | Entrées et mots-clés de Listes et d’Équipes |
| Contrôle mobile E2E | Nouvelles pages à ajouter à `mobile-layout.checks.ts` |
| Fiches de page, cartographie | Une fiche par page et par onglet ; routes, API et données actualisées |

**Points examinés** : Q01–Q07, Q09–Q17, Q19, Q22, Q25, Q27, Q29, Q30, Q33–Q36.
Non applicables : Q08, Q20, Q21, Q23, Q24, Q26 (ni notification, ni fichier, ni
import, ni traitement différé, ni gouvernance, ni montant). Hors impact : Q18, Q28.

## Questions au propriétaire

| ID | Question | Recommandation | Bloque |
| --- | --- | --- | --- |
| CAD-Q3 | Quel délai avant la purge des coordonnées, et qui le valide ? | À faire valider par une personne compétente | Confidentialité & conservation |
