import 'server-only';

import type { Prisma } from '@prisma/client';
import { AuditAction, AuditCategory } from '@repo/database';

import { FEATURES } from '$constants/feature-registry.constants';
import { PERMISSIONS } from '$constants/permissions.constants';
import { readBalances } from '$features/operations/server/operation.service';
import { isPrismaUniqueConstraintError } from '$server/api-response';
import { createAuditLogWithHeaders } from '$server/audit-log';
import { prisma } from '$server/prisma';
import { ServiceError, serviceErrors } from '$server/service-error';
import { authorizeUserAction } from '$server/user-action-authorization';
import { ErrorCode } from '$types/api.types';
import type { SessionType, UserType } from '$types/auth.types';
import {
  formatApproximateDate,
  normalizeApproximateDate,
} from '$utils/approximate-date.utils';
import { formatEuros } from '$utils/money.utils';
import { normalizeSearchText } from '$utils/search-text.utils';

import { holdersOn, holdsOn } from '../account-holders';
import { FINANCIAL_ACCOUNT_KIND_LABELS } from '../financial-account.constants';
import type {
  AccountHolder,
  FinancialAccountCreateInput,
  FinancialAccountInput,
  FinancialAccountItem,
  FinancialAccountsOverview,
} from '../types/financial-account.types';

export type FinancialAccountActor = Readonly<{
  actor: Pick<UserType, 'id'>;
  session: SessionType | null;
}>;

type AuditValues = Readonly<{
  closedOn: string | null;
  entity: string;
  institution: string | null;
  kind: string;
  name: string;
  openingBalance: string;
  openingOn: string;
}>;

const fieldError = (
  field: string,
  message: string,
  status: 400 | 409,
): ServiceError =>
  new ServiceError(
    status === 409 ? ErrorCode.CONFLICT : ErrorCode.VALIDATION_ERROR,
    message,
    status,
    { details: { [field]: [message] } },
  );
const duplicateName = (): ServiceError =>
  fieldError('name', 'Cette entité a déjà un compte de ce nom.', 409);
const accountChanged = (): ServiceError =>
  serviceErrors.conflict(
    'Ce compte a été modifié entre-temps. Rechargez-le avant de recommencer.',
  );
const accountMissing = (): ServiceError =>
  serviceErrors.notFound('Ce compte n’existe plus. Rechargez la liste.');

const WITH_ENTITY = {
  _count: { select: { incomingTransfers: true, operations: true } },
  entity: { select: { id: true, name: true } },
} as const;
type AccountRow = Prisma.FinancialAccountGetPayload<{
  include: typeof WITH_ENTITY;
}>;

const dateOnly = (value: Date): string => value.toISOString().slice(0, 10);
const asDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);
const formatDay = (day: string): string =>
  formatApproximateDate({ date: day, precision: 'DAY' });

/** With its balance of the day; none moved yet, the opening one. */
const toItem = (
  row: AccountRow,
  balances?: ReadonlyMap<string, number>,
): FinancialAccountItem => ({
  balanceCents: balances?.get(row.id) ?? row.openingBalanceCents,
  closedOn: row.closedOn ? dateOnly(row.closedOn) : null,
  entity: { id: row.entity.id, name: row.entity.name },
  id: row.id,
  institution: row.institution,
  kind: row.kind,
  name: row.name,
  openingBalanceCents: row.openingBalanceCents,
  openingOn: dateOnly(row.openingOn),
  operationCount: row._count.operations + row._count.incomingTransfers,
  updatedAt: row.updatedAt.toISOString(),
  version: row.version,
});

/** Open accounts first, then by name. */
const compareAccounts = (
  left: FinancialAccountItem,
  right: FinancialAccountItem,
): number =>
  Number(left.closedOn !== null) - Number(right.closedOn !== null) ||
  left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' });

/** What the journal shows: readable values, the amount in euros. */
const auditValues = (
  value: FinancialAccountInput,
  entityName: string,
): AuditValues => ({
  closedOn: value.closedOn ? formatDay(value.closedOn) : null,
  entity: entityName,
  institution: value.institution,
  kind: FINANCIAL_ACCOUNT_KIND_LABELS[value.kind],
  name: value.name,
  openingBalance: formatEuros(value.openingBalanceCents),
  openingOn: formatDay(value.openingOn),
});

