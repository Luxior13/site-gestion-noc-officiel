import { describe, expect, it } from 'vitest';

import {
  COUNTRY_OPTIONS,
  countryName,
  isKnownCountry,
} from '$constants/countries.constants';
import { updatePersonSchema } from '$features/persons/schemas/person-identity.schemas';
import {
  createEmergencyContactSchema,
  createLegalGuardianSchema,
  updateLegalGuardianSchema,
} from '$features/persons/schemas/person-relatives.schemas';

/*
 * The person record completed on 10 November 2026: a nationality, emergency
 * contacts and legal representatives (owner: « fais la 2B d'abord et la
 * nationalité »).
 */

const identity = {
  birthDate: null,
  firstName: 'Ada',
  lastName: 'Lovelace',
  nickname: null,
  version: 1,
};

describe('nationality', () => {
  it('keeps a known country code, in capitals', () => {
    const parsed = updatePersonSchema.parse({ ...identity, nationality: 'be' });
    expect(parsed.nationality).toBe('BE');
    expect(
      updatePersonSchema.parse({ ...identity, nationality: '' }).nationality,
    ).toBeNull();
    expect(updatePersonSchema.parse(identity).nationality).toBeNull();
  });

  it('refuses a code outside the list', () => {
    const parsed = updatePersonSchema.safeParse({
      ...identity,
      nationality: 'ZZ',
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe('Nationalité inconnue');
    // Uninhabited territories are no nationality.
    expect(isKnownCountry('AQ')).toBe(false);
    expect(isKnownCountry('XK')).toBe(true);
  });

  it('lists France first, then the countries by their French name', () => {
    expect(COUNTRY_OPTIONS[0]).toEqual({ label: 'France', value: 'FR' });
    const rest = COUNTRY_OPTIONS.slice(1).map((option) => option.label);
    expect(rest).toEqual(
      [...rest].sort((left, right) => left.localeCompare(right, 'fr')),
    );
    expect(countryName('DE')).toBe('Allemagne');
    expect(countryName('ZZ')).toBe('ZZ');
  });
});

describe('emergency contact', () => {
  it('normalizes the number of its country', () => {
    const parsed = createEmergencyContactSchema.parse({
      countryCode: 'fr',
      name: '  Camille Exemple ',
      personVersion: 3,
      phone: '06 12 34 56 78',
      relation: '  ',
    });
    expect(parsed).toMatchObject({
      countryCode: 'FR',
      name: 'Camille Exemple',
      normalizedPhone: '+33612345678',
      relation: null,
    });
  });

  it('asks for a name and a valid number, and nothing else', () => {
    const blank = createEmergencyContactSchema.safeParse({
      name: ' ',
      personVersion: 3,
      phone: '12',
    });
    expect(blank.success).toBe(false);
    expect(blank.error?.issues.map((issue) => issue.path.join('.'))).toEqual([
      'name',
    ]);
    const invalid = createEmergencyContactSchema.safeParse({
      name: 'Camille',
      personVersion: 3,
      phone: '12',
    });
    expect(invalid.error?.issues[0]).toMatchObject({
      message: 'Numéro de téléphone invalide',
      path: ['phone'],
    });
    expect(
      createEmergencyContactSchema.safeParse({
        email: 'camille@example.test',
        name: 'Camille',
        personVersion: 3,
        phone: '0612345678',
      }).success,
    ).toBe(false);
  });
});

describe('legal representative', () => {
  it('links a record with a relation of the list', () => {
    expect(
      createLegalGuardianSchema.parse({
        guardianId: 'cm0000000000000000000001',
        personVersion: 2,
        relation: 'TUTOR',
      }).relation,
    ).toBe('TUTOR');
    const unknown = createLegalGuardianSchema.safeParse({
      guardianId: 'cm0000000000000000000001',
      personVersion: 2,
      relation: 'COUSIN',
    });
    expect(unknown.error?.issues[0]?.message).toBe(
      'Choisissez le lien avec la personne',
    );
  });

  it('never moves a link to another record', () => {
    expect(
      updateLegalGuardianSchema.safeParse({
        guardianId: 'cm0000000000000000000001',
        personVersion: 2,
        relation: 'PARENT',
        version: 1,
      }).success,
    ).toBe(false);
  });
});
