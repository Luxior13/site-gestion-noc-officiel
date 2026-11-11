import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('$env', () => ({ env: { NODE_ENV: 'test' } }));
vi.mock('$server/prisma', () => ({ prisma: {} }));

import { PERMISSIONS } from '$constants/permissions.constants';
import {
  getReaderRights,
  type JournalRow,
  projectJournalEvent,
} from '$features/audit/server/audit-journal.projection';
import { getOrganizationCapabilities } from '$features/organizations/organization.permissions';
import {
  kindsLabel,
  websiteLabel,
} from '$features/organizations/organization.ui';
import {
  createContactSchema,
  createOrganizationSchema,
  updateContactSchema,
  updateOrganizationSchema,
} from '$features/organizations/schemas/organization.schemas';

const reader = (
  permissions: Record<string, boolean>,
): ReturnType<typeof getReaderRights> =>
  getReaderRights({
    id: 'reader',
    isProtected: false,
    permissions,
    role: 'USER',
  });

describe('organisations (11 November 2026)', () => {
  it('keeps each kind once, in the order of the list, and at least one', () => {
    expect(
      createOrganizationSchema.parse({
        kinds: ['SUPPLIER', 'SPONSOR', 'SUPPLIER'],
        name: '  LDLC  ',
      }),
    ).toEqual({ kinds: ['SPONSOR', 'SUPPLIER'], name: 'LDLC' });
    expect(
      createOrganizationSchema.safeParse({ kinds: [], name: 'LDLC' }).success,
    ).toBe(false);
    expect(
      createOrganizationSchema.safeParse({ kinds: ['BANK'], name: 'LDLC' })
        .success,
    ).toBe(false);
    expect(kindsLabel(['SPONSOR', 'SUPPLIER'])).toBe('Sponsor, Fournisseur');
  });

  it('reads a site as it is said, and a SIRET with its spaces', () => {
    const base = {
      address: '  2 rue des Érables\n69000 Lyon  ',
      expectedVersion: 1,
      kinds: ['FUNDER'],
      name: 'Mairie de Lyon',
    };
    const parsed = updateOrganizationSchema.parse({
      ...base,
      siretNumber: '216 901 231 00011',
      website: 'lyon.fr',
    });
    expect(parsed.website).toBe('https://lyon.fr');
    expect(parsed.siretNumber).toBe('21690123100011');
    expect(parsed.address).toBe('2 rue des Érables\n69000 Lyon');
    expect(
      updateOrganizationSchema.parse({
        ...base,
        siretNumber: '',
        website: 'https://www.ldlc.com/',
      }),
    ).toMatchObject({ siretNumber: null, website: 'https://www.ldlc.com' });
    for (const website of ['ldlc', 'ftp://ldlc.com', 'ld lc.com'])
      expect(
        updateOrganizationSchema.safeParse({
          ...base,
          siretNumber: null,
          website,
        }).success,
      ).toBe(false);
    expect(
      updateOrganizationSchema.safeParse({
        ...base,
        siretNumber: '1234',
        website: null,
      }).success,
    ).toBe(false);
    expect(websiteLabel('https://www.ldlc.com/')).toBe('ldlc.com');
    expect(websiteLabel('https://lyon.fr/sport')).toBe('lyon.fr/sport');
  });

  it('stores a contact’s number in its international form, read with its country', () => {
    expect(
      createContactSchema.parse({
        email: '  Lea.Martin@LDLC.com ',
        name: 'Léa Martin',
        phone: '06 12 34 56 78',
        phoneCountry: 'fr',
        role: '',
      }),
    ).toEqual({
      email: 'lea.martin@ldlc.com',
      name: 'Léa Martin',
      phone: '+33612345678',
      phoneCountry: 'FR',
      role: null,
    });
    expect(
      createContactSchema.parse({
        email: null,
        name: 'Marc',
        phone: '+32 470 12 34 56',
        phoneCountry: 'FR',
        role: null,
      }).phone,
    ).toBe('+32470123456');
    const wrong = createContactSchema.safeParse({
      email: 'pas-un-email',
      name: 'Marc',
      phone: '12',
      phoneCountry: 'FR',
      role: null,
    });
    expect(wrong.success).toBe(false);
    expect(
      wrong.error?.issues.map((issue) => issue.path.join('.')).sort(),
    ).toEqual(['email']);
    expect(
      createContactSchema.safeParse({
        email: null,
        name: 'Marc',
        phone: '12',
        phoneCountry: 'FR',
        role: null,
      }).error?.issues[0]?.path,
    ).toEqual(['phone']);
    // Left out, the link to a record stays as it is.
    expect(
      updateContactSchema.parse({
        email: null,
        expectedVersion: 2,
        name: null,
        phone: null,
        phoneCountry: 'FR',
        role: 'Trésorière',
      }),
    ).not.toHaveProperty('personId');
  });

  it('opens a record of the Répertoire to who manages and reads it', () => {
    const user = (
      permissions: Record<string, boolean>,
    ): Parameters<typeof getOrganizationCapabilities>[0] => ({
      isProtected: false,
      permissions,
      role: 'USER',
    });
    expect(
      getOrganizationCapabilities(
        user({
          [PERMISSIONS.ORGANIZATIONS.MANAGE]: true,
          [PERMISSIONS.ORGANIZATIONS.VIEW]: true,
        }),
      ),
    ).toEqual({
      canLinkPersons: false,
      canManage: true,
      canView: true,
      canViewPersons: false,
    });
    expect(
      getOrganizationCapabilities(
        user({
          [PERMISSIONS.ORGANIZATIONS.MANAGE]: true,
          [PERMISSIONS.ORGANIZATIONS.VIEW]: true,
          [PERMISSIONS.PERSONS.VIEW]: true,
        }),
      ).canLinkPersons,
    ).toBe(true);
    // Managing without reading grants nothing.
    expect(
      getOrganizationCapabilities(
        user({ [PERMISSIONS.ORGANIZATIONS.MANAGE]: true }),
      ),
    ).toMatchObject({ canManage: false, canView: false });
  });

  it('keeps an organisation’s contacts in the journal to who may read the organisations', () => {
    const row = {
      action: 'ORGANIZATION_CONTACT_UPDATE',
      actorDisplayNameSnapshot: 'Camille Exemple',
      actorLoginNameSnapshot: 'camille.exemple',
      actorRoleSnapshot: 'USER',
      category: 'ORGANIZATION',
      createdAt: new Date('2026-11-11T12:00:00Z'),
      description: 'Contact modifié : Léa Martin (LDLC)',
      entityId: null,
      entityType: null,
      eventKind: 'ACTIVITY',
      eventVersion: 1,
      fieldChanges: [],
      id: 'event-contact',
      ipAddress: null,
      metadata: {
        after: { email: 'lea@ldlc.com' },
        before: { email: null },
        changes: ['email'],
        contactName: 'Léa Martin',
        organizationName: 'LDLC',
      },
      outcome: 'SUCCESS',
      pageKey: 'organizations',
      poleKey: 'legal',
      requestId: null,
      targetUserId: null,
      userAgent: null,
      userId: 'secretary',
    } as unknown as JournalRow;
    const allowed = projectJournalEvent(
      row,
      reader({ [PERMISSIONS.ORGANIZATIONS.VIEW]: true }),
      new Map(),
    );
    expect(allowed.subject).toBe('Contact : Léa Martin (LDLC)');
    expect(allowed.typeLabel).toBe('Organisations');
    expect(allowed.changes).toEqual([
      { after: 'lea@ldlc.com', before: '—', label: 'Email' },
    ]);
    const masked = projectJournalEvent(row, reader({}), new Map());
    expect(masked.subject).toBe('Contact d’une organisation');
    expect(masked.changes).toEqual([
      { after: 'Valeur masquée', before: 'Valeur masquée', label: 'Email' },
    ]);
    const organization = projectJournalEvent(
      {
        ...row,
        action: 'ORGANIZATION_UPDATE',
        metadata: {
          after: { kinds: 'Sponsor, Fournisseur' },
          before: { kinds: 'Fournisseur' },
          changes: ['kinds'],
          organizationName: 'LDLC',
        },
      } as unknown as JournalRow,
      reader({ [PERMISSIONS.ORGANIZATIONS.VIEW]: true }),
      new Map(),
    );
    expect(organization.subject).toBe('Organisation : LDLC');
    expect(organization.changes).toEqual([
      { after: 'Sponsor, Fournisseur', before: 'Fournisseur', label: 'Types' },
    ]);
  });
});
