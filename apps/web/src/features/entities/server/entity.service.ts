import 'server-only';

import type { Prisma } from '@prisma/client';
import { AuditAction, AuditCategory } from '@repo/database';

import { FEATURES } from '$constants/feature-registry.constants';
import { PERMISSIONS } from '$constants/permissions.constants';
import { isPrismaUniqueConstraintError } from '$server/api-response';
import { createAuditLogWithHeaders } from '$server/audit-log';
import { prisma } from '$server/prisma';
import { ServiceError, serviceErrors } from '$server/service-error';
import { authorizeUserAction } from '$server/user-action-authorization';
import { ErrorCode } from '$types/api.types';
import type { SessionType, UserType } from '$types/auth.types';
import {
  type ApproximateDate,
  approximateDateEnd,
  formatApproximateDate,
  normalizeApproximateDate,
} from '$utils/approximate-date.utils';
import { normalizeSearchText } from '$utils/search-text.utils';

import { LEGAL_FORM_LABELS } from '../entity.constants';
import type {
  LegalEntityCreateInput,
  LegalEntityInput,
  LegalEntityItem,
} from '../types/entity.types';

export type EntityActor = Readonly<{
  actor: Pick<UserType, 'id'>;
  session: SessionType | null;
}>;

type AuditValues = Readonly<{
  end: string | null;
  form: string;
  headOffice: string | null;
  isPrincipal: boolean;
  name: string;
  rnaNumber: string | null;
  siretNumber: string | null;
  start: string;
}>;

const DUPLICATE_NAME = 'Une entité porte déjà ce nom.';

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
const entityChanged = (): ServiceError =>
  serviceErrors.conflict(
    'Cette entité a été modifiée entre-temps. Rechargez-la avant de recommencer.',
  );
const entityMissing = (): ServiceError =>
  serviceErrors.notFound('Cette entité n’existe plus. Rechargez la liste.');
const accountsLabel = (count: number): string =>
  count > 1 ? `${count} comptes` : 'un compte';

const WITH_COUNTS = { _count: { select: { accounts: true } } } as const;
type EntityRow = Prisma.LegalEntityGetPayload<{ include: typeof WITH_COUNTS }>;

const dateOnly = (value: Date): string => value.toISOString().slice(0, 10);
const asDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

/** The start at the start of its period; the end is stored at its end. */
const toItem = (row: EntityRow): LegalEntityItem => ({
  accountCount: row._count.accounts,
  end:
    row.endOn && row.endPrecision
      ? normalizeApproximateDate({
          date: dateOnly(row.endOn),
          precision: row.endPrecision,
        })
      : null,
  form: row.form,
  headOffice: row.headOffice,
  id: row.id,
  isPrincipal: row.isPrincipal,
  name: row.name,
  otherForm: row.otherForm,
  rnaNumber: row.rnaNumber,
  siretNumber: row.siretNumber,
  start: { date: dateOnly(row.startOn), precision: row.startPrecision },
  updatedAt: row.updatedAt.toISOString(),
  version: row.version,
});

/** « Association loi 1901 », or the name given to « Autre ». */
const formLabel = (
  value: Pick<LegalEntityItem, 'form' | 'otherForm'>,
): string =>
  value.form === 'OTHER' && value.otherForm
    ? value.otherForm
    : LEGAL_FORM_LABELS[value.form];

