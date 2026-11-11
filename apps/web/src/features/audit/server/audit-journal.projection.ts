import 'server-only';

import type { AuditFieldChange, AuditLog } from '@prisma/client';

import { countryName } from '$constants/countries.constants';
import { FEATURES } from '$constants/feature-registry.constants';
import {
  getAccessLabel,
  getPermissionItem,
  hasPermission,
  PERMISSIONS,
} from '$constants/permissions.constants';
import { personDetailPath, userDetailPath } from '$constants/routes.constants';
import { getSystemSettingDefinition } from '$constants/system-setting-catalog.constants';
import {
  getPersonSocialNetwork,
  LEGAL_GUARDIAN_RELATION_LABELS,
  PERSON_STRUCTURE_STATUS_LABELS,
} from '$features/persons/person.constants';
import {
  decodePlainPersonAuditValues,
  decryptPersonAuditValues,
} from '$features/persons/server/person-audit';
import { formatDaysAsYears } from '$features/settings/system-settings-page.helpers';
import type { UserType } from '$types/auth.types';
import {
  describeUserAgent,
  formatIpAddress,
} from '$utils/session-display.utils';

import type {
  JournalChange,
  JournalEvent,
  JournalFact,
  JournalTone,
} from '../types/audit-journal.types';
import {
  BLOCKED_ATTEMPT_PROOFS,
  BLOCKED_ATTEMPT_STEPS,
  FINANCIAL_ACCOUNT_FIELD_LABELS,
  FUNCTION_FIELD_LABELS,
  GAME_FIELD_LABELS,
  JOURNAL_ACTION_LABELS,
  LEGAL_ENTITY_FIELD_LABELS,
  LOGIN_FAILURE_REASONS,
  PASSAGE_FIELD_LABELS,
  PERSON_FIELD_LABELS,
  PERSON_SECTION_LABELS,
  STEP_UP_FAILURE_REASONS,
  TEAM_FIELD_LABELS,
  USER_FIELD_LABELS,
} from './audit-journal.labels';

export type JournalReader = Pick<
  UserType,
  'id' | 'isProtected' | 'permissions' | 'role'
>;

export type JournalRow = AuditLog & { fieldChanges: AuditFieldChange[] };

type ReaderRights = {
  /** Balances and names of the accounts (10 November 2026). */
  canViewFinancialAccounts: boolean;
  canViewPersonContacts: boolean;
  canViewPersons: boolean;
  canViewUserContacts: boolean;
  canViewUsers: boolean;
  isProtected: boolean;
};

export const getReaderRights = (reader: JournalReader): ReaderRights => {
  const can = (key: string): boolean =>
    reader.isProtected || hasPermission(reader.role, key, reader.permissions);

  return {
    canViewFinancialAccounts: can(PERMISSIONS.FINANCIAL_ACCOUNTS.VIEW),
    canViewPersonContacts: can(PERMISSIONS.PERSONS.VIEW_CONTACT),
    canViewPersons: can(PERMISSIONS.PERSONS.VIEW),
    canViewUserContacts: can(PERMISSIONS.USERS.VIEW_CONTACT),
    canViewUsers: can(PERMISSIONS.USERS.VIEW),
    isProtected: reader.isProtected,
  };
};

const EMPTY = '—';
const MASKED = 'Valeur masquée';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/u;

const formatCount = (value: number): string => value.toLocaleString('fr-FR');

/** The catalogue label reads « Journal d’activité », the journal names the setting. */
const SETTING_JOURNAL_LABELS: Readonly<Record<string, string>> = {
  'audit.retentionDays': 'Conservation du journal d’activité',
};

const formatValue = (fieldKey: string, value: unknown): string => {
  if (value === null || value === undefined || value === '') return EMPTY;
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (fieldKey === 'structureStatus' && typeof value === 'string')
    return (
      PERSON_STRUCTURE_STATUS_LABELS[
        value as keyof typeof PERSON_STRUCTURE_STATUS_LABELS
      ] ?? value
    );
  if (fieldKey === 'networkKey' && typeof value === 'string')
    return getPersonSocialNetwork(value)?.label ?? value;
  if (fieldKey === 'nationality' && typeof value === 'string')
    return countryName(value);
  if (fieldKey === 'guardianRelation' && typeof value === 'string')
    return (
      LEGAL_GUARDIAN_RELATION_LABELS[
        value as keyof typeof LEGAL_GUARDIAN_RELATION_LABELS
      ] ?? value
    );
  if (fieldKey === 'role' && typeof value === 'string')
    return getAccessLabel({ isProtected: false, role: value });
  if (typeof value === 'string' && DATE_ONLY.test(value))
    return new Date(`${value}T00:00:00Z`).toLocaleDateString('fr-FR', {
      timeZone: 'UTC',
    });
  if (typeof value === 'string' || typeof value === 'number')
    return String(value);

  return EMPTY;
};

