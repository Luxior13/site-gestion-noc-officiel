'use client';

import { Command as CommandPrimitive } from 'cmdk';
import { CheckIcon, ChevronDownIcon, SearchIcon } from 'lucide-react';
import React, {
  type FC,
  type KeyboardEvent,
  type ReactNode,
  useId,
  useRef,
  useState,
} from 'react';

import { passwordManagerIgnoreAttributes } from '$utils/autofill.utils';
import { cn } from '$utils/css.utils';
import { normalizeSearchText } from '$utils/search-text.utils';

import { Popover, PopoverContent, PopoverTrigger } from './popover';

/**
 * From this many choices the menu opens on a search field (owner,
 * 9 November 2026: « la barre de recherche si beaucoup de fonctions »).
 */
export const SEARCH_SELECT_SEARCH_FROM = 8;

type SearchSelectOption = Readonly<{
  /** Decorative, before the name, here and in the field: a flag. */
  icon?: ReactNode;
  label: string;
  /** Said after the name, muted: « inactive ». */
  note?: string;
  value: string;
}>;

/** A block of the menu, its heading shown above its choices. */
export type SearchSelectGroup = Readonly<{
  label?: string;
  options: readonly SearchSelectOption[];
}>;

/**
 * The groups that hold every word typed, by the site's single comparison
 * rule (accents, case and punctuation ignored); empty groups go.
 */
export const filterSearchSelectGroups = (
  groups: readonly SearchSelectGroup[],
  query: string,
): SearchSelectGroup[] => {
  const terms = normalizeSearchText(query).split(' ').filter(Boolean);

  return groups
    .map((group) => ({
      ...group,
      options: group.options.filter((option) => {
        const text = normalizeSearchText(option.label);

        return terms.every((term) => text.includes(term));
      }),
    }))
    .filter((group) => group.options.length > 0);
};

type Props = {
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  /** The first field of a window takes the focus. */
  autoFocus?: boolean;
  disabled?: boolean;
  /** « Aucune fonction trouvée », under a search that finds nothing. */
  emptyText: string;
  groups: readonly SearchSelectGroup[];
  id: string;
  /** The field's label: the trigger is named by it, then by its value. */
  labelId: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  /** « Rechercher une fonction » : the search field's name and hint. */
  searchLabel: string;
  value: string;
};

/**
 * A value among the choices of a list kept on the site (functions, games),
 * as a form field (owner, 9 November 2026): the menu shows each group under
 * its heading, keeps a bounded height and scrolls, and from eight choices
 * opens on a search field. Arrows, Entrée and Échap from the keyboard; the
 * chosen value carries a check. A short fixed list of the code keeps the
 * plain `Select`.
 */