const changedKeys = (
  before: AuditValues,
  after: AuditValues,
): (keyof AuditValues)[] =>
  (Object.keys(after) as (keyof AuditValues)[]).filter(
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

const writeData = (
  input: FinancialAccountInput,
): Omit<Prisma.FinancialAccountUncheckedCreateInput, 'entityId'> => ({
  closedOn: input.closedOn ? asDate(input.closedOn) : null,
  institution: input.institution,
  kind: input.kind,
  name: input.name,
  normalizedName: normalizeSearchText(input.name),
  openingBalanceCents: input.openingBalanceCents,
  openingOn: asDate(input.openingOn),
});

const audit = async (
  transaction: Prisma.TransactionClient,
  input: {
    account: Pick<FinancialAccountItem, 'id' | 'name'>;
    action:
      | 'FINANCIAL_ACCOUNT_CREATE'
      | 'FINANCIAL_ACCOUNT_DELETE'
      | 'FINANCIAL_ACCOUNT_UPDATE';
    actorId: string;
    after: Partial<AuditValues> | null;
    before: Partial<AuditValues> | null;
    changes: readonly string[];
    description: string;
  },
): Promise<void> =>
  createAuditLogWithHeaders(
    {
      action: AuditAction[input.action],
      category: AuditCategory.FINANCIAL_ACCOUNT,
      description: input.description,
      metadata: {
        accountId: input.account.id,
        accountName: input.account.name,
        after: input.after,
        before: input.before,
        changes: input.changes,
        ...FEATURES.financialAccounts.audit,
      },
      targetUserId: null,
      userId: input.actorId,
    },
    { client: transaction, required: true },
  );

const HOLDER_SELECT = {
  endOn: true,
  endPrecision: true,
  id: true,
  isPrincipal: true,
  name: true,
  startOn: true,
  startPrecision: true,
} as const;
type HolderRow = Prisma.LegalEntityGetPayload<{ select: typeof HOLDER_SELECT }>;

const toHolder = (row: HolderRow): AccountHolder => ({
  end:
    row.endOn && row.endPrecision
      ? normalizeApproximateDate({
          date: dateOnly(row.endOn),
          precision: row.endPrecision,
        })
      : null,
  id: row.id,
  isPrincipal: row.isPrincipal,
  name: row.name,
  start: { date: dateOnly(row.startOn), precision: row.startPrecision },
});

/** The entities with a legal form, in the order of time. */
const readHolders = async (
  client: Prisma.TransactionClient,
): Promise<AccountHolder[]> =>
  (
    await client.legalEntity.findMany({
      orderBy: [{ startOn: 'asc' }, { name: 'asc' }],
      select: HOLDER_SELECT,
      where: { form: { not: 'NONE' } },
    })
  ).map(toHolder);

/** Who may change the accounts; their entities are read, and held, after. */
const authorize = async (
  transaction: Prisma.TransactionClient,
  { actor, session }: FinancialAccountActor,
): Promise<void> => {
  await authorizeUserAction(
    transaction,
    { actorId: actor.id, session },
    PERMISSIONS.FINANCIAL_ACCOUNTS.MANAGE,
  );
  // An entity's period changes under a lock on every entity: the accounts
  // share it, so a period never moves past an account being written.
  await transaction.$queryRaw`SELECT "id" FROM "LegalEntity" ORDER BY "id" FOR SHARE`;
};

/** The accounts, and the entities that may hold one, for the Comptes page. */
export const getFinancialAccountsOverview =
  async (): Promise<FinancialAccountsOverview> => {
    const [rows, holders] = await Promise.all([
      prisma.financialAccount.findMany({ include: WITH_ENTITY }),
      readHolders(prisma),
    ]);
    const balances = await readBalances(prisma, rows);

    return {
      accounts: rows.map((row) => toItem(row, balances)).sort(compareAccounts),
      holders,
    };
  };

export const getFinancialAccount = async (
  id: string,
): Promise<FinancialAccountItem> => {
  const row = await prisma.financialAccount.findUnique({
    include: WITH_ENTITY,
    where: { id },
  });
  if (!row) throw accountMissing();

  return toItem(row, await readBalances(prisma, [row]));
};

/**
 * The period of an account keeps covering its operations: its opening day
 * never after the first, its closing day never before the last (also kept
 * by `FinancialAccount_operations_check`).
 */
const assertCoversOperations = async (
  transaction: Prisma.TransactionClient,
  id: string,
  input: FinancialAccountInput,
): Promise<void> => {
  const where = { OR: [{ accountId: id }, { toAccountId: id }] };
  const [first, last] = await Promise.all([
    transaction.financialOperation.findFirst({
      orderBy: { occurredOn: 'asc' },
      select: { occurredOn: true },
      where,
    }),
    transaction.financialOperation.findFirst({
      orderBy: { occurredOn: 'desc' },
      select: { occurredOn: true },
      where,
    }),
  ]);
  if (first && dateOnly(first.occurredOn) < input.openingOn)
    throw fieldError(
      'openingOn',
      `Une opération date du ${formatDay(dateOnly(first.occurredOn))} : le solde de départ ne peut pas être plus tard.`,
      409,
    );
  if (last && input.closedOn && dateOnly(last.occurredOn) > input.closedOn)
    throw fieldError(
      'closedOn',
      `Une opération date du ${formatDay(dateOnly(last.occurredOn))} : la clôture ne peut pas être plus tôt.`,
      409,
    );
};

/**
 * The entity of a new account (cadrage, règle 3): the only one existing on
 * the opening day applies by itself; with several, the one chosen, which
 * must exist on that day.
 */
const resolveHolder = (
  holders: readonly AccountHolder[],
  input: FinancialAccountCreateInput,
): AccountHolder => {
  const candidates = holdersOn(holders, input.openingOn);
  if (input.entityId) {
    const chosen = candidates.find((holder) => holder.id === input.entityId);
    if (!chosen)
      throw fieldError(
        'entityId',
        'Cette entité n’existe pas à la date du solde de départ.',
        400,
      );

    return chosen;
  }
  const [only, ...others] = candidates;
  if (!only)
    throw fieldError(
      'openingOn',
      holders.length
        ? 'Aucune entité n’existe à cette date : choisissez un jour de la période de l’association.'
        : 'Ajoutez d’abord l’association dans Structure › Entités : chaque compte lui appartient.',
      400,
    );
  if (others.length > 0)
    throw fieldError(
      'entityId',
      'Choisissez l’entité titulaire du compte.',
      400,
    );

  return only;
};

/** Opens an account: its entity is fixed for good (cadrage, règle 2). */
export const createFinancialAccount = async (
  input: FinancialAccountCreateInput,
  context: FinancialAccountActor,
): Promise<FinancialAccountItem> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      await authorize(transaction, context);
      const holder = resolveHolder(await readHolders(transaction), input);
      const full: FinancialAccountInput = { ...input, closedOn: null };
      const account = toItem(
        await transaction.financialAccount.create({
          data: { ...writeData(full), entityId: holder.id },
          include: WITH_ENTITY,
        }),
      );
      const after = auditValues(full, holder.name);
      await audit(transaction, {
        account,
        action: 'FINANCIAL_ACCOUNT_CREATE',
        actorId: context.actor.id,
        after,
        before: null,
        changes: Object.keys(after),
        description: `Compte ouvert : ${account.name}`,
      });

      return account;
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) throw duplicateName();
    throw error;
  }
};

