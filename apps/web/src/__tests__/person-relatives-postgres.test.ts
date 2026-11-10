import { createHash, randomUUID } from 'node:crypto';

import { type Prisma, PrismaClient, type User } from '@prisma/client';
import { NextRequest } from 'next/server';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  DELETE as deleteNickname,
  PATCH as updateNickname,
} from '$app/api/personnes/[id]/autres-pseudos/[nicknameId]/route';
import { POST as addNickname } from '$app/api/personnes/[id]/autres-pseudos/route';
import {
  DELETE as deleteContact,
  PATCH as updateContact,
} from '$app/api/personnes/[id]/contacts-urgence/[contactId]/route';
import { POST as addContact } from '$app/api/personnes/[id]/contacts-urgence/route';
import {
  DELETE as removeGuardian,
  PATCH as updateGuardian,
} from '$app/api/personnes/[id]/representants-legaux/[linkId]/route';
import { POST as addGuardian } from '$app/api/personnes/[id]/representants-legaux/route';
import { POST as addSocial } from '$app/api/personnes/[id]/reseaux-sociaux/route';
import { DELETE, GET, PATCH } from '$app/api/personnes/[id]/route';
import { GET as listPeople, POST as create } from '$app/api/personnes/route';
import { GET as suggestions } from '$app/api/personnes/suggestions/route';
import { PERMISSIONS } from '$constants/permissions.constants';
import type { PersonDetail } from '$features/persons/types/person.types';
import { encryptTotpSecret, generateTotpSecret } from '$server/mfa';

const connection = vi.hoisted(() => ({
  client: null as PrismaClient | null,
  cookies: new Map<string, string>(),
}));
vi.mock('server-only', () => ({}));
vi.mock('$env', () => ({
  env: { AUDIT_ENCRYPTION_CURRENT_VERSION: 1, NODE_ENV: 'test' },
}));
vi.stubEnv('MFA_ENCRYPTION_KEY_V1', Buffer.alloc(32, 13).toString('base64'));
vi.mock('$server/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn() },
}));
vi.mock('$server/prisma', () => ({
  prisma: new Proxy(
    {},
    {
      get: (_target, key): unknown => {
        if (!connection.client)
          throw new Error('Isolated person relatives database not initialized');
        const value: unknown = Reflect.get(connection.client, key);

        return typeof value === 'function'
          ? value.bind(connection.client)
          : value;
      },
    },
  ),
}));
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    delete: (name: string): void => {
      connection.cookies.delete(name);
    },
    get: (name: string): { value: string } | undefined => {
      const value = connection.cookies.get(name);

      return value === undefined ? undefined : { value };
    },
    set: (name: string, value: string): void => {
      connection.cookies.set(name, value);
    },
  })),
  headers: vi.fn(async () => new Headers()),
}));

const target = process.env.PERSON_RELATIVES_TEST_DATABASE_URL;

type Body = {
  data?: { person: PersonDetail };
  error?: { code: string; details?: Record<string, string[]>; message: string };
};

const request = (
  body?: unknown,
  method = 'PATCH',
  url = 'http://localhost/api/personnes/',
  operation?: string,
): NextRequest =>
  new NextRequest(url, {
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    headers: operation ? { 'Idempotency-Key': operation } : {},
    method,
  });
const params = <T extends Record<string, string>>(
  value: T,
): { params: Promise<T> } => ({ params: Promise.resolve(value) });

const answer = async (
  response: Response,
): Promise<Body & { status: number }> => ({
  ...((await response.json()) as Body),
  status: response.status,
});