export const SearchSelect: FC<Props> = ({
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  autoFocus,
  disabled,
  emptyText,
  groups,
  id,
  labelId,
  onValueChange,
  placeholder,
  searchLabel,
  value,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  // The highlighted choice, moved by the arrows.
  const [active, setActive] = useState('');
  const listId = useId();
  const valueId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const options = groups.flatMap((group) => group.options);
  const searchable = options.length >= SEARCH_SELECT_SEARCH_FROM;
  const selected = options.find((option) => option.value === value);
  const shown = filterSearchSelectGroups(groups, query);

  const toggle = (next: boolean): void => {
    if (next) {
      setQuery('');
      setActive(selected?.value ?? options[0]?.value ?? '');
    }
    setOpen(next);
  };

  const choose = (next: string): void => {
    onValueChange(next);
    setOpen(false);
  };

  // The arrows open the menu too, as a native choice does.
  const openFromKeyboard = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (!open && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      toggle(true);
    }
  };

  return (
    // Modal while open, as a plain Select: the menu then owns the wheel and
    // the touch scroll, even inside a window that locks the page's scroll
    // (owner, 9 November 2026: « je ne peux pas scroller avec la roulette »).
    <Popover modal onOpenChange={toggle} open={open}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          aria-controls={open ? listId : undefined}
          aria-describedby={describedBy}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-invalid={invalid || undefined}
          aria-labelledby={`${labelId} ${valueId}`}
          // The first field of its window, as a plain Select.
          autoFocus={autoFocus}
          className={cn(
            'border-border-form bg-input text-foreground font-form rounded-control flex h-10 w-full min-w-0 items-center gap-2 border px-[11px] py-1.5 text-left text-[16px] leading-5 transition-[background-color,border-color,color,box-shadow] outline-none max-sm:h-11 lg:text-[13px]',
            'hover:enabled:not-focus-visible:not-data-[state=open]:not-aria-invalid:border-border-strong hover:enabled:not-focus-visible:not-data-[state=open]:bg-surface-control-hover',
            'focus-visible:not-aria-invalid:border-primary data-[state=open]:not-aria-invalid:border-primary focus-visible:bg-surface-control-focus data-[state=open]:bg-surface-control-focus ring-ring-form focus-visible:ring-2 data-[state=open]:ring-2',
            'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          disabled={disabled}
          id={id}
          onKeyDown={openFromKeyboard}
          role="combobox"
          type="button"
        >
          {selected?.icon}
          <span
            className={cn(
              'min-w-0 flex-1 truncate',
              !selected && 'text-muted-foreground',
            )}
            id={valueId}
          >
            {selected ? selected.label : placeholder}
            {selected?.note && (
              <span className="text-muted-foreground"> ({selected.note})</span>
            )}
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className="text-muted-foreground size-4 shrink-0 opacity-50"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="bg-surface-floating border-border-form rounded-control flex w-(--radix-popover-trigger-width) min-w-[12rem] flex-col overflow-hidden p-0"
        onOpenAutoFocus={(event) => {
          // The search when there is one, otherwise the list for the arrows.
          event.preventDefault();
          (inputRef.current ?? rootRef.current)?.focus();
        }}
      >
        <CommandPrimitive
          className="flex min-h-0 flex-col outline-none"
          label={searchLabel}
          loop
          onValueChange={setActive}
          ref={rootRef}
          shouldFilter={false}
          tabIndex={-1}
          value={active}
        >
          {searchable && (
            <div className="border-border-divider flex items-center gap-2 border-b px-3">
              <SearchIcon
                aria-hidden="true"
                className="text-muted-foreground size-4 shrink-0"
              />
              <CommandPrimitive.Input
                aria-label={searchLabel}
                className="placeholder:text-muted-foreground font-form h-10 w-full min-w-0 bg-transparent text-[16px] outline-none max-sm:h-11 lg:text-[13px]"
                onValueChange={setQuery}
                placeholder={`${searchLabel}…`}
                ref={inputRef}
                value={query}
                {...passwordManagerIgnoreAttributes}
              />
            </div>
          )}
          <CommandPrimitive.List
            className="max-h-72 overflow-x-hidden overflow-y-auto overscroll-contain p-1"
            id={listId}
          >
            <CommandPrimitive.Empty className="text-muted-foreground px-2 py-4 text-center text-xs">
              {emptyText}
            </CommandPrimitive.Empty>
            {shown.map((group, index) => (
              <CommandPrimitive.Group
                className="[&_[cmdk-group-heading]]:text-muted-foreground not-first:border-border-divider not-first:mt-1 not-first:border-t not-first:pt-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold"
                heading={group.label}
                key={group.label ?? index}
              >
                {group.options.map((option) => (
                  <CommandPrimitive.Item
                    className={cn(
                      'rounded-option relative flex min-h-[34px] w-full cursor-default items-center gap-2 py-1.5 pr-7 pl-2 text-[12px] leading-5 outline-hidden select-none max-sm:min-h-11',
                      // As a plain choice marks its value, the highlight above.
                      option.value === value
                        ? 'bg-surface-navigation-active text-foreground'
                        : 'data-[selected=true]:bg-surface-tile-hover',
                    )}
                    key={option.value}
                    onSelect={() => choose(option.value)}
                    value={option.value}
                  >
                    {option.icon}
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      {option.label}
                      {option.note && (
                        <span className="text-muted-foreground">
                          {' '}
                          ({option.note})
                        </span>
                      )}
                    </span>
                    {option.value === value && (
                      <>
                        <span className="sr-only">, choix actuel</span>
                        <CheckIcon
                          aria-hidden="true"
                          className="text-muted-foreground absolute right-2 size-4"
                        />
                      </>
                    )}
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            ))}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </PopoverContent>
    </Popover>
  );
};