/**
 * Edits an account under optimistic versioning; its new opening day stays in
 * its entity's period. An unchanged form answers the current state.
 */
export const updateFinancialAccount = async (
  id: string,
  input: FinancialAccountInput & { expectedVersion: number },
  context: FinancialAccountActor,
): Promise<FinancialAccountItem> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      await authorize(transaction, context);
      const previous = await transaction.financialAccount.findUnique({
        include: WITH_ENTITY,
        where: { id },
      });
      if (!previous) throw accountMissing();
      if (previous.version !== input.expectedVersion) throw accountChanged();
      const current = toItem(previous);
      const before = auditValues(current, current.entity.name);
      const after = auditValues(input, current.entity.name);
      const changes = changedKeys(before, after);
      if (changes.length === 0) return current;
      const holder = (await readHolders(transaction)).find(
        (candidate) => candidate.id === current.entity.id,
      );
      if (holder && !holdsOn(holder, input.openingOn))
        throw fieldError(
          'openingOn',
          `${holder.name} n’existe pas à cette date : choisissez un jour de sa période.`,
          400,
        );
      await assertCoversOperations(transaction, id, input);
      const result = await transaction.financialAccount.updateMany({
        data: { ...writeData(input), version: { increment: 1 } },
        where: { id, version: input.expectedVersion },
      });
      if (result.count !== 1) throw accountChanged();
      const row = await transaction.financialAccount.findUniqueOrThrow({
        include: WITH_ENTITY,
        where: { id },
      });
      const account = toItem(row, await readBalances(transaction, [row]));
      await audit(transaction, {
        account,
        action: 'FINANCIAL_ACCOUNT_UPDATE',
        actorId: context.actor.id,
        after: pick(after, changes),
        before: pick(before, changes),
        changes,
        description: `Compte modifié : ${account.name}`,
      });

      return account;
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) throw duplicateName();
    throw error;
  }
};

/**
 * Deletes an account opened by mistake. One that has operations is closed
 * instead: refused here and by the base (`ON DELETE RESTRICT`).
 */
export const deleteFinancialAccount = async (
  id: string,
  expectedVersion: number,
  context: FinancialAccountActor,
): Promise<{ id: string }> =>
  prisma.$transaction(async (transaction) => {
    await authorize(transaction, context);
    const previous = await transaction.financialAccount.findUnique({
      include: WITH_ENTITY,
      where: { id },
    });
    if (!previous) throw accountMissing();
    if (previous.version !== expectedVersion) throw accountChanged();
    if (previous._count.operations + previous._count.incomingTransfers > 0)
      throw serviceErrors.conflict(
        'Ce compte a des opérations : clôturez-le plutôt que de le supprimer.',
      );
    const result = await transaction.financialAccount.deleteMany({
      where: { id, version: expectedVersion },
    });
    if (result.count !== 1) throw accountChanged();
    const account = toItem(previous);
    const before = auditValues(account, account.entity.name);
    await audit(transaction, {
      account,
      action: 'FINANCIAL_ACCOUNT_DELETE',
      actorId: context.actor.id,
      after: null,
      before,
      changes: Object.keys(before),
      description: `Compte supprimé : ${account.name}`,
    });

    return { id };
  });