/** Sections read with the coordinates (`persons:view_contact`). */
const CONTACT_SECTIONS: ReadonlySet<string> = new Set([
  'contacts',
  'emergency',
  'guardians',
  'online',
  'social',
]);

/** A section's values follow the right that shows them in the Répertoire. */
const canReadPersonSection = (
  sectionKey: string,
  rights: ReaderRights,
): boolean =>
  CONTACT_SECTIONS.has(sectionKey)
    ? rights.canViewPersonContacts
    : rights.canViewPersons;

const projectPersonChange = (
  row: JournalRow,
  change: AuditFieldChange,
  rights: ReaderRights,
): JournalChange => {
  const field = PERSON_FIELD_LABELS[change.fieldKey] ?? change.fieldKey;
  const names = {
    field,
    label: [
      PERSON_SECTION_LABELS[change.sectionKey] ?? change.sectionKey,
      field,
    ].join(' · '),
  };
  if (change.valueMode === 'NONE')
    return { after: 'Valeur effacée', before: 'Valeur effacée', ...names };
  if (!canReadPersonSection(change.sectionKey, rights))
    return { after: MASKED, before: MASKED, ...names };

  let values: { after: unknown; before: unknown };
  try {
    values =
      change.valueMode === 'ENCRYPTED' &&
      change.valuesCiphertext &&
      change.valuesIv &&
      change.valuesAuthTag &&
      change.valueKeyVersion !== null
        ? decryptPersonAuditValues({
            auditLogId: row.id,
            changeType: change.changeType,
            entityId: change.entityId,
            fieldKey: change.fieldKey,
            recordId: change.recordId,
            sectionKey: change.sectionKey,
            valueKeyVersion: change.valueKeyVersion,
            valuesAuthTag: change.valuesAuthTag,
            valuesCiphertext: change.valuesCiphertext,
            valuesIv: change.valuesIv,
          })
        : decodePlainPersonAuditValues(change);
  } catch {
    return { after: 'Valeur illisible', before: 'Valeur illisible', ...names };
  }

  return {
    after: formatValue(change.fieldKey, values.after),
    before: formatValue(change.fieldKey, values.before),
    ...names,
  };
};

/** The label already says it: « Compte désactivé » needs no « Compte actif ». */
const ACTIVE_STATE_ACTIONS: ReadonlySet<string> = new Set([
  'USER_ACTIVATE',
  'USER_DEACTIVATE',
]);

const projectUserChanges = (
  row: JournalRow,
  metadata: Record<string, unknown>,
  rights: ReaderRights,
): JournalChange[] => {
  const before = isRecord(metadata.before) ? metadata.before : {};
  const after = isRecord(metadata.after) ? metadata.after : {};

  return USER_FIELD_LABELS.flatMap(([key, label]) => {
    if (!Object.hasOwn(before, key) && !Object.hasOwn(after, key)) return [];
    if (key === 'isActive' && ACTIVE_STATE_ACTIONS.has(row.action)) return [];
    if (key === 'contactEmail' && !rights.canViewUserContacts)
      return [{ after: MASKED, before: MASKED, label }];

    return [
      {
        // Keys come from the fixed USER_FIELD_LABELS list.
        // eslint-disable-next-line security/detect-object-injection
        after: formatValue(key, after[key]),
        // eslint-disable-next-line security/detect-object-injection
        before: formatValue(key, before[key]),
        label,
      },
    ];
  });
};

/**
 * A game, a team or a function records its readable values in `before` /
 * `after` (8 and 9 November 2026); the labels list fixes their names and order.
 */
const projectReadableChanges = (
  metadata: Record<string, unknown>,
  labels: ReadonlyArray<readonly [string, string]>,
): JournalChange[] => {
  const before = isRecord(metadata.before) ? metadata.before : {};
  const after = isRecord(metadata.after) ? metadata.after : {};

  return labels.flatMap(([key, label]) => {
    if (!Object.hasOwn(before, key) && !Object.hasOwn(after, key)) return [];

    return [
      {
        // Keys come from a fixed labels list.
        // eslint-disable-next-line security/detect-object-injection
        after: formatValue(key, after[key]),
        // eslint-disable-next-line security/detect-object-injection
        before: formatValue(key, before[key]),
        label,
      },
    ];
  });
};

