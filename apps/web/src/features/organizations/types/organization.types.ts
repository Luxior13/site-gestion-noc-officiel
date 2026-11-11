import type { PersonRef } from '$features/persons/types/person.types';

import type { OrganizationKind } from '../organization.constants';

/** Browser-safe projection of an organisation (11 November 2026). */
export type OrganizationItem = Readonly<{
  address: string | null;
  contactCount: number;
  id: string;
  /** In the order of `ORGANIZATION_KINDS`, each once. */
  kinds: readonly OrganizationKind[];
  name: string;
  siretNumber: string | null;
  updatedAt: string;
  version: number;
  website: string | null;
}>;

/** A person to reach at an organisation. */
export type OrganizationContactItem = Readonly<{
  email: string | null;
  id: string;
  /** The record's name when one is linked. */
  name: string;
  /** The linked record, for who may read the Répertoire only. */
  person: PersonRef | null;
  /** Whether a record is linked, even when `person` is hidden. */
  personLinked: boolean;
  /** International form, « +33612345678 ». */
  phone: string | null;
  role: string | null;
  version: number;
}>;

export type OrganizationDetail = OrganizationItem &
  Readonly<{ contacts: readonly OrganizationContactItem[] }>;

/** What the window of a new organisation sends; the rest in its record. */
export type OrganizationCreateInput = Readonly<{
  kinds: readonly OrganizationKind[];
  name: string;
}>;

export type OrganizationInput = OrganizationCreateInput &
  Readonly<{
    address: string | null;
    siretNumber: string | null;
    website: string | null;
  }>;

/**
 * A contact as sent. `personId` left out keeps the current link, so who
 * cannot read the Répertoire never removes one by editing a contact.
 */
export type OrganizationContactInput = Readonly<{
  email: string | null;
  name: string | null;
  personId?: string | null;
  phone: string | null;
  phoneCountry: string;
  role: string | null;
}>;
