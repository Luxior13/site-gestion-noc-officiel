import 'server-only';

import type { MemberFunction, Prisma } from '@prisma/client';
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
  COMMON_GAME_FUNCTIONS,
  compareMemberFunctions,
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

type AuditValues = Readonly<{
  game: string;
  isActive: boolean;
  kind: string;
  name: string;
}>;

type GameRef = Readonly<{ id: string; name: string }>;

const DUPLICATE_NAME = 'Ce jeu a déjà une fonction de ce nom.';

const duplicateName = (): ServiceError =>
  new ServiceError(ErrorCode.CONFLICT, DUPLICATE_NAME, 409, {
    details: { name: [DUPLICATE_NAME] },
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
 * The roster's passages will reference it with `ON DELETE RESTRICT`.
 */
const functionUsed = (): ServiceError =>
  serviceErrors.conflict(
    'Cette fonction a déjà servi : rendez-la inactive plutôt que de la supprimer.',
  );

const toItem = (row: MemberFunction): MemberFunctionItem => ({
  id: row.id,
  isActive: row.isActive,
  kind: row.kind,
  name: row.name,
  position: row.position,
  updatedAt: row.updatedAt.toISOString(),
  version: row.version,
});

/** What the journal shows: the game by its name, the kind by its label. */
const auditValues = (
  item: MemberFunctionInput | MemberFunctionItem,
  game: GameRef,
): AuditValues => ({
  game: game.name,
  isActive: item.isActive,
  kind: memberFunctionKindLabel(item.kind),
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

const findGame = async (
  client: Prisma.TransactionClient,
  id: string,
): Promise<GameRef> => {
  const game = await client.game.findUnique({
    select: { id: true, name: true },
    where: { id },
  });
  if (!game) throw gameMissing();

  return game;
};

/** The place after the last function of a group: a new one goes there. */
const nextPosition = async (
  client: Prisma.TransactionClient,
  gameId: string,
  kind: MemberFunctionKind,
): Promise<number> =>
  ((
    await client.memberFunction.aggregate({
      _max: { position: true },
      where: { gameId, kind },
    })
  )._max.position ?? -1) + 1;

/** A function of this game: another game's function is « not found » here. */
const findFunction = async (
  client: Prisma.TransactionClient,
  gameId: string,
  id: string,
): Promise<MemberFunction> => {
  const row = await client.memberFunction.findFirst({ where: { gameId, id } });
  if (!row) throw functionMissing();

  return row;
};

const audit = async (
  transaction: Prisma.TransactionClient,
  input: {
    action: 'FUNCTION_CREATE' | 'FUNCTION_DELETE' | 'FUNCTION_UPDATE';
    actorId: string;
    after: Partial<AuditValues> | null;
    before: Partial<AuditValues> | null;
    changes: readonly string[];
    description: string;
    game: GameRef;
    item: Pick<MemberFunctionItem, 'id' | 'name'>;
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
        gameId: input.game.id,
        gameName: input.game.name,
        // The functions of a game are managed in its record.
        ...FEATURES.games.audit,
      },
      targetUserId: null,
      userId: input.actorId,
    },
    { client: transaction, required: true },
  );

const authorize = (
  transaction: Prisma.TransactionClient,
  { actor, session }: MemberFunctionActor,
): Promise<unknown> =>
  authorizeUserAction(
    transaction,
    { actorId: actor.id, session },
    PERMISSIONS.GAMES.MANAGE,
  );

const createOne = async (
  transaction: Prisma.TransactionClient,
  game: GameRef,
  input: MemberFunctionInput,
  actorId: string,
): Promise<MemberFunctionItem> => {
  const item = toItem(
    await transaction.memberFunction.create({
      data: {
        ...editableData(input),
        gameId: game.id,
        // Last of its group; its managers drag it higher if it matters more.
        position: await nextPosition(transaction, game.id, input.kind),
      },
    }),
  );
  const after = auditValues(item, game);
  await audit(transaction, {
    action: 'FUNCTION_CREATE',
    actorId,
    after,
    before: null,
    changes: Object.keys(after),
    description: `Fonction ajoutée : ${item.name} (${game.name})`,
    game,
    item,
  });

  return item;
};

/** The functions of a game: players first, then the staff, each in its order. */
export const listGameFunctions = async (
  gameId: string,
): Promise<MemberFunctionItem[]> => {
  await findGame(prisma, gameId);

  return (await prisma.memberFunction.findMany({ where: { gameId } }))
    .map(toItem)
    .sort(compareMemberFunctions);
};

/** Adds a function to a game; its name is unique within the game. */
export const createGameFunction = async (
  gameId: string,
  input: MemberFunctionInput,
  actor: MemberFunctionActor,
): Promise<MemberFunctionItem> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      await authorize(transaction, actor);
      const game = await findGame(transaction, gameId);

      return createOne(transaction, game, input, actor.actor.id);
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) throw duplicateName();
    throw error;
  }
};

/**
 * Adds Joueur, Remplaçant, Coach, Manager and Analyste to a game that has no
 * function yet, each traced like a single addition, in one transaction.
 */