/** Which fields changed stays readable; their values need the right. */
const maskUnlessAllowed = (
  changes: JournalChange[],
  allowed: boolean,
): JournalChange[] =>
  allowed
    ? changes
    : changes.map(({ label }) => ({ after: MASKED, before: MASKED, label }));

const permissionLabels = (value: unknown): string | null => {
  if (!Array.isArray(value) || value.length === 0) return null;

  return value
    .filter((key): key is string => typeof key === 'string')
    .map((key) => getPermissionItem(key)?.label ?? key)
    .join(', ');
};

const projectFacts = (row: JournalRow): JournalFact[] => {
  const metadata = isRecord(row.metadata) ? row.metadata : {};
  const facts: JournalFact[] = [];
  if (row.action === 'PERMISSION_UPDATE') {
    const granted = permissionLabels(metadata.effectivelyGrantedPermissionKeys);
    const revoked = permissionLabels(metadata.effectivelyRevokedPermissionKeys);
    if (granted) facts.push({ label: 'Accordées', value: granted });
    if (revoked) facts.push({ label: 'Retirées', value: revoked });
  }
  if (row.action === 'LOGIN_FAILED' && typeof metadata.reason === 'string')
    facts.push({
      label: 'Motif',
      value: LOGIN_FAILURE_REASONS[metadata.reason] ?? 'Autre motif',
    });
  if (row.action === 'STEP_UP_FAILED') {
    // Every refused proof names where it was asked (31 October 2026).
    if (typeof metadata.step === 'string')
      facts.push({
        label: 'Étape',
        value: BLOCKED_ATTEMPT_STEPS[metadata.step] ?? 'Autre étape',
      });
    if (typeof metadata.reason === 'string')
      facts.push({
        label: 'Motif',
        value: STEP_UP_FAILURE_REASONS[metadata.reason] ?? 'Autre motif',
      });
  }
  if (row.action === 'AUDIT_PURGE') {
    if (typeof metadata.deletedEvents === 'number')
      facts.push({
        label: 'Événements supprimés',
        value: formatCount(metadata.deletedEvents),
      });
    if (typeof metadata.retentionDays === 'number')
      facts.push({
        label: 'Conservation',
        value: `${formatCount(metadata.retentionDays)} jours (${formatDaysAsYears(metadata.retentionDays)})`,
      });
    if (
      typeof metadata.expiredSessions === 'number' &&
      metadata.expiredSessions > 0
    )
      facts.push({
        label: 'Sessions expirées supprimées',
        value: formatCount(metadata.expiredSessions),
      });
  }
  if (
    row.action === 'SESSION_INVALIDATE' &&
    typeof metadata.revokedSessions === 'number'
  )
    facts.push({
      label: 'Sessions fermées',
      value: formatCount(metadata.revokedSessions),
    });
  if (row.action === 'ATTEMPTS_BLOCKED') {
    if (typeof metadata.step === 'string')
      facts.push({
        label: 'Étape',
        value: BLOCKED_ATTEMPT_STEPS[metadata.step] ?? 'Autre étape',
      });
    if (typeof metadata.proof === 'string')
      facts.push({
        label: 'Preuve refusée',
        value: BLOCKED_ATTEMPT_PROOFS[metadata.proof] ?? 'Autre preuve',
      });
    if (typeof metadata.blockedForSeconds === 'number')
      facts.push({
        label: 'Durée du blocage',
        value: `environ ${Math.max(1, Math.ceil(metadata.blockedForSeconds / 60))} min`,
      });
  }

  return facts;
};

const projectSettingChanges = (
  metadata: Record<string, unknown>,
): JournalChange[] => {
  if (metadata.settingKey !== 'audit.retentionDays') return [];
  const { defaultValue } = getSystemSettingDefinition('audit.retentionDays');
  // No stored row means the default: say which value that was.
  const days = (side: unknown): string => {
    const value = isRecord(side) ? side.value : null;

    return typeof value === 'number'
      ? `${formatCount(value)} jours (${formatDaysAsYears(value)})`
      : `${formatCount(defaultValue)} jours (${formatDaysAsYears(defaultValue)}, défaut)`;
  };

  return [
    {
      after: days(metadata.after),
      before: days(metadata.before),
      label: SETTING_JOURNAL_LABELS['audit.retentionDays'] ?? 'Paramètre',
    },
  ];
};

