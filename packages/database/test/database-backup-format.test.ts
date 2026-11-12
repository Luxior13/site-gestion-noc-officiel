import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  type BackupManifest,
  BackupStreamValidator,
  DATABASE_BACKUP_FORMAT_VERSION,
  DATABASE_BACKUP_TABLES,
  stringifyBackupRecord,
} from '../scripts/database-backup-format.ts';
import { validateRestoreEnvironment } from '../scripts/database-restore-support.ts';

const createManifest = (): BackupManifest => ({
  backupId: '123e4567-e89b-42d3-a456-426614174000',
  createdAt: '2026-07-22T12:00:00.000Z',
  formatVersion: DATABASE_BACKUP_FORMAT_VERSION,
  requiredAuditEncryptionKeyVersions: [1, 2],
  tables: DATABASE_BACKUP_TABLES.map(({ property, tableName }) => ({
    property,
    tableName,
  })),
  type: 'manifest',
});

const createBackupLines = (
  rowsByProperty: Readonly<
    Record<string, readonly Record<string, unknown>[]>
  > = {},
): string[] => {
  const lines = [stringifyBackupRecord(createManifest())];
  const counts = new Map<string, number>();
  for (const { property } of DATABASE_BACKUP_TABLES) {
    // Properties come from the closed backup contract.
    // eslint-disable-next-line security/detect-object-injection
    const rows = rowsByProperty[property] ?? [];
    counts.set(property, rows.length);
    lines.push(stringifyBackupRecord({ property, type: 'tableStart' }));
    for (const value of rows) {
      lines.push(stringifyBackupRecord({ property, type: 'row', value }));
    }
    lines.push(
      stringifyBackupRecord({ count: rows.length, property, type: 'tableEnd' }),
    );
  }
  lines.push(
    stringifyBackupRecord({
      counts: Object.fromEntries(counts),
      type: 'footer',
    }),
  );

  return lines;
};

const validateLines = (
  lines: readonly string[],
): ReturnType<BackupStreamValidator['finish']> => {
  const validator = new BackupStreamValidator();
  lines.forEach((line, index) => validator.consume(line, index + 1));

  return validator.finish();
};

test('validates the signed v19 format, ordered tables and exact counts', () => {
  const summary = validateLines(
    createBackupLines({ users: [{ id: 'user-1' }, { id: 'user-2' }] }),
  );

  assert.equal(summary.manifest.formatVersion, 19);
  assert.equal(summary.counts.users, 2);
  const tableNames: readonly string[] = DATABASE_BACKUP_TABLES.map(
    ({ tableName }) => tableName,
  );
  assert.equal(tableNames.includes('BackgroundJob'), false);
  assert.equal(tableNames.includes('PersonDeletionRequest'), false);
  assert.equal(tableNames.includes('PartnerOrganization'), false);
  assert.equal(tableNames.includes('PartnerFollowUpEntry'), false);
  assert.equal(tableNames.includes('PartnerTimelineEvent'), false);
  assert.equal(tableNames.includes('InternalAnnouncement'), false);
  assert.equal(tableNames.includes('ArchivedStaffProfile'), false);
});

// The registry tables were left out of v10 for a day (9 November 2026): every
// model of the schema now has to be in the copy, or this test names it.
test('backs up every table of the schema', () => {
  // A fixed path inside this package.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const schema = readFileSync(
    new URL('../prisma/schema.prisma', import.meta.url),
    'utf8',
  );
  const models = [...schema.matchAll(/^model (\w+) \{/gmu)]
    .map((match) => match[1] ?? '')
    .sort();
  const backedUp = DATABASE_BACKUP_TABLES.map(
    ({ tableName }) => tableName as string,
  ).sort();
  assert.ok(models.length > 0);
  assert.deepEqual(
    models.filter((model) => !backedUp.includes(model)),
    [],
    'A table of the schema is missing from the backup',
  );
  assert.deepEqual(
    backedUp.filter((table) => !models.includes(table)),
    [],
    'The backup names a table the schema no longer has',
  );
});

