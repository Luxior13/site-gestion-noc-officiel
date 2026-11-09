'use client';

import { ExternalLink, Search } from 'lucide-react';
import Link from 'next/link';
import React, { type FC, useEffect, useId, useRef, useState } from 'react';

import {
  MEMBER_FUNCTION_KINDS,
  memberFunctionGroupLabel,
  type MemberFunctionKind,
} from '$features/member-functions/member-function.constants';
import { PersonAvatarFrame } from '$features/persons/components/PersonAvatar';
import { Button } from '$ui/button';
import { Input } from '$ui/input';
import { Label } from '$ui/label';
import { Popover, PopoverAnchor, PopoverContent } from '$ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '$ui/select';
import { compareActiveThenRank } from '$utils/active-order.utils';
import { cn } from '$utils/css.utils';

import { searchPassagePersonsRequest } from '../passage.api';
import type {
  PassageFunction,
  PassagePerson,
  PassagePersonResults,
} from '../types/passage.types';

const ID = 'passage-dialog';

/**
 * The functions of the team's game, by group: the active ones first, then the
 * inactive ones, marked, still chosen for an old passage (PREF-Q10).
 */
export const FunctionSelect: FC<{
  disabled: boolean;
  error?: string;
  exclude?: string;
  functions: readonly PassageFunction[];
  id: string;
  label: string;
  onChange: (id: string) => void;
  value: string;
}> = ({ disabled, error, exclude, functions, id, label, onChange, value }) => {
  const groups = MEMBER_FUNCTION_KINDS.map((kind: MemberFunctionKind) => ({
    items: functions
      .filter((entry) => entry.kind === kind && entry.id !== exclude)
      .sort(compareActiveThenRank),
    kind,
  })).filter((group) => group.items.length > 0);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} required>
        {label}
      </Label>
      <Select disabled={disabled} onValueChange={onChange} value={value}>
        <SelectTrigger
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={Boolean(error)}
          className="w-full"
          id={id}
        >
          <SelectValue placeholder="Choisir une fonction" />
        </SelectTrigger>
        <SelectContent>
          {groups.map(({ items, kind }) =>
            items.map((entry, index) => (
              <SelectItem
                // The group's name before its first function.
                key={entry.id}
                textValue={entry.name}
                value={entry.id}
              >
                {index === 0 && (
                  <span className="sr-only">
                    {memberFunctionGroupLabel(kind)} :{' '}
                  </span>
                )}
                {entry.isActive ? entry.name : `${entry.name} (inactive)`}
              </SelectItem>
            )),
          )}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-destructive text-xs" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * A record of the Répertoire, searched by pseudo or name in a drop-down list
 * under the field (owner, 9 November 2026: « en afficher moins et faire un
 * menu déroulant »): six suggestions at most, then « précisez la recherche ».
 * The field keeps the focus: arrows, Entrée to choose, Échap to close. A
 * missing record is created in the Répertoire, in another tab.
 */
