'use client';

import React, { type FC } from 'react';

import {
  functionKindsOf,
  type FunctionScopeType,
  memberFunctionGroupLabel,
  type MemberFunctionKind,
} from '$features/member-functions/member-function.constants';
import { Label } from '$ui/label';
import { SearchSelect, type SearchSelectGroup } from '$ui/search-select';
import { compareActiveThenRank } from '$utils/active-order.utils';

import type { PassageFunction } from '../types/passage.types';

/**
 * The functions of the team's game, or of the structure, under their group's
 * heading (« Joueurs », « Bureau »…): the active ones first, then the
 * inactive ones, marked, still chosen for an old passage (PREF-Q10). A search
 * from eight functions (owner, 9 November 2026).
 */
export const FunctionSelect: FC<{
  disabled: boolean;
  error?: string;
  exclude?: string;
  functions: readonly PassageFunction[];
  /** Names its groups: « Encadrement » in a team, « Staff » in the structure. */
  functionScope: FunctionScopeType;
  id: string;
  label: string;
  onChange: (id: string) => void;
  value: string;
}> = ({
  disabled,
  error,
  exclude,
  functions,
  functionScope,
  id,
  label,
  onChange,
  value,
}) => {
  const groups: SearchSelectGroup[] = functionKindsOf(functionScope)
    .map((kind: MemberFunctionKind) => ({
      label: memberFunctionGroupLabel(kind, functionScope),
      options: functions
        .filter((entry) => entry.kind === kind && entry.id !== exclude)
        .sort(compareActiveThenRank)
        .map((entry) => ({
          label: entry.name,
          note: entry.isActive ? undefined : 'inactive',
          value: entry.id,
        })),
    }))
    .filter((group) => group.options.length > 0);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} id={`${id}-label`} required>
        {label}
      </Label>
      <SearchSelect
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        disabled={disabled}
        emptyText="Aucune fonction trouvée"
        groups={groups}
        id={id}
        labelId={`${id}-label`}
        onValueChange={onChange}
        placeholder="Choisir une fonction"
        searchLabel="Rechercher une fonction"
        value={value}
      />
      {error && (
        <p className="text-destructive text-xs" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
