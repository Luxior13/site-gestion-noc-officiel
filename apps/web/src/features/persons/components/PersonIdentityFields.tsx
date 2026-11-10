import React, { type FC } from 'react';

import { COUNTRY_OPTIONS } from '$constants/countries.constants';
import { CountryFlag } from '$ui/country-flag';
import { DatePicker } from '$ui/date-picker';
import { Input } from '$ui/input';
import { Label } from '$ui/label';
import { SearchSelect } from '$ui/search-select';
import { cn } from '$utils/css.utils';

export type PersonIdentityFormValue = {
  birthDate: string;
  firstName: string;
  lastName: string;
  /** A country code, empty when not given (10 November 2026). */
  nationality: string;
  nickname: string;
};

/**
 * « Non renseignée » first, to clear it; then France and every country, each
 * with its flag (owner, 10 November 2026).
 */
const NATIONALITY_GROUPS = [
  { options: [{ label: 'Non renseignée', value: '' }] },
  {
    options: COUNTRY_OPTIONS.map((option) => ({
      ...option,
      icon: <CountryFlag code={option.value} />,
    })),
  },
];

type PersonIdentityFieldsProps = {
  disabled?: boolean;
  errors: Record<string, string>;
  idPrefix: string;
  /**
   * Record view (27 October 2026): `names` (pseudo, first and last name) and
   * `situation` (the birth date and, since 10 November 2026, the
   * nationality) go in their own rubric cards.
   */
  onChange: <TKey extends keyof PersonIdentityFormValue>(
    key: TKey,
    value: PersonIdentityFormValue[TKey],
  ) => void;
  part?: 'all' | 'names' | 'situation';
  value: PersonIdentityFormValue;
  variant?: 'default' | 'quiet';
};

const FieldLabel: FC<{
  htmlFor: string;
  id?: string;
  label: string;
}> = ({ htmlFor, id, label }) => (
  <div className="flex min-h-6 items-center gap-1.5">
    <Label htmlFor={htmlFor} id={id}>
      {label}
    </Label>
  </div>
);

/** Earliest year a birth date's calendar offers. */
const BIRTH_FIRST_YEAR = 1900;

const FieldError: FC<{ id: string; message?: string }> = ({ id, message }) =>
  message ? (
    <p className="text-destructive text-xs" id={id} role="alert">
      {message}
    </p>
  ) : null;

