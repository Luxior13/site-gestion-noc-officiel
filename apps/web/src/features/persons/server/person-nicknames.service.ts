import 'server-only';

import type { Prisma } from '@prisma/client';

import { PERMISSIONS } from '$constants/permissions.constants';
import { prisma } from '$server/prisma';
import {
  type ApproximateDate,
  approximateDateEnd,
  formatApproximateDate,
} from '$utils/approximate-date.utils';

import { PERSON_AUDIT_KEYS, PERSON_LIMITS } from '../person.constants';
import { normalizePersonSearchValue } from '../person.utils';
import type {
  CreateOtherNicknameInput,
  DeleteOtherNicknameInput,
  UpdateOtherNicknameInput,
} from '../schemas/person-nickname.schemas';
import type { PersonDetail } from '../types/person.types';
import type { PersonAuditChange } from './person-audit';
import {
  auditContactMutation,
  childFieldChange,
} from './person-child-mutation';
import {
  mapPersonDetail,
  requirePersonDetailRecord,
} from './person-core.service';
import { personErrors } from './person-errors';
import {
  authorizePersonMutation,
  type PersonMutationActor,
} from './person-mutation-authorization';

/*
 * The other pseudos of a record (10 November 2026, « ok go »). Written with
 * the identity's right, each with its own version: the record's version does
 * not move, so a pseudo added beside an identity being edited never turns
 * that edit into a conflict. The record's row is locked for the limit and
 * the comparison with its main pseudo.
 */

type Transaction = Prisma.TransactionClient;

const FIELDS = [
  ['otherNickname', 'nickname'],
  ['otherNicknameNote', 'note'],
  ['otherNicknameUntil', 'until'],
] as const;

type Values = Readonly<{
  nickname: string;
  note: string | null;
  until: ApproximateDate | null;
}>;

const dateOnly = (value: Date): string => value.toISOString().slice(0, 10);
const asDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

/** The journal reads « 2023 » or « mars 2023 », as precisely as it is known. */
const journalValue = (
  values: Values,
  key: (typeof FIELDS)[number][1],
): string | null =>
  key === 'until'
    ? values.until && formatApproximateDate(values.until)
    : // `key` comes from the closed FIELDS list.
      // eslint-disable-next-line security/detect-object-injection
      values[key];

const changesOf = (
  recordId: string,
  before: Values | null,
  after: Values | null,
  changeType: PersonAuditChange['changeType'],
): PersonAuditChange[] =>
  FIELDS.flatMap(([fieldKey, key]) => {
    const previous = before ? journalValue(before, key) : null;
    const next = after ? journalValue(after, key) : null;

    return previous === next
      ? []
      : [
          childFieldChange({
            after: next,
            before: previous,
            changeType,
            fieldKey,
            recordId,
            sectionKey: PERSON_AUDIT_KEYS.sections.identity,
            sensitive: true,
          }),
        ];
  });

const storedValues = (
  row: Readonly<{
    nickname: string;
    note: string | null;
    untilOn: Date | null;
    untilPrecision: ApproximateDate['precision'] | null;
  }>,
): Values => ({
  nickname: row.nickname,
  note: row.note,
  until:
    row.untilOn && row.untilPrecision
      ? { date: dateOnly(row.untilOn), precision: row.untilPrecision }
      : null,
});

/** Authorized, the record locked, and the pseudo not its main one. */
const openRecord = async (
  transaction: Transaction,
  personId: string,
  actor: PersonMutationActor,
  nickname?: string,
): Promise<void> => {
  await authorizePersonMutation(
    transaction,
    actor,
    PERMISSIONS.PERSONS.UPDATE,
    personId,
  );
  const rows = await transaction.$queryRaw<
    Array<{ normalizedNickname: string | null }>
  >`
    SELECT person."normalizedNickname"
    FROM "public"."Person" person
    WHERE person."id" = ${personId}
    FOR UPDATE
  `;
  const person = rows[0];
  if (!person) throw personErrors.notFound();
  if (
    nickname !== undefined &&
    person.normalizedNickname === normalizePersonSearchValue(nickname)
  )
    throw personErrors.nicknameConflict(
      'C’est déjà le pseudo principal de la fiche.',
    );
};

