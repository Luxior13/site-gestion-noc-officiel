import 'server-only';

import type { Prisma } from '@prisma/client';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

import { getPersonDisplayName } from '$features/persons/person.ui';
import { PERSON_REF_SELECT } from '$features/persons/server/person-suggestions';
import { isPrismaUniqueConstraintError } from '$server/api-response';
import { prisma } from '$server/prisma';
import { type ServiceError, serviceErrors } from '$server/service-error';

import { ORGANIZATION_CONTACTS_LIMIT } from '../organization.constants';
import type {
  OrganizationContactInput,
  OrganizationDetail,
} from '../types/organization.types';
import {
  auditOrganization,
  authorizeOrganizationChange,
  fieldError,
  type OrganizationActor,
  organizationMissing,
  type OrganizationReader,
  readOrganizationDetail,
} from './organization.service';

type ContactAuditValues = Readonly<{
  email: string | null;
  name: string;
  person: string | null;
  phone: string | null;
  role: string | null;
}>;

type ContactValues = Readonly<{
  email: string | null;
  name: string;
  personId: string | null;
  phone: string | null;
  role: string | null;
}>;

const contactChanged = (): ServiceError =>
  serviceErrors.conflict(
    'Ce contact a été modifié entre-temps. Rechargez l’organisation avant de recommencer.',
  );
const contactMissing = (): ServiceError =>
  serviceErrors.notFound('Ce contact n’existe plus. Rechargez l’organisation.');
const ALREADY_CONTACT =
  'Cette personne est déjà un contact de cette organisation.';

/**
 * The record of the Répertoire is named, never shown, in the journal: who
 * reads it sees that a record is linked (11 November 2026).
 */
const auditValues = (value: ContactValues): ContactAuditValues => ({
  email: value.email,
  name: value.name,
  person: value.personId ? 'Liée' : null,
  phone: value.phone
    ? (parsePhoneNumberFromString(value.phone)?.formatInternational() ??
      value.phone)
    : null,
  role: value.role,
});

const changedKeys = (
  before: ContactAuditValues,
  after: ContactAuditValues,
): (keyof ContactAuditValues)[] =>
  (Object.keys(after) as (keyof ContactAuditValues)[]).filter(
    // Keys come from the closed ContactAuditValues type.
    // eslint-disable-next-line security/detect-object-injection
    (key) => before[key] !== after[key],
  );

const pick = (
  values: ContactAuditValues,
  keys: readonly (keyof ContactAuditValues)[],
): Partial<ContactAuditValues> =>
  Object.fromEntries(
    // eslint-disable-next-line security/detect-object-injection
    keys.map((key) => [key, values[key]]),
  ) as Partial<ContactAuditValues>;

/** The organisation, locked: its contacts change one at a time. */
const lockOrganization = async (
  transaction: Prisma.TransactionClient,
  id: string,
): Promise<{ id: string; name: string }> => {
  const [row] = await transaction.$queryRaw<{ id: string; name: string }[]>`
    SELECT "id", "name" FROM "Organization" WHERE "id" = ${id} FOR UPDATE`;
  if (!row) throw organizationMissing();

  return row;
};

/**
 * What is stored: a linked record gives its name; without one, the typed
 * name is required. Linking or unlinking a record needs the Répertoire;
 * left out, `personId` keeps the current link.
 */
const resolveValues = async (
  transaction: Prisma.TransactionClient,
  input: OrganizationContactInput,
  currentPersonId: string | null,
  reader: OrganizationReader,
): Promise<ContactValues> => {
  const personId =
    input.personId === undefined ? currentPersonId : input.personId;
  if (personId !== currentPersonId && !reader.canViewPersons)
    throw serviceErrors.forbidden(
      'Relier une fiche du Répertoire demande d’avoir accès au Répertoire.',
    );
  const base = { email: input.email, phone: input.phone, role: input.role };
  if (!personId) {
    if (!input.name) throw fieldError('name', 'Le nom est obligatoire', 400);

    return { ...base, name: input.name, personId: null };
  }
  const person = await transaction.person.findUnique({
    select: PERSON_REF_SELECT,
    where: { id: personId },
  });
  if (!person)
    throw fieldError(
      'personId',
      'Cette fiche n’existe plus dans le Répertoire.',
      404,
    );

  return {
    ...base,
    name: getPersonDisplayName(person).slice(0, 100),
    personId,
  };
};

const translateUnique = (error: unknown): unknown =>
  isPrismaUniqueConstraintError(error)
    ? fieldError('personId', ALREADY_CONTACT, 409)
    : error;

