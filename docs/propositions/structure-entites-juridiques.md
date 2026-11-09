# Cadrage — Entités juridiques : l’association aujourd’hui, une société peut-être demain

[Propositions](README.md) · [Feuille de route](feuille-de-route.md) ·
[Domaine Structure](../domaines/structure-juridique.md) ·
[Registre historique](../domaines/registre-historique.md)

- **Date** : 9 novembre 2026. **Demandeur** : le propriétaire.
- **Périmètre** : chantier « Entités juridiques & périmètres » (étape 3) et ses
  effets sur la trésorerie, les adhésions, les contrats, les réunions, Bureau &
  staff et les salariés.
- **Statut** : **adopté le 9 novembre 2026** (« ok pour moi ; de toute façon on met des dates, donc on saura toujours quand on était quelle entité »). Rien n’est
  construit ; aucune donnée actuelle n’en dépend. Les règles ci-dessous sont
  reportées dans le [domaine Structure](../domaines/structure-juridique.md#décisions-du-9-novembre-2026)
  et le plan de la [feuille de route](feuille-de-route.md) (page Entités et
  fiche entité, à la place de « Identité juridique »).
- **Risque : sensible** (argent, obligations juridiques). Les règles
  juridiques et fiscales réelles (TVA, reçus de dons, transfert d’activité,
  forme d’une société) se valident avec un professionnel au moment où elles
  deviennent réelles ; le site enregistre leurs effets, il ne les décide pas.

## Ce que dit le propriétaire

Faits du 9 novembre 2026 : la structure est aujourd’hui **une association**
(depuis octobre 2025) ; l’histoire commence en 2014. Une société pourrait venir,
sans savoir si elle **remplacerait** l’association ou **coexisterait** avec
elle. Demande : le prévoir maintenant, tant que rien n’est construit, et
« mettre un principe pour la trésorerie, pour ne pas rentrer à chaque fois
lequel choisir ».

## Trois niveaux à ne jamais confondre

| Niveau | Ce que c’est | Change-t-il avec la forme juridique ? |
| --- | --- | --- |
| **La structure Noctambule** | La marque, la communauté, son histoire depuis 2014 : personnes, jeux, équipes, passages, tournois, chronologie | Jamais |
| **Les entités juridiques** | Les personnes morales qui portent la structure : l’association, demain peut-être une société ; avant 2025, une période sans entité | Oui : elles naissent, coexistent, se succèdent, se dissolvent |
| **Les actes** | Ce qu’une entité signe, encaisse, paie, déclare : comptes, factures, contrats, adhésions, assemblées | Chacun garde l’entité qui l’a fait, pour toujours |

## Règle 1 — le registre n’a pas d’entité

Personnes, comptes de connexion, jeux, équipes, fonctions, passages, tournois
(participation, line-up, classement), entraînements, suivi et chronologie ne
portent **aucune** entité. Un passage de 2016 n’a pas à dire quelle association
existait : il n’y en avait pas. Un changement de forme ne touche donc jamais le
registre, ni ses pages.

## Règle 2 — ce qui porte une entité, et d’où elle vient

| Objet (module) | Porte une entité | D’où elle vient, sans la demander |
| --- | --- | --- |
| Compte bancaire, caisse (Comptes) | Oui, fixée à la création | Seule entité active, sinon choisie une fois à l’ouverture du compte |
| Exercice comptable (Comptes) | Oui | Celle du compte ou de l’entité dont on ouvre l’exercice |
| Opération, règlement (Opérations) | **Jamais en propre** | Celle du compte où elle est passée : une source par donnée |
| Facture émise ou reçue (Facturation) | Oui ; numérotation propre à chaque entité | Le contexte : équipe, contrat, partenariat ; sinon l’entité principale |
| Note de frais (Frais) | Oui, celle qui rembourse | L’équipe ou le déplacement concerné ; sinon l’entité principale |
| Subvention, don (Subventions & dons) | Oui, celle qui reçoit | L’entité principale, proposée d’avance |
| Campagne d’adhésion (Adhésions) | Oui : une association | L’association, seule à avoir des adhérents |
| Contrat (Contrats) | Oui, la signataire | L’entité porteuse de l’équipe pour un contrat de joueur ; sinon l’entité principale |
| Assurance, licence, affiliation | Oui | La fiche de l’entité où on l’ajoute |
| Statuts et pièces officielles (Documents) | Oui | La fiche de l’entité où on les ajoute |
| Réunion d’instance, décision (Réunions) | Oui : l’assemblée ou le bureau d’une entité | L’instance choisie ; une réunion d’équipe n’en porte pas |
| Mandat du Bureau (Bureau & staff) | Oui, quand plusieurs entités existent | L’entité principale par défaut ; la fonction « Président » d’une société est une autre fonction que celle de l’association |
| Emploi, paie (Salariés) | Oui, l’employeur | Choisi au contrat de travail |
| Gains de tournoi, frais d’inscription | Par leurs opérations et factures | L’entité porteuse de l’équipe à la date |

Une fonction de **Staff** (graphiste, monteur) n’a pas d’entité : un bénévole
aide la structure ; s’il est payé, c’est son contrat ou sa facture qui porte
l’entité.

## Règle 3 — le principe demandé : on ne choisit jamais l’entité quand le site peut la déduire

Pour tout objet qui porte une entité, le site la trouve dans cet ordre :

1. **Une seule entité active à la date du fait** : elle s’applique d’office.
   Aucun champ « Entité » n’apparaît dans les formulaires ; on la lit seulement
   sur le document produit (l’émetteur d’une facture). C’est la situation
   d’aujourd’hui et, sans doute, des années à venir.
2. **Sinon, l’objet dont il dépend la donne** : le compte pour une opération,
   la facture pour son règlement, l’équipe (son entité porteuse à la date) pour
   ses frais, ses gains et ses contrats, la campagne pour une adhésion,
   l’instance pour une réunion.
3. **Sinon seulement**, l’**entité principale** est proposée d’avance, et
   modifiable. Il n’y a qu’une entité principale à la fois, choisie dans la
   page Entités.
4. **Une fois enregistré, l’objet garde son entité.** Changer d’entité
   principale, créer ou dissoudre une entité ne réécrit rien : les anciens
   comptes, factures, contrats et adhésions restent à l’entité qui les a faits.

L’entité se calcule **à la date du fait** (date de l’opération, de la facture,
du contrat), jamais à la date de saisie : une dépense de 2027 saisie en 2028
reste celle de l’entité de 2027.

Effet attendu : avec une seule entité, personne ne voit jamais la question ;
avec deux, on ne choisit qu’en ouvrant un compte, un exercice ou en rattachant
une équipe, quelques fois par an, jamais à chaque saisie.

## Règle 4 — l’entité porteuse d’une équipe

Seulement quand deux entités coexistent : chaque équipe a une **entité
porteuse**, relation datée (« l’équipe pro est portée par la société depuis
le 1er janvier 2028 »). Sans relation, l’équipe est portée par l’entité
principale. Elle se règle dans l’onglet Informations de la fiche équipe, comme
le jeu, et n’apparaît pas tant qu’une seule entité existe. Elle sert aux
finances de l’équipe, à ses contrats et à ses gains ; jamais à son Roster.

## Règle 5 — un changement de forme est un événement daté

| Événement | Ce que le site enregistre | Ce qu’il ne fait jamais |
| --- | --- | --- |
| Création d’une entité | La fiche : forme, dates, identifiants ; un fait de la Chronologie | Rattacher d’office les anciens actes |
| Remplacement (l’association cède la place) | Le changement d’entité principale à une date ; l’entité porteuse des équipes ; les contrats repris par avenant ; les comptes fermés et ouverts | Changer l’entité des factures, contrats ou opérations déjà enregistrés |
| Coexistence | Les deux entités actives ; l’entité porteuse de chaque équipe concernée | Additionner leurs comptes sans le dire |
| Dissolution | La date de fin ; l’entité passe en lecture, ses dossiers restent consultables | Supprimer quoi que ce soit |

La forme juridique d’une reprise (transformation, transfert d’activité,
apport) se décide avec un professionnel ; le site en garde la date, la pièce et
les effets, comme un fait de la Chronologie.

## Les quatre situations

- **Aujourd’hui — l’association seule.** Une entité, principale. Aucun champ
  Entité nulle part ; la page Entités montre l’association et la période qui
  l’a précédée.
- **Avant 2025 — la période sans entité.** Une ligne « Avant l’association »
  (2014 à octobre 2025), sans identifiant ni compte. Le registre de cette
  période existe déjà par ses passages ; la trésorerie commence avec le premier
  exercice de l’association.
- **Demain, remplacement.** On crée la société, on la rend principale à sa
  date, on rattache les équipes, on ouvre ses comptes et son exercice ;
  l’association se dissout ou reste en lecture. Aucune reprise de données.
- **Demain, coexistence.** Par exemple l’association pour l’amateur et les
  adhérents, la société pour l’équipe pro, ses contrats et ses sponsors. Chaque
  équipe a son entité porteuse ; les listes de Finances gagnent un filtre
  « Entité » et une colonne, les totaux se lisent par entité, une vue « toutes
  entités » le dit explicitement.

## L’argent : ce qui reste propre à chaque entité

- **Comptes et exercices** : chaque entité a les siens ; un exercice ne mêle
  jamais deux entités.
- **Factures** : une numérotation continue par entité émettrice.
- **Fiscalité** : l’assujettissement à la TVA, le régime, la possibilité
  d’émettre des reçus de dons sont des **paramètres datés de l’entité**, à
  valider avec un comptable ; ils s’appliquent d’office aux actes de cette
  entité, jamais ressaisis.
- **Flux entre entités** (la société sponsorise l’association, l’association
  refacture une prestation) : l’autre entité apparaît comme contrepartie,
  marquée « interne », et ces flux sont exclus d’une vue consolidée pour ne
  pas compter deux fois le même euro.
- **Bilan annuel** : par entité ; une synthèse de la structure, si elle sert,
  le dit et sépare les entités.

## Personnes, gouvernance et accès

- **Bureau** : les fonctions du type Bureau sont des mandats d’une entité.
  Tant qu’il n’y en a qu’une, rien ne change sur Bureau & staff ; à la
  deuxième, chaque fonction du Bureau reçoit son entité (l’association pour
  les existantes) et l’Effectif se lit par entité.
- **Adhésions** : propres à l’association. Les associés d’une société sont une
  autre relation datée, à cadrer le jour où elle existe.
- **Réunions** : une assemblée ou un conseil appartient à une entité ; une
  réunion d’équipe, non.
- **Accès** : mêmes droits pour toutes les entités au départ. Une portée par
  entité (le trésorier de l’association ne voit pas les comptes de la société)
  ne s’ajoute que si des personnes différentes les gèrent, comme prévu au
  chantier Accès & responsabilités métier (« portées par entité, si le besoin
  apparaît »).

## Écrans

- **Page Entités** (pôle Structure), à la place de la page « Identité
  juridique » prévue : la liste chronologique, « Avant l’association », puis
  chaque entité avec sa forme, ses dates, son état (active, dissoute) et la
  pastille « Principale ».
- **Forme et dates d’une entité** (précisé le 9 novembre 2026, « je pourrais
  mettre association de date à date, et aussi société SAS, etc. ? ») : la forme
  se choisit dans une liste fixe du code, puisque la loi la fixe (« Sans forme
  juridique » pour la période d’avant, association loi 1901, SAS, SASU, SARL,
  EURL…, et « Autre » avec son nom) ; le début (création, immatriculation) et
  la fin (dissolution, vide tant qu’elle existe) se saisissent au jour, au mois
  ou à l’année, comme toute date du site. Deux entités peuvent se chevaucher :
  c’est la coexistence.
- **Fiche d’une entité** : Identité (dénomination, forme, dates, identifiants,
  siège, paramètres fiscaux datés), Dirigeants ↗ (lus dans Bureau & staff),
  Assurances, Documents (statuts), Finances ↗ (ses comptes et exercices).
- **Ailleurs** : aucun champ Entité tant qu’une seule existe ; ensuite, un
  champ seulement là où la règle 3 ne peut pas déduire, prérempli.

## Données, à l’étape 3

- Une table `LegalEntity` (dénomination, forme, début et fin avec leur
  précision, identifiants, entité principale, version) et l’association créée
  avec elle.
- **Chaque table de trésorerie naît avec son entité**, remplie d’office par la
  règle 3 : comptes, exercices, factures, notes de frais, subventions et dons,
  campagnes d’adhésion, contrats, instances, assurances, pièces officielles,
  emplois. Les opérations la tiennent de leur compte, sans colonne propre. Le
  jour où une société arrive, aucune table n’est à reprendre.
- L’entité porteuse d’une équipe et l’entité d’une fonction du Bureau
  s’ajoutent seulement avec la deuxième entité.

## Ordre

1. **Maintenant** : rien dans le code ; le registre n’en a pas besoin.
2. **Étape 3, en premier** : la page Entités et l’association, avant Comptes
  (déjà prérequis dans la feuille de route), puis chaque module de trésorerie
  avec son entité dès sa première version.
3. **Le jour d’une société** : la créer, choisir la principale, rattacher les
  équipes et les fonctions du Bureau, ouvrir ses comptes. Rien d’autre.

## Points examinés

Q01, Q12, Q13, Q24, Q26 (le cœur : entité, actes, argent), Q09 (portée par
entité), Q15 (chaque création, changement de principale ou dissolution tracé),
Q22 (entité à la date du fait), Q29 (nouvelle table dans la sauvegarde, garde
du test `database-backup-format`), Q33 à Q35. Non applicables aujourd’hui :
Q02 à Q07 (aucun écran construit), Q20, Q21, Q23.

## Questions au propriétaire

| ID | Question | Par défaut | Bloque |
| --- | --- | --- | --- |
| ENT-Q1 | Que s’est-il passé en 2014 et en 2023 (groupe, équipe, marque) ? | Une seule période « Avant l’association », sans entité, ses faits dans la Chronologie | Rien |
| ENT-Q2 | Quel professionnel valide TVA, reçus de dons et forme d’une reprise ? | À désigner avant la création d’une société | La société, pas l’association |
| ENT-Q3 | En coexistence, quelle entité est principale ? | L’association tant qu’elle existe | La coexistence |
