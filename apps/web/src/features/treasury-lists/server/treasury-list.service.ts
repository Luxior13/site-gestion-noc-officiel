import 'server-only';

import type { Prisma } from '@prisma/client';
import { AuditAction, AuditCategory } from '@repo/database';

import { FEATURES } from '$constants/feature-registry.constants';
import { PERMISSIONS } from '$constants/permissions.constants';
import {
  isPrismaForeignKeyError,
  isPrismaUniqueConstraintError,
} from '$server/api-response';
import { createAuditLogWithHeaders } from '$server/audit-log';
import { planManualOrder } from '$server/manual-order';
import { prisma } from '$server/prisma';
import { ServiceError, serviceErrors } from '$server/service-error';
import { authorizeUserAction } from '$server/user-action-authorization';
import { ErrorCode } from '$types/api.types';
import type { SessionType, UserType } from '$types/auth.types';
import { normalizeSearchText } from '$utils/search-text.utils';

import {
  COMMON_TREASURY_CHOICES,
  compareTreasuryChoices,
  TREASURY_CHOICE_KIND_LABELS,
  TREASURY_LIST_KINDS,
  type TreasuryChoiceKind,
  type TreasuryList,
} from '../treasury-list.constants';
import type {
  TreasuryChoiceInput,
  TreasuryChoiceItem,
} from '../types/treasury-list.types';

export type TreasuryListActor = Readonly<{
  actor: Pick<UserType, 'id'>;
  session: SessionType | null;
}>;

type AuditValues = Readonly<{ isActive: boolean; kind: string; name: string }>;

const duplicateName = (): ServiceError => {
  const message = 'Cette liste a déjà une valeur de ce nom.';

  return new ServiceError(ErrorCode.CONFLICT, message, 409, {
    details: { name: [message] },
  });
};
const kindOutside = (): ServiceError =>
  new ServiceError(ErrorCode.VALIDATION_ERROR, 'Choisissez un type', 400, {
    details: { kind: ['Choisissez un type'] },
  });
const choiceChanged = (): ServiceError =>
  serviceErrors.conflict(
    'Cette valeur a été modifiée entre-temps. Rechargez la liste avant de recommencer.',
  );
const choiceMissing = (): ServiceError =>
  serviceErrors.notFound('Cette valeur n’existe plus. Rechargez la liste.');
const groupChanged = (): ServiceError =>
  serviceErrors.conflict(
    'La liste a changé entre-temps. Elle est rechargée : recommencez le déplacement.',
  );
const choicesArrived = (): ServiceError =>
  serviceErrors.conflict(
    'Des valeurs ont été ajoutées entre-temps. Rechargez la liste.',
  );
/** Operations name it with `ON DELETE RESTRICT`: it is made inactive. */
const choiceUsed = (): ServiceError =>
  serviceErrors.conflict(
    'Cette valeur a déjà servi : rendez-la inactive plutôt que de la supprimer.',
  );
const kindLocked = (): ServiceError =>
  new ServiceError(
    ErrorCode.CONFLICT,
    'Elle a déjà servi : elle garde son type.',
    409,
    { details: { kind: ['Elle a déjà servi : elle garde son type.'] } },
  );

const WITH_USES = {
  _count: { select: { categoryOperations: true, paymentOperations: true } },
} as const;
type ChoiceRow = Prisma.TreasuryChoiceGetPayload<{
  include: typeof WITH_USES;
}>;

const toItem = (row: ChoiceRow): TreasuryChoiceItem => ({
  id: row.id,
  isActive: row.isActive,
  kind: row.kind,
  name: row.name,
  position: row.position,
  updatedAt: row.updatedAt.toISOString(),
  useCount: row._count.categoryOperations + row._count.paymentOperations,
  version: row.version,
});