/** Adds a person to reach at an organisation. */
export const createOrganizationContact = async (
  organizationId: string,
  input: OrganizationContactInput,
  context: OrganizationActor,
): Promise<OrganizationDetail> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const reader = await authorizeOrganizationChange(transaction, context);
      const organization = await lockOrganization(transaction, organizationId);
      const count = await transaction.organizationContact.count({
        where: { organizationId },
      });
      if (count >= ORGANIZATION_CONTACTS_LIMIT)
        throw serviceErrors.conflict(
          `Une organisation garde ${ORGANIZATION_CONTACTS_LIMIT} contacts au plus : retirez d’abord ceux qui sont partis.`,
        );
      const values = await resolveValues(transaction, input, null, reader);
      const contact = await transaction.organizationContact.create({
        data: { ...values, organizationId },
        select: { id: true, name: true },
      });
      const after = auditValues(values);
      const changes = changedKeys(
        { email: null, name: '', person: null, phone: null, role: null },
        after,
      );
      await auditOrganization(transaction, {
        action: 'ORGANIZATION_CONTACT_CREATE',
        actorId: context.actor.id,
        after: pick(after, changes),
        before: null,
        changes,
        contact,
        description: `Contact ajouté : ${contact.name} (${organization.name})`,
        organization,
      });

      return readOrganizationDetail(transaction, organizationId, reader);
    });
  } catch (error) {
    throw translateUnique(error);
  }
};

/**
 * Edits a contact under optimistic versioning. Left out, `personId` keeps
 * the current link, and the name keeps following its record.
 */
export const updateOrganizationContact = async (
  organizationId: string,
  contactId: string,
  input: OrganizationContactInput & { expectedVersion: number },
  context: OrganizationActor,
): Promise<OrganizationDetail> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const reader = await authorizeOrganizationChange(transaction, context);
      const organization = await lockOrganization(transaction, organizationId);
      const current = await transaction.organizationContact.findFirst({
        where: { id: contactId, organizationId },
      });
      if (!current) throw contactMissing();
      if (current.version !== input.expectedVersion) throw contactChanged();
      const values = await resolveValues(
        transaction,
        input,
        current.personId,
        reader,
      );
      const before = auditValues(current);
      const after = auditValues(values);
      const changes = changedKeys(before, after);
      if (changes.length === 0 && current.personId === values.personId)
        return readOrganizationDetail(transaction, organizationId, reader);
      const result = await transaction.organizationContact.updateMany({
        data: { ...values, version: { increment: 1 } },
        where: { id: contactId, version: input.expectedVersion },
      });
      if (result.count !== 1) throw contactChanged();
      // Another record linked in place of one: the change is still named.
      const named = changes.length > 0 ? changes : (['person'] as const);
      await auditOrganization(transaction, {
        action: 'ORGANIZATION_CONTACT_UPDATE',
        actorId: context.actor.id,
        after: pick(after, named),
        before: pick(before, named),
        changes: named,
        contact: { id: contactId, name: values.name },
        description: `Contact modifié : ${values.name} (${organization.name})`,
        organization,
      });

      return readOrganizationDetail(transaction, organizationId, reader);
    });
  } catch (error) {
    throw translateUnique(error);
  }
};

/** Removes a contact: someone who left the organisation, or a mistake. */
export const deleteOrganizationContact = async (
  organizationId: string,
  contactId: string,
  expectedVersion: number,
  context: OrganizationActor,
): Promise<OrganizationDetail> =>
  prisma.$transaction(async (transaction) => {
    const reader = await authorizeOrganizationChange(transaction, context);
    const organization = await lockOrganization(transaction, organizationId);
    const current = await transaction.organizationContact.findFirst({
      where: { id: contactId, organizationId },
    });
    if (!current) throw contactMissing();
    if (current.version !== expectedVersion) throw contactChanged();
    const result = await transaction.organizationContact.deleteMany({
      where: { id: contactId, version: expectedVersion },
    });
    if (result.count !== 1) throw contactChanged();
    const before = auditValues(current);
    const changes = changedKeys(before, {
      email: null,
      name: '',
      person: null,
      phone: null,
      role: null,
    });
    await auditOrganization(transaction, {
      action: 'ORGANIZATION_CONTACT_DELETE',
      actorId: context.actor.id,
      after: null,
      before: pick(before, changes),
      changes,
      contact: { id: contactId, name: current.name },
      description: `Contact supprimé : ${current.name} (${organization.name})`,
      organization,
    });

    return readOrganizationDetail(transaction, organizationId, reader);
  });
