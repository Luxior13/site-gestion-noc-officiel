import 'server-only';

import { Prisma } from '@prisma/client';
import { AuditAction, AuditCategory } from '@repo/database';

import { FEATURES } from '$constants/feature-registry.constants';
import { PERMISSIONS } from '$constants/permissions.constants';
import {
  isPrismaForeignKeyError,
  isPrismaUniqueConstraintError,
} from '$server/api-response';
import { createAuditLogWithHeaders } from '$server/audit-log';
import {
  assertCoversGame,
  authorizeEsportAction,
  type EsportScope,
  gameScopeWhere,
} from '$server/esport-scope';
import { planManualOrder } from '$server/manual-order';
import { prisma } from '$server/prisma';
import { ServiceError, serviceErrors } from '$server/service-error';
import { authorizeUserAction } from '$server/user-action-authorization';
import { ErrorCode } from '$types/api.types';
import type { SessionType, UserType } from '$types/auth.types';
import { normalizeSearchText } from '$utils/search-text.utils';

import {
  commonFunctionsOf,
  compareMemberFunctions,
  functionKindsOf,
  type FunctionScope,
  type FunctionScopeType,
  type MemberFunctionKind,
  memberFunctionKindLabel,
} from '../member-function.constants';
import type {
  MemberFunctionInput,
  MemberFunctionItem,
} from '../types/member-function.types';

export type MemberFunctionActor = Readonly<{
  actor: Pick<UserType, 'id'>;
  session: SessionType | null;
}>;

/** The game is said for a game's function only. */
type AuditValues = Readonly<{
  game?: string;
  isActive: boolean;
  kind: string;
  name: string;
}>;

/**
 * The list a function belongs to, as the journal names it: a game, or the
 * structure, kept in Bureau & staff (9 November 2026).
 */
type ScopeRef = Readonly<{
  gameId: string | null;
  name: string;
  type: FunctionScopeType;
}>;

const STRUCTURE_REF: ScopeRef = {
  gameId: null,
  name: FEATURES.staff.label,
  type: 'structure',
};

const duplicateName = (scope: FunctionScopeType): ServiceError => {
  const message =
    scope === 'game'
      ? 'Ce jeu a déjà une fonction de ce nom.'
      : 'La structure a déjà une fonction de ce nom.';

  return new ServiceError(ErrorCode.CONFLICT, message, 409, {
    details: { name: [message] },
  });
};
const kindOutside = (): ServiceError =>
  new ServiceError(ErrorCode.VALIDATION_ERROR, 'Choisissez un type', 400, {
    details: { kind: ['Choisissez un type'] },
  });
const functionChanged = (): ServiceError =>
  serviceErrors.conflict(
    'Cette fonction a été modifiée entre-temps. Rechargez la liste avant de recommencer.',
  );
const functionMissing = (): ServiceError =>
  serviceErrors.notFound('Cette fonction n’existe plus. Rechargez la liste.');
const gameMissing = (): ServiceError =>
  serviceErrors.notFound('Ce jeu n’existe plus. Rechargez la liste.');
/** A reorder names every function of its group, as they are now. */
const groupChanged = (): ServiceError =>
  serviceErrors.conflict(
    'La liste des fonctions a changé entre-temps. Elle est rechargée : recommencez le déplacement.',
  );
/** The common functions only fill an empty list (owner, 9 November 2026). */
const functionsArrived = (): ServiceError =>
  serviceErrors.conflict(
    'Des fonctions ont été ajoutées entre-temps. Rechargez la liste.',
  );
/**
 * A function used by a passage stays in the history: it is made inactive.
 * The passages reference it with `ON DELETE RESTRICT`.
 */
const functionUsed = (): ServiceError =>
  serviceErrors.conflict(
    'Cette fonction a déjà servi : rendez-la inactive plutôt que de la supprimer.',
  );

/** Every read counts the passages: a used function says so, and stays. */
const WITH_USES = { _count: { select: { passages: true } } } as const;
type MemberFunctionRow = Prisma.MemberFunctionGetPayload<{
  include: typeof WITH_USES;
}>;

const toItem = (row: MemberFunctionRow): MemberFunctionItem => ({
  id: row.id,
  isActive: row.isActive,
  kind: row.kind,
  name: row.name,
  passageCount: row._count.passages,
  position: row.position,
  updatedAt: row.updatedAt.toISOString(),
  version: row.version,
});

