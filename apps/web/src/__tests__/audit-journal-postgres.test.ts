import { randomUUID } from 'node:crypto';

import { Prisma, PrismaClient, type User } from '@prisma/client';
import { NextRequest } from 'next/server';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { GET } from '$app/api/audit/route';
import type { JournalResponse } from '$features/audit/types/audit-journal.types';
import { buildUserSearchPredicate } from '$features/users/server/users-list-search';
import { mapUserToUserType } from '$server/user-projection';
import { normalizeSearchText } from '$utils/search-text.utils';

const connection = vi.hoisted(() => ({
  client: null as PrismaClient | null,
  session: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('$env', () => ({ env: { NODE_ENV: 'test' } }));
vi.mock('$server/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn() },
}));
vi.mock('$server/prisma', () => ({
  prisma: new Proxy(
    {},
    {
      get: (_target, key): unknown => {
        if (!connection.client)
          throw new Error('Isolated journal database not initialized');
        const value: unknown = Reflect.get(connection.client, key);

        return typeof value === 'function'
          ? value.bind(connection.client)
          : value;
      },
    },
  ),
}));
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock('$server/rate-limiter', () => ({
  reserveAuthenticatedApiRateLimit: vi.fn(async () => ({ allowed: true })),
}));
vi.mock('$server/session', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$server/session')>()),
  getAuthSession: connection.session,
}));

const target = process.env.AUDIT_JOURNAL_TEST_DATABASE_URL;
const DAY_MS = 86_400_000;

