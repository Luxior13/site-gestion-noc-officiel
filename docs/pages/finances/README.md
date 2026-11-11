# Espace Finances

[Index des pages](../README.md) · [Design](../../design/README.md) · [Guide général](../../REFERENCE_GENERALE.md)

Pôle Finances de la navigation (`/finances/*`), ouvert le 10 novembre 2026
avec sa première page, Comptes : les comptes bancaires, comptes en ligne et
caisses de chaque entité, avec leur solde de départ. Suivront les opérations
(encaissements, décaissements, virements, catégories, justificatifs), puis les
factures, notes de frais, subventions et dons, contrôles et clôtures
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

## Pages

| Page | Fiche | Contenu |
| --- | --- | --- |
| Comptes | [comptes.md](comptes.md) | `/finances/comptes` : les comptes, leur solde de départ et leur état ; ouverture en fenêtre |
| Fiche compte | [compte.md](compte.md) | `/finances/comptes/[id]` : informations modifiées sur place, clôture, entité titulaire en lecture |

Les autres vues prévues du pôle reçoivent une fiche lors de leur création.
