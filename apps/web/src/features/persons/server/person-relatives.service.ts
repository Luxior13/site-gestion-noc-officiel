import 'server-only';

import type { Prisma } from '@prisma/client';

import { PERMISSIONS } from '$constants/permissions.constants';
import { prisma } from '$server/prisma';

import { PERSON_AUDIT_KEYS, PERSON_LIMITS } from '../person.constants';
import { getPersonDisplayName } from '../person.ui';
import type {
  CreateEmergencyContactInput,
  CreateLegalGuardianInput,
  DeletePersonRelativeInput,
  UpdateEmergencyContactInput,
  UpdateLegalGuardianInput,
} from '../schemas/person-relatives.schemas';
import type { PersonDetail } from '../types/person.types';
import type { PersonAuditChange } from './person-audit';
import {
  auditContactMutation,
  childFieldChange,
} from './person-child-mutation';
import {
  mapPersonDetail,
  requirePersonDetailRecord,
  touchPerson,
} from './person-core.service';
import { personErrors } from './person-errors';
import {
  authorizePersonMutation,
  type PersonMutationActor,
} from './person-mutation-authorization';

/*
 * Emergency contacts and legal representatives of a record (10 November
 * 2026). Like the coordinates: the coordinates' right, the version of the
 * record read, and the trace in the same transaction, values encrypted.
 */

type Transaction = Prisma.TransactionClient;
type DetailRecord = Awaited<ReturnType<typeof requirePersonDetailRecord>>;

const EMERGENCY_FIELDS = ['name', 'relation', 'phone'] as const;
const EMERGENCY_FIELD_KEYS = {
  name: 'contactName',
  phone: 'phone',
  relation: 'relation',
} as const satisfies Record<(typeof EMERGENCY_FIELDS)[number], string>;

/** Authorized, read, and at the version the writer saw. */
const openRecord = async (
  transaction: Transaction,
  personId: string,
  personVersion: number,
  actor: PersonMutationActor,
): Promise<DetailRecord> => {
  await authorizePersonMutation(
    transaction,
    actor,
    PERMISSIONS.PERSONS.UPDATE_CONTACT,
    personId,
  );
  const person = await requirePersonDetailRecord(transaction, personId);
  if (person.version !== personVersion) throw personErrors.versionConflict();

  return person;
};

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

/** The number in the journal as « +33612345678 »: a new country shows. */
const emergencyValue = (
  contact: Readonly<{
    name: string;
    normalizedPhone: string;
    relation: string | null;
  }>,
  field: (typeof EMERGENCY_FIELDS)[number],
): string | null =>
  field === 'phone'
    ? contact.normalizedPhone
    : field === 'name'
      ? contact.name
      : contact.relation;

const emergencyChange = (
  field: (typeof EMERGENCY_FIELDS)[number],
  values: { after: unknown; before: unknown },
  changeType: PersonAuditChange['changeType'],
  recordId: string,
): PersonAuditChange =>
  childFieldChange({
    ...values,
    changeType,
    // `field` comes from the closed emergency-field tuple.
    // eslint-disable-next-line security/detect-object-injection
    fieldKey: EMERGENCY_FIELD_KEYS[field],
    recordId,
    sectionKey: PERSON_AUDIT_KEYS.sections.emergency,
    sensitive: true,
  });

export const addPersonEmergencyContact = async (
  personId: string,
  input: CreateEmergencyContactInput,
  actor: PersonMutationActor,
): Promise<PersonDetail> =>
  prisma.$transaction(async (transaction) => {
    const person = await openRecord(
      transaction,
      personId,
      input.personVersion,
      actor,
    );
    if (person.emergencyContacts.length >= PERSON_LIMITS.emergencyContacts)
      throw new RangeError('PERSON_EMERGENCY_CONTACT_LIMIT');
    await touchPerson(transaction, personId, input.personVersion);
    const contact = await transaction.personEmergencyContact.create({
      data: {
        name: input.name,
        normalizedPhone: input.normalizedPhone,
        personId,
        phone: input.phone,
        relation: input.relation,
      },
    });

    return finish(transaction, {
      actor,
      changes: EMERGENCY_FIELDS.flatMap((field) => {
        const after = emergencyValue(contact, field);

        return after === null
          ? []
          : [
              emergencyChange(
                field,
                { after, before: null },
                'CREATE',
                contact.id,
              ),
            ];
      }),
      description: 'Contact d’urgence ajouté à une fiche',
      personId,
    });
  });