describe.skipIf(!target)(
  'activity journal on fully migrated PostgreSQL (30 October 2026)',
  () => {
    let db: PrismaClient;
    let root: User;
    let admin: User;
    let member: User;

    const authenticate = async (user: User): Promise<void> => {
      const session = await db.session.create({
        data: {
          expiresAt: new Date(Date.now() + 3600_000),
          idleExpiresAt: new Date(Date.now() + 1800_000),
          mfaMethod: 'TOTP',
          mfaVerifiedAt: new Date(),
          securityVersion: user.securityVersion,
          token: randomUUID(),
          userId: user.id,
        },
      });
      connection.session.mockResolvedValue({
        session,
        user: mapUserToUserType(user),
      });
    };
    const read = async (
      query = '',
    ): Promise<{ body: { data: JournalResponse }; status: number }> => {
      const response = await GET(
        new NextRequest(`http://localhost/api/audit?${query}`),
      );

      return { body: await response.json(), status: response.status };
    };
    const user = (role: 'ADMIN' | 'USER', isProtected = false): Promise<User> =>
      db.user.create({
        data: {
          firstName: isProtected
            ? 'Racine'
            : role === 'ADMIN'
              ? 'Camille'
              : 'Cible',
          isProtected,
          lastName: 'Journal',
          loginName: 'journal.' + randomUUID().replaceAll('-', '').slice(0, 16),
          mfaEnabledAt: new Date(),
          passwordHash: '!fictive',
          role,
        },
      });

    beforeAll(async () => {
      if (!target) throw new Error('Missing isolated journal database');
      const url = new URL(target);
      if (
        !['127.0.0.1', 'localhost'].includes(url.hostname) ||
        url.pathname !== '/audit_journal_service_test'
      )
        throw new Error(
          'A local audit_journal_service_test database is required',
        );
      db = new PrismaClient({ datasourceUrl: target });
      connection.client = db;
      root =
        (await db.user.findFirst({ where: { isProtected: true } })) ??
        (await user('ADMIN', true));
      admin = await user('ADMIN');
      member = await user('USER');
      const events = [
        {
          action: 'LOGIN_FAILED' as const,
          category: 'AUTH' as const,
          description: `Connexion échouée: ${member.loginName}`,
          eventKind: 'CONNECTION' as const,
          metadata: { reason: 'INVALID_CREDENTIALS' },
          outcome: 'FAILURE' as const,
          severity: 'WARNING' as const,
          stream: 'AUTHENTICATION' as const,
          targetDisplayNameSnapshot: 'Cible Journal',
          targetUserId: member.id,
        },
        {
          action: 'PERMISSION_UPDATE' as const,
          actorDisplayNameSnapshot: 'Camille Journal',
          category: 'PERMISSION' as const,
          description: `Autorisations modifiées : ${member.loginName}`,
          metadata: { effectivelyGrantedPermissionKeys: ['persons:view'] },
          severity: 'CRITICAL' as const,
          stream: 'AUTHORIZATION' as const,
          targetDisplayNameSnapshot: 'Cible Journal',
          targetUserId: member.id,
          userId: admin.id,
        },
        {
          action: 'PASSWORD_CHANGE' as const,
          actorDisplayNameSnapshot: 'Racine Journal',
          category: 'AUTH' as const,
          description: 'Mot de passe changé',
          ipAddress: '192.0.2.10',
          stream: 'SECURITY' as const,
          userId: root.id,
        },
      ];
      for (const event of events) await db.auditLog.create({ data: event });
      // Outside the one-year period: never listed.
      await db.auditLog.create({
        data: {
          action: 'USER_UPDATE',
          category: 'USER',
          createdAt: new Date(Date.now() - 400 * DAY_MS),
          description: 'Ancien fait',
          stream: 'IDENTITY',
          targetUserId: member.id,
          userId: admin.id,
        },
      });
    });
    afterAll(async () => {
      await db?.$disconnect();
      connection.client = null;
    });

    it('refuses a reader without the journal permission', async () => {
      await authenticate(member);
      expect((await read()).status).toBe(403);
    });

    it('traces the reading once, hides the protected account and masks IPs', async () => {
      await authenticate(admin);
      const first = await read('period=1y');
      expect(first.status).toBe(200);
      const labels = first.body.data.events.map((event) => event.label);
      expect(labels).toContain('Journal consulté');
      expect(labels).toContain('Autorisations modifiées');
      expect(labels).toContain('Connexion échouée');
      expect(labels).not.toContain('Mot de passe changé');
      expect(labels).not.toContain('Compte modifié');

      await read('period=1y');
      expect(
        await db.auditLog.count({
          where: { action: 'AUDIT_VIEW', userId: admin.id },
        }),
      ).toBe(1);

      await authenticate(root);
      const forRoot = await read('period=1y&type=security');
      const password = forRoot.body.data.events.find(
        (event) => event.label === 'Mot de passe changé',
      );
      expect(password).toMatchObject({ ip: '192.0.2.10', ipMasked: false });
      expect(
        forRoot.body.data.events.every(
          (event) => event.typeLabel === 'Sécurité',
        ),
      ).toBe(true);
    });

    it('filters by failures, by account and by a case-insensitive name', async () => {
      await authenticate(admin);
      const failures = await read('show=failures');
      expect(failures.body.data.events.map((event) => event.label)).toEqual([
        'Connexion échouée',
      ]);

      const account = await read(`user=${member.id}&period=1y`);
      expect(account.body.data.focusLabel).toBe('Cible Journal');
      expect(
        account.body.data.events.every(
          (event) => event.target?.id === member.id,
        ),
      ).toBe(true);

      const search = await read('search=CIBLE');
      expect(search.body.data.pagination.total).toBe(2);
    });

    // Audit RL of 31 October 2026: public.search_text must read every
    // character exactly as normalizeSearchText, whatever the database language.
    it('mirrors the site-wide search form in SQL, character by character', async () => {
      const blocks: Array<[number, number]> = [
        [0x0001, 0x052f],
        [0x1e00, 0x1fff],
        [0x2000, 0x2bff],
        [0x3000, 0x303f],
        [0xfb00, 0xfb4f],
        [0xfe00, 0xfe6f],
        [0xff00, 0xffef],
        [0x1f300, 0x1f5ff],
      ];
      const codepoints = blocks.flatMap(([start, end]) =>
        Array.from({ length: end - start + 1 }, (_, index) => start + index),
      );
      const characters = await db.$queryRaw<
        Array<{ folded: string; n: number }>
      >`SELECT n, search_text(chr(n)) AS folded FROM unnest(${codepoints}::int[]) AS n`;
      expect(characters).toHaveLength(codepoints.length);
      const mismatches = characters.filter(
        ({ folded, n }) =>
          folded !== normalizeSearchText(String.fromCodePoint(n)),
      );
      expect(mismatches.map(({ n }) => n.toString(16))).toEqual([]);

      const names = [
        '  André   LEFÈVRE ',
        'Jean-Pierre d’Artagnan',
        "O'Brien-Smith",
        'Nguyễn Thị Minh Khai',
        'ΟΔΟΣ Οδός',
        'Дмитрий Ёлкин',
        '佐々木 ★ＫＥＮ★ 🔥',
        'jean.dupont@exemple.fr',
      ];
      const folded = await db.$queryRaw<
        Array<{ folded: string; name: string }>
      >`
        SELECT name, search_text(name) AS folded FROM unnest(${names}::text[]) AS name`;
      for (const { folded: value, name } of folded)
        expect(value).toBe(normalizeSearchText(name));
    });

    it('finds an author or an account by every word, in any order, without accents', async () => {
      const event = await db.auditLog.create({
        data: {
          action: 'USER_UPDATE',
          actorDisplayNameSnapshot: 'André Lefèvre',
          actorLoginNameSnapshot: 'a.lefevre',
          category: 'USER',
          description: 'Recherche du journal',
          stream: 'IDENTITY',
          targetDisplayNameSnapshot: 'Jean-Pierre d’Artagnan',
          userId: admin.id,
        },
      });
      // Written by the database itself, never by the application.
      expect(event.searchText).toBe(
        'andre lefevre a lefevre jean pierre d artagnan',
      );

      await authenticate(admin);
      const found = async (search: string): Promise<boolean> =>
        (
          await read(`period=1y&search=${encodeURIComponent(search)}`)
        ).body.data.events.some((item) => item.id === event.id);
      for (const search of [
        'andre',
        'ANDRÉ',
        'lefevre andre',
        'jean pierre',
        "d'artagnan",
        'Artagnan Lefèvre',
      ])
        expect(await found(search)).toBe(true);
      expect(await found('andre hopper')).toBe(false);
    });

    it('serves the users search from the indexes of the same search form', async () => {
      const plan = await db.$transaction(async (transaction) => {
        // Only the trigram indexes can then answer the search predicate: a
        // drift between the query and the index expressions shows here.
        await transaction.$executeRaw`SET LOCAL enable_seqscan = off`;
        await transaction.$executeRaw`SET LOCAL enable_indexscan = off`;

        return transaction.$queryRaw<Array<{ 'QUERY PLAN': string }>>(
          Prisma.sql`EXPLAIN SELECT "id" FROM "User" WHERE ${buildUserSearchPredicate(
            'lefevre andre',
            { canViewContact: true, isProtected: true },
          )}`,
        );
      });
      const text = plan.map((row) => row['QUERY PLAN']).join('\n');
      expect(text).toContain('User_search_identity_trgm_idx');
      expect(text).toContain('User_search_contact_trgm_idx');
    });
  },
);
