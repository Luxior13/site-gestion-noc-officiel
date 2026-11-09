import 'server-only';

import type { Prisma } from '@prisma/client';
import { AuditAction, AuditCategory } from '@repo/database';

import { compareMemberFunctions } from '$features/member-functions/member-function.constants';
import { normalizePersonSearchValue } from '$features/persons/person.utils';
import { createAuditLogWithHeaders } from '$server/audit-log';
import { prisma } from '$server/prisma';
import { authorizeUserAction } from '$server/user-action-authorization';
import type { SessionType, UserType } from '$types/auth.types';
import {
  type ApproximateDate,
  approximateDateEnd,
  formatApproximateDate,
  normalizeApproximateDate,
} from '$utils/approximate-date.utils';

import type {
  PassageChangeInput,
  PassageCreateInput,
  PassageFunction,
  PassageInput,
  PassageItem,
  PassagePerson,
  PassagePersonResults,
  PassageRoster,
  PassageScope,
} from '../types/passage.types';
import {
  managePermissionOf,
  type PassagePlace,
  placeAuditMetadata,
  placeErrors,
  resolvePlace,
  teamIdOf,
} from './passage-place';

export type PassageActor = Readonly<{
  actor: Pick<UserType, 'id'>;
  session: SessionType | null;
}>;

/** The team is said for a team's passage only. */
type AuditValues = Readonly<{
  end: string;
  function: string;
  start: string;
  team?: string;
}>;

const PERSON_REF = {
  firstName: true,
  id: true,
  lastName: true,
  nickname: true,
} as const;
const FUNCTION_REF = {
  gameId: true,
  id: true,
  isActive: true,
  kind: true,
  name: true,
  position: true,
} as const;
const WITH_REFS = {
  memberFunction: { select: FUNCTION_REF },
  person: { select: PERSON_REF },
} as const;
type PassageRow = Prisma.PersonPassageGetPayload<{ include: typeof WITH_REFS }>;
type FunctionRow = Prisma.MemberFunctionGetPayload<{
  select: typeof FUNCTION_REF;
}>;

/** Suggestions shown under the person field (owner: « en afficher moins »). */
const PICKER_LIMIT = 6;

const violates = (error: unknown, name: string): boolean =>
  error instanceof Error && error.message.includes(name);

/** A refusal of the base, said in the words of the place. */
const baseRefusal = (
  scope: PassageScope,
  error: unknown,
  field: 'at' | 'start',
): unknown =>
  violates(error, 'PersonPassage_no_overlap')
    ? placeErrors(scope.type).overlapping(field)
    : violates(error, 'PersonPassage_function_scope')
      ? placeErrors(scope.type).functionOutside()
      : error;

const dateOnly = (value: Date): string => value.toISOString().slice(0, 10);
const asDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

/** « Kaiz · Prénom Nom », as the Répertoire names a record. */
const displayNameOf = (
  person: Readonly<{
    firstName: string | null;
    lastName: string | null;
    nickname: string | null;
  }>,
): string => {
  const civil = [person.firstName, person.lastName]
    .filter((part): part is string => Boolean(part))
    .join(' ');
  if (person.nickname && civil) return `${person.nickname} · ${civil}`;

  return person.nickname ?? (civil || 'Fiche sans nom');
};

const toPerson = (
  row: Readonly<{
    firstName: string | null;
    id: string;
    lastName: string | null;
    nickname: string | null;
  }>,
): PassagePerson => ({
  displayName: displayNameOf(row),
  firstName: row.firstName,
  id: row.id,
  lastName: row.lastName,
  nickname: row.nickname,
});

const toFunction = (row: FunctionRow): PassageFunction => ({
  id: row.id,
  isActive: row.isActive,
  kind: row.kind,
  name: row.name,
  position: row.position,
});

/** Both dates at the start of their period; the end is stored at its end. */
const toItem = (row: PassageRow): PassageItem => ({
  end:
    row.endOn && row.endPrecision
      ? normalizeApproximateDate({
          date: dateOnly(row.endOn),
          precision: row.endPrecision,
        })
      : null,
  function: toFunction(row.memberFunction),
  id: row.id,
  person: toPerson(row.person),
  start: { date: dateOnly(row.startOn), precision: row.startPrecision },
  updatedAt: row.updatedAt.toISOString(),
  version: row.version,
});

/**
 * Players (or the board) first, then the staff, each in the order of the
 * functions; then the earliest start; then the name.
 */