export const updatePersonEmergencyContact = async (
  personId: string,
  contactId: string,
  input: UpdateEmergencyContactInput,
  actor: PersonMutationActor,
): Promise<PersonDetail> =>
  prisma.$transaction(async (transaction) => {
    const person = await openRecord(
      transaction,
      personId,
      input.personVersion,
      actor,
    );
    const current = person.emergencyContacts.find(
      (contact) => contact.id === contactId,
    );
    if (!current) throw personErrors.notFound();
    if (current.version !== input.version) throw personErrors.versionConflict();
    const changes = EMERGENCY_FIELDS.flatMap((field) => {
      const before = emergencyValue(current, field);
      const after = emergencyValue(input, field);

      return before === after
        ? []
        : [emergencyChange(field, { after, before }, 'UPDATE', contactId)];
    });
    // A number typed another way (« 06… » or « +33 6… ») is the same one.
    if (changes.length === 0 && current.phone === input.phone)
      return mapPersonDetail(transaction, person, actor);
    await touchPerson(transaction, personId, input.personVersion);
    const updated = await transaction.personEmergencyContact.updateMany({
      data: {
        name: input.name,
        normalizedPhone: input.normalizedPhone,
        phone: input.phone,
        relation: input.relation,
        version: { increment: 1 },
      },
      where: { id: contactId, personId, version: input.version },
    });
    if (updated.count !== 1) throw personErrors.versionConflict();

    return finish(transaction, {
      actor,
      changes,
      description: 'Contact d’urgence d’une fiche modifié',
      personId,
    });
  });

export const deletePersonEmergencyContact = async (
  personId: string,
  contactId: string,
  input: DeletePersonRelativeInput,
  actor: PersonMutationActor,
): Promise<PersonDetail> =>
  prisma.$transaction(async (transaction) => {
    const person = await openRecord(
      transaction,
      personId,
      input.personVersion,
      actor,
    );
    const current = person.emergencyContacts.find(
      (contact) => contact.id === contactId,
    );
    if (!current) throw personErrors.notFound();
    if (current.version !== input.version) throw personErrors.versionConflict();
    await touchPerson(transaction, personId, input.personVersion);
    const deleted = await transaction.personEmergencyContact.deleteMany({
      where: { id: contactId, personId, version: input.version },
    });
    if (deleted.count !== 1) throw personErrors.versionConflict();

    return finish(transaction, {
      actor,
      changes: EMERGENCY_FIELDS.flatMap((field) => {
        const before = emergencyValue(current, field);

        return before === null
          ? []
          : [
              emergencyChange(
                field,
                { after: null, before },
                'DELETE',
                contactId,
              ),
            ];
      }),
      description: 'Contact d’urgence supprimé d’une fiche',
      personId,
    });
  });

const guardianChanges = (
  link: { guardianName: string; id: string; relation: string },
  changeType: 'CREATE' | 'DELETE',
): PersonAuditChange[] =>
  (
    [
      ['guardian', link.guardianName],
      ['guardianRelation', link.relation],
    ] as const
  ).map(([fieldKey, value]) =>
    childFieldChange({
      after: changeType === 'CREATE' ? value : null,
      before: changeType === 'CREATE' ? null : value,
      changeType,
      fieldKey,
      recordId: link.id,
      sectionKey: PERSON_AUDIT_KEYS.sections.guardians,
      sensitive: true,
    }),
  );

/**
 * Links another record as a legal representative. The representative's row
 * is locked for the link, so a deletion running at the same time either
 * waits for it and is refused, or has already removed the record.
 */
