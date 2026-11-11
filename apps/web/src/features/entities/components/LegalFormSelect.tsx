'use client';

import React, { type FC } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '$ui/select';

import {
  LEGAL_FORM_LABELS,
  LEGAL_FORMS,
  type LegalForm,
} from '../entity.constants';

type Props = {
  disabled?: boolean;
  error?: string;
  /** Forms that cannot be chosen now, with the reason given by the hint. */
  excluded?: readonly LegalForm[];
  hintId?: string;
  id: string;
  onChange: (form: LegalForm) => void;
  value: LegalForm;
};

/**
 * The legal form, from the fixed list of the law (9 November 2026: « je
 * pourrais mettre association de date à date, et aussi société SAS, etc. ? »):
 * the period before the association is « Sans forme juridique », last.
 */
export const LegalFormSelect: FC<Props> = ({
  disabled,
  error,
  excluded = [],
  hintId,
  id,
  onChange,
  value,
}) => (
  <Select
    disabled={disabled}
    onValueChange={(form) => onChange(form as LegalForm)}
    value={value}
  >
    <SelectTrigger
      aria-describedby={
        [hintId, error && `${id}-error`].filter(Boolean).join(' ') || undefined
      }
      aria-invalid={Boolean(error)}
      className="w-full"
      id={id}
    >
      <SelectValue placeholder="Choisir une forme" />
    </SelectTrigger>
    <SelectContent>
      {LEGAL_FORMS.map((form) => (
        <SelectItem disabled={excluded.includes(form)} key={form} value={form}>
          {/* A closed list of seven forms. */}
          {/* eslint-disable-next-line security/detect-object-injection */}
          {LEGAL_FORM_LABELS[form]}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
