# Espace Système

[Index des pages](../README.md) · [Design](../../design/README.md) · [Guide général](../../REFERENCE_GENERALE.md)

Pôle Système (`/systeme/*`) : administration technique. Chaque page a sa
route explicite depuis le 31 octobre 2026 ; `/systeme` seul redirige vers la
première page visible du pôle pour le compte connecté
([routes](../../systeme/routes.md), [SYS-14](../../systeme/constats.md)).

## Modules et pages

| Route | Fiche | Gabarit | État |
| --- | --- | --- | --- |
| `/systeme/utilisateurs`, `/nouveau`, `/[id]` | [Utilisateurs](utilisateurs/README.md) : liste, création, Profil, Autorisations, Sécurité | A, C, B | Pages de référence (liste en complément, fiche pour la barre d’enregistrement) |
| `/systeme/parametres` | [Paramètres système](parametres.md) | D | Route explicite `systeme/parametres/page.tsx` |
| `/systeme/feuille-de-route` | [Feuille de route](feuille-de-route.md) | E | Aligné |
| `/systeme/journal-activite` | [Journal d’activité](journal-activite.md) | A | Reconstruite le 30 octobre 2026 (retirée du 9 au 30 octobre) |

Les alias `/administration` et `/administration/utilisateurs/*` redirigent vers
les Utilisateurs ([routes](../../systeme/routes.md#alias-et-redirections)).