const auditValues = (
  item: TreasuryChoiceInput | TreasuryChoiceItem,
): AuditValues => ({
  isActive: item.isActive,
  kind: TREASURY_CHOICE_KIND_LABELS[item.kind],
  name: item.name,
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

/** « Catégorie d’entrée ajoutée », « Moyen de paiement ajouté ». */
const done = (kind: TreasuryChoiceKind, participle: string): string =>
  // A closed list of three kinds.
  // eslint-disable-next-line security/detect-object-injection
  `${TREASURY_CHOICE_KIND_LABELS[kind]} ${participle}${kind === 'PAYMENT_METHOD' ? '' : 'e'}`;

const assertKind = (list: TreasuryList, kind: TreasuryChoiceKind): void => {
  // eslint-disable-next-line security/detect-object-injection
  if (!TREASURY_LIST_KINDS[list].includes(kind)) throw kindOutside();
};

const nextPosition = async (
  client: Prisma.TransactionClient,
  kind: TreasuryChoiceKind,
): Promise<number> =>
  ((
    await client.treasuryChoice.aggregate({
      _max: { position: true },
      where: { kind },
    })
  )._max.position ?? -1) + 1;

/** A value of this list: another list's value is « not found » here. */
const findChoice = async (
  client: Prisma.TransactionClient,
  list: TreasuryList,
  id: string,
): Promise<ChoiceRow> => {
  const row = await client.treasuryChoice.findFirst({
    include: WITH_USES,
    // eslint-disable-next-line security/detect-object-injection
    where: { id, kind: { in: [...TREASURY_LIST_KINDS[list]] } },
  });
  if (!row) throw choiceMissing();

  return row;
};

const readList = async (
  client: Prisma.TransactionClient,
  list: TreasuryList,
): Promise<TreasuryChoiceItem[]> =>
  (
    await client.treasuryChoice.findMany({
      include: WITH_USES,
      // eslint-disable-next-line security/detect-object-injection
      where: { kind: { in: [...TREASURY_LIST_KINDS[list]] } },
    })
  )
    .map(toItem)
    .sort(compareTreasuryChoices);

const audit = async (
  transaction: Prisma.TransactionClient,
  input: {
    action:
      | 'TREASURY_CHOICE_CREATE'
      | 'TREASURY_CHOICE_DELETE'
      | 'TREASURY_CHOICE_UPDATE';
    actorId: string;
    after: Partial<AuditValues> | null;
    before: Partial<AuditValues> | null;
    changes: readonly string[];
    description: string;
    item: Pick<TreasuryChoiceItem, 'id' | 'kind' | 'name'>;
  },
): Promise<void> =>
  createAuditLogWithHeaders(
    {
      action: AuditAction[input.action],
      category: AuditCategory.TREASURY_CHOICE,
      description: input.description,
      metadata: {
        after: input.after,
        before: input.before,
        changes: input.changes,
        choiceId: input.item.id,
        choiceName: input.item.name,
        listLabel: TREASURY_CHOICE_KIND_LABELS[input.item.kind],
        ...FEATURES.financialAccounts.audit,
      },
      targetUserId: null,
      userId: input.actorId,
    },
    { client: transaction, required: true },
  );

/** The lists are kept by who manages the accounts (Comptes page). */
const authorize = async (
  transaction: Prisma.TransactionClient,
  { actor, session }: TreasuryListActor,
): Promise<void> => {
  await authorizeUserAction(
    transaction,
    { actorId: actor.id, session },
    PERMISSIONS.FINANCIAL_ACCOUNTS.MANAGE,
  );
};

const createOne = async (
  transaction: Prisma.TransactionClient,
  input: TreasuryChoiceInput,
  actorId: string,
): Promise<TreasuryChoiceItem> => {
  const item = toItem(
    await transaction.treasuryChoice.create({
      data: {
        isActive: input.isActive,
        kind: input.kind,
        name: input.name,
        normalizedName: normalizeSearchText(input.name),
        // Last of its block; dragged higher if it matters more.
        position: await nextPosition(transaction, input.kind),
      },
      include: WITH_USES,
    }),
  );
  const after = auditValues(item);
  await audit(transaction, {
    action: 'TREASURY_CHOICE_CREATE',
    actorId,
    after,
    before: null,
    changes: Object.keys(after),
    description: `${done(item.kind, 'ajouté')} : ${item.name}`,
    item,
  });

  return item;
};

/** The values of a list: each block in its dragged order. */
export const listTreasuryChoices = (
  list: TreasuryList,
): Promise<TreasuryChoiceItem[]> => readList(prisma, list);

export const createTreasuryChoice = async (
  list: TreasuryList,
  input: TreasuryChoiceInput,
  actor: TreasuryListActor,
): Promise<TreasuryChoiceItem> => {
  assertKind(list, input.kind);
  try {
    return await prisma.$transaction(async (transaction) => {
      await authorize(transaction, actor);

      return createOne(transaction, input, actor.actor.id);
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) throw duplicateName();
    throw error;
  }
};

/** Fills an empty list with its common values, each traced. */
export const addCommonTreasuryChoices = async (
  list: TreasuryList,
  actor: TreasuryListActor,
): Promise<TreasuryChoiceItem[]> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      await authorize(transaction, actor);
      if (
        (await transaction.treasuryChoice.count({
          // eslint-disable-next-line security/detect-object-injection
          where: { kind: { in: [...TREASURY_LIST_KINDS[list]] } },
        })) > 0
      )
        throw choicesArrived();
      // eslint-disable-next-line security/detect-object-injection
      for (const common of COMMON_TREASURY_CHOICES[list])
        await createOne(
          transaction,
          { ...common, isActive: true },
          actor.actor.id,
        );

      return readList(transaction, list);
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) throw choicesArrived();
    throw error;
  }
};