/** What the journal shows: the game by its name, the kind by its label. */
const auditValues = (
  item: MemberFunctionInput | MemberFunctionItem,
  scope: ScopeRef,
): AuditValues => ({
  ...(scope.type === 'game' ? { game: scope.name } : {}),
  isActive: item.isActive,
  kind: memberFunctionKindLabel(item.kind, scope.type),
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

const editableData = (
  input: MemberFunctionInput,
): Pick<
  Prisma.MemberFunctionUncheckedCreateInput,
  'isActive' | 'kind' | 'name' | 'normalizedName'
> => ({
  isActive: input.isActive,
  kind: input.kind,
  name: input.name,
  normalizedName: normalizeSearchText(input.name),
});

/**
 * The list of functions; a game's only within the reader's Esport scope
 * (10 November 2026), the structure's outside of it.
 */
const resolveScope = async (
  client: Prisma.TransactionClient,
  scope: FunctionScope,
  esport: EsportScope,
): Promise<ScopeRef> => {
  if (scope.type === 'structure') return STRUCTURE_REF;
  const game = await client.game.findFirst({
    select: { id: true, name: true },
    // Both conditions: the scope's ids would be overwritten in one object.
    where: { AND: [gameScopeWhere(esport), { id: scope.gameId }] },
  });
  if (!game) throw gameMissing();

  return { gameId: game.id, name: game.name, type: 'game' };
};

/** No board in a game, no players in the structure: the base refuses it too. */
const assertKind = (scope: ScopeRef, kind: MemberFunctionKind): void => {
  if (!functionKindsOf(scope.type).includes(kind)) throw kindOutside();
};

/** The place after the last function of a group: a new one goes there. */
const nextPosition = async (
  client: Prisma.TransactionClient,
  scope: ScopeRef,
  kind: MemberFunctionKind,
): Promise<number> =>
  ((
    await client.memberFunction.aggregate({
      _max: { position: true },
      where: { gameId: scope.gameId, kind },
    })
  )._max.position ?? -1) + 1;

/** A function of this list: another list's function is « not found » here. */
const findFunction = async (
  client: Prisma.TransactionClient,
  scope: ScopeRef,
  id: string,
): Promise<MemberFunctionRow> => {
  const row = await client.memberFunction.findFirst({
    include: WITH_USES,
    where: { gameId: scope.gameId, id },
  });
  if (!row) throw functionMissing();

  return row;
};

const readList = async (
  client: Prisma.TransactionClient,
  scope: ScopeRef,
): Promise<MemberFunctionItem[]> =>
  (
    await client.memberFunction.findMany({
      include: WITH_USES,
      where: { gameId: scope.gameId },
    })
  )
    .map(toItem)
    .sort(compareMemberFunctions);

/**
 * Where the journal files a function: the game's record, or Bureau & staff
 * for the structure's.
 */
const locationOf = (scope: ScopeRef): Record<string, string> =>
  scope.type === 'game' && scope.gameId
    ? { gameId: scope.gameId, gameName: scope.name, ...FEATURES.games.audit }
    : { scopeName: scope.name, ...FEATURES.staff.audit };

const audit = async (
  transaction: Prisma.TransactionClient,
  input: {
    action: 'FUNCTION_CREATE' | 'FUNCTION_DELETE' | 'FUNCTION_UPDATE';
    actorId: string;
    after: Partial<AuditValues> | null;
    before: Partial<AuditValues> | null;
    changes: readonly string[];
    description: string;
    item: Pick<MemberFunctionItem, 'id' | 'name'>;
    scope: ScopeRef;
  },
): Promise<void> =>
  createAuditLogWithHeaders(
    {
      action: AuditAction[input.action],
      category: AuditCategory.FUNCTION,
      description: input.description,
      metadata: {
        after: input.after,
        before: input.before,
        changes: input.changes,
        functionId: input.item.id,
        functionName: input.item.name,
        ...locationOf(input.scope),
      },
      targetUserId: null,
      userId: input.actorId,
    },
    { client: transaction, required: true },
  );

/**
 * A game's functions follow the game, the structure's Bureau & staff. A
 * game's are shared by all its teams: changing them needs the whole game in
 * the actor's Esport scope.
 */
const openScope = async (
  transaction: Prisma.TransactionClient,
  scope: FunctionScope,
  { actor, session }: MemberFunctionActor,
): Promise<ScopeRef> => {
  if (scope.type === 'structure') {
    await authorizeUserAction(
      transaction,
      { actorId: actor.id, session },
      PERMISSIONS.STAFF.MANAGE,
    );

    return STRUCTURE_REF;
  }
  const esport = await authorizeEsportAction(
    transaction,
    { actorId: actor.id, session },
    PERMISSIONS.GAMES.MANAGE,
  );
  assertCoversGame(esport, scope.gameId, gameMissing);

  return resolveScope(transaction, scope, esport);
};

const createOne = async (
  transaction: Prisma.TransactionClient,
  scope: ScopeRef,
  input: MemberFunctionInput,
  actorId: string,
): Promise<MemberFunctionItem> => {
  assertKind(scope, input.kind);
  const item = toItem(
    await transaction.memberFunction.create({
      data: {
        ...editableData(input),
        gameId: scope.gameId,
        // Last of its group; its managers drag it higher if it matters more.
        position: await nextPosition(transaction, scope, input.kind),
      },
      include: WITH_USES,
    }),
  );
  const after = auditValues(item, scope);
  await audit(transaction, {
    action: 'FUNCTION_CREATE',
    actorId,
    after,
    before: null,
    changes: Object.keys(after),
    description: `Fonction ajoutée : ${item.name} (${scope.name})`,
    item,
    scope,
  });

  return item;
};

/**
 * The functions of a list: the players or the board first, then the staff,
 * each in its order.
 */
export const listFunctions = async (
  scope: FunctionScope,
  esport: EsportScope,
): Promise<MemberFunctionItem[]> =>
  readList(prisma, await resolveScope(prisma, scope, esport));

/** Adds a function to a list; its name is unique within the list. */
export const createFunction = async (
  scope: FunctionScope,
  input: MemberFunctionInput,
  actor: MemberFunctionActor,
): Promise<MemberFunctionItem> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const ref = await openScope(transaction, scope, actor);

      return createOne(transaction, ref, input, actor.actor.id);
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) throw duplicateName(scope.type);
    throw error;
  }
};

