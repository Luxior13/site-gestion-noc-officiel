# Espace Finances

[Index des pages](../README.md) · [Design](../../design/README.md) · [Guide général](../../REFERENCE_GENERALE.md)

Pôle Finances de la navigation (`/finances/*`), ouvert le 10 novembre 2026
avec sa première page, Comptes : les comptes bancaires, comptes en ligne et
caisses de chaque entité, puis le 11 novembre 2026 les Opérations : l’argent
reçu, versé ou passé d’un compte à l’autre, qui fait le solde du jour de chaque
compte, avec les catégories et moyens de paiement en onglets de Comptes.
Suivront les justificatifs, puis les factures, notes de frais, subventions et
dons, contrôles et clôtures
([feuille de route](../../propositions/feuille-de-route.md)). Thème `treasury`
(`--nav-treasury`, [fondations](../../design/fondations.md#pôles-et-avatars)),
icône portefeuille ; sa section de menu s’appelle « Trésorerie ».

Règles communes du pôle (10 novembre 2026, sur les réponses du propriétaire) :

- **Euro seulement**, montants stockés en centimes entiers ; dix millions
  d’euros au plus dans un sens ou dans l’autre.
- **Le bureau saisit**, pas seulement le trésorier : chaque page a ses droits,
  donnés dans les autorisations de chaque compte ; pas de validation par le
  trésorier à ce stade, le journal d’activité dit qui a saisi quoi.
- **Pas de reprise de l’ancien suivi** : chaque compte démarre sur son solde à
  un jour choisi ; le tableur existant reste à côté, une reprise viendra si
  elle sert.
- **Une entité par compte**, déduite et jamais demandée quand une seule existe
  ([cadrage, règle 3](../../propositions/structure-entites-juridiques.md#règle-3--le-principe-demandé--on-ne-choisit-jamais-lentité-quand-le-site-peut-la-déduire)).
- **L’argent se saisit à un seul endroit**, dans Opérations (11 novembre 2026,
  « ok go ») : une fiche de compte, d’organisation, puis d’équipe, de jeu, de
  personne ou de tournoi le lit dans un onglet, sans le ressaisir.
- **Couleur des montants** (11 novembre 2026) : une entrée en vert avec « + »,
  une sortie dans la couleur du texte avec « − », un solde négatif en rouge,
  le signe toujours affiché ([fondations](../../design/fondations.md#hiérarchie-de-couleurs)).

## Pages

| Page | Fiche | Contenu |
| --- | --- | --- |
| Comptes | [comptes.md](comptes.md) | `/finances/comptes` : les comptes, leur solde du jour et leur état ; ouverture en fenêtre ; onglets Catégories et Moyens de paiement |
| Fiche compte | [compte.md](compte.md) | `/finances/comptes/[id]` : onglets Mouvements (ses opérations) et Informations (modifiées sur place, clôture, entité titulaire en lecture) |
| Opérations | [operations.md](operations.md) | `/finances/operations` : entrées, sorties et virements, recherche et filtres par sens ; ajout en fenêtre |
| Fiche opération | [operation.md](operation.md) | `/finances/operations/[id]` : l’opération modifiée sur place, le sens fixé |

Les autres vues prévues du pôle reçoivent une fiche lors de leur création.
