'use client';

import { Trophy } from 'lucide-react';
import React, { type FC } from 'react';

import { DatePicker } from '$ui/date-picker';
import { Label } from '$ui/label';
import { ServiceIcon } from '$ui/service-icon';
import { StatusBadge, type StatusBadgeTone } from '$ui/status-badge';
import {
  APPROXIMATE_DATE_FIRST_YEAR,
  APPROXIMATE_DATE_LAST_YEAR,
} from '$utils/approximate-date.utils';
import { cn } from '$utils/css.utils';

import {
  TOURNAMENT_STATE_LABELS,
  type TournamentDatePrecision,
  type TournamentState,
} from '../tournament.constants';
import { tournamentDatesCell } from '../tournament.ui';

const STATE_TONES: Readonly<Record<TournamentState, StatusBadgeTone>> = {
  cancelled: 'warning',
  finished: 'muted',
  ongoing: 'success',
  unscheduled: 'muted',
  upcoming: 'info',
};

/** « À venir », « En cours », « Terminé » or « Annulé ». */
export const TournamentStateBadge: FC<{ state: TournamentState }> = ({
  state,
}) => (
  // A closed list of four states.
  // eslint-disable-next-line security/detect-object-injection
  <StatusBadge tone={STATE_TONES[state]}>
    {/* eslint-disable-next-line security/detect-object-injection */}
    {TOURNAMENT_STATE_LABELS[state]}
  </StatusBadge>
);

/**
 * The Dates cell of a list (13 November 2026), on the rhythm of the
 * Tournoi cell beside it: the days, then the year and the length, discreet.
 */
export const TournamentDates: FC<{
  tournament: Parameters<typeof tournamentDatesCell>[0];
}> = ({ tournament }) => {
  const { days, detail } = tournamentDatesCell(tournament);

  return detail === null ? (
    <span className="text-muted-foreground">{days}</span>
  ) : (
    <>
      <span className="block">{days}</span>
      <span className="text-muted-foreground mt-0.5 block text-xs">
        {detail}
      </span>
    </>
  );
};

/** A cup in the colours of the Esport pole, until a tournament has a logo. */
export const TournamentAvatar: FC<{ className?: string }> = ({ className }) => (
  <ServiceIcon
    className={cn(
      'border-primary/30 bg-primary/10 text-primary-emphasis size-9 shrink-0 [&_svg]:size-4',
      className,
    )}
  >
    <Trophy aria-hidden="true" />
  </ServiceIcon>
);

export const FieldError: FC<{ id: string; message?: string }> = ({
  id,
  message,
}) =>
  message ? (
    <p className="text-destructive text-xs" id={id} role="alert">
      {message}
    </p>
  ) : null;

export const describedBy = (
  ...ids: (false | string | undefined)[]
): string | undefined => ids.filter(Boolean).join(' ') || undefined;

const DAY_ONLY = ['DAY'] as const;

/**
 * A day of the calendar, the site's date field with its precision fixed: a
 * tournament's dates and deadlines are known to the day. An optional one
 * offers « Effacer ».
 */
export const TournamentDayField: FC<{
  disabled?: boolean;
  error?: string;
  hint?: string;
  idPrefix: string;
  label: string;
  onChange: (day: string) => void;
  required?: boolean;
  value: string;
}> = ({
  disabled,
  error,
  hint,
  idPrefix,
  label,
  onChange,
  required,
  value,
}) => {
  const fieldId = `${idPrefix}-date`;
  const labelId = `${idPrefix}-label`;

  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={fieldId} id={labelId} required={required}>
        {label}
      </Label>
      <DatePicker
        aria-describedby={describedBy(
          hint && `${idPrefix}-hint`,
          error && `${idPrefix}-error`,
        )}
        aria-invalid={Boolean(error)}
        clearable={!required}
        disabled={disabled}
        id={fieldId}
        labelId={labelId}
        maxYear={APPROXIMATE_DATE_LAST_YEAR}
        minYear={APPROXIMATE_DATE_FIRST_YEAR}
        onChange={(next) => onChange(next?.date ?? '')}
        placeholder="Choisir un jour"
        precisions={DAY_ONLY}
        value={value ? { date: value, precision: 'DAY' } : null}
      />
      {hint && (
        <p className="text-muted-foreground text-xs" id={`${idPrefix}-hint`}>
          {hint}
        </p>
      )}
      <FieldError id={`${idPrefix}-error`} message={error} />
    </div>
  );
};

const DAY_OR_MONTH = ['DAY', 'MONTH'] as const;

export type TournamentDates = Readonly<{
  datePrecision: TournamentDatePrecision;
  endOn: string;
  startOn: string;
}>;

/**
 * A tournament's dates, optional (owner, 12 November 2026): its first day,
 * or only its month (« mars 2027 »), then its last day when the first is
 * known to the day. Clearing the first clears the last.
 */
export const TournamentDatesFields: FC<{
  disabled?: boolean;
  errors: Readonly<{ endOn?: string; startOn?: string }>;
  idPrefix: string;
  onChange: (next: Partial<TournamentDates>) => void;
  value: TournamentDates;
}> = ({ disabled, errors, idPrefix, onChange, value }) => {
  const startId = `${idPrefix}-start-date`;
  const startLabel = `${idPrefix}-start-label`;

  return (
    <>
      <div className="min-w-0 space-y-1.5">
        <Label htmlFor={startId} id={startLabel}>
          {value.datePrecision === 'MONTH' ? 'Mois' : 'Premier jour'}
        </Label>
        <DatePicker
          aria-describedby={describedBy(
            `${idPrefix}-start-hint`,
            errors.startOn && `${idPrefix}-start-error`,
          )}
          aria-invalid={Boolean(errors.startOn)}
          clearable
          disabled={disabled}
          id={startId}
          labelId={startLabel}
          maxYear={APPROXIMATE_DATE_LAST_YEAR}
          minYear={APPROXIMATE_DATE_FIRST_YEAR}
          onChange={(next) =>
            onChange(
              !next
                ? { datePrecision: 'DAY', endOn: '', startOn: '' }
                : next.precision === 'MONTH'
                  ? { datePrecision: 'MONTH', endOn: '', startOn: next.date }
                  : {
                      datePrecision: 'DAY',
                      // A last day before the new first one no longer fits.
                      endOn:
                        value.endOn && value.endOn >= next.date
                          ? value.endOn
                          : '',
                      startOn: next.date,
                    },
            )
          }
          placeholder="Date à fixer"
          precisions={DAY_OR_MONTH}
          value={
            value.startOn
              ? { date: value.startOn, precision: value.datePrecision }
              : null
          }
        />
        <p
          className="text-muted-foreground text-xs"
          id={`${idPrefix}-start-hint`}
        >
          Facultatif : le jour, ou seulement le mois s’il n’est pas encore
          connu.
        </p>
        <FieldError id={`${idPrefix}-start-error`} message={errors.startOn} />
      </div>
      {value.datePrecision === 'DAY' && value.startOn ? (
        <TournamentDayField
          disabled={disabled}
          error={errors.endOn}
          hint="Facultatif : pour un tournoi sur plusieurs jours."
          idPrefix={`${idPrefix}-end`}
          label="Dernier jour"
          onChange={(endOn) => onChange({ endOn })}
          value={value.endOn}
        />
      ) : (
        <div aria-hidden="true" className="max-sm:hidden" />
      )}
    </>
  );
};