// v11, 9 November 2026: the registry is in the copy, each parent before the
// rows that reference it, so a restore keeps every foreign key enabled.
test('keeps the registry, parents first', () => {
  const tableNames: readonly string[] = DATABASE_BACKUP_TABLES.map(
    ({ tableName }) => tableName,
  );
  const at = (name: string): number => {
    const index = tableNames.indexOf(name);
    assert.notEqual(index, -1, `${name} is backed up`);

    return index;
  };
  assert.ok(at('Game') < at('Team'));
  assert.ok(at('Game') < at('MemberFunction'));
  assert.ok(at('Person') < at('PersonPassage'));
  assert.ok(at('Team') < at('PersonPassage'));
  assert.ok(at('MemberFunction') < at('PersonPassage'));
  const summary = validateLines(
    createBackupLines({
      games: [{ id: 'game-1' }],
      memberFunctions: [{ id: 'function-1' }, { id: 'function-2' }],
      personPassages: [{ id: 'passage-1' }],
      teams: [{ id: 'team-1' }],
    }),
  );
  assert.deepEqual(
    [
      summary.counts.games,
      summary.counts.teams,
      summary.counts.memberFunctions,
      summary.counts.personPassages,
    ],
    [1, 1, 2, 1],
  );
});

test('keeps the relatives of a person after every person', () => {
  const tableNames: readonly string[] = DATABASE_BACKUP_TABLES.map(
    ({ tableName }) => tableName,
  );
  const at = (name: string): number => {
    const index = tableNames.indexOf(name);
    assert.notEqual(index, -1, `${name} is backed up`);

    return index;
  };
  // A representative is a record of the Répertoire: both ends come first.
  assert.ok(at('Person') < at('PersonEmergencyContact'));
  assert.ok(at('Person') < at('PersonOtherNickname'));
  assert.ok(at('Person') < at('PersonLegalGuardian'));
  const summary = validateLines(
    createBackupLines({
      personEmergencyContacts: [{ id: 'contact-1' }],
      personLegalGuardians: [{ id: 'guardian-1' }, { id: 'guardian-2' }],
    }),
  );
  assert.deepEqual(
    [
      summary.counts.personEmergencyContacts,
      summary.counts.personLegalGuardians,
    ],
    [1, 2],
  );
});

test('serializes bigint and bytea without loss', () => {
  assert.deepEqual(
    JSON.parse(
      stringifyBackupRecord({
        bigint: 9_007_199_254_740_993n,
        bytes: Buffer.from([0, 1, 254, 255]),
      }),
    ),
    { bigint: '9007199254740993', bytes: '\\x0001feff' },
  );
});

test('rejects truncated, reordered and count-divergent streams', () => {
  const lines = createBackupLines();
  assert.throws(() => validateLines(lines.slice(0, -1)), /truncated/u);

  const reordered = [...lines];
  reordered[1] = stringifyBackupRecord({
    property: DATABASE_BACKUP_TABLES[1]?.property,
    type: 'tableStart',
  });
  assert.throws(() => validateLines(reordered), /missing or out of order/u);

  const divergent = [...lines];
  divergent[2] = stringifyBackupRecord({
    count: 1,
    property: DATABASE_BACKUP_TABLES[0]?.property,
    type: 'tableEnd',
  });
  assert.throws(() => validateLines(divergent), /count or section boundary/u);
});

test('rejects old manifests and unknown properties', () => {
  // A v12 copy, from before the other pseudos, is refused rather than
  // restored without them.
  const oldManifest = { ...createManifest(), formatVersion: 12 };
  assert.throws(
    () =>
      new BackupStreamValidator().consume(
        stringifyBackupRecord(oldManifest),
        1,
      ),
    /Unsupported backup format/u,
  );

  const unknownManifest = { ...createManifest(), unexpected: true };
  assert.throws(
    () =>
      new BackupStreamValidator().consume(
        stringifyBackupRecord(unknownManifest),
        1,
      ),
    /unknown or missing properties/u,
  );
});

test('restore requires all referenced audit AES keys and no deletion ledger secret', () => {
  const environment = {
    AUDIT_ENCRYPTION_CURRENT_VERSION: '2',
    AUDIT_ENCRYPTION_KEY_V1: Buffer.alloc(32, 1).toString('base64'),
    AUDIT_ENCRYPTION_KEY_V2: Buffer.alloc(32, 2).toString('base64'),
  };

  assert.doesNotThrow(() =>
    validateRestoreEnvironment(createManifest(), environment),
  );
  assert.throws(
    () =>
      validateRestoreEnvironment(createManifest(), {
        ...environment,
        AUDIT_ENCRYPTION_KEY_V1: undefined,
      }),
    /AUDIT_ENCRYPTION_KEY_V1/u,
  );
});