export const addCommonGameFunctions = async (
  gameId: string,
  actor: MemberFunctionActor,
): Promise<MemberFunctionItem[]> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      await authorize(transaction, actor);
      const game = await findGame(transaction, gameId);
      if ((await transaction.memberFunction.count({ where: { gameId } })) > 0)
        throw functionsArrived();
      const items: MemberFunctionItem[] = [];
      for (const common of COMMON_GAME_FUNCTIONS)
        items.push(
          await createOne(
            transaction,
            game,
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
export const updateGameFunction = async (
  gameId: string,
  id: string,
  input: MemberFunctionInput & { expectedVersion: number },
  actor: MemberFunctionActor,
): Promise<MemberFunctionItem> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      await authorize(transaction, actor);
      const game = await findGame(transaction, gameId);
      const previous = toItem(await findFunction(transaction, gameId, id));
      if (previous.version !== input.expectedVersion) throw functionChanged();
      const before = auditValues(previous, game);
      const after = auditValues(input, game);
      const changes = changedKeys(before, after);
      if (changes.length === 0) return previous;
      const result = await transaction.memberFunction.updateMany({
        data: {
          ...editableData(input),
          // Another kind: last of its new group.
          ...(input.kind === previous.kind
            ? {}
            : {
                position: await nextPosition(transaction, gameId, input.kind),
              }),
          version: { increment: 1 },
        },
        where: { gameId, id, version: input.expectedVersion },
      });
      if (result.count !== 1) throw functionChanged();
      const item = toItem(
        await transaction.memberFunction.findUniqueOrThrow({ where: { id } }),
      );
      await audit(transaction, {
        action: 'FUNCTION_UPDATE',
        actorId: actor.actor.id,
        after: pick(after, changes),
        before: pick(before, changes),
        changes,
        description: `Fonction modifiée : ${item.name} (${game.name})`,
        game,
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
 * Sets the order of the functions of one group of a game (players or staff),
 * as its managers dragged it (owner, 9 November 2026). The request names
 * every function of the group: one added, deleted or moved to the other
 * group in between refuses it.
 * One order for every item of the list, active or not: an inactive item
 * never blocks (owner, 9 November 2026).
 * The order is not part of a function's version, so an edit window left open
 * stays valid; one trace holds the order before and after. Answers every
 * function of the game, in its new order.
 */
export const reorderGameFunctions = async (
  gameId: string,
  input: Readonly<{ ids: readonly string[]; kind: MemberFunctionKind }>,
  actor: MemberFunctionActor,
): Promise<MemberFunctionItem[]> =>
  prisma.$transaction(async (transaction) => {
    await authorize(transaction, actor);
    const game = await findGame(transaction, gameId);
    // One reorder of a group at a time: the second waits for the first to
    // commit, then reads its order as « before ».
    await transaction.$queryRaw`SELECT "id" FROM "MemberFunction" WHERE "gameId" = ${gameId} AND "kind" = ${input.kind}::"MemberFunctionKind" ORDER BY "id" FOR UPDATE`;
    const plan = planManualOrder(
      (
        await transaction.memberFunction.findMany({
          where: { gameId, kind: input.kind },
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
      const kind = memberFunctionKindLabel(input.kind);
      await createAuditLogWithHeaders(
        {
          action: AuditAction.FUNCTION_REORDER,
          category: AuditCategory.FUNCTION,
          description: `Ordre des fonctions modifié : ${kind} (${game.name})`,
          metadata: {
            after: { order: plan.after },
            before: { order: plan.before },
            changes: ['order'],
            gameId: game.id,
            gameName: game.name,
            kind: input.kind,
            kindLabel: kind,
            ...FEATURES.games.audit,
          },
          targetUserId: null,
          userId: actor.actor.id,
        },
        { client: transaction, required: true },
      );
    }

    return (await transaction.memberFunction.findMany({ where: { gameId } }))
      .map(toItem)
      .sort(compareMemberFunctions);
  });

/**
 * Deletes a function created by mistake. Nothing uses a function yet; the
 * roster's passages will, with `ON DELETE RESTRICT`, and a used function is
 * then refused here: it is made inactive instead.
 */
export const deleteGameFunction = async (
  gameId: string,
  id: string,
  expectedVersion: number,
  actor: MemberFunctionActor,
): Promise<{ id: string }> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      await authorize(transaction, actor);
      const game = await findGame(transaction, gameId);
      const previous = toItem(await findFunction(transaction, gameId, id));
      if (previous.version !== expectedVersion) throw functionChanged();
      const result = await transaction.memberFunction.deleteMany({
        where: { gameId, id, version: expectedVersion },
      });
      if (result.count !== 1) throw functionChanged();
      const before = auditValues(previous, game);
      await audit(transaction, {
        action: 'FUNCTION_DELETE',
        actorId: actor.actor.id,
        after: null,
        before,
        changes: Object.keys(before),
        description: `Fonction supprimée : ${previous.name} (${game.name})`,
        game,
        item: previous,
      });

      return { id };
    });
  } catch (error) {
    if (isPrismaForeignKeyError(error)) throw functionUsed();
    throw error;
  }
};
