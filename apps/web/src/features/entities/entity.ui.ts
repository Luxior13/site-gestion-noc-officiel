import type { StatusBadgeTone } from '$ui/status-badge';
import {
  type ApproximateDate,
  approximateDateEnd,
  formatApproximateDate,
  formatApproximateRange,
} from '$utils/approximate-date.utils';

import { LEGAL_FORM_LABELS } from './entity.constants';
import type { LegalEntityItem } from './types/entity.types';

type EntityShape = Pick<
  LegalEntityItem,
  'end' | 'form' | 'otherForm' | 'start'
>;

/** « Association loi 1901 », or the name given to « Autre ». */
export const entityFormLabel = (
  entity: Pick<LegalEntityItem, 'form' | 'otherForm'>,
): string =>
  entity.form === 'OTHER' && entity.otherForm
    ? entity.otherForm
    : LEGAL_FORM_LABELS[entity.form];

/** « depuis 2023 », « depuis octobre 2025 », « depuis le 15 mars 2023 ». */
const sinceLabel = (value: ApproximateDate): string =>
  `depuis ${value.precision === 'DAY' ? 'le ' : ''}${formatApproximateDate(value)}`;

/** « 2014 → octobre 2025 », or « depuis octobre 2025 » while it lasts. */
export const entityPeriodLabel = (entity: EntityShape): string =>
  entity.end
    ? formatApproximateRange(entity.start, entity.end)
    : sinceLabel(entity.start);

/**
 * Where an entity stands on a day, read from its dates and never stored: to
 * come, active, or over (« Dissoute »; « Terminée » for the period before the
 * association, which was never dissolved).
 */
export const entityStateOf = (
  entity: EntityShape,
  today: string,
): Readonly<{ label: string; tone: StatusBadgeTone }> => {
  if (entity.start.date > today) return { label: 'À venir', tone: 'info' };
  if (entity.end && approximateDateEnd(entity.end) < today)
    return {
      label: entity.form === 'NONE' ? 'Terminée' : 'Dissoute',
      tone: 'former',
    };

  return {
    label: entity.form === 'NONE' ? 'En cours' : 'Active',
    tone: 'success',
  };
};
