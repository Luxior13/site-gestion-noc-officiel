import 'server-only';

import { Prisma } from '@prisma/client';
import { AuditAction, AuditCategory } from '@repo/database';

import { FEATURES } from '$constants/feature-registry.constants';
import {
  hasPermission,
  PERMISSIONS,
  type PermissionsData,
} from '$constants/permissions.constants';
import { getPersonDisplayName } from '$features/persons/person.ui';
import {
  PERSON_REF_SELECT,
  toPersonRef,
} from '$features/persons/server/person-suggestions';
import { createAuditLogWithHeaders } from '$server/audit-log';
import { prisma } from '$server/prisma';
import { ServiceError, serviceErrors } from '$server/service-error';
import { authorizeUserAction } from '$server/user-action-authorization';
import { ErrorCode } from '$types/api.types';
import type { SessionType, UserType } from '$types/auth.types';
import { formatApproximateDate } from '$utils/approximate-date.utils';
import { formatEuros } from '$utils/money.utils';
import { getSearchTerms, normalizeSearchText } from '$utils/search-text.utils';

import {
  OPERATION_KIND_LABELS,
  OPERATION_KINDS,
  OPERATIONS_PAGE_SIZE,
} from '../operation.constants';
import type {
  OperationFilters,
  OperationInput,
  OperationItem,
  OperationsPage,
} from '../types/operation.types';

export type OperationActor = Readonly<{
  actor: Pick<UserType, 'id'>;
  session: SessionType | null;
}>;

/** What the reader may see beside the operations: the Répertoire. */
export type OperationReader = Readonly<{ canViewPersons: boolean }>;

type AuditValues = Readonly<{
  account: string;
  amount: string;
  assignment: string | null;
  category: string | null;
  kind: string;
  label: string | null;
  note: string | null;
  occurredOn: string;
  organization: string | null;
  paymentMethod: string | null;
  person: string | null;
  toAccount: string | null;
}>;

const fieldError = (
  field: string,
  message: string,
  status: 400 | 404 | 409 = 400,
): ServiceError =>
  new ServiceError(
    status === 409
      ? ErrorCode.CONFLICT
      : status === 404
        ? ErrorCode.NOT_FOUND
        : ErrorCode.VALIDATION_ERROR,
    message,
    status,
    { details: { [field]: [message] } },
  );
const operationChanged = (): ServiceError =>
  serviceErrors.conflict(
    'Cette opération a été modifiée entre-temps. Rechargez-la avant de recommencer.',
  );
const operationMissing = (): ServiceError =>
  serviceErrors.notFound('Cette opération n’existe plus. Rechargez la liste.');

const INCLUDE = {
  account: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
  game: { select: { id: true, name: true } },
  organization: { select: { id: true, name: true } },
  paymentMethod: { select: { id: true, name: true } },
  person: { select: PERSON_REF_SELECT },
  team: { select: { game: { select: { name: true } }, id: true, name: true } },
  toAccount: { select: { id: true, name: true } },
} as const;
type OperationRow = Prisma.FinancialOperationGetPayload<{
  include: typeof INCLUDE;
}>;

const dateOnly = (value: Date): string => value.toISOString().slice(0, 10);
const asDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);
const dayLabel = (value: string): string =>
  formatApproximateDate({ date: value, precision: 'DAY' });

const toItem = (row: OperationRow, reader: OperationReader): OperationItem => ({
  account: row.account,
  amountCents: row.amountCents,
  assignment: row.team
    ? {
        gameName: row.team.game.name,
        id: row.team.id,
        kind: 'team',
        name: row.team.name,
      }
    : row.game
      ? { gameName: null, id: row.game.id, kind: 'game', name: row.game.name }
      : null,
  category: row.category,
  id: row.id,
  kind: row.kind,
  label: row.label,
  note: row.note,
  occurredOn: dateOnly(row.occurredOn),
  organization: row.organization,
  paymentMethod: row.paymentMethod,
  person: reader.canViewPersons && row.person ? toPersonRef(row.person) : null,
  personLinked: row.personId !== null,
  toAccount: row.toAccount,
  updatedAt: row.updatedAt.toISOString(),
  version: row.version,
});

