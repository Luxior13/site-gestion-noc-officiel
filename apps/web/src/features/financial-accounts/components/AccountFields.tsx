'use client';

import React, { type FC } from 'react';

import { DatePicker } from '$ui/date-picker';
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
} from '$utils/approximate-date.utils';

import {
  FINANCIAL_ACCOUNT_KIND_LABELS,
  FINANCIAL_ACCOUNT_KINDS,
  type FinancialAccountKind,
} from '../financial-account.constants';

const DAY_ONLY = ['DAY'] as const;

const describedBy = (
  ...ids: (false | string | undefined)[]
): string | undefined => ids.filter(Boolean).join(' ') || undefined;

export const FieldError: FC<{ id: string; message?: string }> = ({
  id,
  message,
}) =>
  message ? (
    <p className="text-destructive text-xs" id={id} role="alert">
      {message}
    </p>
  ) : null;

type DayFieldProps = {
  disabled?: boolean;
  error?: string;
  hint?: string;
  idPrefix: string;
  label: string;
  onChange: (day: string) => void;
  value: string;
};

/**
 * A day of the calendar, never a month or a year: a balance and a closing
 * are known to the day. The site's date field, its precision fixed.
 */
export const DayField: FC<DayFieldProps> = ({
  disabled,
  error,
  hint,
  idPrefix,
  label,
  onChange,
  value,
}) => {
  const fieldId = `${idPrefix}-date`;
  const labelId = `${idPrefix}-label`;

  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={fieldId} id={labelId} required>
        {label}
      </Label>
      <DatePicker
        aria-describedby={describedBy(
          hint && `${idPrefix}-hint`,
          error && `${idPrefix}-error`,
        )}
        aria-invalid={Boolean(error)}
        disabled={disabled}
        id={fieldId}
        labelId={labelId}
        maxYear={APPROXIMATE_DATE_LAST_YEAR}
        minYear={APPROXIMATE_DATE_FIRST_YEAR}
        onChange={(next) => {
          if (next) onChange(next.date);
        }}
        precisions={DAY_ONLY}
        value={{ date: value, precision: 'DAY' }}
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

type AmountFieldProps = {
  disabled?: boolean;
  error?: string;
  hint?: string;
  /** A hint written beside the field, for both the amount and its day. */
  hintId?: string;
  id: string;
  label: string;
  onChange: (text: string) => void;
  value: string;
};

/** An amount in euros, typed as written in French: « 1 234,56 ». */
export const AmountField: FC<AmountFieldProps> = ({
  disabled,
  error,
  hint,
  hintId,
  id,
  label,
  onChange,
  value,
}) => (
  <div className="min-w-0 space-y-1.5">
    <Label htmlFor={id} required>
      {label}
    </Label>
    <div className="relative">
      <Input
        aria-describedby={describedBy(
          hint && `${id}-hint`,
          hintId,
          error && `${id}-error`,
        )}
        aria-invalid={Boolean(error)}
        className="pr-8 text-right tabular-nums"
        disabled={disabled}
        id={id}
        inputMode="decimal"
        maxLength={16}
        onChange={(event) => onChange(event.target.value)}
        placeholder="0,00"
        value={value}
      />
      <span
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm"
      >
        €
      </span>
    </div>
    {hint && (
      <p className="text-muted-foreground text-xs" id={`${id}-hint`}>
        {hint}
      </p>
    )}
    <FieldError id={`${id}-error`} message={error} />
  </div>
);

type KindSelectProps = {
  disabled?: boolean;
  error?: string;
  id: string;
  onChange: (kind: FinancialAccountKind) => void;
  value: FinancialAccountKind;
};

/** Bank, online account or cash box. */
export const AccountKindSelect: FC<KindSelectProps> = ({
  disabled,
  error,
  id,
  onChange,
  value,
}) => (
  <Select
    disabled={disabled}
    onValueChange={(kind) => onChange(kind as FinancialAccountKind)}
    value={value}
  >
    <SelectTrigger
      aria-describedby={error ? `${id}-error` : undefined}
      aria-invalid={Boolean(error)}
      className="w-full"
      id={id}
    >
      <SelectValue placeholder="Choisir un type" />
    </SelectTrigger>
    <SelectContent>
      {FINANCIAL_ACCOUNT_KINDS.map((kind) => (
        <SelectItem key={kind} value={kind}>
          {/* A closed list of three kinds. */}
          {/* eslint-disable-next-line security/detect-object-injection */}
          {FINANCIAL_ACCOUNT_KIND_LABELS[kind]}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
