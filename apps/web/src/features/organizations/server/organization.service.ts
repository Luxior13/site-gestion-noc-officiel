import 'server-only';

import type { Prisma } from '@prisma/client';
import { AuditAction, AuditCategory } from '@repo/database';

import { FEATURES } from '$constants/feature-registry.constants';
import {
  hasPermission,
  PERMISSIONS,
  type PermissionsData,
} from '$constants/permissions.constants';
import {
  PERSON_REF_SELECT,
  toPersonRef,
} from '$features/persons/server/person-suggestions';
import { isPrismaUniqueConstraintError } from '$server/api-response';
import { createAuditLogWithHeaders } from '$server/audit-log';
import { prisma } from '$server/prisma';
import { ServiceError, serviceErrors } from '$server/service-error';
import { authorizeUserAction } from '$server/user-action-authorization';
import { ErrorCode } from '$types/api.types';
import type { SessionType, UserType } from '$types/auth.types';
import { normalizeSearchText } from '$utils/search-text.utils';

import { ORGANIZATION_KINDS } from '../organization.constants';
import { kindsLabel } from '../organization.ui';
import type {
  OrganizationContactItem,
  OrganizationCreateInput,
  OrganizationDetail,
  OrganizationInput,
  OrganizationItem,
  OrganizerAdded,
} from '../types/organization.types';

export type OrganizationActor = Readonly<{
  actor: Pick<UserType, 'id'>;
  session: SessionType | null;
}>;

/** What the reader may see beside the organisations themselves. */
export type OrganizationReader = Readonly<{ canViewPersons: boolean }>;

type AuditValues = Readonly<{
  address: string | null;
  kinds: string;
  name: string;
  siretNumber: string | null;
  website: string | null;
}>;

const DUPLICATE_NAME = 'Une organisation porte déjà ce nom.';