/** The person record completed on 10 November 2026. */
describe.skipIf(!target)(
  'person relatives on fully migrated PostgreSQL',
  () => {
    let db: PrismaClient;

    const signIn = async (
      permissions: Record<string, boolean> | null = null,
      overrides: Partial<Prisma.UserCreateInput> = {},
    ): Promise<User> => {
      const user = await db.user.create({
        data: {
          firstName: 'Fiche fictive',
          loginName:
            'relatives.' + randomUUID().replaceAll('-', '').slice(0, 18),
          mfaEnabledAt: new Date(),
          passwordHash: 'unused-password-fixture',
          permissions: permissions ?? {
            [PERMISSIONS.PERSONS.CREATE]: true,
            [PERMISSIONS.PERSONS.DELETE]: true,
            [PERMISSIONS.PERSONS.UPDATE]: true,
            [PERMISSIONS.PERSONS.UPDATE_CONTACT]: true,
            [PERMISSIONS.PERSONS.VIEW]: true,
            [PERMISSIONS.PERSONS.VIEW_CONTACT]: true,
          },
          ...overrides,
        },
      });
      await db.totpCredential.create({
        data: {
          ...encryptTotpSecret(generateTotpSecret(), user.id),
          userId: user.id,
        },
      });
      const token = randomUUID();
      await db.session.create({
        data: {
          expiresAt: new Date(Date.now() + 3600_000),
          idleExpiresAt: new Date(Date.now() + 1800_000),
          mfaMethod: 'TOTP',
          mfaVerifiedAt: new Date(),
          passwordReauthenticatedAt: new Date(),
          securityVersion: user.securityVersion,
          token: createHash('sha256').update(token).digest('hex'),
          userId: user.id,
        },
      });
      connection.cookies.set('session', token);

      return user;
    };

    const record = async (
      extra: Record<string, unknown> = {},
    ): Promise<PersonDetail> => {
      const created = await answer(
        await create(
          request({ nickname: 'Fiche ' + randomUUID(), ...extra }, 'POST'),
        ),
      );
      expect(created.status).toBe(201);

      return created.data?.person as PersonDetail;
    };
    const read = async (id: string): Promise<PersonDetail> => {
      const response = await answer(
        await GET(request(undefined, 'GET'), params({ id })),
      );
      expect(response.status).toBe(200);

      return response.data as unknown as PersonDetail;
    };
    const changesOf = (
      personId: string,
      sectionKey: string,
    ): Promise<{ changeType: string; fieldKey: string; valueMode: string }[]> =>
      db.auditFieldChange.findMany({
        orderBy: [{ createdAt: 'asc' }, { fieldKey: 'asc' }],
        select: { changeType: true, fieldKey: true, valueMode: true },
        where: { entityId: personId, entityType: 'PERSON', sectionKey },
      });
    /** Born `years` years ago today, as a civil date. */
    const bornYearsAgo = (years: number): string => {
      const date = new Date();
      date.setUTCFullYear(date.getUTCFullYear() - years);

      return date.toISOString().slice(0, 10);
    };

    beforeAll(async () => {
      if (!target)
        throw new Error('Missing isolated person relatives database');
      const url = new URL(target);
      if (
        !['127.0.0.1', 'localhost'].includes(url.hostname) ||
        url.pathname !== '/person_relatives_service_test'
      ) {
        throw new Error('Only local person_relatives_service_test is allowed');
      }
      db = new PrismaClient({ datasourceUrl: target });
      connection.client = db;
      vi.stubEnv('AUDIT_ENCRYPTION_CURRENT_VERSION', '1');
      vi.stubEnv(
        'AUDIT_ENCRYPTION_KEY_V1',
        Buffer.alloc(32, 17).toString('base64'),
      );
    });
    beforeEach(() => {
      connection.client = db;
      connection.cookies.clear();
    });
    afterAll(async () => {
      await db?.$disconnect();
      connection.client = null;
      vi.unstubAllEnvs();
    });

    it('keeps a nationality with the identity, traced and checked', async () => {
      await signIn();
      const person = await record({ nationality: 'fr' });
      expect(person.nationality).toBe('FR');
      const changed = await answer(
        await PATCH(
          request({
            birthDate: null,
            firstName: null,
            lastName: null,
            nationality: 'BE',
            nickname: person.nickname,
            version: person.version,
          }),
          params({ id: person.id }),
        ),
      );
      expect(changed.status).toBe(200);
      expect(changed.data?.person.nationality).toBe('BE');
      expect(await changesOf(person.id, 'identity')).toEqual(
        expect.arrayContaining([
          {
            changeType: 'CREATE',
            fieldKey: 'nationality',
            valueMode: 'ENCRYPTED',
          },
          {
            changeType: 'UPDATE',
            fieldKey: 'nationality',
            valueMode: 'ENCRYPTED',
          },
        ]),
      );
      const unknown = await answer(
        await PATCH(
          request({
            nationality: 'ZZ',
            nickname: person.nickname,
            version: changed.data?.person.version,
          }),
          params({ id: person.id }),
        ),
      );
      expect(unknown.status).toBe(400);
      await expect(
        db.$executeRaw`UPDATE "Person" SET "nationality" = 'fr' WHERE "id" = ${person.id}`,
      ).rejects.toThrow(/Person_nationality_check/);
    });

    it('adds, corrects and removes an emergency contact with the coordinates’ right', async () => {
      await signIn();
      const person = await record();
      const added = await answer(
        await addContact(
          request(
            {
              name: 'Camille Exemple',
              personVersion: person.version,
              phone: '06 12 34 56 78',
              relation: 'Mère',
            },
            'POST',
          ),
          params({ id: person.id }),
        ),
      );
      expect(added.status).toBe(201);
      const contact = added.data?.person.emergencyContacts[0];
      expect(contact).toMatchObject({
        countryCode: 'FR',
        name: 'Camille Exemple',
        phone: '06 12 34 56 78',
        relation: 'Mère',
      });
      // The record read before the addition is now stale.
      const stale = await answer(
        await addContact(
          request(
            { name: 'Lou', personVersion: person.version, phone: '0612345679' },
            'POST',
          ),
          params({ id: person.id }),
        ),
      );
      expect(stale.status).toBe(409);
      // A new country alone is a new number.
      const moved = await answer(
        await updateContact(
          request({
            countryCode: 'BE',
            name: 'Camille Exemple',
            personVersion: added.data?.person.version,
            phone: '0470 12 34 56',
            relation: null,
            version: contact?.version,
          }),
          params({ contactId: contact?.id ?? '', id: person.id }),
        ),
      );
      expect(moved.status).toBe(200);
      expect(moved.data?.person.emergencyContacts[0]).toMatchObject({
        countryCode: 'BE',
        relation: null,
      });

      // A reader without the coordinates sees nothing and writes nothing.
      await signIn({ [PERMISSIONS.PERSONS.VIEW]: true });
      expect((await read(person.id)).emergencyContacts).toEqual([]);
      const refused = await addContact(
        request({ name: 'X', personVersion: 1, phone: '0612345678' }, 'POST'),
        params({ id: person.id }),
      );
      expect(refused.status).toBe(403);

      await signIn();
      const current = await read(person.id);
      const removed = await answer(
        await deleteContact(
          request(
            {
              personVersion: current.version,
              version: current.emergencyContacts[0]?.version,
            },
            'DELETE',
          ),
          params({ contactId: contact?.id ?? '', id: person.id }),
        ),
      );
      expect(removed.status).toBe(200);
      expect(removed.data?.person.emergencyContacts).toEqual([]);
      const traced = await changesOf(person.id, 'emergency');
      expect(traced.map((change) => change.valueMode)).not.toContain('PLAIN');
      expect(
        traced.map((change) => `${change.changeType}:${change.fieldKey}`),
      ).toEqual(
        expect.arrayContaining([
          'CREATE:contactName',
          'CREATE:relation',
          'CREATE:phone',
          'UPDATE:phone',
          'UPDATE:relation',
          'DELETE:contactName',
          'DELETE:phone',
        ]),
      );
    });

    it('links a record as a legal representative, and keeps it while it represents', async () => {
      await signIn();
      const parent = await record({
        firstName: 'Camille',
        lastName: 'Exemple',
        nickname: null,
        phones: [{ isPrimary: true, label: 'Personnel', phone: '0611223344' }],
      });
      const minor = await record({ birthDate: bornYearsAgo(15) });
      expect(minor.isAdult).toBe(false);

      // The picker finds the parent by name.
      const found = await suggestions(
        new NextRequest(
          'http://localhost/api/personnes/suggestions?q=camille%20exem',
        ),
      );
      expect(found.status).toBe(200);
      expect(
        ((await found.json()).data.persons as { id: string }[]).map(
          (person) => person.id,
        ),
      ).toContain(parent.id);

      const self = await answer(
        await addGuardian(
          request(
            {
              guardianId: minor.id,
              personVersion: minor.version,
              relation: 'PARENT',
            },
            'POST',
          ),
          params({ id: minor.id }),
        ),
      );
      expect(self).toMatchObject({ error: { code: 'CONFLICT' }, status: 409 });
      const linked = await answer(
        await addGuardian(
          request(
            {
              guardianId: parent.id,
              personVersion: minor.version,
              relation: 'PARENT',
            },
            'POST',
          ),
          params({ id: minor.id }),
        ),
      );
      expect(linked.status).toBe(201);
      const link = linked.data?.person.legalGuardians[0];
      expect(link).toMatchObject({
        guardian: {
          displayName: 'Camille Exemple',
          id: parent.id,
          primaryEmail: null,
          primaryPhone: '+33611223344',
        },
        relation: 'PARENT',
      });
      const twice = await answer(
        await addGuardian(
          request(
            {
              guardianId: parent.id,
              personVersion: linked.data?.person.version,
              relation: 'TUTOR',
            },
            'POST',
          ),
          params({ id: minor.id }),
        ),
      );
      expect(twice.status).toBe(409);
      expect(twice.error?.message).toContain('déjà représentant légal');

      // The other side reads whom it represents.
      expect((await read(parent.id)).represents).toEqual([
        expect.objectContaining({
          age: 15,
          person: expect.objectContaining({ id: minor.id }),
          relation: 'PARENT',
        }),
      ]);
      // The representative's record stays while the link exists.
      const kept = await answer(
        await DELETE(
          request(
            { version: (await read(parent.id)).version },
            'DELETE',
            undefined,
            randomUUID(),
          ),
          params({ id: parent.id }),
        ),
      );
      expect(kept.status).toBe(409);
      expect(kept.error?.message).toContain('représentant légal');
      // Both ends stay fixed in the base, and nobody represents themselves.
      await expect(
        db.$executeRaw`UPDATE "PersonLegalGuardian" SET "guardianId" = ${parent.id} WHERE "id" = ${link?.id ?? ''}`,
      ).resolves.toBe(1);
      await expect(
        db.$executeRaw`UPDATE "PersonLegalGuardian" SET "guardianId" = ${minor.id} WHERE "id" = ${link?.id ?? ''}`,
      ).rejects.toThrow(/cannot be moved/);
      await expect(
        db.$executeRaw`INSERT INTO "PersonLegalGuardian" ("id", "personId", "guardianId", "updatedAt") VALUES (${randomUUID()}, ${parent.id}, ${parent.id}, now())`,
      ).rejects.toThrow(/PersonLegalGuardian_not_self_check/);

      const tutor = await answer(
        await updateGuardian(
          request({
            personVersion: linked.data?.person.version,
            relation: 'TUTOR',
            version: link?.version,
          }),
          params({ id: minor.id, linkId: link?.id ?? '' }),
        ),
      );
      expect(tutor.data?.person.legalGuardians[0]?.relation).toBe('TUTOR');
      const removed = await answer(
        await removeGuardian(
          request(
            {
              personVersion: tutor.data?.person.version,
              version: tutor.data?.person.legalGuardians[0]?.version,
            },
            'DELETE',
          ),
          params({ id: minor.id, linkId: link?.id ?? '' }),
        ),
      );
      expect(removed.data?.person.legalGuardians).toEqual([]);
      expect(
        (await changesOf(minor.id, 'guardians')).map(
          (change) =>
            `${change.changeType}:${change.fieldKey}:${change.valueMode}`,
        ),
      ).toEqual(
        expect.arrayContaining([
          'CREATE:guardian:ENCRYPTED',
          'CREATE:guardianRelation:ENCRYPTED',
          'UPDATE:guardianRelation:ENCRYPTED',
          'DELETE:guardian:ENCRYPTED',
        ]),
      );
      // Without the link, the parent's record can go.
      const gone = await DELETE(
        request(
          { version: (await read(parent.id)).version },
          'DELETE',
          undefined,
          randomUUID(),
        ),
        params({ id: parent.id }),
      );
      expect(gone.status).toBe(204);
    });

    it('removes the links and contacts with the represented record', async () => {
      await signIn();
      const parent = await record();
      const minor = await record({ birthDate: bornYearsAgo(12) });
      const linked = await answer(
        await addGuardian(
          request(
            {
              guardianId: parent.id,
              personVersion: minor.version,
              relation: 'OTHER',
            },
            'POST',
          ),
          params({ id: minor.id }),
        ),
      );
      await addContact(
        request(
          {
            name: 'Lou',
            personVersion: linked.data?.person.version,
            phone: '0612345678',
          },
          'POST',
        ),
        params({ id: minor.id }),
      );
      const deleted = await DELETE(
        request(
          { version: (await read(minor.id)).version },
          'DELETE',
          undefined,
          randomUUID(),
        ),
        params({ id: minor.id }),
      );
      expect(deleted.status).toBe(204);
      expect(
        await db.personLegalGuardian.count({ where: { personId: minor.id } }),
      ).toBe(0);
      expect(
        await db.personEmergencyContact.count({
          where: { personId: minor.id },
        }),
      ).toBe(0);
      expect((await read(parent.id)).represents).toEqual([]);
    });

    it('keeps the other pseudos of a record, found by the Répertoire', async () => {
      await signIn();
      const person = await record({ nickname: 'Kaiz ' + randomUUID() });
      const formerName = 'Shadow' + randomUUID().slice(0, 8);
      const added = await answer(
        await addNickname(
          request(
            {
              nickname: formerName,
              note: 'Ancien pseudo',
              until: { date: '2023-06-15', precision: 'YEAR' },
            },
            'POST',
          ),
          params({ id: person.id }),
        ),
      );
      expect(added.status).toBe(201);
      const other = added.data?.person.otherNicknames[0];
      expect(other).toMatchObject({
        nickname: formerName,
        note: 'Ancien pseudo',
        until: { date: '2023-01-01', precision: 'YEAR' },
      });
      // Its own version: the record's does not move, an identity being edited
      // beside it stays valid.
      expect(added.data?.person.version).toBe(person.version);
      const stored = await db.personOtherNickname.findUniqueOrThrow({
        where: { id: other?.id ?? '' },
      });
      expect(stored.untilOn?.toISOString().slice(0, 10)).toBe('2023-12-31');
      // Neither twice, nor the main pseudo.
      for (const nickname of [formerName.toUpperCase(), person.nickname]) {
        const refused = await answer(
          await addNickname(
            request({ nickname }, 'POST'),
            params({ id: person.id }),
          ),
        );
        expect(refused).toMatchObject({
          error: { code: 'CONFLICT' },
          status: 409,
        });
      }
      // The Répertoire finds the record by it and says so.
      const found = await answer(
        await listPeople(
          new NextRequest(
            'http://localhost/api/personnes?q=' +
              encodeURIComponent(formerName),
          ),
        ),
      );
      expect(
        (
          found.data as unknown as {
            items: { id: string; matchedOtherNickname: string | null }[];
          }
        ).items,
      ).toEqual([
        expect.objectContaining({
          id: person.id,
          matchedOtherNickname: formerName,
        }),
      ]);
      // In the En ligne tab, with the coordinates' right (10 November 2026):
      // the identity's right neither reads, writes nor finds them.
      await signIn({
        [PERMISSIONS.PERSONS.VIEW]: true,
        [PERMISSIONS.PERSONS.UPDATE]: true,
      });
      expect((await read(person.id)).otherNicknames).toEqual([]);
      expect(
        (
          await addNickname(
            request({ nickname: 'Autre' }, 'POST'),
            params({ id: person.id }),
          )
        ).status,
      ).toBe(403);
      const hidden = await answer(
        await listPeople(
          new NextRequest(
            'http://localhost/api/personnes?q=' +
              encodeURIComponent(formerName),
          ),
        ),
      );
      expect((hidden.data as unknown as { items: unknown[] }).items).toEqual(
        [],
      );
      await signIn({
        [PERMISSIONS.PERSONS.VIEW]: true,
        [PERMISSIONS.PERSONS.VIEW_CONTACT]: true,
      });
      expect((await read(person.id)).otherNicknames).toHaveLength(1);
      await signIn();
      const corrected = await answer(
        await updateNickname(
          request({
            nickname: formerName,
            note: 'Compte secondaire',
            until: null,
            version: other?.version,
          }),
          params({ id: person.id, nicknameId: other?.id ?? '' }),
        ),
      );
      expect(corrected.data?.person.otherNicknames[0]).toMatchObject({
        note: 'Compte secondaire',
        until: null,
      });
      const stale = await updateNickname(
        request({
          nickname: 'X',
          note: null,
          until: null,
          version: other?.version,
        }),
        params({ id: person.id, nicknameId: other?.id ?? '' }),
      );
      expect(stale.status).toBe(409);
      const removed = await answer(
        await deleteNickname(
          request(
            { version: corrected.data?.person.otherNicknames[0]?.version },
            'DELETE',
          ),
          params({ id: person.id, nicknameId: other?.id ?? '' }),
        ),
      );
      expect(removed.data?.person.otherNicknames).toEqual([]);
      expect(
        (await changesOf(person.id, 'online'))
          .filter((change) => change.fieldKey.startsWith('otherNickname'))
          .map(
            (change) =>
              `${change.changeType}:${change.fieldKey}:${change.valueMode}`,
          ),
      ).toEqual(
        expect.arrayContaining([
          'CREATE:otherNickname:ENCRYPTED',
          'CREATE:otherNicknameNote:ENCRYPTED',
          'CREATE:otherNicknameUntil:ENCRYPTED',
          'UPDATE:otherNicknameNote:ENCRYPTED',
          'UPDATE:otherNicknameUntil:ENCRYPTED',
          'DELETE:otherNickname:ENCRYPTED',
        ]),
      );
    });

    it('recognizes a Discord account by its ID, on another record too', async () => {
      await signIn();
      const discordId = String(10n ** 17n + BigInt(Date.now()));
      const first = await record();
      const added = await answer(
        await addSocial(
          request(
            {
              identifier: 'kaiz',
              label: 'Personnel',
              networkKey: 'discord',
              personVersion: first.version,
              profileUrl: `https://discord.com/users/${discordId}`,
            },
            'POST',
          ),
          params({ id: first.id }),
        ),
      );
      expect(added.status).toBe(201);
      const wrong = await answer(
        await addSocial(
          request(
            {
              label: 'Personnel',
              networkKey: 'discord',
              personVersion: added.data?.person.version,
              profileUrl: 'https://discord.gg/noctambule',
            },
            'POST',
          ),
          params({ id: first.id }),
        ),
      );
      expect(wrong.status).toBe(400);
      // The ID alone finds the record.
      const found = await answer(
        await listPeople(
          new NextRequest(`http://localhost/api/personnes?q=${discordId}`),
        ),
      );
      expect(
        (
          found.data as unknown as {
            items: { id: string; matchedByContact: boolean }[];
          }
        ).items,
      ).toEqual([
        expect.objectContaining({ id: first.id, matchedByContact: true }),
      ]);
      // A game account too: its SteamID64 alone finds it, though it has the
      // shape of a Discord ID as well (10 November 2026).
      const steamId = `7656119${String(Date.now()).slice(-10)}`;
      const steam = await answer(
        await addSocial(
          request(
            {
              identifier: 'Kaiz',
              label: 'Personnel',
              networkKey: 'steam',
              personVersion: (await read(first.id)).version,
              profileUrl: `https://steamcommunity.com/profiles/${steamId}`,
            },
            'POST',
          ),
          params({ id: first.id }),
        ),
      );
      expect(steam.status).toBe(201);
      const bySteam = await answer(
        await listPeople(
          new NextRequest(`http://localhost/api/personnes?q=${steamId}`),
        ),
      );
      expect(
        (bySteam.data as unknown as { items: { id: string }[] }).items.map(
          (item) => item.id,
        ),
      ).toEqual([first.id]);
      // Back under another name, on another record: the same account warns.
      const second = await record();
      const again = await answer(
        await addSocial(
          request(
            {
              identifier: 'nouveau-nom',
              label: 'Personnel',
              networkKey: 'discord',
              personVersion: second.version,
              profileUrl: `https://discord.com/users/${discordId}`,
            },
            'POST',
          ),
          params({ id: second.id }),
        ),
      );
      expect(again.status).toBe(201);
      expect(
        (
          again.data as unknown as {
            duplicateWarning: { duplicateFound: boolean };
          }
        ).duplicateWarning.duplicateFound,
      ).toBe(true);
    });

    it('lets only the writers of coordinates search records to link', async () => {
      await signIn({
        [PERMISSIONS.PERSONS.VIEW]: true,
        [PERMISSIONS.PERSONS.VIEW_CONTACT]: true,
      });
      const refused = await suggestions(
        new NextRequest('http://localhost/api/personnes/suggestions?q=a'),
      );
      expect(refused.status).toBe(403);
      await signIn();
      const blank = await suggestions(
        new NextRequest('http://localhost/api/personnes/suggestions?q='),
      );
      expect(blank.status).toBe(400);
    });
  },
);