/**
 * Edits a value under optimistic versioning. Renaming corrects a typo; a
 * used value keeps its kind (trigger `TreasuryChoice_kind_check`).
 */
export const updateTreasuryChoice = async (
  list: TreasuryList,
  id: string,
  input: TreasuryChoiceInput & { expectedVersion: number },
  actor: TreasuryListActor,
): Promise<TreasuryChoiceItem> => {
  assertKind(list, input.kind);
  try {
    return await prisma.$transaction(async (transaction) => {
      await authorize(transaction, actor);
      const previous = toItem(await findChoice(transaction, list, id));
      if (previous.version !== input.expectedVersion) throw choiceChanged();
      if (input.kind !== previous.kind && previous.useCount > 0)
        throw kindLocked();
      const before = auditValues(previous);
      const after = auditValues(input);
      const changes = changedKeys(before, after);
      if (changes.length === 0) return previous;
      const result = await transaction.treasuryChoice.updateMany({
        data: {
          isActive: input.isActive,
          kind: input.kind,
          name: input.name,
          normalizedName: normalizeSearchText(input.name),
          ...(input.kind === previous.kind
            ? {}
            : { position: await nextPosition(transaction, input.kind) }),
          version: { increment: 1 },
        },
        where: { id, version: input.expectedVersion },
      });
      if (result.count !== 1) throw choiceChanged();
      const item = toItem(
        await transaction.treasuryChoice.findUniqueOrThrow({
          include: WITH_USES,
          where: { id },
        }),
      );
      await audit(transaction, {
        action: 'TREASURY_CHOICE_UPDATE',
        actorId: actor.actor.id,
        after: pick(after, changes),
        before: pick(before, changes),
        changes,
        description: `${done(item.kind, 'modifié')} : ${item.name}`,
        item,
      });

      return item;
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) throw duplicateName();
    throw error;
  }
};

/**
 * Sets the order of one block, as its managers dragged it: the request names
 * every value of the block. One trace holds the order before and after;
 * answers the whole list.
 */
export const reorderTreasuryChoices = async (
  list: TreasuryList,
  input: Readonly<{ ids: readonly string[]; kind: TreasuryChoiceKind }>,
  actor: TreasuryListActor,
): Promise<TreasuryChoiceItem[]> => {
  assertKind(list, input.kind);

  return prisma.$transaction(async (transaction) => {
    await authorize(transaction, actor);
    await transaction.$queryRaw`SELECT "id" FROM "TreasuryChoice" WHERE "kind" = ${input.kind}::"TreasuryChoiceKind" ORDER BY "id" FOR UPDATE`;
    const plan = planManualOrder(
      (
        await transaction.treasuryChoice.findMany({
          include: WITH_USES,
          where: { kind: input.kind },
        })
      )
        .map(toItem)
        .sort(compareTreasuryChoices),
      input.ids,
    );
    if (!plan) throw groupChanged();
    if (plan.changed) {
      for (const { id, position } of plan.moves)
        await transaction.treasuryChoice.update({
          data: { position },
          where: { id },
        });
      const listLabel = TREASURY_CHOICE_KIND_LABELS[input.kind];
      await createAuditLogWithHeaders(
        {
          action: AuditAction.TREASURY_CHOICE_REORDER,
          category: AuditCategory.TREASURY_CHOICE,
          description: `Ordre modifié : ${listLabel}`,
          metadata: {
            after: { order: plan.after },
            before: { order: plan.before },
            changes: ['order'],
            listLabel,
            ...FEATURES.financialAccounts.audit,
          },
          targetUserId: null,
          userId: actor.actor.id,
        },
        { client: transaction, required: true },
      );
    }

    return readList(transaction, list);
  });
};

/**
 * Deletes a value created by mistake; one an operation names is refused by
 * the service and the base (`ON DELETE RESTRICT`).
 */
export const deleteTreasuryChoice = async (
  list: TreasuryList,
  id: string,
  expectedVersion: number,
  actor: TreasuryListActor,
): Promise<{ id: string }> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      await authorize(transaction, actor);
      const previous = toItem(await findChoice(transaction, list, id));
      if (previous.version !== expectedVersion) throw choiceChanged();
      if (previous.useCount > 0) throw choiceUsed();
      const result = await transaction.treasuryChoice.deleteMany({
        where: { id, version: expectedVersion },
      });
      if (result.count !== 1) throw choiceChanged();
      const before = auditValues(previous);
      await audit(transaction, {
        action: 'TREASURY_CHOICE_DELETE',
        actorId: actor.actor.id,
        after: null,
        before,
        changes: Object.keys(before),
        description: `${done(previous.kind, 'supprimé')} : ${previous.name}`,
        item: previous,
      });

      return { id };
    });
  } catch (error) {
    if (isPrismaForeignKeyError(error)) throw choiceUsed();
    throw error;
  }
};