export const PersonIdentityFields: FC<PersonIdentityFieldsProps> = ({
  disabled = false,
  errors,
  idPrefix,
  onChange,
  part = 'all',
  value,
  variant = 'default',
}) => {
  const quiet = variant === 'quiet';
  const field = (
    key: keyof PersonIdentityFormValue,
  ): {
    describedBy: string | undefined;
    error: string | undefined;
    id: string;
  } => {
    const id = `${idPrefix}-${key}`;
    const error = Object.entries(errors).find(
      ([entryKey]) => entryKey === key,
    )?.[1];

    return { describedBy: error ? `${id}-error` : undefined, error, id };
  };
  const nickname = field('nickname');
  const firstName = field('firstName');
  const lastName = field('lastName');
  const birthDate = field('birthDate');
  const nationality = field('nationality');
  const showNames = part !== 'situation';
  const showSituation = part !== 'names';

  return (
    <div
      className={cn(
        'grid min-w-0 gap-4 sm:grid-cols-2',
        part === 'names' && 'lg:grid-cols-3',
      )}
    >
      {showNames && (
        <>
          <div
            className={cn(
              'min-w-0 space-y-1.5 sm:col-span-2',
              part === 'names' && 'lg:col-span-1',
            )}
          >
            <FieldLabel htmlFor={nickname.id} label="Pseudo principal" />
            <Input
              aria-describedby={
                nickname.describedBy ??
                (!quiet ? `${nickname.id}-hint` : undefined)
              }
              aria-invalid={Boolean(nickname.error)}
              disabled={disabled}
              id={nickname.id}
              maxLength={80}
              onChange={(event) => onChange('nickname', event.target.value)}
              placeholder="Pseudo principal ou habituel"
              value={value.nickname}
            />
            <FieldError id={`${nickname.id}-error`} message={nickname.error} />
            {!quiet && !nickname.error && (
              <p
                className="text-muted-foreground text-xs"
                id={`${nickname.id}-hint`}
              >
                Renseignez un pseudo, ou le prénom et le nom ci-dessous.
              </p>
            )}
          </div>
          <div className="min-w-0 space-y-1.5">
            <FieldLabel htmlFor={firstName.id} label="Prénom" />
            <Input
              aria-describedby={firstName.describedBy}
              aria-invalid={Boolean(firstName.error)}
              disabled={disabled}
              id={firstName.id}
              maxLength={100}
              onChange={(event) => onChange('firstName', event.target.value)}
              placeholder={quiet ? 'Non renseigné' : undefined}
              value={value.firstName}
            />
            <FieldError
              id={`${firstName.id}-error`}
              message={firstName.error}
            />
          </div>
          <div className="min-w-0 space-y-1.5">
            <FieldLabel htmlFor={lastName.id} label="Nom" />
            <Input
              aria-describedby={lastName.describedBy}
              aria-invalid={Boolean(lastName.error)}
              disabled={disabled}
              id={lastName.id}
              maxLength={100}
              onChange={(event) => onChange('lastName', event.target.value)}
              placeholder={quiet ? 'Non renseigné' : undefined}
              value={value.lastName}
            />
            <FieldError id={`${lastName.id}-error`} message={lastName.error} />
          </div>
        </>
      )}
      {showSituation && (
        <div className="min-w-0 space-y-1.5">
          <FieldLabel
            htmlFor={birthDate.id}
            id={`${birthDate.id}-label`}
            label="Date de naissance"
          />
          {/* The site's calendar, to the day only (9 November 2026). */}
          <DatePicker
            aria-describedby={
              birthDate.describedBy ??
              (!quiet ? `${birthDate.id}-hint` : undefined)
            }
            aria-invalid={Boolean(birthDate.error)}
            clearable
            disabled={disabled}
            id={birthDate.id}
            labelId={`${birthDate.id}-label`}
            maxYear={new Date().getFullYear()}
            minYear={BIRTH_FIRST_YEAR}
            onChange={(next) => onChange('birthDate', next?.date ?? '')}
            placeholder="Non renseignée"
            precisions={['DAY']}
            value={
              value.birthDate
                ? { date: value.birthDate, precision: 'DAY' }
                : null
            }
          />
          <FieldError id={`${birthDate.id}-error`} message={birthDate.error} />
          {!quiet && !birthDate.error && (
            <p
              className="text-muted-foreground text-xs"
              id={`${birthDate.id}-hint`}
            >
              Facultative, utile pour l’âge légal et les anniversaires.
            </p>
          )}
        </div>
      )}
      {showSituation && (
        <div className="min-w-0 space-y-1.5">
          <FieldLabel
            htmlFor={nationality.id}
            id={`${nationality.id}-label`}
            label="Nationalité"
          />
          {/* A long fixed list: the site's menu, with its search. */}
          <SearchSelect
            aria-describedby={nationality.describedBy}
            aria-invalid={Boolean(nationality.error)}
            disabled={disabled}
            emptyText="Aucun pays trouvé"
            groups={NATIONALITY_GROUPS}
            id={nationality.id}
            labelId={`${nationality.id}-label`}
            onValueChange={(next) => onChange('nationality', next)}
            placeholder="Non renseignée"
            searchLabel="Rechercher un pays"
            value={value.nationality}
          />
          <FieldError
            id={`${nationality.id}-error`}
            message={nationality.error}
          />
        </div>
      )}
    </div>
  );
};