export const addPersonLegalGuardian = async (
  personId: string,
  input: CreateLegalGuardianInput,
  actor: PersonMutationActor,
): Promise<PersonDetail> =>
  prisma.$transaction(async (transaction) => {
    const person = await openRecord(
      transaction,
      personId,
      input.personVersion,
      actor,
    );
    if (input.guardianId === personId)
      throw personErrors.guardianConflict(
        'Une fiche ne peut pas être son propre représentant légal.',
      );
    const existing = person.legalGuardians.find(
      (link) => link.guardianId === input.guardianId,
    );
    if (existing)
      throw personErrors.guardianConflict(
        `${getPersonDisplayName(existing.guardian)} est déjà représentant légal de cette fiche.`,
      );
    if (person.legalGuardians.length >= PERSON_LIMITS.legalGuardians)
      throw new RangeError('PERSON_LEGAL_GUARDIAN_LIMIT');
    const guardians = await transaction.$queryRaw<
      Array<{
        firstName: string | null;
        lastName: string | null;
        nickname: string | null;
      }>
    >`
      SELECT person."firstName", person."lastName", person."nickname"
      FROM "public"."Person" person
      WHERE person."id" = ${input.guardianId}
      FOR KEY SHARE
    `;
    const guardian = guardians[0];
    if (!guardian)
      throw personErrors.guardianConflict(
        'La fiche du représentant n’existe plus. Choisissez-en une autre.',
      );
    await touchPerson(transaction, personId, input.personVersion);
    const link = await transaction.personLegalGuardian.create({
      data: {
        guardianId: input.guardianId,
        personId,
        relation: input.relation,
      },
    });

    return finish(transaction, {
      actor,
      changes: guardianChanges(
        {
          guardianName: getPersonDisplayName(guardian),
          id: link.id,
          relation: link.relation,
        },
        'CREATE',
      ),
      description: 'Représentant légal ajouté à une fiche',
      personId,
    });
  });

export const updatePersonLegalGuardian = async (
  personId: string,
  linkId: string,
  input: UpdateLegalGuardianInput,
  actor: PersonMutationActor,
): Promise<PersonDetail> =>
  prisma.$transaction(async (transaction) => {
    const person = await openRecord(
      transaction,
      personId,
      input.personVersion,
      actor,
    );
    const current = person.legalGuardians.find((link) => link.id === linkId);
    if (!current) throw personErrors.notFound();
    if (current.version !== input.version) throw personErrors.versionConflict();
    if (current.relation === input.relation)
      return mapPersonDetail(transaction, person, actor);
    await touchPerson(transaction, personId, input.personVersion);
    const updated = await transaction.personLegalGuardian.updateMany({
      data: { relation: input.relation, version: { increment: 1 } },
      where: { id: linkId, personId, version: input.version },
    });
    if (updated.count !== 1) throw personErrors.versionConflict();

    return finish(transaction, {
      actor,
      changes: [
        childFieldChange({
          after: input.relation,
          before: current.relation,
          changeType: 'UPDATE',
          fieldKey: 'guardianRelation',
          recordId: linkId,
          sectionKey: PERSON_AUDIT_KEYS.sections.guardians,
          sensitive: true,
        }),
      ],
      description: 'Lien d’un représentant légal modifié',
      personId,
    });
  });

/** Removes the link; the representative's record stays in the Répertoire. */
export const deletePersonLegalGuardian = async (
  personId: string,
  linkId: string,
  input: DeletePersonRelativeInput,
  actor: PersonMutationActor,
): Promise<PersonDetail> =>
  prisma.$transaction(async (transaction) => {
    const person = await openRecord(
      transaction,
      personId,
      input.personVersion,
      actor,
    );
    const current = person.legalGuardians.find((link) => link.id === linkId);
    if (!current) throw personErrors.notFound();
    if (current.version !== input.version) throw personErrors.versionConflict();
    await touchPerson(transaction, personId, input.personVersion);
    const deleted = await transaction.personLegalGuardian.deleteMany({
      where: { id: linkId, personId, version: input.version },
    });
    if (deleted.count !== 1) throw personErrors.versionConflict();

    return finish(transaction, {
      actor,
      changes: guardianChanges(
        {
          guardianName: getPersonDisplayName(current.guardian),
          id: linkId,
          relation: current.relation,
        },
        'DELETE',
      ),
      description: 'Représentant légal retiré d’une fiche',
      personId,
    });
  });