const comparePassages = (left: PassageItem, right: PassageItem): number =>
  compareMemberFunctions(left.function, right.function) ||
  left.start.date.localeCompare(right.start.date) ||
  left.person.displayName.localeCompare(right.person.displayName, 'fr', {
    sensitivity: 'base',
  });

const writeDates = (
  input: Readonly<{ end: ApproximateDate | null; start: ApproximateDate }>,
): Pick<
  Prisma.PersonPassageUncheckedCreateInput,
  'endOn' | 'endPrecision' | 'startOn' | 'startPrecision'
> => ({
  endOn: input.end ? asDate(approximateDateEnd(input.end)) : null,
  endPrecision: input.end?.precision ?? null,
  startOn: asDate(input.start.date),
  startPrecision: input.start.precision,
});

/** What the journal shows: readable values, the dates as precisely as known. */
const auditValues = (
  passage: Readonly<{
    end: ApproximateDate | null;
    functionName: string;
    start: ApproximateDate;
  }>,
  place: PassagePlace,
): AuditValues => ({
  end: passage.end ? formatApproximateDate(passage.end) : 'En cours',
  function: passage.functionName,
  start: formatApproximateDate(passage.start),
  ...(place.team ? { team: place.label } : {}),
});

const changedKeys = (
  before: AuditValues,
  after: AuditValues,
): (keyof AuditValues)[] =>
  (Object.keys(after) as (keyof AuditValues)[]).filter(
    // Keys come from the closed AuditValues type.
    // eslint-disable-next-line security/detect-object-injection
    (key) => before[key] !== after[key],
  );

const pick = (
  values: AuditValues,
  keys: readonly (keyof AuditValues)[],
): Partial<AuditValues> =>
  Object.fromEntries(
    // eslint-disable-next-line security/detect-object-injection
    keys.map((key) => [key, values[key]]),
  ) as Partial<AuditValues>;

/**
 * A passage is traced on the record it concerns (its history shows it), by
 * its function and place, never by the person's name: the journal names the
 * record only to who may read it.
 */
const audit = (
  transaction: Prisma.TransactionClient,
  input: {
    action: 'PASSAGE_CREATE' | 'PASSAGE_DELETE' | 'PASSAGE_UPDATE';
    actorId: string;
    after: Partial<AuditValues> | null;
    before: Partial<AuditValues> | null;
    changes: readonly string[];
    description: string;
    functionName: string;
    passageId: string;
    personId: string;
    place: PassagePlace;
  },
): Promise<void> =>
  createAuditLogWithHeaders(
    {
      action: AuditAction[input.action],
      category: AuditCategory.PASSAGE,
      description: input.description,
      entityId: input.personId,
      entityType: 'PERSON',
      metadata: {
        after: input.after,
        before: input.before,
        changes: input.changes,
        functionName: input.functionName,
        passageId: input.passageId,
        ...placeAuditMetadata(input.place),
      },
      targetUserId: null,
      userId: input.actorId,
    },
    { client: transaction, required: true },
  );

/**
 * A function of the place's list, active or not (an inactive one never
 * blocks): the team's game, or the structure.
 */
const findFunction = async (
  client: Prisma.TransactionClient,
  scope: PassageScope,
  place: PassagePlace,
  id: string,
): Promise<FunctionRow> => {
  const row = await client.memberFunction.findFirst({
    select: FUNCTION_REF,
    where: { gameId: place.gameId, id },
  });
  if (!row) throw placeErrors(scope.type).functionOutside();

  return row;
};

const findPassage = async (
  client: Prisma.TransactionClient,
  scope: PassageScope,
  place: PassagePlace,
  id: string,
): Promise<PassageRow> => {
  const row = await client.personPassage.findFirst({
    include: WITH_REFS,
    where: { id, teamId: teamIdOf(place) },
  });
  if (!row) throw placeErrors(scope.type).missing();

  return row;
};

const readRoster = async (
  client: Prisma.TransactionClient,
  place: PassagePlace,
): Promise<PassageRoster> => {
  const [functions, passages] = await Promise.all([
    client.memberFunction.findMany({
      select: FUNCTION_REF,
      where: { gameId: place.gameId },
    }),
    client.personPassage.findMany({
      include: WITH_REFS,
      where: { teamId: teamIdOf(place) },
    }),
  ]);

  return {
    functions: functions.map(toFunction).sort(compareMemberFunctions),
    passages: passages.map(toItem).sort(comparePassages),
  };
};

/**
 * The place, once its right is checked: a team's roster follows the teams,
 * the structure's Bureau & staff (9 November 2026).
 */
