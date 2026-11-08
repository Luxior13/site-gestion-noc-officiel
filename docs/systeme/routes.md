# Routes

[Cartographie](README.md) · [Fiches des pages](../pages/README.md) · [API](api.md) ·
[Navigation](../domaines/navigation.md)

Relevé du 31 octobre 2026 : **13 fichiers `page.tsx`** dans `apps/web/src/app` (journal d’activité reconstruit le 30 octobre 2026).
La route générique `/systeme/[[...slug]]` est remplacée le 31 octobre 2026 par
`systeme/page.tsx` (redirection) et `systeme/parametres/page.tsx` ([SYS-14](constats.md)). Les pages de redirection
`/administration` et `/tableau-de-bord` ont été retirées le 20 octobre 2026 :
les alias permanents ci-dessous les couvrent ([SYS-04](constats.md)). Chaque page servie a au moins
une fiche dans [docs/pages](../pages/README.md) ; le contrôle documentaire
vérifie que chaque route y est citée.

## Layouts et états de route

| Fichier | Portée |
| --- | --- |
| [app/layout.tsx](../../apps/web/src/app/layout.tsx) | Tout le site : langue, polices, fournisseurs, thème sombre |
| [login/layout.tsx](../../apps/web/src/app/login/layout.tsx) | Métadonnées de la connexion |
| [mon-compte/layout.tsx](../../apps/web/src/app/mon-compte/layout.tsx) | Métadonnées de Mon compte |
| [systeme/utilisateurs/layout.tsx](../../apps/web/src/app/systeme/utilisateurs/layout.tsx) | Métadonnées du module Utilisateurs |
| [membres/repertoire/nouveau/layout.tsx](../../apps/web/src/app/personnes/repertoire/nouveau/layout.tsx), [membres/repertoire/[id]/layout.tsx](../../apps/web/src/app/personnes/repertoire/%5Bid%5D/layout.tsx), [systeme/utilisateurs/nouveau/layout.tsx](../../apps/web/src/app/systeme/utilisateurs/nouveau/layout.tsx), [systeme/utilisateurs/[id]/layout.tsx](../../apps/web/src/app/systeme/utilisateurs/%5Bid%5D/layout.tsx), [systeme/journal-activite/layout.tsx](../../apps/web/src/app/systeme/journal-activite/layout.tsx), [systeme/feuille-de-route/layout.tsx](../../apps/web/src/app/systeme/feuille-de-route/layout.tsx) | Titre d’onglet de la page (31 octobre 2026, WCAG 2.4.2) ; Paramètres système le déclare dans sa propre `page.tsx` |
| [error.tsx](../../apps/web/src/app/error.tsx), [global-error.tsx](../../apps/web/src/app/global-error.tsx) | Erreurs de rendu, dont l’état racine autonome |
| [not-found.tsx](../../apps/web/src/app/not-found.tsx) | Page introuvable |
| [loading.tsx](../../apps/web/src/app/loading.tsx) et `loading.tsx` des listes et fiches | Squelettes de chargement |

Le cadre privé (sidebar, header) est fourni par `AuthenticatedLayout`, composé
par chaque page privée ; la protection serveur vient de `getPageAuthSession`,
des gardes de module et du middleware.

## Inventaire

**Accès relevé** : gardes trouvées dans `page.tsx` ou son composant principal.
Ce relevé ne remplace pas la [référence des permissions](../domaines/permissions.md).

