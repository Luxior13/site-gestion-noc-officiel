# Personne — Coordonnées

[Index des pages](../../README.md) · [Répertoire](README.md) · [Design](../../../design/README.md) · [Guide général](../../../REFERENCE_GENERALE.md)

## Identité

| Élément | Valeur |
| --- | --- |
| Route | `/personnes/repertoire/[id]` |
| Section | `?section=coordonnees` |
| Espace | Personnes |
| Gabarit visé | [B. Fiche à sections](../../../design/gabarits.md#b-fiche-à-sections) |
| État d’harmonisation | Aligné ; sélecteurs en variante par défaut depuis le 17 octobre 2026 — voir [Harmonisation](../../../design/harmonisation.md#état-par-page) |
| Point d’entrée | [PersonCollectionsSection](../../../../apps/web/src/features/persons/components/PersonCollectionsSection.tsx) |
| Contrôle d’accès | lecture `persons:view` et `persons:view_contact` ; écriture `persons:update_contact` (routes `emails`, `telephones`, `reseaux-sociaux` pour les réseaux et les comptes de jeu, `contacts-urgence`, `representants-legaux`, et `suggestions` pour chercher un représentant) |
| Chargement / erreur dédiés | section chargée à la demande / commune à la fiche |

## Rôle et tâches principales

Joindre la personne ou ses proches : emails et téléphones, avec un contact
principal par type, sans écraser une modification concurrente ; depuis le
10 novembre 2026, qui appeler en cas d’urgence et qui représente légalement
une personne mineure. Les réseaux sociaux et comptes de jeu sont dans l’onglet
[En ligne](fiche-en-ligne.md) depuis le même jour.

## Composition actuelle

Collections en une colonne (Emails, Téléphones), cartes
`CollectionCard` : icône, titre, compteur et « Ajouter », sans sous-titre ;
chaque ligne a une icône de type (enveloppe, téléphone, plateforme), le
numéro est affiché au format international lisible (« +33 6 12 34 56 78 »,
affichage seulement). L’onglet porte le total des coordonnées
(« Coordonnées 4 », chiffre visuel, nom accessible inchangé). Ajout,
modification et suppression en fenêtre (`PersonChildDialog`), alerte de doublon, choix du
contact principal ; plafonds de dix emails et dix téléphones.

Puis, depuis le 10 novembre 2026 ([PersonRelativesCards](../../../../apps/web/src/features/persons/components/PersonRelativesCards.tsx)) :

- **Contacts d’urgence** (bouée) : nom en gras suivi du numéro, lien d’appel
  (`tel:`), puis le lien avec la personne en petit ; copier le numéro ; cinq au
  plus. Un contact d’urgence n’est pas une fiche : nom, lien facultatif
  (suggestions « Parent », « Conjoint ou conjointe »… ou texte libre) et
  numéro avec son pays.
- **Représentants légaux** (bouclier), affichée pour une personne mineure,
  pour un âge inconnu (sauf sur la fiche de quelqu’un qui représente déjà une
  autre personne), ou dès qu’un lien existe : chaque représentant est une autre
  fiche du Répertoire, avec son avatar et son nom en gras qui ouvre sa fiche,
  puis le lien (« Parent », « Tuteur ou tutrice », « Autre représentant »), son
  téléphone et son email principaux ; quatre au plus.
- **Représentant légal de**, en lecture, seulement sur la fiche d’un
  représentant : les personnes qu’il représente, avec leur âge ; « Le lien se
  modifie sur la fiche de la personne représentée. »

Fenêtres ([PersonRelativeDialogs](../../../../apps/web/src/features/persons/components/PersonRelativeDialogs.tsx))
au modèle de la fenêtre d’un passage : Supprimer (ou Retirer) à gauche,
Annuler et l’action à droite, retrait confirmé à part (« Retirer Camille
Exemple des représentants légaux de Kaiz ? », sa fiche reste). Le représentant
se choisit avec la recherche de fiche commune (`PersonPicker`, six
suggestions), sans la personne elle-même ni les représentants déjà liés ; une
fois lié, il ne change plus, seul le lien se corrige. Le total de l’onglet
compte aussi les contacts d’urgence et les représentants, plus les réseaux
depuis le 10 novembre 2026 (ils comptent dans l’onglet En ligne).

## Décisions retenues

- 15 octobre 2026 : lecture et écriture des coordonnées séparées de l’identité ;
  provenance minimale (voir ci-dessous).
- Chaque écriture vérifie la version lue de la coordonnée (REP-19) ; le
  propriétaire d’un profil social est protégé (REP-20).

- 27 octobre 2026 : revue de l’onglet, « ok go » sur cinq points : une
  colonne au lieu de deux (trous selon le nombre d’adresses), sous-titres
  retirés, numéro lisible, compteurs de l’en-tête (✉ 2 · ☎ 1 · partage 1)
  remplacés par le total sur l’onglet, icône de type sur chaque ligne ;
  précisions de ligne qui passent à la ligne au lieu d’être tronquées.
- 27 octobre 2026 : sur demande du propriétaire (« retire toutes les icônes qui au survol montrent qui a renseigné la donnée », puis « aucune page ne devrait avoir ça, on mettra en place les logs plus tard »), l’historique de champ disparaît de toute l’interface : horloges d’Identité, icônes des fenêtres de coordonnées, bouton « Consulter … et son origine » des lecteurs sans droit de modification, composant `PersonFieldProvenanceHint` et appel client. Le même jour (« fais ce que tu veux » du propriétaire), l’autorisation `audit:view_field_history`, la route `/api/personnes/[id]/historique-champ` et son service sont retirés ; la migration `20261027120000_remove_field_history_permission` efface la clé des autorisations individuelles enregistrées (vérifiée sur PostgreSQL local jetable, puis appliquée par le propriétaire sur la base de travail le 27 octobre 2026). Les événements d’audit et les changements de champ sont conservés pour le futur journal d’activité.

- 10 novembre 2026 (« fais la 2B d’abord et la nationalité ») : contacts
  d’urgence et représentants légaux, suivant le cadrage du 7 novembre
  (représentants = fiches du Répertoire liées explicitement, droits des
  coordonnées). Tables `PersonEmergencyContact` et `PersonLegalGuardian`
  (migration `20261110120000_person_relatives`) : la base refuse une personne
  qui se représente elle-même et le déplacement d’un lien ; la fiche d’un
  représentant ne se supprime pas tant qu’elle représente quelqu’un (le
  service le dit, la base le refuse aussi), celle de la personne représentée
  emporte ses liens et ses contacts d’urgence. Pas de contrôle d’âge côté
  serveur : un majeur protégé peut avoir un représentant.
- 10 novembre 2026 : trois onglets (« ok go ») ; les réseaux sociaux et les
  comptes de jeu, livrés ici le même jour, rejoignent l’onglet
  [En ligne](fiche-en-ligne.md) avec les autres pseudos. Les décisions
  ci-dessous restent leur origine.
- 10 novembre 2026 (« ok go ») : pour Discord, le profil prend le **nom
  d’utilisateur** et l’**ID du compte** (17 à 20 chiffres) au lieu d’une URL.
  L’ID ne change jamais, même quand le nom change : il reconnaît un banni qui
  revient sous un autre nom. Rangé comme lien `https://discord.com/users/<ID>`
  (un lien collé est accepté), donc l’unicité par fiche et l’alerte « figure
  déjà sur une autre fiche » s’appliquent sans nouvelle table ; tout autre lien
  Discord est refusé (« L’ID d’un compte Discord compte 17 à 20 chiffres »).
  L’aide du champ dit où le trouver (Paramètres › Avancés › Mode développeur,
  clic droit sur le profil › Copier l’identifiant de l’utilisateur). La ligne
  montre le nom, puis « ID … » ; la copie prend l’ID ; la recherche du
  Répertoire trouve la fiche par l’ID seul. Plusieurs comptes Discord restent
  possibles, un principal. Le serveur Discord d’une personne n’est pas retenu
  (il n’identifie pas la personne).
- 10 novembre 2026 (« pour les pseudos en jeu, il faut bien sélectionner un
  jeu, non ? », puis « ok go ») : carte **« Comptes de jeu »** après « Réseaux
  sociaux ». Un nom en jeu est le compte d’une **plateforme**, pas d’un jeu
  (un compte Riot joue à Valorant et à League of Legends) : on choisit la
  plateforme (Riot Games, Steam, Epic Games, Battle.net, PlayStation Network,
  Xbox, EA, Ubisoft Connect, FACEIT), puis le **nom du compte** (« Kaiz#EUW »
  pour Riot), et pour **Steam** son **ID** (SteamID64, 17 chiffres commençant
  par 7656119, rangé comme lien `https://steamcommunity.com/profiles/<ID>`),
  comme l’ID Discord. Ce sont des profils de la fiche (`PersonSocialProfile`,
  réseaux de type « jeu ») : mêmes droits, plafond commun de vingt, un
  principal par plateforme, recherche et alerte de doublon sur une autre
  fiche ; aucune migration (la base n’accepte que la forme de la clé). Icône
  de la plateforme quand la marque existe (Steam, Battle.net, PlayStation,
  Xbox), sinon une manette. La recherche par ID seul cherche à la fois
  Discord et Steam. Le compteur de la liste du Répertoire compte encore ces
  comptes avec les profils sociaux. Le même jour (« nom du compte est
  obligatoire mais n’a pas la pastille ») : pour une plateforme sans ID, le
  nom du compte est obligatoire seul, avec l’astérisque, l’URL facultative ;
  pour Steam, Discord et les réseaux, l’un ou l’autre suffit, sans astérisque,
  avec des messages qui reprennent les libellés.
- 10 novembre 2026 : le menu « Pays » d’un téléphone et d’un contact d’urgence
  porte le drapeau de chaque pays, comme la nationalité
  ([préférence](../../../design/preferences.md)).
- Le numéro d’un téléphone ou d’un contact d’urgence s’affiche au format
  international avec le pays de la ligne, même tapé « 06… », et le lien
  d’appel utilise ce format (10 novembre 2026) ; avant, un numéro tapé sans
  indicatif s’affichait tel quel.
- 27 octobre 2026 : fenêtres relues une par une (captures `fenetre-*` du
  banc, 390 et 1 440 px), puis « ok go » sur trois corrections. Sous le titre,
  « Si cette adresse (ce numéro, ce profil) figure déjà sur une autre fiche,
  vous en serez averti. » au lieu d’une phrase sur le système ; pour l’élément
  principal, « C’est l’email principal. Pour en changer, choisissez d’abord un
  autre email comme principal. » (et ses variantes) ; la confirmation nomme
  l’élément, « Supprimer camille@example.test ? », et le choix du nouveau
  principal affiche les numéros au format lisible ; le champ « Libellé »
  montre le chevron des menus au lieu du triangle du navigateur.

## Points ouverts

- Zone dangereuse d’une fiche de représentant : avec le droit des
  coordonnées, le bouton laisse place à l’explication (« Cette fiche
  représente légalement … : retirez d’abord ce lien sur la fiche
  représentée. ») ; sans ce droit, les liens ne sont pas connus de la page et
  le serveur refuse avec le même motif. Une fiche qui a des passages garde
  le refus après la demande (antérieur, hors de ce lot).
- Un majeur protégé n’affiche la carte des représentants que s’il en a déjà un
  ou si son âge est inconnu.
- Conservation : les contacts d’urgence et les liens de représentants
  suivent la question ouverte CAD-Q3 (délai de purge des coordonnées, à faire
  valider), avec le chantier Confidentialité & conservation ; aucune purge
  automatique n’est livrée.

## Traces dans le journal

« Fiche modifiée » sur la fiche concernée, valeurs chiffrées et lues avec
`persons:view_contact` : « Contact d’urgence · Nom / Lien / Téléphone » (le
numéro au format international, pour qu’un changement de pays se voie) ;
« Représentant légal · Fiche / Lien » à l’ajout, au changement de lien et au
retrait. Rien n’est écrit sur la fiche du représentant.

## Références

- [Page Répertoire](../../../domaines/permissions.md#page-répertoire), fiche [Confidentialité](../../../references/confidentialite.md)
- Audits : [12 octobre 2026](../../../audits/2026-10-12-fiche-personne.md), [15 octobre 2026](../../../audits/2026-10-15-autorisations-site.md)

## Historique

- 19 octobre 2026 : fiche propre à la section, créée par découpage du suivi du module.
- 22 octobre 2026 : pied « Dernière modification » retiré, la date est dans le
  bandeau de la fiche ([reprise](fiche-identite.md#reprise--22-octobre-2026)).
- 10 novembre 2026 : contacts d’urgence, représentants légaux et « Représentant
  légal de ».

## Revues datées

Sections déplacées le 19 octobre 2026 depuis l’ancien suivi du module, sans
modification de leur contenu. Elles conservent leur date, leur portée et leurs
preuves ; la synthèse ci-dessus porte l’état courant.

### Corrections et séparation des coordonnées — 15 octobre 2026

Après accord utilisateur, AUT-S01/S03/S04 sont corrigés et vérifiés ; AUT-S06
est adopté. Ces décisions remplacent les anciennes descriptions couplant
identité et contacts ou mentionnant deux valeurs de provenance.

- `persons:view` permet identité, date de naissance et statut (calculé depuis
  les passages, 9 novembre 2026) ; `persons:update` permet de modifier
  l’identité et la date de naissance.
- `persons:view_contact`, dépendant de la lecture du Répertoire, ouvre emails,
  téléphones et profils sociaux. Sans lui : onglet/résumé absents, collections
  vides dans les réponses, compteurs masqués, recherche limitée à l'identité,
  filtre « sans coordonnées » et provenance des coordonnées refusés.
- `persons:update_contact` exige ces deux lectures et autorise ajout,
  modification et retrait des contacts. Une création API avec contacts initiaux
  l'exige aussi ; le formulaire actuel reste l’identité.
- La provenance appartient au Répertoire, dépend de sa lecture et ne renvoie
  que le dernier auteur autorisé, l'action, la date et l'id de trace, sans valeurs.
- L'auteur racine est présenté comme « Superadmin », sans identifiant,
  aux autres lecteurs de liste, fiche, provenance et retours de mutation.
  Les snapshots d'audit originaux sont conservés.
- Les mutations revalident l'autorité attendue et les droits courants dans
  leur transaction, y compris avant de retourner une fiche projetée.

Migration appliquée après sauvegarde signée : accès effectifs antérieurs aux
contacts conservés, nouveaux choix explicites respectés, compte protégé et
tombstones exclus, aucun audit réécrit. AUT-S07 reste une suggestion non
adoptée : suppression avec confirmation/version, sans nouveau mot de passe.

**82 tests PostgreSQL réussis** (création, fiche, liste, migration), inclus dans
les 1 335 tests web réussis. Cinq parcours Chromium/Next de production/PostgreSQL
à 1440 px, données fictives et sessions préparées ; pas de nouveau parcours
connexion/MFA, de qualification de charge ni de tous les formats.
Le [complément du rapport](../../../audits/2026-10-15-autorisations-site.md#corrections-après-accord--15-octobre-2026)
porte les résultats et limites ; les constats initiaux ci-dessous restent datés.