const openPlace = async (
  transaction: Prisma.TransactionClient,
  scope: PassageScope,
  { actor, session }: PassageActor,
): Promise<PassagePlace> => {
  await authorizeUserAction(
    transaction,
    { actorId: actor.id, session },
    managePermissionOf(scope),
  );

  return resolvePlace(transaction, scope);
};

/** The passages of a place, every one, and its functions. */
export const getRoster = async (scope: PassageScope): Promise<PassageRoster> =>
  readRoster(prisma, await resolvePlace(prisma, scope));

/**
 * Records of the Répertoire whose pseudo, first name or last name contain
 * every word typed, for the person picker of a passage: six at most, and
 * whether more exist, so the picker asks for a closer search.
 */
export const searchPassagePersons = async (
  query: string,
): Promise<PassagePersonResults> => {
  const terms = normalizePersonSearchValue(query).split(' ').filter(Boolean);
  if (terms.length === 0) return { more: false, persons: [] };
  const rows = await prisma.person.findMany({
    orderBy: [{ sortName: 'asc' }, { id: 'asc' }],
    select: PERSON_REF,
    take: PICKER_LIMIT + 1,
    where: {
      AND: terms.map((term) => ({
        OR: [
          { normalizedNickname: { contains: term } },
          { normalizedFirstName: { contains: term } },
          { normalizedLastName: { contains: term } },
        ],
      })),
    },
  });

  return {
    more: rows.length > PICKER_LIMIT,
    persons: rows.slice(0, PICKER_LIMIT).map(toPerson),
  };
};

/** Adds a passage: a person, a function of the place, two dates. */
export const createPassage = async (
  scope: PassageScope,
  input: PassageCreateInput,
  actor: PassageActor,
): Promise<PassageRoster> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const place = await openPlace(transaction, scope, actor);
      const person = await transaction.person.findUnique({
        select: { id: true },
        where: { id: input.personId },
      });
      if (!person)
        throw placeErrors(scope.type).field(
          400,
          'personId',
          'Cette fiche n’existe plus dans le Répertoire.',
        );
      const memberFunction = await findFunction(
        transaction,
        scope,
        place,
        input.functionId,
      );
      const created = await transaction.personPassage.create({
        data: {
          ...writeDates(input),
          functionId: memberFunction.id,
          personId: person.id,
          teamId: teamIdOf(place),
        },
      });
      const after = auditValues(
        { ...input, functionName: memberFunction.name },
        place,
      );
      await audit(transaction, {
        action: 'PASSAGE_CREATE',
        actorId: actor.actor.id,
        after,
        before: null,
        changes: Object.keys(after),
        description: `Passage ajouté : ${memberFunction.name}, ${place.label}`,
        functionName: memberFunction.name,
        passageId: created.id,
        personId: person.id,
        place,
      });

      return readRoster(transaction, place);
    });
  } catch (error) {
    throw baseRefusal(scope, error, 'start');
  }
};

/**
 * Corrects a passage under optimistic versioning: its function, start or end.
 * Its person never changes; a passage on the wrong person is deleted. An
 * unchanged form answers the roster without writing.
 */
export const updatePassage = async (
  scope: PassageScope,
  passageId: string,
  input: PassageInput & { expectedVersion: number },
  actor: PassageActor,
): Promise<PassageRoster> => {
  const errors = placeErrors(scope.type);
  try {
    return await prisma.$transaction(async (transaction) => {
      const place = await openPlace(transaction, scope, actor);
      const previous = toItem(
        await findPassage(transaction, scope, place, passageId),
      );
      if (previous.version !== input.expectedVersion) throw errors.changed();
      const memberFunction = await findFunction(
        transaction,
        scope,
        place,
        input.functionId,
      );
      const before = auditValues(
        { ...previous, functionName: previous.function.name },
        place,
      );
      const after = auditValues(
        { ...input, functionName: memberFunction.name },
        place,
      );
      const changes = changedKeys(before, after);
      if (changes.length === 0) return readRoster(transaction, place);
      const result = await transaction.personPassage.updateMany({
        data: {
          ...writeDates(input),
          functionId: memberFunction.id,
          version: { increment: 1 },
        },
        where: {
          id: passageId,
          teamId: teamIdOf(place),
          version: input.expectedVersion,
        },
      });
      if (result.count !== 1) throw errors.changed();
      await audit(transaction, {
        action: 'PASSAGE_UPDATE',
        actorId: actor.actor.id,
        after: pick(after, changes),
        before: pick(before, changes),
        changes,
        description: `Passage modifié : ${memberFunction.name}, ${place.label}`,
        functionName: memberFunction.name,
        passageId,
        personId: previous.person.id,
        place,
      });

      return readRoster(transaction, place);
    });
  } catch (error) {
    throw baseRefusal(scope, error, 'start');
  }
};