| Route | Type | Accès relevé | Chargement | Fiches |
| --- | --- | --- | --- | --- |
| `/` | Page | Session (`AuthenticatedLayout`), `dashboard:view` | commun | [Accueil — Mon travail](../pages/accueil.md) |
| `/login` | Page | Publique | intégré | [Connexion](../pages/connexion.md) |
| `/mon-compte` | Page | Session | commun | [Mon compte](../pages/mon-compte/README.md), [Profil](../pages/mon-compte/profil.md), [Autorisations](../pages/mon-compte/acces.md), [Sécurité](../pages/mon-compte/securite.md) |
| `/personnes/repertoire` | Page | `getPageAuthSession`, `persons:view`, `assertPersonFeatureReady` | oui | [Liste du répertoire](../pages/personnes/repertoire/liste.md) |
| `/personnes/repertoire/nouveau` | Page | Session, `persons:create` | commun | [Nouvelle fiche personne](../pages/personnes/repertoire/creation.md) |
| `/personnes/repertoire/[id]` | Page | `getPageAuthSession`, `persons:view`, `assertPersonFeatureReady` | oui | [Identité](../pages/personnes/repertoire/fiche-identite.md), [Coordonnées](../pages/personnes/repertoire/fiche-coordonnees.md) |
| `/systeme/utilisateurs` | Page | Session, `users:view` | oui | [Liste des utilisateurs](../pages/systeme/utilisateurs/liste.md) |
| `/systeme/utilisateurs/nouveau` | Page | Session, `users:create` | intégré | [Nouvel utilisateur](../pages/systeme/utilisateurs/creation.md) |
| `/systeme/utilisateurs/[id]` | Page | `getPageAuthSession`, `users:view`, sections selon les capacités | oui | [Profil](../pages/systeme/utilisateurs/fiche-profil.md), [Autorisations](../pages/systeme/utilisateurs/fiche-autorisations.md), [Sécurité](../pages/systeme/utilisateurs/fiche-securite.md) |
| `/systeme/journal-activite` | Page | Session, `audit:view` ; l’API refait le contrôle et trace la lecture | intégré | [Journal d’activité](../pages/systeme/journal-activite.md) |
| `/systeme/feuille-de-route` | Page | Session | commun | [Feuille de route](../pages/systeme/feuille-de-route.md) |
| `/systeme` | Redirection | Première page visible du pôle pour le compte, sinon l’accueil ; sans session, la connexion | — | [Espace Système](../pages/systeme/README.md) |
| `/systeme/parametres` | Page | Session, `settings:view` (`settings:update` pour modifier) | commun | [Paramètres système](../pages/systeme/parametres.md) |

## Alias et redirections permanentes

Déclarés dans `LEGACY_PAGE_ALIASES`
([routes.constants.ts](../../apps/web/src/shared/constants/routes.constants.ts))
et appliqués par `redirects()` de [next.config.ts](../../apps/web/next.config.ts),
avant le rendu des pages.

| Ancienne adresse | Destination |
| --- | --- |
| `/membres/repertoire/*` (pôle renommé le 8 novembre 2026), `/vie-interne/repertoire/*` | `/personnes/repertoire/*` |
| `/administration/utilisateurs/*`, `/administration` | `/systeme/utilisateurs/*` |
| `/vie-interne/actualite-interne`, `/activite/actualites`, `/feuille-de-route` | `/systeme/feuille-de-route` |
| `/mes-notifications`, `/tableau-de-bord/mes-notifications` | `/systeme/feuille-de-route` |
| `/tableau-de-bord`, `/recherche` | `/` |

## Pages retirées

| Ancienne page | Date | Remplacement | Fiche |
| --- | --- | --- | --- |
| Journal d’activité `/systeme/journal-activite` | 9 octobre 2026, **reconstruite le 30 octobre 2026** | Alias vers la feuille de route pendant le retrait, retiré à la reconstruction | [Journal d’activité](../pages/systeme/journal-activite.md) |
| Notifications `/mes-notifications` | 9 octobre 2026 (migration `remove_notifications_module`) | Alias vers la feuille de route | Aucune fiche : retirée avant la création des fiches |
| Recherche complète `/recherche` | Avant le 12 octobre 2026 | Navigation rapide du header | [Navigation générale](../pages/transverse/navigation-generale.md) |
| Sponsors et partenaires | 21 septembre 2026 | Reconstruction à cadrer | [Proposition](../propositions/relations-sponsors-partenaires.md) |

## Relevé

```bash
find apps/web/src/app -name page.tsx | sort
grep -n "source:" apps/web/src/shared/constants/routes.constants.ts
```
