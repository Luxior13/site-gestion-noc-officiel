import type { ApproximateDate } from '$utils/approximate-date.utils';

import type {
  LegalGuardianRelation,
  PERSON_LIST_SORTS,
  PERSON_STRUCTURE_STATUSES,
} from '../person.constants';

export type PersonStructureStatus = (typeof PERSON_STRUCTURE_STATUSES)[number];
export type PersonListSort = (typeof PERSON_LIST_SORTS)[number];

export type PersonAuditActor = {
  displayName: string;
  loginName: string | null;
};

export type PersonLastChange = {
  action: string;
  actor: PersonAuditActor;
  at: string;
} | null;

export type PersonEmailItem = {
  createdAt: string;
  email: string;
  id: string;
  isPrimary: boolean;
  label: string;
  updatedAt: string;
  version: number;
};

export type PersonPhoneItem = {
  countryCode: string;
  createdAt: string;
  id: string;
  isPrimary: boolean;
  label: string;
  phone: string;
  updatedAt: string;
  version: number;
};

export type PersonSocialProfileItem = {
  createdAt: string;
  id: string;
  identifier: string | null;
  isPrimary: boolean;
  label: string;
  networkKey: string;
  profileUrl: string | null;
  updatedAt: string;
  version: number;
};

/**
 * A record of the Répertoire by the name the site shows (« Kaiz · Prénom
 * Nom »); the name parts give the initials of its avatar.
 */
export type PersonRef = Readonly<{
  displayName: string;
  firstName: string | null;
  id: string;
  lastName: string | null;
  nickname: string | null;
}>;

/** Records proposed under a search field: six at most, and whether more exist. */
export type PersonSuggestions = Readonly<{
  more: boolean;
  persons: readonly PersonRef[];
}>;

/** Another pseudo of the person (10 November 2026), read with the identity. */
export type PersonOtherNicknameItem = {
  createdAt: string;
  id: string;
  nickname: string;
  note: string | null;
  /** Used until then, at the start of its period. */
  until: ApproximateDate | null;
  updatedAt: string;
  version: number;
};

/** Who to call in an emergency (10 November 2026), not a record. */
export type PersonEmergencyContactItem = {
  countryCode: string;
  createdAt: string;
  id: string;
  name: string;
  phone: string;
  relation: string | null;
  updatedAt: string;
  version: number;
};

/**
 * A legal representative: another record, with its main email and number,
 * to reach them from the represented person's record.
 */
export type PersonLegalGuardianItem = {
  createdAt: string;
  guardian: PersonRef & {
    primaryEmail: string | null;
    /** International form, « +33612345678 ». */
    primaryPhone: string | null;
  };
  id: string;
  relation: LegalGuardianRelation;
  updatedAt: string;
  version: number;
};

/** The other side of a link: whom this record represents, read only. */
export type PersonRepresentedItem = {
  age: number | null;
  id: string;
  person: PersonRef;
  relation: LegalGuardianRelation;
};

export type PersonSummary = {
  contactCounts: {
    emails: number;
    phones: number;
    socialProfiles: number;
  } | null;
  createdAt: string;
  firstName: string | null;
  id: string;
  lastModifiedBy: PersonAuditActor | null;
  lastName: string | null;
  matchedByContact: boolean;
  /** The other pseudo a search found, when the name itself did not match. */
  matchedOtherNickname: string | null;
  nickname: string | null;
  structureStatus: PersonStructureStatus;
  updatedAt: string;
  version: number;
};

export type PersonDetail = Omit<
  PersonSummary,
  | 'contactCounts'
  | 'lastModifiedBy'
  | 'matchedByContact'
  | 'matchedOtherNickname'
> & {
  age: number | null;
  birthDate: string | null;
  emails: PersonEmailItem[];
  /** These three follow the coordinates' right, empty without it. */
  emergencyContacts: PersonEmergencyContactItem[];
  isAdult: boolean | null;
  lastChange: PersonLastChange;
  legalGuardians: PersonLegalGuardianItem[];
  /** ISO code, « FR » (10 November 2026). */
  nationality: string | null;
  otherNicknames: PersonOtherNicknameItem[];
  phones: PersonPhoneItem[];
  represents: PersonRepresentedItem[];
  socialProfiles: PersonSocialProfileItem[];
};

export type PersonsListResponse = {
  items: PersonSummary[];
  overview: PersonOverview;
  pagination: {
    hasMore: boolean;
    limit: number;
    nextCursor: string | null;
    snapshotAt: string;
    total: number;
  };
};

export type PersonOverview = {
  /** No passage under way, one ended (10 November 2026). */
  formerMember: number;
  inStructure: number;
  noContacts: number | null;
  outsideStructure: number;
  total: number;
};

export type PersonDuplicateWarning = {
  duplicateFound: boolean;
  /**
   * Optional form paths identifying the matching values. Kept optional so
   * older clients that only understand `duplicateFound` remain compatible.
   */
  fields?: string[];
  matches?: Array<{
    fieldKey: 'email' | 'identifier' | 'phone' | 'profileUrl';
    recordId: string;
  }>;
};

export type PersonMutationResponse = {
  duplicateWarning?: PersonDuplicateWarning;
  person: PersonDetail;
};
