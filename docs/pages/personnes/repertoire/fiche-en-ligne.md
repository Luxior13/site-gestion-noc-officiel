# Personne — En ligne

[Index des pages](../../README.md) · [Répertoire](README.md) · [Design](../../../design/README.md) · [Guide général](../../../REFERENCE_GENERALE.md)

## Identité

| Élément | Valeur |
| --- | --- |
| Route | `/personnes/repertoire/[id]` |
| Section | `?section=en-ligne` (onglet « En ligne », icône globe) |
| Espace | Personnes |
| Gabarit visé | [B. Fiche à sections](../../../design/gabarits.md#b-fiche-à-sections) |
| État d’harmonisation | Aligné à sa création, le 10 novembre 2026 — voir [Harmonisation](../../../design/harmonisation.md#état-par-page) |
| Point d’entrée | [PersonCollectionsSection](../../../../apps/web/src/features/persons/components/PersonCollectionsSection.tsx) (`part="online"`) |
| Contrôle d’accès | lecture `persons:view` et `persons:view_contact` ; écriture `persons:update_contact` (routes `autres-pseudos` et `reseaux-sociaux`) |
| Chargement / erreur dédiés | section chargée à la demande / commune à la fiche |

## Rôle et tâches principales

Reconnaître une personne sur internet et en jeu, même sous un autre nom :
les pseudos sous lesquels on la connaît, ses réseaux sociaux et ses comptes de
jeu. C’est l’onglet à regarder pour repérer quelqu’un, par exemple une
personne bannie qui revient sous un autre pseudo ou un autre compte
([besoin du 10 novembre 2026](../../../domaines/registre-historique.md)).

## Composition actuelle

Trois cartes en une colonne, chacune avec son compteur et « Ajouter » dans
l’en-tête ; l’onglet porte leur total.

- **Autres pseudos** ([PersonOtherNicknames](../../../../apps/web/src/features/persons/components/PersonOtherNicknames.tsx)) :
  une ligne par pseudo, sa précision et « jusqu’en 2023 » ; ajout,
  correction et suppression en fenêtre (pseudo, précision facultative avec
  les suggestions « Ancien pseudo », « Compte secondaire », « Surnom »,
  « Utilisé jusqu’à » facultatif à l’année, au mois ou au jour). Vingt au
  plus, jamais deux fois le même ni le pseudo principal ; chaque pseudo a sa
  propre version, la fiche garde la sienne.
- **Réseaux sociaux** : Discord, Instagram, X, TikTok, Twitch, YouTube,
  Facebook, LinkedIn ; pour Discord, le nom d’utilisateur et l’**ID du
  compte** (17 à 20 chiffres) au lieu d’une URL.
- **Comptes de jeu** : un compte de **plateforme**, pas de jeu (Riot Games,
  Steam, Epic Games, Battle.net, PlayStation Network, Xbox, EA, Ubisoft
  Connect, FACEIT) ; le nom du compte, obligatoire avec l’astérisque pour une
  plateforme sans ID, et pour **Steam** son **ID** (SteamID64). Icône de la
  plateforme quand la marque existe, sinon une manette.

Réseaux et comptes partagent la fenêtre des coordonnées (`PersonChildDialog`,
alerte de doublon sur une autre fiche, un principal par réseau ou
plateforme, vingt profils en tout). Une ligne montre le nom, puis « ID … »
quand l’ID est connu ; la copie prend l’ID.

## Traces dans le journal

« Fiche modifiée », valeurs chiffrées, lues avec `persons:view_contact` :
« En ligne · Autre pseudo / Précision / Jusqu’à » pour les autres pseudos,
« Réseaux · Réseau / Identifiant / Lien du profil / Libellé / Principal » pour
les réseaux et les comptes de jeu (le réseau se lit par son nom : « Steam »).

## Décisions retenues

- 10 novembre 2026 (« la section autres pseudos ne devrait pas être dans
  coordonnées aussi pour laisser les champs principaux dans identité, et même
  changer le titre si besoin ? », puis « ok go » sur trois onglets) : onglet
  créé entre Coordonnées et Parcours. Identité garde les champs principaux,
  Coordonnées ce qui sert à joindre la personne ou ses proches, En ligne ce
  qui la fait reconnaître. « En ligne » plutôt que « Comptes », qui ferait
  penser aux comptes bancaires ou utilisateurs.
- Même jour : les **autres pseudos** passent du droit de l’identité à celui
  des coordonnées, comme les réseaux à côté d’eux ; la recherche du
  Répertoire et le choix d’une fiche ne les cherchent qu’avec ce droit.
  Leurs traces passent de la rubrique Identité à « En ligne ».
- Même jour : ID du compte Discord, puis comptes de jeu et ID Steam (décisions
  détaillées dans la [fiche Coordonnées](fiche-coordonnees.md#décisions-retenues),
  où ils ont été livrés avant l’ouverture de cet onglet) ; « Pseudo en jeu »
  retiré des suggestions des autres pseudos, un nom en jeu étant un compte de
  jeu.
- Même jour : nom du compte obligatoire seul pour une plateforme sans ID,
  textes d’exemple préfixés « Ex. » ([préférence](../../../design/preferences.md)).

## Points ouverts

- Le compteur « profils sociaux » de la liste du Répertoire compte encore les
  comptes de jeu avec les réseaux.
- Conservation : suit la question CAD-Q3, comme les coordonnées.

## Vérifications et prochaine reprise

Le 10 novembre 2026 : tests unitaires (schémas, ID par plateforme, recherche),
suites SQL réelles (autres pseudos, ID Discord et Steam, droits, journal),
captures réelles à 1 440 et 390 px des cartes et fenêtres avant leur
déplacement dans cet onglet, puis de l’onglet lui-même. Reprendre si une
plateforme ou un droit change.

## Références

- [Page Répertoire](../../../domaines/permissions.md#page-répertoire), fiche [Confidentialité](../../../references/confidentialite.md)
- [Personne — Coordonnées](fiche-coordonnees.md), [Personne — Identité](fiche-identite.md)

## Historique

- 10 novembre 2026 : création de l’onglet et de sa fiche.
