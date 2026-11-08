'use client';

import React, { type FC } from 'react';

import { DatePicker } from '$ui/date-picker';
import { Label } from '$ui/label';
import {
  APPROXIMATE_DATE_FIRST_YEAR,
  APPROXIMATE_DATE_LAST_YEAR,
  type ApproximateDate,
} from '$utils/approximate-date.utils';

type Props = {
  disabled?: boolean;
  error?: string;
  idPrefix: string;
  /** Visible name of the field, « Première ouverture » or « Création ». */
  label: string;
  onChange: (value: ApproximateDate) => void;
  value: ApproximateDate;
};

/**
 * A required date as precisely as it is known: a day, a month or only a year,
 * never an invented day (registre historique). One field opening the site's
 * calendar, where the precision is chosen (9 November 2026, in place of a
 * precision menu beside the browser's date input). A game's first opening, a
 * team's creation.
 */
export const ApproximateDateField: FC<Props> = ({
  disabled,
  error,
  idPrefix,
  label,
  onChange,
  value,
}) => {
  const fieldId = `${idPrefix}-date`;
  const labelId = `${idPrefix}-label`;
  const errorId = `${idPrefix}-error`;

  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={fieldId} id={labelId} required>
        {label}
      </Label>
      <DatePicker
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        disabled={disabled}
        id={fieldId}
        labelId={labelId}
        maxYear={APPROXIMATE_DATE_LAST_YEAR}
        minYear={APPROXIMATE_DATE_FIRST_YEAR}
        onChange={(next) => {
          // The field is required: the calendar offers no « Effacer ».
          if (next) onChange(next);
        }}
        value={value}
      />
      {error && (
        <p className="text-destructive text-xs" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