/**
 * « Changer de fonction » (owner, 9 November 2026): the passage ends at the
 * given date and a new one, with the other function, starts there, in one
 * transaction and two traces. A planned end moves to the new passage.
 */
export const changePassageFunction = async (
  scope: PassageScope,
  passageId: string,
  input: PassageChangeInput,
  actor: PassageActor,
): Promise<PassageRoster> => {
  const errors = placeErrors(scope.type);
  try {
    return await prisma.$transaction(async (transaction) => {
      const place = await openPlace(transaction, scope, actor);
      const previous = toItem(
        await findPassage(transaction, scope, place, passageId),
      );
      if (previous.version !== input.expectedVersion) throw errors.changed();
      if (input.functionId === previous.function.id)
        throw errors.field(400, 'functionId', 'Choisissez une autre fonction.');
      if (input.at.date < previous.start.date)
        throw errors.field(
          400,
          'at',
          'Le changement ne peut pas précéder le début du passage.',
        );
      if (previous.end && input.at.date > approximateDateEnd(previous.end))
        throw errors.field(
          400,
          'at',
          'Ce passage est terminé avant cette date : ajoutez plutôt un nouveau passage.',
        );
      const memberFunction = await findFunction(
        transaction,
        scope,
        place,
        input.functionId,
      );
      const result = await transaction.personPassage.updateMany({
        data: {
          endOn: asDate(approximateDateEnd(input.at)),
          endPrecision: input.at.precision,
          version: { increment: 1 },
        },
        where: {
          id: passageId,
          teamId: teamIdOf(place),
          version: input.expectedVersion,
        },
      });
      if (result.count !== 1) throw errors.changed();
      const before = auditValues(
        { ...previous, functionName: previous.function.name },
        place,
      );
      const ended = auditValues(
        {
          ...previous,
          end: input.at,
          functionName: previous.function.name,
        },
        place,
      );
      await audit(transaction, {
        action: 'PASSAGE_UPDATE',
        actorId: actor.actor.id,
        after: pick(ended, ['end']),
        before: pick(before, ['end']),
        changes: ['end'],
        description: `Passage terminé (changement de fonction) : ${previous.function.name}, ${place.label}`,
        functionName: previous.function.name,
        passageId,
        personId: previous.person.id,
        place,
      });
      const next = { end: previous.end, start: input.at };
      const created = await transaction.personPassage.create({
        data: {
          ...writeDates(next),
          functionId: memberFunction.id,
          personId: previous.person.id,
          teamId: teamIdOf(place),
        },
      });
      const after = auditValues(
        { ...next, functionName: memberFunction.name },
        place,
      );
      await audit(transaction, {
        action: 'PASSAGE_CREATE',
        actorId: actor.actor.id,
        after,
        before: null,
        changes: Object.keys(after),
        description: `Passage ajouté (changement de fonction) : ${memberFunction.name}, ${place.label}`,
        functionName: memberFunction.name,
        passageId: created.id,
        personId: previous.person.id,
        place,
      });

      return readRoster(transaction, place);
    });
  } catch (error) {
    throw baseRefusal(scope, error, 'at');
  }
};

/** Deletes a passage entered by mistake; the journal keeps its trace. */
export const deletePassage = async (
  scope: PassageScope,
  passageId: string,
  expectedVersion: number,
  actor: PassageActor,
): Promise<PassageRoster> =>
  prisma.$transaction(async (transaction) => {
    const errors = placeErrors(scope.type);
    const place = await openPlace(transaction, scope, actor);
    const previous = toItem(
      await findPassage(transaction, scope, place, passageId),
    );
    if (previous.version !== expectedVersion) throw errors.changed();
    const result = await transaction.personPassage.deleteMany({
      where: {
        id: passageId,
        teamId: teamIdOf(place),
        version: expectedVersion,
      },
    });
    if (result.count !== 1) throw errors.changed();
    const before = auditValues(
      { ...previous, functionName: previous.function.name },
      place,
    );
    await audit(transaction, {
      action: 'PASSAGE_DELETE',
      actorId: actor.actor.id,
      after: null,
      before,
      changes: Object.keys(before),
      description: `Passage supprimé : ${previous.function.name}, ${place.label}`,
      functionName: previous.function.name,
      passageId,
      personId: previous.person.id,
      place,
    });

    return readRoster(transaction, place);
  });