/**
 * Adds the common functions to a list that has none yet (Joueur, Coach… for
 * a game; Président, Graphiste… for the structure), each traced like a single
 * addition, in one transaction.
 */
export const addCommonFunctions = async (
  scope: FunctionScope,
  actor: MemberFunctionActor,
): Promise<MemberFunctionItem[]> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const ref = await openScope(transaction, scope, actor);
      if (
        (await transaction.memberFunction.count({
          where: { gameId: ref.gameId },
        })) > 0
      )
        throw functionsArrived();
      const items: MemberFunctionItem[] = [];
      for (const common of commonFunctionsOf(ref.type))
        items.push(
          await createOne(
            transaction,
            ref,
            { ...common, isActive: true },
            actor.actor.id,
          ),
        );

      return items.sort(compareMemberFunctions);
    });
  } catch (error) {
    // Two clicks at once: the second meets the first one's names.
    if (isPrismaUniqueConstraintError(error)) throw functionsArrived();
    throw error;
  }
};

/**
 * Edits a function under optimistic versioning. Renaming corrects a typo: a
 * function that changes becomes a new one, and the old one turns inactive
 * (registre historique). An unchanged form answers the current state.
 */
export const updateFunction = async (
  scope: FunctionScope,
  id: string,
  input: MemberFunctionInput & { expectedVersion: number },
  actor: MemberFunctionActor,
): Promise<MemberFunctionItem> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const current = await openScope(transaction, scope, actor);
      assertKind(current, input.kind);
      const previous = toItem(await findFunction(transaction, current, id));
      if (previous.version !== input.expectedVersion) throw functionChanged();
      const before = auditValues(previous, current);
      const after = auditValues(input, current);
      const changes = changedKeys(before, after);
      if (changes.length === 0) return previous;
      const result = await transaction.memberFunction.updateMany({
        data: {
          ...editableData(input),
          // Another kind: last of its new group.
          ...(input.kind === previous.kind
            ? {}
            : {
                position: await nextPosition(transaction, current, input.kind),
              }),
          version: { increment: 1 },
        },
        where: { gameId: current.gameId, id, version: input.expectedVersion },
      });
      if (result.count !== 1) throw functionChanged();
      const item = toItem(
        await transaction.memberFunction.findUniqueOrThrow({
          include: WITH_USES,
          where: { id },
        }),
      );
      await audit(transaction, {
        action: 'FUNCTION_UPDATE',
        actorId: actor.actor.id,
        after: pick(after, changes),
        before: pick(before, changes),
        changes,
        description: `Fonction modifiée : ${item.name} (${current.name})`,
        item,
        scope: current,
      });

      return item;
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) throw duplicateName(scope.type);
    throw error;
  }
};

