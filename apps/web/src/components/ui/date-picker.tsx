'use client';

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import React, {
  type FC,
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import {
  type ApproximateDate,
  type DatePrecision,
  formatApproximateDate,
  getLocalToday,
  normalizeApproximateDate,
  parseDateOnly,
} from '$utils/approximate-date.utils';
import { cn } from '$utils/css.utils';

import { Popover, PopoverContent, PopoverTrigger } from './popover';

/** The grid shown: days of a month, months of a year, or a page of years. */
type View = 'day' | 'month' | 'year';

const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const;

const MONTHS_SHORT = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
] as const;

/** Monday first, as in France. */
const WEEKDAYS = [
  ['lu', 'lundi'],
  ['ma', 'mardi'],
  ['me', 'mercredi'],
  ['je', 'jeudi'],
  ['ve', 'vendredi'],
  ['sa', 'samedi'],
  ['di', 'dimanche'],
] as const;

const PRECISION_LABELS = new Map<DatePrecision, string>([
  ['DAY', 'Jour'],
  ['MONTH', 'Mois'],
  ['YEAR', 'Année'],
]);

const viewOf = (precision: DatePrecision): View =>
  precision === 'DAY' ? 'day' : precision === 'MONTH' ? 'month' : 'year';

const YEARS_PER_PAGE = 12;

const pad = (value: number): string => String(value).padStart(2, '0');

type Parts = { day: number; month: number; year: number };

const partsOf = (date: Date): Parts => ({
  day: date.getUTCDate(),
  month: date.getUTCMonth() + 1,
  year: date.getUTCFullYear(),
});

/** A calendar day, never shifted by the time zone. */
const utc = (year: number, month: number, day: number): Date =>
  new Date(Date.UTC(year, month - 1, day));

const dayKey = ({ day, month, year }: Parts): string =>
  `${year}-${pad(month)}-${pad(day)}`;

const daysIn = (year: number, month: number): number =>
  utc(year, month + 1, 0).getUTCDate();

/** The same day in another month, kept inside that month (31 → 30). */
const withMonth = (parts: Parts, year: number, month: number): Parts => ({
  day: Math.min(parts.day, daysIn(year, month)),
  month,
  year,
});

const monthName = (month: number): string => MONTHS.at(month - 1) ?? '';

/** « lundi 9 novembre 2026 », the name of a day's button. */
const dayLabel = (parts: Parts): string => {
  const weekday = WEEKDAYS.at(
    (utc(parts.year, parts.month, parts.day).getUTCDay() + 6) % 7,
  );

  return `${weekday?.[1] ?? ''} ${parts.day === 1 ? '1er' : parts.day} ${monthName(parts.month)} ${parts.year}`;
};

const pageStart = (year: number, minYear: number): number =>
  year -
  ((((year - minYear) % YEARS_PER_PAGE) + YEARS_PER_PAGE) % YEARS_PER_PAGE);

type DatePickerProps = {
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  /** Offers « Effacer » for an optional date. */
  clearable?: boolean;
  disabled?: boolean;
  id?: string;
  /** Id of the visible label: the field is named by it, then by its value. */
  labelId?: string;
  maxYear: number;
  minYear: number;
  onChange: (value: ApproximateDate | null) => void;
  placeholder?: string;
  /** What the field accepts, in this order; one precision hides the choice. */
  precisions?: readonly DatePrecision[];
  value: ApproximateDate | null;
};

/**
 * The site's date field (owner, 9 November 2026: « un composant parfait pour
 * les dates, et non natif »). A field showing the date as known, which opens a
 * calendar in the site's colours: days, months or years, as precisely as the
 * date is known, never an invented day. Keyboard: arrows, Page up/down, Home,
 * End, Enter, Escape.
 */