const toneOf = (row: AuditLog): JournalTone => {
  if (row.outcome === 'FAILURE') return 'failure';
  if (row.severity === 'CRITICAL') return 'critical';
  if (row.severity === 'WARNING') return 'warning';

  return 'neutral';
};

const typeLabelOf = (row: AuditLog): string => {
  if (row.category === 'PERSON') return 'Personnes';
  if (row.category === 'PASSAGE') return 'Parcours';
  if (row.category === 'GAME') return 'Jeux';
  if (row.category === 'TEAM') return 'Équipes';
  if (row.category === 'FUNCTION') return 'Fonctions';
  if (row.category === 'LEGAL_ENTITY') return 'Entités';
  if (row.category === 'FINANCIAL_ACCOUNT') return 'Trésorerie';
  if (row.stream === 'AUTHENTICATION' || row.stream === 'SECURITY')
    return 'Sécurité';
  if (row.category === 'USER' || row.category === 'PERMISSION')
    return 'Comptes et droits';
  if (row.action === 'SYSTEM_SETTING_UPDATE') return 'Paramètres';

  return 'Autres';
};

/**
 * What a line without a record or account concerns, built from closed
 * metadata instead of the stored sentence, which only repeated the label
 * (« Connexion échouée · Connexion échouée: alex »; audit of 31 October 2026).
 */
const subjectOf = (
  row: JournalRow,
  metadata: Record<string, unknown>,
  rights: ReaderRights,
): string | null => {
  if (typeof metadata.loginName === 'string' && metadata.loginName.trim())
    return `Identifiant : ${metadata.loginName.trim()}`;
  if (
    row.action === 'SYSTEM_SETTING_UPDATE' &&
    typeof metadata.settingKey === 'string'
  )
    return SETTING_JOURNAL_LABELS[metadata.settingKey] ?? 'Paramètre';
  // « Passage : Joueur, Noctambule Academy (Valorant) », « Passage :
  // Trésorier, Bureau & staff »: never the person's name, which only the
  // line's target shows, to who may read it.
  if (
    row.category === 'PASSAGE' &&
    typeof metadata.functionName === 'string' &&
    typeof metadata.teamName === 'string'
  )
    return typeof metadata.gameName === 'string'
      ? `Passage : ${metadata.functionName}, ${metadata.teamName} (${metadata.gameName})`
      : `Passage : ${metadata.functionName}, ${metadata.teamName}`;
  if (
    row.category === 'PASSAGE' &&
    typeof metadata.functionName === 'string' &&
    typeof metadata.scopeName === 'string'
  )
    return `Passage : ${metadata.functionName}, ${metadata.scopeName}`;
  if (row.category === 'GAME' && typeof metadata.gameName === 'string')
    return `Jeu : ${metadata.gameName}`;
  if (
    row.category === 'LEGAL_ENTITY' &&
    typeof metadata.entityName === 'string'
  )
    return `Entité : ${metadata.entityName}`;
  // An account's name stays with who may see the accounts.
  if (row.category === 'FINANCIAL_ACCOUNT')
    return rights.canViewFinancialAccounts &&
      typeof metadata.accountName === 'string'
      ? `Compte : ${metadata.accountName}`
      : 'Compte financier';
  if (row.category === 'TEAM' && typeof metadata.teamName === 'string')
    return typeof metadata.gameName === 'string'
      ? `Équipe : ${metadata.teamName} (${metadata.gameName})`
      : `Équipe : ${metadata.teamName}`;
  // A new order concerns the active teams of a game, or its inactive ones.
  if (row.category === 'TEAM' && typeof metadata.gameName === 'string')
    return metadata.active === false
      ? `Équipes inactives : ${metadata.gameName}`
      : `Équipes : ${metadata.gameName}`;
  if (row.action === 'GAME_REORDER' && metadata.active === false)
    return 'Jeux inactifs';
  // A function of a game, or of the structure (« Bureau & staff »).
  const functionList =
    typeof metadata.gameName === 'string'
      ? metadata.gameName
      : typeof metadata.scopeName === 'string'
        ? metadata.scopeName
        : null;
  if (row.category === 'FUNCTION' && typeof metadata.functionName === 'string')
    return functionList
      ? `Fonction : ${metadata.functionName} (${functionList})`
      : `Fonction : ${metadata.functionName}`;
  // A new order concerns a whole group: « Fonctions : Encadrement (Valorant) »,
  // or its inactive ones (9 November 2026).
  if (row.category === 'FUNCTION' && typeof metadata.kindLabel === 'string') {
    const group =
      metadata.active === false ? 'Fonctions inactives' : 'Fonctions';

    return functionList
      ? `${group} : ${metadata.kindLabel} (${functionList})`
      : `${group} : ${metadata.kindLabel}`;
  }
  if (
    row.action === 'AUDIT_PURGE' &&
    typeof metadata.deletedEvents === 'number'
  )
    return metadata.deletedEvents === 1
      ? '1 événement supprimé'
      : `${formatCount(metadata.deletedEvents)} événements supprimés`;

  return null;
};

