'use client';

import React, { type FC } from 'react';

import { Input } from '$ui/input';
import { Label } from '$ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '$ui/select';
import {
  APPROXIMATE_DATE_FIRST_YEAR,
  APPROXIMATE_DATE_LAST_YEAR,
  type ApproximateDate,
  changeDatePrecision,
  DATE_PRECISION_LABELS,
  DATE_PRECISIONS,
  type DatePrecision,
  parseDateOnly,
} from '$utils/approximate-date.utils';

const MONTH_LABELS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
] as const;

const pad = (value: number): string => String(value).padStart(2, '0');

type Props = {
  disabled?: boolean;
  error?: string;
  idPrefix: string;
  /** Visible name of the group, « Première ouverture » or « Création ». */
  label: string;
  onChange: (value: ApproximateDate) => void;
  /** The same in a sentence, for the accessible names: « première ouverture ». */
  subject: string;
  value: ApproximateDate;
};

/**
 * A required date as precisely as it is known: a day, a month or only a year,
 * never an invented day (registre historique). Month and year use a menu and a
 * number, readable in every browser. A game's first opening, a team's creation.
 */
export const ApproximateDateField: FC<Props> = ({
  disabled,
  error,
  idPrefix,
  label,
  onChange,
  subject,
  value,
}) => {
  const parts = parseDateOnly(value.date);
  const year = parts?.year ?? new Date().getFullYear();
  const month = parts?.month ?? 1;
  const errorId = `${idPrefix}-error`;
  const setYear = (raw: string): void => {
    const nextYear = /^\d{4}$/.test(raw) ? raw : '';
    onChange({
      ...value,
      // An incomplete year stays invalid until four digits are typed.
      date: nextYear
        ? `${nextYear}-${pad(value.precision === 'YEAR' ? 1 : month)}-01`
        : raw,
    });
  };

  return (
    <fieldset className="space-y-1.5" disabled={disabled}>
      {/* Same look as a required Label: the legend names the whole group. */}
      <legend className="font-form mb-1.5 flex items-center gap-2 text-[14px] leading-5 font-semibold">
        {label}
        <span aria-hidden="true" className="text-destructive">
          *
        </span>
        <span className="sr-only">obligatoire</span>
      </legend>
      <div className="grid gap-2 sm:grid-cols-[11rem_minmax(0,1fr)]">
        <div className="space-y-1">
          <Label className="sr-only" htmlFor={`${idPrefix}-precision`}>
            Précision de la date
          </Label>
          <Select
            onValueChange={(precision) =>
              onChange(changeDatePrecision(value, precision as DatePrecision))
            }
            value={value.precision}
          >
            <SelectTrigger
              aria-label="Précision de la date"
              className="w-full"
              id={`${idPrefix}-precision`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRECISIONS.map((precision) => (
                <SelectItem key={precision} value={precision}>
                  {/* A closed union of three values. */}
                  {/* eslint-disable-next-line security/detect-object-injection */}
                  {DATE_PRECISION_LABELS[precision]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {value.precision === 'DAY' && (
          <Input
            aria-describedby={error ? errorId : undefined}
            aria-invalid={Boolean(error)}
            aria-label={`Date de ${subject}`}
            id={`${idPrefix}-date`}
            max={`${APPROXIMATE_DATE_LAST_YEAR}-12-31`}
            min={`${APPROXIMATE_DATE_FIRST_YEAR}-01-01`}
            onChange={(event) =>
              onChange({ ...value, date: event.target.value })
            }
            type="date"
            value={value.date}
          />
        )}
        {value.precision !== 'DAY' && (
          <div
            className={
              value.precision === 'MONTH'
                ? 'grid grid-cols-[minmax(0,1fr)_6.5rem] gap-2'
                : 'grid grid-cols-[6.5rem] gap-2'
            }
          >
            {value.precision === 'MONTH' && (
              <Select
                onValueChange={(nextMonth) =>
                  onChange({
                    ...value,
                    date: `${year}-${pad(Number(nextMonth))}-01`,
                  })
                }
                value={String(month)}
              >
                <SelectTrigger
                  aria-label={`Mois de ${subject}`}
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_LABELS.map((label, index) => (
                    <SelectItem key={label} value={String(index + 1)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Input
              aria-describedby={error ? errorId : undefined}
              aria-invalid={Boolean(error)}
              aria-label={`Année de ${subject}`}
              id={`${idPrefix}-year`}
              inputMode="numeric"
              max={APPROXIMATE_DATE_LAST_YEAR}
              maxLength={4}
              min={APPROXIMATE_DATE_FIRST_YEAR}
              onChange={(event) => setYear(event.target.value)}
              type="number"
              value={parts ? String(year) : value.date.slice(0, 4)}
            />
          </div>
        )}
      </div>
      {error && (
        <p className="text-destructive text-xs" id={errorId} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
};