export const DatePicker: FC<DatePickerProps> = ({
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  clearable = false,
  disabled = false,
  id,
  labelId,
  maxYear,
  minYear,
  onChange,
  placeholder = 'Choisir une date',
  precisions = ['DAY', 'MONTH', 'YEAR'],
  value,
}) => {
  const generatedId = useId();
  const valueId = `${id ?? generatedId}-value`;
  const [open, setOpen] = useState(false);
  const [precision, setPrecision] = useState<DatePrecision>(
    precisions[0] ?? 'DAY',
  );
  const [view, setView] = useState<View>('day');
  /** The focused day; month and year views read its month and year. */
  const [focus, setFocus] = useState<Parts>(() => partsOf(new Date()));
  const gridRef = useRef<HTMLDivElement>(null);
  const today = parseDateOnly(getLocalToday()) ?? partsOf(new Date());
  const selected = value ? parseDateOnly(value.date) : null;
  const clampYear = (year: number): number =>
    Math.min(maxYear, Math.max(minYear, year));

  const begin = (): void => {
    const nextPrecision =
      value && precisions.includes(value.precision)
        ? value.precision
        : (precisions[0] ?? 'DAY');
    const start = selected ?? today;
    const year = clampYear(start.year);
    setPrecision(nextPrecision);
    setView(viewOf(nextPrecision));
    setFocus(withMonth(start, year, start.month));
  };

  // The focused cell takes the focus whenever it or the grid changes.
  useEffect(() => {
    if (!open) return undefined;
    const frame = requestAnimationFrame(() => {
      gridRef.current
        ?.querySelector<HTMLButtonElement>('[data-focused="true"]')
        ?.focus();
    });

    return (): void => cancelAnimationFrame(frame);
  }, [focus, open, view]);

  const commit = (date: Parts, chosen: DatePrecision): void => {
    onChange(
      normalizeApproximateDate({ date: dayKey(date), precision: chosen }),
    );
    setOpen(false);
  };

  const moveTo = (next: Parts): void => {
    const year = clampYear(next.year);
    setFocus(year === next.year ? next : withMonth(next, year, next.month));
  };

  const shiftDays = (offset: number): void =>
    moveTo(partsOf(utc(focus.year, focus.month, focus.day + offset)));

  const shiftMonths = (offset: number): void => {
    const date = utc(focus.year, focus.month + offset, 1);
    moveTo(withMonth(focus, date.getUTCFullYear(), date.getUTCMonth() + 1));
  };

  const shiftYears = (offset: number): void =>
    moveTo(withMonth(focus, focus.year + offset, focus.month));

  const choosePrecision = (next: DatePrecision): void => {
    setPrecision(next);
    setView(viewOf(next));
  };

  const onGridKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const columns = view === 'day' ? 7 : 3;
    const step = (offset: number): void =>
      view === 'day'
        ? shiftDays(offset)
        : view === 'month'
          ? shiftMonths(offset)
          : shiftYears(offset);
    const page = (direction: 1 | -1): void =>
      view === 'day'
        ? shiftMonths(direction)
        : view === 'month'
          ? shiftYears(direction)
          : shiftYears(direction * YEARS_PER_PAGE);
    const weekday =
      (utc(focus.year, focus.month, focus.day).getUTCDay() + 6) % 7;
    const handlers = new Map<string, () => void>([
      ['ArrowDown', (): void => step(columns)],
      ['ArrowLeft', (): void => step(-1)],
      ['ArrowRight', (): void => step(1)],
      ['ArrowUp', (): void => step(-columns)],
      [
        'End',
        (): void => (view === 'day' ? shiftDays(6 - weekday) : undefined),
      ],
      ['Home', (): void => (view === 'day' ? shiftDays(-weekday) : undefined)],
      ['PageDown', (): void => page(1)],
      ['PageUp', (): void => page(-1)],
    ]);
    const handler = handlers.get(event.key);
    if (!handler) return;
    event.preventDefault();
    handler();
  };

  const firstYear = pageStart(focus.year, minYear);
  const caption =
    view === 'day'
      ? `${monthName(focus.month)} ${focus.year}`
      : view === 'month'
        ? String(focus.year)
        : `${firstYear} – ${firstYear + YEARS_PER_PAGE - 1}`;
  const canGoBack =
    view === 'year'
      ? firstYear > minYear
      : focus.year > minYear || (view === 'day' && focus.month > 1);
  const canGoForward =
    view === 'year'
      ? firstYear + YEARS_PER_PAGE <= maxYear
      : focus.year < maxYear || (view === 'day' && focus.month < 12);
  const goBack = (): void =>
    view === 'day'
      ? shiftMonths(-1)
      : shiftYears(view === 'month' ? -1 : -YEARS_PER_PAGE);
  const goForward = (): void =>
    view === 'day'
      ? shiftMonths(1)
      : shiftYears(view === 'month' ? 1 : YEARS_PER_PAGE);
  // The caption climbs one level: days → months → years.
  const climb =
    view === 'day'
      ? (): void => setView('month')
      : view === 'month'
        ? (): void => setView('year')
        : undefined;

  const cellClass = (state: {
    current: boolean;
    disabled: boolean;
    outside?: boolean;
    selected: boolean;
  }): string =>
    cn(
      'rounded-control w-full text-sm tabular-nums transition-colors outline-none',
      'focus-visible:ring-ring-form focus-visible:ring-2',
      state.selected
        ? 'bg-primary text-primary-foreground font-semibold'
        : 'hover:enabled:bg-surface-control-hover text-foreground',
      !state.selected && state.current && 'ring-primary/70 ring-1 ring-inset',
      !state.selected && state.outside && 'text-muted-foreground/60',
      state.disabled && 'cursor-not-allowed opacity-35',
    );

  const renderDays = (): React.ReactNode => {
    const first = utc(focus.year, focus.month, 1);
    const offset = (first.getUTCDay() + 6) % 7;
    const cells = Array.from({ length: 42 }, (_, index) =>
      partsOf(utc(focus.year, focus.month, 1 - offset + index)),
    );

    return (
      <table className="w-full table-fixed border-collapse" role="grid">
        <thead>
          <tr>
            {WEEKDAYS.map(([short, long]) => (
              <th
                abbr={long}
                className="text-muted-foreground pb-1 text-xs font-medium"
                key={short}
                scope="col"
              >
                {short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }, (_, week) => (
            <tr key={week}>
              {cells.slice(week * 7, week * 7 + 7).map((cell) => {
                const key = dayKey(cell);
                const isSelected =
                  precision === 'DAY' &&
                  value?.precision === 'DAY' &&
                  selected !== null &&
                  key === dayKey(selected);
                const isFocused = key === dayKey(focus);
                const isDisabled = cell.year < minYear || cell.year > maxYear;

                return (
                  <td
                    aria-selected={isSelected || undefined}
                    className="p-0.5"
                    key={key}
                    role="gridcell"
                  >
                    <button
                      aria-current={key === dayKey(today) ? 'date' : undefined}
                      aria-label={dayLabel(cell)}
                      className={cn(
                        'h-9 max-sm:h-11',
                        cellClass({
                          current: key === dayKey(today),
                          disabled: isDisabled,
                          outside: cell.month !== focus.month,
                          selected: isSelected,
                        }),
                      )}
                      data-focused={isFocused}
                      disabled={isDisabled}
                      onClick={() => commit(cell, 'DAY')}
                      tabIndex={isFocused ? 0 : -1}
                      type="button"
                    >
                      {cell.day}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderMonths = (): React.ReactNode => (
    <div className="grid grid-cols-3 gap-1" role="grid">
      {MONTHS_SHORT.map((short, index) => {
        const month = index + 1;
        const isSelected =
          selected !== null &&
          value?.precision === 'MONTH' &&
          precision === 'MONTH' &&
          selected.year === focus.year &&
          selected.month === month;
        const isCurrent = today.year === focus.year && today.month === month;
        const isFocused = focus.month === month;

        return (
          <div
            aria-selected={isSelected || undefined}
            key={short}
            role="gridcell"
          >
            <button
              aria-label={`${monthName(month)} ${focus.year}`}
              className={cn(
                'h-11 capitalize',
                cellClass({
                  current: isCurrent,
                  disabled: false,
                  selected: isSelected,
                }),
              )}
              data-focused={isFocused}
              onClick={() => {
                const chosen = withMonth(focus, focus.year, month);
                if (precision === 'MONTH') commit(chosen, 'MONTH');
                else {
                  // Navigating to a day: back to that month's days.
                  setFocus(chosen);
                  setView('day');
                }
              }}
              tabIndex={isFocused ? 0 : -1}
              type="button"
            >
              {short}
            </button>
          </div>
        );
      })}
    </div>
  );

  const renderYears = (): React.ReactNode => (
    <div className="grid grid-cols-3 gap-1" role="grid">
      {Array.from({ length: YEARS_PER_PAGE }, (_, index) => {
        const year = firstYear + index;
        const isSelected =
          selected !== null &&
          value?.precision === 'YEAR' &&
          precision === 'YEAR' &&
          selected.year === year;
        const isDisabled = year < minYear || year > maxYear;
        const isFocused = focus.year === year;

        return (
          <div
            aria-selected={isSelected || undefined}
            key={year}
            role="gridcell"
          >
            <button
              aria-label={String(year)}
              className={cn(
                'h-11',
                cellClass({
                  current: today.year === year,
                  disabled: isDisabled,
                  selected: isSelected,
                }),
              )}
              data-focused={isFocused}
              disabled={isDisabled}
              onClick={() => {
                const chosen = withMonth(focus, year, focus.month);
                if (precision === 'YEAR') commit(chosen, 'YEAR');
                else {
                  // Navigating: back to that year's months.
                  setFocus(chosen);
                  setView('month');
                }
              }}
              tabIndex={isFocused ? 0 : -1}
              type="button"
            >
              {year}
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <Popover
      onOpenChange={(next) => {
        if (next) begin();
        setOpen(next);
      }}
      open={open}
    >
      <PopoverTrigger asChild disabled={disabled}>
        <button
          aria-describedby={describedBy}
          aria-haspopup="dialog"
          aria-invalid={invalid || undefined}
          aria-labelledby={labelId ? `${labelId} ${valueId}` : undefined}
          className={cn(
            'border-border-form bg-input text-foreground font-form rounded-control flex h-10 w-full min-w-0 items-center gap-2 border px-[11px] py-1.5 text-left text-[16px] leading-5 transition-[background-color,border-color,color,box-shadow] outline-none max-sm:h-11 lg:text-[13px]',
            'hover:enabled:not-focus-visible:not-data-[state=open]:not-aria-invalid:border-border-strong hover:enabled:not-focus-visible:not-data-[state=open]:bg-surface-control-hover',
            'focus-visible:not-aria-invalid:border-primary data-[state=open]:not-aria-invalid:border-primary focus-visible:bg-surface-control-focus data-[state=open]:bg-surface-control-focus ring-ring-form focus-visible:ring-2 data-[state=open]:ring-2',
            'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          disabled={disabled}
          id={id}
          type="button"
        >
          <CalendarDays
            aria-hidden="true"
            className="text-muted-foreground size-4 shrink-0"
          />
          <span
            className={cn(
              'min-w-0 flex-1 truncate',
              !value && 'text-muted-foreground',
            )}
            id={valueId}
          >
            {value ? formatApproximateDate(value) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        aria-label="Choisir une date"
        className="bg-surface-floating border-border-form w-[19rem] p-3"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {precisions.length > 1 && (
          <div
            aria-label="Précision de la date"
            className="bg-surface-inset border-border-default rounded-control mb-3 grid grid-cols-3 gap-1 border p-1"
            role="group"
          >
            {precisions.map((option) => (
              <button
                aria-pressed={precision === option}
                className={cn(
                  'rounded-compact h-8 text-xs font-semibold transition-colors outline-none max-sm:h-11',
                  'focus-visible:ring-ring-form focus-visible:ring-2',
                  precision === option
                    ? 'bg-primary/15 text-primary-emphasis border-primary/50 border'
                    : 'text-muted-foreground hover:text-foreground border border-transparent',
                )}
                key={option}
                onClick={() => choosePrecision(option)}
                type="button"
              >
                {PRECISION_LABELS.get(option)}
              </button>
            ))}
          </div>
        )}
        <div className="mb-2 flex items-center justify-between gap-1">
          <button
            aria-label={
              view === 'day'
                ? 'Mois précédent'
                : view === 'month'
                  ? 'Année précédente'
                  : 'Années précédentes'
            }
            className="text-muted-foreground hover:enabled:bg-surface-control-hover hover:enabled:text-foreground focus-visible:ring-ring-form rounded-control flex size-9 items-center justify-center outline-none focus-visible:ring-2 disabled:opacity-35 max-sm:size-11"
            disabled={!canGoBack}
            onClick={goBack}
            type="button"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>
          <button
            aria-label={
              climb
                ? `${caption}, choisir ${view === 'day' ? 'le mois' : 'l’année'}`
                : caption
            }
            aria-live="polite"
            className="hover:enabled:bg-surface-control-hover focus-visible:ring-ring-form rounded-control min-w-0 flex-1 truncate px-2 py-1.5 text-sm font-semibold capitalize outline-none focus-visible:ring-2 disabled:cursor-default max-sm:min-h-11"
            disabled={!climb}
            onClick={climb}
            type="button"
          >
            {caption}
          </button>
          <button
            aria-label={
              view === 'day'
                ? 'Mois suivant'
                : view === 'month'
                  ? 'Année suivante'
                  : 'Années suivantes'
            }
            className="text-muted-foreground hover:enabled:bg-surface-control-hover hover:enabled:text-foreground focus-visible:ring-ring-form rounded-control flex size-9 items-center justify-center outline-none focus-visible:ring-2 disabled:opacity-35 max-sm:size-11"
            disabled={!canGoForward}
            onClick={goForward}
            type="button"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </div>
        <div onKeyDown={onGridKeyDown} ref={gridRef}>
          {view === 'day'
            ? renderDays()
            : view === 'month'
              ? renderMonths()
              : renderYears()}
        </div>
        <div className="border-border-divider mt-3 flex items-center justify-between gap-2 border-t pt-3">
          {clearable && value ? (
            <button
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring-form rounded-control px-2 py-1 text-xs font-semibold outline-none focus-visible:ring-2 max-sm:min-h-11"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              type="button"
            >
              Effacer
            </button>
          ) : (
            <span />
          )}
          <button
            className="text-primary-emphasis hover:bg-primary/10 focus-visible:ring-ring-form rounded-control px-2 py-1 text-xs font-semibold outline-none focus-visible:ring-2 disabled:opacity-35 max-sm:min-h-11"
            disabled={today.year < minYear || today.year > maxYear}
            onClick={() => commit(today, precision)}
            type="button"
          >
            {precision === 'DAY'
              ? 'Aujourd’hui'
              : precision === 'MONTH'
                ? 'Ce mois-ci'
                : 'Cette année'}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