export const projectJournalEvent = (
  row: JournalRow,
  rights: ReaderRights,
  personNames: ReadonlyMap<string, string>,
): JournalEvent => {
  const metadata = isRecord(row.metadata) ? row.metadata : {};
  const isPerson = row.entityType === 'PERSON' && row.entityId !== null;
  const personName =
    isPerson && row.entityId
      ? rights.canViewPersons
        ? (personNames.get(row.entityId) ?? 'Fiche supprimée')
        : 'Fiche du répertoire'
      : null;
  const target: JournalEvent['target'] =
    isPerson && row.entityId && personName
      ? {
          href:
            rights.canViewPersons && personNames.has(row.entityId)
              ? personDetailPath(row.entityId)
              : null,
          id: row.entityId,
          kind: 'person',
          name: personName,
        }
      : row.targetUserId
        ? {
            // Same rule as a record: no link to a page the reader cannot open.
            href: rights.canViewUsers ? userDetailPath(row.targetUserId) : null,
            id: row.targetUserId,
            kind: 'user',
            name:
              row.targetDisplayNameSnapshot ??
              row.targetLoginNameSnapshot ??
              'Compte',
          }
        : null;
  // A passage concerns a record (its target) but keeps readable values.
  const changes =
    row.category === 'PASSAGE'
      ? projectReadableChanges(metadata, PASSAGE_FIELD_LABELS)
      : isPerson
        ? row.fieldChanges.map((change) =>
            projectPersonChange(row, change, rights),
          )
        : row.action === 'SYSTEM_SETTING_UPDATE'
          ? projectSettingChanges(metadata)
          : row.category === 'GAME'
            ? projectReadableChanges(metadata, GAME_FIELD_LABELS)
            : row.category === 'TEAM'
              ? projectReadableChanges(metadata, TEAM_FIELD_LABELS)
              : row.category === 'FUNCTION'
                ? projectReadableChanges(metadata, FUNCTION_FIELD_LABELS)
                : row.category === 'LEGAL_ENTITY'
                  ? projectReadableChanges(metadata, LEGAL_ENTITY_FIELD_LABELS)
                  : row.category === 'FINANCIAL_ACCOUNT'
                    ? maskUnlessAllowed(
                        projectReadableChanges(
                          metadata,
                          FINANCIAL_ACCOUNT_FIELD_LABELS,
                        ),
                        rights.canViewFinancialAccounts,
                      )
                    : projectUserChanges(row, metadata, rights);

  return {
    actor:
      row.userId || row.actorDisplayNameSnapshot
        ? {
            id: row.userId,
            loginName: row.actorLoginNameSnapshot,
            name:
              row.actorDisplayNameSnapshot ??
              row.actorLoginNameSnapshot ??
              'Compte',
          }
        : {
            id: null,
            loginName: null,
            name:
              row.eventKind === 'CONNECTION'
                ? 'Personne non connectée'
                : 'Système',
          },
    at: row.createdAt.toISOString(),
    browser: row.userAgent ? describeUserAgent(row.userAgent).label : null,
    changes,
    facts: projectFacts(row),
    id: row.id,
    ip:
      rights.isProtected && row.ipAddress
        ? formatIpAddress(row.ipAddress)
        : null,
    ipMasked: !rights.isProtected && row.ipAddress !== null,
    // A replaced authenticator is written as MFA_ENABLED with `replacing`.
    label:
      row.action === 'MFA_ENABLED' && metadata.replacing === true
        ? 'Application d’authentification remplacée'
        : JOURNAL_ACTION_LABELS[row.action],
    // A passage keeps its team and function beside its record.
    subject:
      target && row.category !== 'PASSAGE'
        ? null
        : subjectOf(row, metadata, rights),
    target,
    tone: toneOf(row),
    typeLabel: typeLabelOf(row),
  };
};

export const JOURNAL_AUDIT_LOCATION = FEATURES.systemActivity.audit;