export const fieldError = (
  field: string,
  message: string,
  status: 400 | 404 | 409,
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
const organizationChanged = (): ServiceError =>
  serviceErrors.conflict(
    'Cette organisation a été modifiée entre-temps. Rechargez-la avant de recommencer.',
  );
export const organizationMissing = (): ServiceError =>
  serviceErrors.notFound(
    'Cette organisation n’existe plus. Rechargez la liste.',
  );
const contactsLabel = (count: number): string =>
  count > 1 ? `ses ${count} contacts` : 'son contact';

const WITH_COUNTS = {
  _count: { select: { contacts: true, operations: true, tournaments: true } },
} as const;
type OrganizationRow = Prisma.OrganizationGetPayload<{
  include: typeof WITH_COUNTS;
}>;

const CONTACT_INCLUDE = {
  person: { select: PERSON_REF_SELECT },
} as const;
type ContactRow = Prisma.OrganizationContactGetPayload<{
  include: typeof CONTACT_INCLUDE;
}>;

const toItem = (row: OrganizationRow): OrganizationItem => ({
  address: row.address,
  contactCount: row._count.contacts,
  id: row.id,
  kinds: row.kinds,
  name: row.name,
  operationCount: row._count.operations,
  siretNumber: row.siretNumber,
  updatedAt: row.updatedAt.toISOString(),
  version: row.version,
  website: row.website,
});

const toContactItem = (
  row: ContactRow,
  reader: OrganizationReader,
): OrganizationContactItem => ({
  email: row.email,
  id: row.id,
  name: row.name,
  person: reader.canViewPersons && row.person ? toPersonRef(row.person) : null,
  personLinked: row.personId !== null,
  phone: row.phone,
  role: row.role,
  version: row.version,
});

/** What the journal shows: readable values. */
const auditValues = (value: OrganizationInput): AuditValues => ({
  address: value.address,
  kinds: kindsLabel(value.kinds),
  name: value.name,
  siretNumber: value.siretNumber,
  website: value.website,
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

const writeData = (
  input: OrganizationInput,
): Prisma.OrganizationUncheckedCreateInput => ({
  address: input.address,
  kinds: [...input.kinds],
  name: input.name,
  normalizedName: normalizeSearchText(input.name),
  siretNumber: input.siretNumber,
  website: input.website,
});

export const auditOrganization = async (
  transaction: Prisma.TransactionClient,
  input: {
    action:
      | 'ORGANIZATION_CONTACT_CREATE'
      | 'ORGANIZATION_CONTACT_DELETE'
      | 'ORGANIZATION_CONTACT_UPDATE'
      | 'ORGANIZATION_CREATE'
      | 'ORGANIZATION_DELETE'
      | 'ORGANIZATION_UPDATE';
    actorId: string;
    after: Record<string, unknown> | null;
    before: Record<string, unknown> | null;
    changes: readonly string[];
    contact?: Readonly<{ id: string; name: string }>;
    description: string;
    organization: Readonly<{ id: string; name: string }>;
  },
): Promise<void> =>
  createAuditLogWithHeaders(
    {
      action: AuditAction[input.action],
      category: AuditCategory.ORGANIZATION,
      description: input.description,
      metadata: {
        after: input.after,
        before: input.before,
        changes: input.changes,
        ...(input.contact
          ? { contactId: input.contact.id, contactName: input.contact.name }
          : {}),
        organizationId: input.organization.id,
        organizationName: input.organization.name,
        ...FEATURES.organizations.audit,
      },
      targetUserId: null,
      userId: input.actorId,
    },
    { client: transaction, required: true },
  );

/**
 * Who may change the organisations, checked again inside the transaction;
 * returns what the actor may read beside them (the Répertoire).
 */
export const authorizeOrganizationChange = async (
  transaction: Prisma.TransactionClient,
  { actor, session }: OrganizationActor,
): Promise<OrganizationReader> => {
  const { user } = await authorizeUserAction(
    transaction,
    { actorId: actor.id, session },
    PERMISSIONS.ORGANIZATIONS.MANAGE,
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

/** An organisation with its contacts, by name. */
export const readOrganizationDetail = async (
  client: Prisma.TransactionClient,
  id: string,
  reader: OrganizationReader,
): Promise<OrganizationDetail> => {
  const row = await client.organization.findUnique({
    include: {
      ...WITH_COUNTS,
      contacts: {
        include: CONTACT_INCLUDE,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      },
    },
    where: { id },
  });
  if (!row) throw organizationMissing();

  return {
    ...toItem(row),
    contacts: row.contacts.map((contact) => toContactItem(contact, reader)),
  };
};

/** Every organisation, by name; a few hundred at most, filtered on the page. */
export const listOrganizations = async (): Promise<OrganizationItem[]> =>
  (
    await prisma.organization.findMany({
      include: WITH_COUNTS,
      orderBy: [{ normalizedName: 'asc' }, { id: 'asc' }],
    })
  ).map(toItem);

export const getOrganization = (
  id: string,
  reader: OrganizationReader,
): Promise<OrganizationDetail> => readOrganizationDetail(prisma, id, reader);

/** A new organisation from its name and kinds, traced; returns its id. */
const insertOrganization = async (
  transaction: Prisma.TransactionClient,
  input: OrganizationCreateInput,
  actorId: string,
): Promise<string> => {
  const full: OrganizationInput = {
    ...input,
    address: null,
    siretNumber: null,
    website: null,
  };
  const created = await transaction.organization.create({
    data: writeData(full),
    select: { id: true },
  });
  const after = auditValues(full);
  await auditOrganization(transaction, {
    action: 'ORGANIZATION_CREATE',
    actorId,
    after: pick(after, ['name', 'kinds']),
    before: null,
    changes: ['name', 'kinds'],
    description: `Organisation ajoutée : ${input.name}`,
    organization: { id: created.id, name: input.name },
  });

  return created.id;
};

/** Adds an organisation from its name and kinds; its record does the rest. */
export const createOrganization = async (
  input: OrganizationCreateInput,
  context: OrganizationActor,
): Promise<OrganizationDetail> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const reader = await authorizeOrganizationChange(transaction, context);
      const id = await insertOrganization(transaction, input, context.actor.id);

      return readOrganizationDetail(transaction, id, reader);
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error))
      throw fieldError('name', DUPLICATE_NAME, 409);
    throw error;
  }
};

/**
 * The organiser typed in a tournament (owner, 12 November 2026: « si la
 * fiche existe elle est proposée, sinon […] créer la fiche avec le type
 * organisateur »): the organisation of that name, case and accents
 * ignored, given the kind Organisateur when it lacks it, or a new one of
 * that kind; its record does the rest.
 */
export const addOrganizer = async (
  name: string,
  context: OrganizationActor,
): Promise<OrganizerAdded> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      await authorizeOrganizationChange(transaction, context);
      const previous = await transaction.organization.findUnique({
        select: { id: true, kinds: true, name: true, version: true },
        where: { normalizedName: normalizeSearchText(name) },
      });
      if (!previous) {
        const id = await insertOrganization(
          transaction,
          { kinds: ['ORGANIZER'], name },
          context.actor.id,
        );

        return { organizer: { id, name }, outcome: 'created' };
      }
      const organizer = { id: previous.id, name: previous.name };
      if (previous.kinds.includes('ORGANIZER'))
        return { organizer, outcome: 'existing' };
      const kinds = ORGANIZATION_KINDS.filter(
        (kind) => kind === 'ORGANIZER' || previous.kinds.includes(kind),
      );
      const result = await transaction.organization.updateMany({
        data: { kinds, version: { increment: 1 } },
        where: { id: previous.id, version: previous.version },
      });
      if (result.count !== 1) throw organizationChanged();
      await auditOrganization(transaction, {
        action: 'ORGANIZATION_UPDATE',
        actorId: context.actor.id,
        after: { kinds: kindsLabel(kinds) },
        before: { kinds: kindsLabel(previous.kinds) },
        changes: ['kinds'],
        description: `Organisation modifiée : ${previous.name}`,
        organization: organizer,
      });

      return { organizer, outcome: 'kind-added' };
    });
  } catch (error) {
    // Added meanwhile under that name: a second try finds it.
    if (isPrismaUniqueConstraintError(error))
      throw fieldError(
        'name',
        'Cette organisation vient d’être ajoutée : réessayez.',
        409,
      );
    throw error;
  }
};

