/**
 * What an organisation is to the structure (owner, 11 November 2026: one
 * list for all of them, filtered by kind). An organisation holds several:
 * a shop can supply and sponsor without a second record.
 */
export const ORGANIZATION_KINDS = [
  'SPONSOR',
  'PARTNER',
  'SUPPLIER',
  'CLIENT',
  'ORGANIZER',
  'FUNDER',
] as const;
export type OrganizationKind = (typeof ORGANIZATION_KINDS)[number];

export const ORGANIZATION_KIND_LABELS: Readonly<
  Record<OrganizationKind, string>
> = {
  CLIENT: 'Client',
  FUNDER: 'Financeur public',
  ORGANIZER: 'Organisateur',
  PARTNER: 'Partenaire',
  SPONSOR: 'Sponsor',
  SUPPLIER: 'Fournisseur',
};

/** Said under each choice, in the window and the record. */
export const ORGANIZATION_KIND_HINTS: Readonly<
  Record<OrganizationKind, string>
> = {
  CLIENT: 'Achète une prestation à la structure.',
  FUNDER: 'Mairie, région, État : verse des subventions.',
  ORGANIZER: 'Organise des tournois ou des événements.',
  PARTNER: 'Travaille avec la structure sans la financer.',
  SPONSOR: 'Soutient la structure, en argent ou en matériel.',
  SUPPLIER: 'Vend à la structure : matériel, services, salle.',
};

/** The quick filters of the list, in the plural. */
export const ORGANIZATION_KIND_FILTER_LABELS: Readonly<
  Record<OrganizationKind, string>
> = {
  CLIENT: 'Clients',
  FUNDER: 'Financeurs publics',
  ORGANIZER: 'Organisateurs',
  PARTNER: 'Partenaires',
  SPONSOR: 'Sponsors',
  SUPPLIER: 'Fournisseurs',
};

export const ORGANIZATION_NAME_MAX_LENGTH = 120;
export const ORGANIZATION_WEBSITE_MAX_LENGTH = 200;
export const ORGANIZATION_ADDRESS_MAX_LENGTH = 300;
export const CONTACT_NAME_MAX_LENGTH = 100;
export const CONTACT_ROLE_MAX_LENGTH = 80;
/** Enough for any organisation; bounds what a record loads. */
export const ORGANIZATION_CONTACTS_LIMIT = 50;

/** Where the record page renders the save bar, outside the section. */
export const ORGANIZATION_ACTION_BAR_SLOT = 'organization-action-bar-slot';