/**
 * Sets the order of the functions of one group of a list (players, board or
 * staff), as its managers dragged it (owner, 9 November 2026). The request
 * names every function of the group: one added, deleted or moved to the
 * other group in between refuses it.
 * One order for every item of the list, active or not: an inactive item
 * never blocks (owner, 9 November 2026).
 * The order is not part of a function's version, so an edit window left open
 * stays valid; one trace holds the order before and after. Answers every
 * function of the list, in its new order.
 */
export const reorderFunctions = async (
  scope: FunctionScope,
  input: Readonly<{ ids: readonly string[]; kind: MemberFunctionKind }>,
  actor: MemberFunctionActor,
): Promise<MemberFunctionItem[]> =>
  prisma.$transaction(async (transaction) => {
    const ref = await openScope(transaction, scope, actor);
    assertKind(ref, input.kind);
    // One reorder of a group at a time: the second waits for the first to
    // commit, then reads its order as « before ».
    const ofList =
      ref.gameId === null
        ? Prisma.sql`"gameId" IS NULL`
        : Prisma.sql`"gameId" = ${ref.gameId}`;
    await transaction.$queryRaw`SELECT "id" FROM "MemberFunction" WHERE ${ofList} AND "kind" = ${input.kind}::"MemberFunctionKind" ORDER BY "id" FOR UPDATE`;
    const plan = planManualOrder(
      (
        await transaction.memberFunction.findMany({
          include: WITH_USES,
          where: { gameId: ref.gameId, kind: input.kind },
        })
      )
        .map(toItem)
        .sort(compareMemberFunctions),
      input.ids,
    );
    if (!plan) throw groupChanged();
    if (plan.changed) {
      for (const { id, position } of plan.moves)
        await transaction.memberFunction.update({
          data: { position },
          where: { id },
        });
      const kind = memberFunctionKindLabel(input.kind, ref.type);
      await createAuditLogWithHeaders(
        {
          action: AuditAction.FUNCTION_REORDER,
          category: AuditCategory.FUNCTION,
          description: `Ordre des fonctions modifié : ${kind} (${ref.name})`,
          metadata: {
            after: { order: plan.after },
            before: { order: plan.before },
            changes: ['order'],
            kind: input.kind,
            kindLabel: kind,
            ...locationOf(ref),
          },
          targetUserId: null,
          userId: actor.actor.id,
        },
        { client: transaction, required: true },
      );
    }

    return readList(transaction, ref);
  });

/**
 * Deletes a function created by mistake. A function used by a passage is
 * refused, by the service and the base (`ON DELETE RESTRICT`): it is made
 * inactive instead.
 */
export const deleteFunction = async (
  scope: FunctionScope,
  id: string,
  expectedVersion: number,
  actor: MemberFunctionActor,
): Promise<{ id: string }> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const ref = await openScope(transaction, scope, actor);
      const previous = toItem(await findFunction(transaction, ref, id));
      if (previous.version !== expectedVersion) throw functionChanged();
      const result = await transaction.memberFunction.deleteMany({
        where: { gameId: ref.gameId, id, version: expectedVersion },
      });
      if (result.count !== 1) throw functionChanged();
      const before = auditValues(previous, ref);
      await audit(transaction, {
        action: 'FUNCTION_DELETE',
        actorId: actor.actor.id,
        after: null,
        before,
        changes: Object.keys(before),
        description: `Fonction supprimée : ${previous.name} (${ref.name})`,
        item: previous,
        scope: ref,
      });

      return { id };
    });
  } catch (error) {
    if (isPrismaForeignKeyError(error)) throw functionUsed();
    throw error;
  }
};
