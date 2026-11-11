# Espace Relations

[Index des pages](../README.md) · [Design](../../design/README.md) · [Guide général](../../REFERENCE_GENERALE.md)

Pôle Relations de la navigation (`/relations/*`), ouvert le 11 novembre 2026
avec sa première page, Organisations : les sponsors, partenaires,
fournisseurs, clients, organisateurs de tournois et financeurs publics de la
structure, dans une seule liste, avec les personnes à y joindre. Suivront les
partenariats (accords, contreparties, livrables) et la communication
([feuille de route](../../propositions/feuille-de-route.md)). Thème `legal`
(clé de pôle `legal` dans les autorisations et le journal), icône poignée de
main ; sa section de menu s’appelle « Annuaire ».

Règles communes du pôle (11 novembre 2026, décision du propriétaire, « oui
go ») :

- **Une seule fiche par organisation**, quoi qu’elle soit pour la structure :
  ses types (Sponsor, Partenaire, Fournisseur, Client, Organisateur, Financeur
  public) se cumulent sur la même fiche, et la liste se filtre par type. Un
  magasin qui fournit et sponsorise garde une fiche, une adresse.
- **L’organisation dit qui, le partenariat dira ce qui est convenu** : durée,
  contreparties et état d’un accord vivront dans Partenariats, pas sur la
  fiche organisation.
- **Un contact est d’abord un nom** : une personne d’une organisation n’entre
  pas dans le Répertoire, qui garde les personnes de la structure ; une fiche
  du Répertoire ne se relie que si la personne en a déjà une.

## Pages

| Page | Fiche | Contenu |
| --- | --- | --- |
| Organisations | [organisations.md](organisations.md) | `/relations/organisations` : toutes les organisations, recherche et filtres par type ; ajout en fenêtre |
| Fiche organisation | [organisation.md](organisation.md) | `/relations/organisations/[id]` : onglets Identité et Contacts |

Les autres vues prévues du pôle reçoivent une fiche lors de leur création.
