'use client';

import React, { type FC } from 'react';

import { Checkbox } from '$ui/checkbox';
import { Label } from '$ui/label';

import {
  ORGANIZATION_KIND_HINTS,
  ORGANIZATION_KIND_LABELS,
  ORGANIZATION_KINDS,
  type OrganizationKind,
} from '../organization.constants';

/**
 * What an organisation is to the structure: several kinds at once, at least
 * one (owner, 11 November 2026: one list, filtered by kind). Each choice
 * says what it means, so a shop that also sponsors gets both.
 */
export const OrganizationKindsField: FC<{
  disabled: boolean;
  error?: string;
  idPrefix: string;
  onChange: (kinds: OrganizationKind[]) => void;
  value: readonly OrganizationKind[];
}> = ({ disabled, error, idPrefix, onChange, value }) => {
  const errorId = `${idPrefix}-error`;
  const toggle = (kind: OrganizationKind, on: boolean): void =>
    onChange(
      ORGANIZATION_KINDS.filter((item) =>
        item === kind ? on : value.includes(item),
      ),
    );

  return (
    <fieldset
      aria-describedby={error ? errorId : `${idPrefix}-hint`}
      aria-invalid={Boolean(error) || undefined}
      className="min-w-0 space-y-2"
    >
      {/* The legend reads as the site's labels (`Label required`). */}
      <legend className="font-form mb-1.5 flex items-center gap-2 text-[14px] leading-5 font-semibold">
        Types
        <span aria-hidden="true" className="text-destructive">
          *
        </span>
        <span className="sr-only">obligatoire</span>
      </legend>
      <p className="text-muted-foreground text-xs" id={`${idPrefix}-hint`}>
        Cochez tout ce qu’elle est pour la structure, un ou plusieurs.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {ORGANIZATION_KINDS.map((kind) => {
          const id = `${idPrefix}-${kind.toLowerCase()}`;
          // Kinds come from the closed list.
          // eslint-disable-next-line security/detect-object-injection
          const label = ORGANIZATION_KIND_LABELS[kind];
          // eslint-disable-next-line security/detect-object-injection
          const hint = ORGANIZATION_KIND_HINTS[kind];

          return (
            <Label
              className="border-border-default hover:border-ring/70 has-[button[data-state=checked]]:border-primary/60 has-[button[data-state=checked]]:bg-primary/5 min-h-11 cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 font-normal has-[button:disabled]:cursor-not-allowed has-[button:disabled]:opacity-60"
              htmlFor={id}
              key={kind}
            >
              <Checkbox
                aria-describedby={`${id}-hint`}
                checked={value.includes(kind)}
                className="mt-0.5"
                disabled={disabled}
                id={id}
                onCheckedChange={(state) => toggle(kind, state === true)}
              />
              <span className="min-w-0">
                <span className="block text-sm leading-5 font-medium">
                  {label}
                </span>
                <span
                  className="text-muted-foreground block text-xs"
                  id={`${id}-hint`}
                >
                  {hint}
                </span>
              </span>
            </Label>
          );
        })}
      </div>
      {error && (
        <p className="text-destructive text-xs" id={errorId} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
};
