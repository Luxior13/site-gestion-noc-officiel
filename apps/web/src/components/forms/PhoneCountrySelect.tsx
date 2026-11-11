'use client';

import React, { type FC } from 'react';

import { CountryFlag } from '$ui/country-flag';
import { SearchSelect, type SearchSelectGroup } from '$ui/search-select';
import { PHONE_COUNTRY_OPTIONS } from '$utils/phone-country-options';

/** Every country with its calling code and its flag, read once. */
const PHONE_COUNTRY_GROUPS: readonly SearchSelectGroup[] = [
  {
    options: PHONE_COUNTRY_OPTIONS.map(([code, label]) => ({
      icon: <CountryFlag code={code} />,
      label,
      value: code,
    })),
  },
];

/**
 * The country of a phone number, among some 240 (owner, 11 November 2026:
 * « des barres de recherche dans les menus qui auront beaucoup de choix »):
 * the site's menu with its search, each country with its flag. Used by a
 * record's phones and emergency contacts, and an organisation's contacts.
 */
export const PhoneCountrySelect: FC<{
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  disabled?: boolean;
  id: string;
  /** The field's label, which names the button. */
  labelId: string;
  onChange: (countryCode: string) => void;
  value: string;
}> = ({ disabled, id, labelId, onChange, value, ...aria }) => (
  <SearchSelect
    {...aria}
    disabled={disabled}
    emptyText="Aucun pays trouvé"
    groups={PHONE_COUNTRY_GROUPS}
    id={id}
    labelId={labelId}
    onValueChange={onChange}
    placeholder="Choisir un pays"
    searchLabel="Rechercher un pays"
    value={value}
  />
);