/** What the journal shows: readable values, dates as precisely as known. */
const auditValues = (
  value: LegalEntityInput | LegalEntityItem,
): AuditValues => ({
  end: value.end ? formatApproximateDate(value.end) : null,
  form: formLabel(value),
  headOffice: value.headOffice,
  isPrincipal: value.isPrincipal,
  name: value.name,
  rnaNumber: value.rnaNumber,
  siretNumber: value.siretNumber,
  start: formatApproximateDate(value.start),
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

const writeDates = (
  input: Readonly<{ end: ApproximateDate | null; start: ApproximateDate }>,
): Pick<
  Prisma.LegalEntityUncheckedCreateInput,
  'endOn' | 'endPrecision' | 'startOn' | 'startPrecision'
> => ({
  endOn: input.end ? asDate(approximateDateEnd(input.end)) : null,
  endPrecision: input.end?.precision ?? null,
  startOn: asDate(input.start.date),
  startPrecision: input.start.precision,
});

const writeData = (
  input: LegalEntityInput,
): Prisma.LegalEntityUncheckedCreateInput => ({
  ...writeDates(input),
  form: input.form,
  headOffice: input.headOffice,
  isPrincipal: input.isPrincipal,
  name: input.name,
  normalizedName: normalizeSearchText(input.name),
  otherForm: input.otherForm,
  rnaNumber: input.rnaNumber,
  siretNumber: input.siretNumber,
});

const audit = async (
  transaction: Prisma.TransactionClient,
  input: {
    action:
      'LEGAL_ENTITY_CREATE' | 'LEGAL_ENTITY_DELETE' | 'LEGAL_ENTITY_UPDATE';
    actorId: string;
    after: Partial<AuditValues> | null;
    before: Partial<AuditValues> | null;
    changes: readonly string[];
    description: string;
    entity: Pick<LegalEntityItem, 'id' | 'name'>;
  },
): Promise<void> =>
  createAuditLogWithHeaders(
    {
      action: AuditAction[input.action],
      category: AuditCategory.LEGAL_ENTITY,
      description: input.description,
      metadata: {
        after: input.after,
        before: input.before,
        changes: input.changes,
        entityId: input.entity.id,
        entityName: input.entity.name,
        ...FEATURES.entities.audit,
      },
      targetUserId: null,
      userId: input.actorId,
    },
    { client: transaction, required: true },
  );

/**
 * Who may change the entities, then every entity locked: the principal one
 * moves between rows, one change at a time (the second waits, then reads).
 */
const authorize = async (
  transaction: Prisma.TransactionClient,
  { actor, session }: EntityActor,
): Promise<void> => {
  await authorizeUserAction(
    transaction,
    { actorId: actor.id, session },
    PERMISSIONS.ENTITIES.MANAGE,
  );
  await transaction.$queryRaw`SELECT "id" FROM "LegalEntity" ORDER BY "id" FOR UPDATE`;
};

/** The entities in the order of time: the period before first. */
const readEntities = async (
  client: Prisma.TransactionClient,
): Promise<LegalEntityItem[]> =>
  (
    await client.legalEntity.findMany({
      include: WITH_COUNTS,
      orderBy: [{ startOn: 'asc' }, { name: 'asc' }],
    })
  ).map(toItem);

export const listEntities = (): Promise<LegalEntityItem[]> =>
  readEntities(prisma);

export const getEntity = async (id: string): Promise<LegalEntityItem> => {
  const row = await prisma.legalEntity.findUnique({
    include: WITH_COUNTS,
    where: { id },
  });
  if (!row) throw entityMissing();

  return toItem(row);
};

/**
 * Adds an entity. The first one with a legal form becomes the principal
 * entity by itself: with one, nobody ever chooses (règle 3).
 */
export const createEntity = async (
  input: LegalEntityCreateInput,
  context: EntityActor,
): Promise<LegalEntityItem> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      await authorize(transaction, context);
      const isPrincipal =
        input.form !== 'NONE' &&
        (await transaction.legalEntity.count({
          where: { isPrincipal: true },
        })) === 0;
      const full: LegalEntityInput = {
        ...input,
        headOffice: null,
        isPrincipal,
        rnaNumber: null,
        siretNumber: null,
      };
      const entity = toItem(
        await transaction.legalEntity.create({
          data: writeData(full),
          include: WITH_COUNTS,
        }),
      );
      const after = auditValues(entity);
      await audit(transaction, {
        action: 'LEGAL_ENTITY_CREATE',
        actorId: context.actor.id,
        after,
        before: null,
        changes: Object.keys(after),
        description: `Entité ajoutée : ${entity.name}`,
        entity,
      });

      return entity;
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error))
      throw fieldError('name', DUPLICATE_NAME, 409);
    throw error;
  }
};

/** The accounts an entity's period must still cover, by their opening date. */
const assertCoversAccounts = async (
  transaction: Prisma.TransactionClient,
  id: string,
  input: LegalEntityInput,
): Promise<void> => {
  const startOn = asDate(input.start.date);
  const endOn = input.end ? asDate(approximateDateEnd(input.end)) : null;
  const outside = await transaction.financialAccount.findFirst({
    orderBy: { openingOn: 'asc' },
    select: { name: true, openingOn: true },
    where: {
      entityId: id,
      OR: [
        { openingOn: { lt: startOn } },
        ...(endOn ? [{ openingOn: { gt: endOn } }] : []),
      ],
    },
  });
  if (!outside) return;
  const opened = formatApproximateDate({
    date: dateOnly(outside.openingOn),
    precision: 'DAY',
  });
  throw fieldError(
    outside.openingOn < startOn ? 'start' : 'end',
    `Le compte ${outside.name} part du ${opened} : la période de l’entité doit couvrir cette date.`,
    409,
  );
};

/**
 * Edits an entity under optimistic versioning. Making it the principal
 * entity takes the mark from the former one, traced on both; the mark is
 * never simply removed: another entity is made principal instead.
 */
