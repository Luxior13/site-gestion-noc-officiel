import type { ApproximateDate } from '$utils/approximate-date.utils';

import type { LegalForm } from '../entity.constants';

/** Browser-safe projection of a legal entity (10 November 2026). */
export type LegalEntityItem = Readonly<{
  /** Accounts it holds: an entity that has some is ended, not deleted. */
  accountCount: number;
  /** The last day of its period, as precisely as known; null while it lasts. */
  end: ApproximateDate | null;
  form: LegalForm;
  headOffice: string | null;
  id: string;
  isPrincipal: boolean;
  name: string;
  /** Name of the form when it is « Autre ». */
  otherForm: string | null;
  rnaNumber: string | null;
  siretNumber: string | null;
  start: ApproximateDate;
  updatedAt: string;
  version: number;
}>;

/** What the window of a new entity sends; identifiers come in its record. */
export type LegalEntityCreateInput = Readonly<{
  end: ApproximateDate | null;
  form: LegalForm;
  name: string;
  otherForm: string | null;
  start: ApproximateDate;
}>;

export type LegalEntityInput = LegalEntityCreateInput &
  Readonly<{
    headOffice: string | null;
    isPrincipal: boolean;
    rnaNumber: string | null;
    siretNumber: string | null;
  }>;