export const PersonPicker: FC<{
  canCreatePerson: boolean;
  disabled: boolean;
  error?: string;
  onChange: (person: PassagePerson | null) => void;
  /** A new search clears the « choose a person » error. */
  onSearch: () => void;
  value: PassagePerson | null;
}> = ({ canCreatePerson, disabled, error, onChange, onSearch, value }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PassagePersonResults | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const anchorRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const optionId = (index: number): string => `${listId}-option-${index}`;
  const persons = results?.persons ?? [];

  useEffect(() => {
    const term = query.trim();
    setResults(null);
    setSearchError(null);
    setActive(0);
    if (!term) return undefined;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      searchPassagePersonsRequest(term, controller.signal)
        .then(setResults)
        .catch((caught: unknown) => {
          if (!controller.signal.aborted)
            setSearchError(
              caught instanceof Error
                ? caught.message
                : 'Recherche impossible.',
            );
        });
    }, 250);

    return (): void => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const choose = (person: PassagePerson): void => {
    onChange(person);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) setOpen(Boolean(query.trim()));
      if (persons.length === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive(
        (current) => (current + step + persons.length) % persons.length,
      );
    } else if (event.key === 'Enter' && open) {
      // Enter chooses the lit suggestion rather than sending the form.
      event.preventDefault();
      const person = persons.at(active);
      if (person) choose(person);
    }
  };

  if (value)
    return (
      <div className="space-y-1.5">
        <Label>Personne</Label>
        <div className="border-border-default bg-surface-inset flex items-center gap-2.5 rounded-lg border px-3 py-2">
          <PersonAvatarFrame person={value} />
          <span className="min-w-0 flex-1 font-semibold [overflow-wrap:anywhere]">
            {value.displayName}
          </span>
          <Button
            disabled={disabled}
            onClick={() => onChange(null)}
            size="sm"
            type="button"
            variant="outline"
          >
            Changer
          </Button>
        </div>
      </div>
    );

  const expanded = open && Boolean(query.trim());

  return (
    <div className="space-y-1.5">
      <Label htmlFor={`${ID}-person`} required>
        Personne
      </Label>
      <Popover open={expanded} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative" ref={anchorRef}>
            <Search
              aria-hidden="true"
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input
              aria-activedescendant={
                expanded && persons.length > 0 ? optionId(active) : undefined
              }
              aria-autocomplete="list"
              aria-controls={listId}
              aria-describedby={`${ID}-person-hint${error ? ` ${ID}-person-error` : ''}`}
              aria-expanded={expanded}
              aria-invalid={Boolean(error)}
              autoComplete="off"
              autoFocus
              className="pl-9"
              disabled={disabled}
              id={`${ID}-person`}
              maxLength={80}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
                onSearch();
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder="Pseudo, prénom ou nom…"
              role="combobox"
              value={query}
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) p-1"
          // The field keeps the focus while its suggestions show.
          onCloseAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => {
            if (
              event.target instanceof Node &&
              anchorRef.current?.contains(event.target)
            )
              event.preventDefault();
          }}
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <ul aria-label="Fiches trouvées" id={listId} role="listbox">
            {persons.map((person, index) => (
              <li
                aria-selected={index === active}
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm max-sm:min-h-11',
                  index === active && 'bg-surface-row-hover',
                )}
                id={optionId(index)}
                key={person.id}
                // Keeps the focus in the field; the click chooses.
                onClick={() => choose(person)}
                onMouseEnter={() => setActive(index)}
                onPointerDown={(event) => event.preventDefault()}
                role="option"
              >
                <PersonAvatarFrame className="size-7" person={person} />
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  {person.displayName}
                </span>
              </li>
            ))}
          </ul>
          <p
            aria-live="polite"
            className="text-muted-foreground px-3 py-2 text-xs empty:hidden"
          >
            {searchError ??
              (results === null
                ? 'Recherche…'
                : persons.length === 0
                  ? 'Aucune fiche trouvée.'
                  : results.more
                    ? `Plus de ${persons.length} fiches : précisez la recherche.`
                    : '')}
          </p>
        </PopoverContent>
      </Popover>
      <p className="text-muted-foreground text-xs" id={`${ID}-person-hint`}>
        Une fiche du Répertoire.{' '}
        {canCreatePerson && (
          <>
            Absente ?{' '}
            <Link
              className="text-primary-emphasis underline-offset-4 hover:underline"
              href="/personnes/repertoire/nouveau"
              rel="noopener"
              target="_blank"
            >
              Créer la fiche dans le Répertoire
              <ExternalLink aria-hidden="true" className="ml-1 inline size-3" />
            </Link>
            , puis cherchez-la ici.
          </>
        )}
      </p>
      {error && (
        <p
          className="text-destructive text-xs"
          id={`${ID}-person-error`}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};