export const updateEntity = async (
  id: string,
  request: LegalEntityInput & { expectedVersion: number },
  context: EntityActor,
): Promise<LegalEntityItem> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      await authorize(transaction, context);
      const previous = await transaction.legalEntity.findUnique({
        include: WITH_COUNTS,
        where: { id },
      });
      if (!previous) throw entityMissing();
      if (previous.version !== request.expectedVersion) throw entityChanged();
      // An entity that gains a legal form while none is principal takes the
      // mark, as the first one created does.
      const input: LegalEntityInput & { expectedVersion: number } =
        !request.isPrincipal &&
        request.form !== 'NONE' &&
        (await transaction.legalEntity.count({
          where: { isPrincipal: true },
        })) === 0
          ? { ...request, isPrincipal: true }
          : request;
      const current = toItem(previous);
      const before = auditValues(current);
      const after = auditValues(input);
      const changes = changedKeys(before, after);
      if (changes.length === 0) return current;
      if (current.isPrincipal && !input.isPrincipal)
        throw fieldError(
          'isPrincipal',
          'Il faut toujours une entité principale : rendez-en principale une autre.',
          400,
        );
      if (input.form === 'NONE' && current.accountCount > 0)
        throw fieldError(
          'form',
          `Cette entité a ${accountsLabel(current.accountCount)} : elle garde une forme juridique.`,
          409,
        );
      await assertCoversAccounts(transaction, id, input);
      const former =
        input.isPrincipal && !current.isPrincipal
          ? await transaction.legalEntity.findFirst({
              include: WITH_COUNTS,
              where: { id: { not: id }, isPrincipal: true },
            })
          : null;
      if (former) {
        await transaction.legalEntity.update({
          data: { isPrincipal: false, version: { increment: 1 } },
          where: { id: former.id },
        });
        await audit(transaction, {
          action: 'LEGAL_ENTITY_UPDATE',
          actorId: context.actor.id,
          after: { isPrincipal: false },
          before: { isPrincipal: true },
          changes: ['isPrincipal'],
          description: `Entité modifiée : ${former.name} (n’est plus l’entité principale)`,
          entity: former,
        });
      }
      const result = await transaction.legalEntity.updateMany({
        data: { ...writeData(input), version: { increment: 1 } },
        where: { id, version: input.expectedVersion },
      });
      if (result.count !== 1) throw entityChanged();
      const entity = toItem(
        await transaction.legalEntity.findUniqueOrThrow({
          include: WITH_COUNTS,
          where: { id },
        }),
      );
      await audit(transaction, {
        action: 'LEGAL_ENTITY_UPDATE',
        actorId: context.actor.id,
        after: pick(after, changes),
        before: pick(before, changes),
        changes,
        description: former
          ? `Entité modifiée : ${entity.name} (entité principale à la place de ${former.name})`
          : `Entité modifiée : ${entity.name}`,
        entity,
      });

      return entity;
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error))
      throw fieldError('name', DUPLICATE_NAME, 409);
    throw error;
  }
};

/**
 * Deletes an entity entered by mistake. One that holds accounts is refused
 * here and by the base (`FinancialAccount_entityId_fkey`, RESTRICT): its end
 * date is set instead. The principal entity goes only when no other entity
 * with a legal form could take its place.
 */
export const deleteEntity = async (
  id: string,
  expectedVersion: number,
  context: EntityActor,
): Promise<{ id: string }> =>
  prisma.$transaction(async (transaction) => {
    await authorize(transaction, context);
    const previous = await transaction.legalEntity.findUnique({
      include: WITH_COUNTS,
      where: { id },
    });
    if (!previous) throw entityMissing();
    if (previous.version !== expectedVersion) throw entityChanged();
    const entity = toItem(previous);
    if (entity.accountCount > 0)
      throw serviceErrors.conflict(
        `Cette entité a ${accountsLabel(entity.accountCount)} : indiquez sa date de fin plutôt que de la supprimer.`,
      );
    if (
      entity.isPrincipal &&
      (await transaction.legalEntity.count({
        where: { form: { not: 'NONE' }, id: { not: id } },
      })) > 0
    )
      throw serviceErrors.conflict(
        'C’est l’entité principale : rendez d’abord principale une autre entité.',
      );
    const result = await transaction.legalEntity.deleteMany({
      where: { id, version: expectedVersion },
    });
    if (result.count !== 1) throw entityChanged();
    const before = auditValues(entity);
    await audit(transaction, {
      action: 'LEGAL_ENTITY_DELETE',
      actorId: context.actor.id,
      after: null,
      before,
      changes: Object.keys(before),
      description: `Entité supprimée : ${entity.name}`,
      entity,
    });

    return { id };
  });
