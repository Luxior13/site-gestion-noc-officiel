/**
 * The forms an entity can have in law, fixed by the law and so by the code
 * (cadrage des entités, 9 November 2026). NONE is the period before the
 * association: no identifier, no account, never principal.
 */
export const LEGAL_FORMS = [
  'ASSOCIATION',
  'SAS',
  'SASU',
  'SARL',
  'EURL',
  'OTHER',
  'NONE',
] as const;
export type LegalForm = (typeof LEGAL_FORMS)[number];

export const LEGAL_FORM_LABELS: Readonly<Record<LegalForm, string>> = {
  ASSOCIATION: 'Association loi 1901',
  EURL: 'EURL',
  NONE: 'Sans forme juridique',
  OTHER: 'Autre',
  SARL: 'SARL',
  SAS: 'SAS',
  SASU: 'SASU',
};

export const ENTITY_NAME_MAX_LENGTH = 120;
export const OTHER_FORM_MAX_LENGTH = 60;
export const HEAD_OFFICE_MAX_LENGTH = 300;

/** Where the record page renders the save bar, outside the section. */
export const ENTITY_ACTION_BAR_SLOT = 'entity-action-bar-slot';