const assertUnique = async (
  transaction: Transaction,
  personId: string,
  nickname: string,
  exceptId?: string,
): Promise<void> => {
  const same = await transaction.personOtherNickname.findFirst({
    select: { id: true },
    where: {
      normalizedNickname: normalizePersonSearchValue(nickname),
      personId,
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
  });
  if (same)
    throw personErrors.nicknameConflict(
      'Ce pseudo figure déjà parmi les autres pseudos de la fiche.',
    );
};

const rowData = (
  input: Values,
): Omit<Prisma.PersonOtherNicknameUncheckedCreateInput, 'personId'> => ({
  nickname: input.nickname,
  normalizedNickname: normalizePersonSearchValue(input.nickname),
  note: input.note,
  untilOn: input.until ? asDate(approximateDateEnd(input.until)) : null,
  untilPrecision: input.until?.precision ?? null,
});

const finish = async (
  transaction: Transaction,
  input: {
    actor: PersonMutationActor;
    changes: PersonAuditChange[];
    description: string;
    personId: string;
  },
): Promise<PersonDetail> => {
  await auditContactMutation(transaction, input);

  return mapPersonDetail(
    transaction,
    await requirePersonDetailRecord(transaction, input.personId),
    input.actor,
  );
};

export const addPersonOtherNickname = async (
  personId: string,
  input: CreateOtherNicknameInput,
  actor: PersonMutationActor,
): Promise<PersonDetail> =>
  prisma.$transaction(async (transaction) => {
    await openRecord(transaction, personId, actor, input.nickname);
    const count = await transaction.personOtherNickname.count({
      where: { personId },
    });
    if (count >= PERSON_LIMITS.otherNicknames)
      throw new RangeError('PERSON_OTHER_NICKNAME_LIMIT');
    await assertUnique(transaction, personId, input.nickname);
    const row = await transaction.personOtherNickname.create({
      data: { ...rowData(input), personId },
    });

    return finish(transaction, {
      actor,
      changes: changesOf(row.id, null, input, 'CREATE'),
      description: 'Autre pseudo ajouté à une fiche',
      personId,
    });
  });

export const updatePersonOtherNickname = async (
  personId: string,
  nicknameId: string,
  input: UpdateOtherNicknameInput,
  actor: PersonMutationActor,
): Promise<PersonDetail> =>
  prisma.$transaction(async (transaction) => {
    await openRecord(transaction, personId, actor, input.nickname);
    const current = await transaction.personOtherNickname.findFirst({
      where: { id: nicknameId, personId },
    });
    if (!current) throw personErrors.notFound();
    if (current.version !== input.version) throw personErrors.versionConflict();
    const changes = changesOf(
      nicknameId,
      storedValues(current),
      input,
      'UPDATE',
    );
    if (changes.length === 0)
      return mapPersonDetail(
        transaction,
        await requirePersonDetailRecord(transaction, personId),
        actor,
      );
    await assertUnique(transaction, personId, input.nickname, nicknameId);
    const updated = await transaction.personOtherNickname.updateMany({
      data: { ...rowData(input), version: { increment: 1 } },
      where: { id: nicknameId, personId, version: input.version },
    });
    if (updated.count !== 1) throw personErrors.versionConflict();

    return finish(transaction, {
      actor,
      changes,
      description: 'Autre pseudo d’une fiche modifié',
      personId,
    });
  });

export const deletePersonOtherNickname = async (
  personId: string,
  nicknameId: string,
  input: DeleteOtherNicknameInput,
  actor: PersonMutationActor,
): Promise<PersonDetail> =>
  prisma.$transaction(async (transaction) => {
    await openRecord(transaction, personId, actor);
    const current = await transaction.personOtherNickname.findFirst({
      where: { id: nicknameId, personId },
    });
    if (!current) throw personErrors.notFound();
    if (current.version !== input.version) throw personErrors.versionConflict();
    const deleted = await transaction.personOtherNickname.deleteMany({
      where: { id: nicknameId, personId, version: input.version },
    });
    if (deleted.count !== 1) throw personErrors.versionConflict();

    return finish(transaction, {
      actor,
      changes: changesOf(nicknameId, storedValues(current), null, 'DELETE'),
      description: 'Autre pseudo supprimé d’une fiche',
      personId,
    });
  });