/** Edits an organisation's identity under optimistic versioning. */
export const updateOrganization = async (
  id: string,
  input: OrganizationInput & { expectedVersion: number },
  context: OrganizationActor,
): Promise<OrganizationDetail> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const reader = await authorizeOrganizationChange(transaction, context);
      const previous = await transaction.organization.findUnique({
        include: WITH_COUNTS,
        where: { id },
      });
      if (!previous) throw organizationMissing();
      if (previous.version !== input.expectedVersion)
        throw organizationChanged();
      const before = auditValues(toItem(previous));
      const after = auditValues(input);
      const changes = changedKeys(before, after);
      if (changes.length === 0)
        return readOrganizationDetail(transaction, id, reader);
      const result = await transaction.organization.updateMany({
        data: { ...writeData(input), version: { increment: 1 } },
        where: { id, version: input.expectedVersion },
      });
      if (result.count !== 1) throw organizationChanged();
      await auditOrganization(transaction, {
        action: 'ORGANIZATION_UPDATE',
        actorId: context.actor.id,
        after: pick(after, changes),
        before: pick(before, changes),
        changes,
        description: `Organisation modifiée : ${input.name}`,
        organization: { id, name: input.name },
      });

      return readOrganizationDetail(transaction, id, reader);
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error))
      throw fieldError('name', DUPLICATE_NAME, 409);
    throw error;
  }
};

/**
 * Deletes an organisation entered by mistake, its contacts with it. One
 * that paid or was paid stays: refused here and by the base (`ON DELETE
 * RESTRICT` of the operations).
 */
export const deleteOrganization = async (
  id: string,
  expectedVersion: number,
  context: OrganizationActor,
): Promise<{ id: string }> =>
  prisma.$transaction(async (transaction) => {
    await authorizeOrganizationChange(transaction, context);
    const previous = await transaction.organization.findUnique({
      include: WITH_COUNTS,
      where: { id },
    });
    if (!previous) throw organizationMissing();
    if (previous.version !== expectedVersion) throw organizationChanged();
    if (previous._count.operations > 0)
      throw serviceErrors.conflict(
        'Cette organisation a des opérations : elle reste, pour l’historique de la trésorerie.',
      );
    // An organiser stays with its tournaments (11 November 2026).
    if (previous._count.tournaments > 0)
      throw serviceErrors.conflict(
        'Cette organisation a organisé des tournois : elle reste, pour leur historique.',
      );
    const result = await transaction.organization.deleteMany({
      where: { id, version: expectedVersion },
    });
    if (result.count !== 1) throw organizationChanged();
    const organization = toItem(previous);
    const before = auditValues(organization);
    await auditOrganization(transaction, {
      action: 'ORGANIZATION_DELETE',
      actorId: context.actor.id,
      after: null,
      before,
      changes: Object.keys(before),
      description:
        organization.contactCount > 0
          ? `Organisation supprimée : ${organization.name}, avec ${contactsLabel(organization.contactCount)}`
          : `Organisation supprimée : ${organization.name}`,
      organization,
    });

    return { id };
  });
