import {
  ORGANIZATION_KIND_LABELS,
  type OrganizationKind,
} from './organization.constants';

/** « Sponsor, Fournisseur », in the order of the list. */
export const kindsLabel = (kinds: readonly OrganizationKind[]): string =>
  // Kinds come from the closed enum.
  // eslint-disable-next-line security/detect-object-injection
  kinds.map((kind) => ORGANIZATION_KIND_LABELS[kind]).join(', ');

/** « noctambule.gg » for « https://www.noctambule.gg/ »: what a reader says. */
export const websiteLabel = (website: string): string =>
  website
    .replace(/^https?:\/\//iu, '')
    .replace(/^www\./iu, '')
    .replace(/\/$/u, '');