/** « Cotisation 2026 Kaiz », or « Virement : Compte courant → PayPal ». */
const titleOf = (row: OperationRow): string =>
  row.label ??
  `Virement : ${row.account.name} → ${row.toAccount?.name ?? 'compte'}`;

/** What the journal shows: readable values, the record by its name. */
const auditValues = (row: OperationRow): AuditValues => ({
  account: row.account.name,
  amount: formatEuros(row.amountCents),
  assignment: row.team
    ? `${row.team.name} (${row.team.game.name})`
    : (row.game?.name ?? null),
  category: row.category?.name ?? null,
  kind: OPERATION_KIND_LABELS[row.kind],
  label: row.label,
  note: row.note,
  occurredOn: dayLabel(dateOnly(row.occurredOn)),
  organization: row.organization?.name ?? null,
  paymentMethod: row.paymentMethod?.name ?? null,
  person: row.person ? getPersonDisplayName(row.person) : null,
  toAccount: row.toAccount?.name ?? null,
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

/** Only what is said: an empty value is left out of a creation. */
const pick = (
  values: AuditValues,
  keys: readonly (keyof AuditValues)[],
): Partial<AuditValues> =>
  Object.fromEntries(
    // eslint-disable-next-line security/detect-object-injection
    keys.map((key) => [key, values[key]]),
  ) as Partial<AuditValues>;

const filled = (values: AuditValues): (keyof AuditValues)[] =>
  (Object.keys(values) as (keyof AuditValues)[]).filter(
    // eslint-disable-next-line security/detect-object-injection
    (key) => values[key] !== null,
  );

const audit = async (
  transaction: Prisma.TransactionClient,
  input: {
    action:
      | 'FINANCIAL_OPERATION_CREATE'
      | 'FINANCIAL_OPERATION_DELETE'
      | 'FINANCIAL_OPERATION_UPDATE';
    actorId: string;
    after: Partial<AuditValues> | null;
    before: Partial<AuditValues> | null;
    changes: readonly string[];
    description: string;
    row: OperationRow;
  },
): Promise<void> =>
  createAuditLogWithHeaders(
    {
      action: AuditAction[input.action],
      category: AuditCategory.FINANCIAL_OPERATION,
      description: input.description,
      metadata: {
        after: input.after,
        before: input.before,
        changes: input.changes,
        operationId: input.row.id,
        operationLabel: titleOf(input.row),
        ...FEATURES.operations.audit,
      },
      targetUserId: null,
      userId: input.actorId,
    },
    { client: transaction, required: true },
  );

/** Who may enter operations, checked again in the transaction. */
const authorize = async (
  transaction: Prisma.TransactionClient,
  { actor, session }: OperationActor,
): Promise<OperationReader> => {
  const { user } = await authorizeUserAction(
    transaction,
    { actorId: actor.id, session },
    PERMISSIONS.OPERATIONS.MANAGE,
  );

  return {
    canViewPersons:
      user.isProtected ||
      hasPermission(
        user.role,
        PERMISSIONS.PERSONS.VIEW,
        user.permissions as PermissionsData | null,
      ),
  };
};

type AccountPeriod = Readonly<{
  closedOn: Date | null;
  entityId: string;
  id: string;
  name: string;
  openingOn: Date;
}>;

/**
 * The accounts of an operation, locked for share: their period does not
 * move while the operation is written (`FinancialAccount_operations_check`).
 */
const readAccount = async (
  transaction: Prisma.TransactionClient,
  id: string,
  field: 'accountId' | 'toAccountId',
): Promise<AccountPeriod> => {
  const [row] = await transaction.$queryRaw<AccountPeriod[]>`
    SELECT "id", "name", "entityId", "openingOn", "closedOn"
    FROM "FinancialAccount" WHERE "id" = ${id} FOR SHARE`;
  if (!row) throw fieldError(field, 'Ce compte n’existe plus.', 404);

  return row;
};

const assertWithin = (
  account: AccountPeriod,
  occurredOn: string,
  field: 'accountId' | 'occurredOn' | 'toAccountId',
): void => {
  const opening = dateOnly(account.openingOn);
  if (occurredOn < opening)
    throw fieldError(
      field,
      `Le compte ${account.name} part du ${dayLabel(opening)} : une opération ne le précède pas.`,
    );
  const closed = account.closedOn ? dateOnly(account.closedOn) : null;
  if (closed && occurredOn > closed)
    throw fieldError(
      field,
      `Le compte ${account.name} est clôturé le ${dayLabel(closed)}.`,
    );
};

/**
 * Checks what the operation names, field by field: its accounts and their
 * period, a category of its kind, a payment method, an organisation, a
 * record (with the Répertoire's right to change it), a team or a game.
 */
const checkReferences = async (
  transaction: Prisma.TransactionClient,
  input: OperationInput,
  reader: OperationReader,
  currentPersonId: string | null,
): Promise<string | null> => {
  const account = await readAccount(transaction, input.accountId, 'accountId');
  assertWithin(account, input.occurredOn, 'occurredOn');
  if (input.kind === 'TRANSFER' && input.toAccountId) {
    const target = await readAccount(
      transaction,
      input.toAccountId,
      'toAccountId',
    );
    assertWithin(target, input.occurredOn, 'toAccountId');
    if (target.entityId !== account.entityId)
      throw fieldError(
        'toAccountId',
        'Un virement relie deux comptes de la même entité.',
      );
  }
  if (input.categoryId) {
    const category = await transaction.treasuryChoice.findUnique({
      select: { kind: true },
      where: { id: input.categoryId },
    });
    const expected =
      input.kind === 'INCOME' ? 'INCOME_CATEGORY' : 'EXPENSE_CATEGORY';
    if (category?.kind !== expected)
      throw fieldError('categoryId', 'Choisissez une catégorie de ce sens.');
  }
  if (input.paymentMethodId) {
    const method = await transaction.treasuryChoice.findUnique({
      select: { kind: true },
      where: { id: input.paymentMethodId },
    });
    if (method?.kind !== 'PAYMENT_METHOD')
      throw fieldError(
        'paymentMethodId',
        'Ce moyen de paiement n’existe plus.',
      );
  }
  if (
    input.organizationId &&
    !(await transaction.organization.findUnique({
      select: { id: true },
      where: { id: input.organizationId },
    }))
  )
    throw fieldError('organizationId', 'Cette organisation n’existe plus.');
  const personId =
    input.personId === undefined ? currentPersonId : input.personId;
  if (personId !== currentPersonId && !reader.canViewPersons)
    throw serviceErrors.forbidden(
      'Relier une fiche du Répertoire demande d’avoir accès au Répertoire.',
    );
  if (
    personId &&
    personId !== currentPersonId &&
    !(await transaction.person.findUnique({
      select: { id: true },
      where: { id: personId },
    }))
  )
    throw fieldError(
      'personId',
      'Cette fiche n’existe plus dans le Répertoire.',
    );
  if (input.organizationId && personId)
    throw fieldError(
      'organizationId',
      'Une organisation ou une fiche du Répertoire, pas les deux',
    );
  if (
    input.teamId &&
    !(await transaction.team.findUnique({
      select: { id: true },
      where: { id: input.teamId },
    }))
  )
    throw fieldError('assignment', 'Cette équipe n’existe plus.');
  if (
    input.gameId &&
    !(await transaction.game.findUnique({
      select: { id: true },
      where: { id: input.gameId },
    }))
  )
    throw fieldError('assignment', 'Ce jeu n’existe plus.');

  return personId;
};

const writeData = (
  input: OperationInput,
  personId: string | null,
): Prisma.FinancialOperationUncheckedCreateInput => ({
  accountId: input.accountId,
  amountCents: input.amountCents,
  categoryId: input.categoryId,
  gameId: input.gameId,
  kind: input.kind,
  label: input.label,
  note: input.note,
  occurredOn: asDate(input.occurredOn),
  organizationId: input.organizationId,
  paymentMethodId: input.paymentMethodId,
  personId,
  searchText: normalizeSearchText(
    [input.label ?? '', input.note ?? ''].join(' '),
  ).slice(0, 700),
  teamId: input.teamId,
  toAccountId: input.toAccountId,
});

const whereOf = (
  filters: Omit<OperationFilters, 'kind' | 'page'>,
): Prisma.FinancialOperationWhereInput => ({
  AND: [
    filters.accountId
      ? {
          OR: [
            { accountId: filters.accountId },
            { toAccountId: filters.accountId },
          ],
        }
      : {},
    filters.organizationId ? { organizationId: filters.organizationId } : {},
    ...getSearchTerms(filters.q ?? '').map((term) => ({
      searchText: { contains: term },
    })),
  ],
});

/**
 * A page of operations, the latest first, with the number of each kind
 * under the other filters (the quick filters of the list).
 */
export const listOperations = async (
  filters: OperationFilters,
  reader: OperationReader,
): Promise<OperationsPage> => {
  const base = whereOf(filters);
  const where = filters.kind ? { AND: [base, { kind: filters.kind }] } : base;
  const [groups, total] = await Promise.all([
    prisma.financialOperation.groupBy({
      _count: { _all: true },
      by: ['kind'],
      where: base,
    }),
    prisma.financialOperation.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / OPERATIONS_PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const rows = await prisma.financialOperation.findMany({
    include: INCLUDE,
    orderBy: [{ occurredOn: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
    skip: (page - 1) * OPERATIONS_PAGE_SIZE,
    take: OPERATIONS_PAGE_SIZE,
    where,
  });
  const countOf = (kind: (typeof OPERATION_KINDS)[number]): number =>
    groups.find((group) => group.kind === kind)?._count._all ?? 0;

  return {
    counts: {
      ALL: groups.reduce((sum, group) => sum + group._count._all, 0),
      EXPENSE: countOf('EXPENSE'),
      INCOME: countOf('INCOME'),
      TRANSFER: countOf('TRANSFER'),
    },
    items: rows.map((row) => toItem(row, reader)),
    page,
    total,
    totalPages,
  };
};

export const getOperation = async (
  id: string,
  reader: OperationReader,
): Promise<OperationItem> => {
  const row = await prisma.financialOperation.findUnique({
    include: INCLUDE,
    where: { id },
  });
  if (!row) throw operationMissing();

  return toItem(row, reader);
};

/** Enters money received, paid or moved; the entity is the account's. */
export const createOperation = async (
  input: OperationInput,
  context: OperationActor,
): Promise<OperationItem> =>
  prisma.$transaction(async (transaction) => {
    const reader = await authorize(transaction, context);
    const personId = await checkReferences(transaction, input, reader, null);
    const row = await transaction.financialOperation.create({
      data: writeData(input, personId),
      include: INCLUDE,
    });
    const after = auditValues(row);
    const changes = filled(after);
    await audit(transaction, {
      action: 'FINANCIAL_OPERATION_CREATE',
      actorId: context.actor.id,
      after: pick(after, changes),
      before: null,
      changes,
      description: `Opération ajoutée : ${titleOf(row)}, ${formatEuros(row.amountCents)}`,
      row,
    });

    return toItem(row, reader);
  });

/**
 * Edits an operation under optimistic versioning. Its kind stays: an
 * operation entered in the wrong direction is deleted and entered again.
 */
export const updateOperation = async (
  id: string,
  input: OperationInput & { expectedVersion: number },
  context: OperationActor,
): Promise<OperationItem> =>
  prisma.$transaction(async (transaction) => {
    const reader = await authorize(transaction, context);
    const previous = await transaction.financialOperation.findUnique({
      include: INCLUDE,
      where: { id },
    });
    if (!previous) throw operationMissing();
    if (previous.version !== input.expectedVersion) throw operationChanged();
    if (previous.kind !== input.kind)
      throw fieldError(
        'kind',
        'Le sens d’une opération ne change pas : supprimez-la et saisissez-la à nouveau.',
      );
    const personId = await checkReferences(
      transaction,
      input,
      reader,
      previous.personId,
    );
    const data = writeData(input, personId);
    // An unchanged form answers the current state, its version kept.
    if (
      (Object.keys(data) as (keyof typeof data)[]).every((key) =>
        key === 'occurredOn'
          ? dateOnly(previous.occurredOn) === input.occurredOn
          : // Keys come from the closed write data.
            // eslint-disable-next-line security/detect-object-injection
            previous[key as keyof typeof previous] === data[key],
      )
    )
      return toItem(previous, reader);
    const result = await transaction.financialOperation.updateMany({
      data: { ...data, version: { increment: 1 } },
      where: { id, version: input.expectedVersion },
    });
    if (result.count !== 1) throw operationChanged();
    const row = await transaction.financialOperation.findUniqueOrThrow({
      include: INCLUDE,
      where: { id },
    });
    const before = auditValues(previous);
    const after = auditValues(row);
    const changes = changedKeys(before, after);
    if (changes.length > 0)
      await audit(transaction, {
        action: 'FINANCIAL_OPERATION_UPDATE',
        actorId: context.actor.id,
        after: pick(after, changes),
        before: pick(before, changes),
        changes,
        description: `Opération modifiée : ${titleOf(row)}`,
        row,
      });

    return toItem(row, reader);
  });

/** Deletes an operation entered by mistake; the journal keeps it. */
export const deleteOperation = async (
  id: string,
  expectedVersion: number,
  context: OperationActor,
): Promise<{ id: string }> =>
  prisma.$transaction(async (transaction) => {
    await authorize(transaction, context);
    const previous = await transaction.financialOperation.findUnique({
      include: INCLUDE,
      where: { id },
    });
    if (!previous) throw operationMissing();
    if (previous.version !== expectedVersion) throw operationChanged();
    const result = await transaction.financialOperation.deleteMany({
      where: { id, version: expectedVersion },
    });
    if (result.count !== 1) throw operationChanged();
    const before = auditValues(previous);
    const changes = filled(before);
    await audit(transaction, {
      action: 'FINANCIAL_OPERATION_DELETE',
      actorId: context.actor.id,
      after: null,
      before: pick(before, changes),
      changes,
      description: `Opération supprimée : ${titleOf(previous)}, ${formatEuros(previous.amountCents)}`,
      row: previous,
    });

    return { id };
  });

/**
 * The balance of each account on this day: its opening balance, plus the
 * money received and the transfers in, minus the money paid and the
 * transfers out (11 November 2026).
 */
export const readBalances = async (
  client: Prisma.TransactionClient,
  accounts: readonly Readonly<{ id: string; openingBalanceCents: number }>[],
): Promise<Map<string, number>> => {
  const ids = accounts.map((account) => account.id);
  if (ids.length === 0) return new Map();
  const rows = await client.$queryRaw<{ balance: bigint; id: string }[]>`
    SELECT "id", SUM("delta")::bigint AS "balance" FROM (
      SELECT "accountId" AS "id",
        CASE WHEN "kind" = 'INCOME' THEN "amountCents" ELSE -"amountCents" END AS "delta"
      FROM "FinancialOperation" WHERE "accountId" IN (${Prisma.join(ids)})
      UNION ALL
      SELECT "toAccountId" AS "id", "amountCents" AS "delta"
      FROM "FinancialOperation" WHERE "toAccountId" IN (${Prisma.join(ids)})
    ) AS "moves" GROUP BY "id"`;
  const moves = new Map(rows.map((row) => [row.id, Number(row.balance)]));

  return new Map(
    accounts.map((account) => [
      account.id,
      account.openingBalanceCents + (moves.get(account.id) ?? 0),
    ]),
  );
};
