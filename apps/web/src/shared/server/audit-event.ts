import 'server-only';

import {
  AuditAction,
  AuditEventKind,
  AuditOutcome,
  AuditSeverity,
  AuditStream,
  type UserRole,
} from '@repo/database';

export const AUDIT_EVENT_VERSION = 1;

export type AuditEventClassification = Readonly<{
  eventKind: AuditEventKind;
  outcome: AuditOutcome;
  severity: AuditSeverity;
  stream: AuditStream;
}>;

export type AuditIdentitySnapshot = Readonly<{
  displayName: string;
  loginName: string;
  role: UserRole;
}>;

type AuditSnapshotSource = {
  firstName: string;
  lastName: string;
  loginName: string;
  role: UserRole;
};

const activity = (
  stream: AuditStream,
  severity: AuditSeverity = AuditSeverity.INFO,
): AuditEventClassification => ({
  eventKind: AuditEventKind.ACTIVITY,
  outcome: AuditOutcome.SUCCESS,
  severity,
  stream,
});

const connection = (
  outcome: AuditOutcome,
  severity: AuditSeverity = AuditSeverity.INFO,
): AuditEventClassification => ({
  eventKind: AuditEventKind.CONNECTION,
  outcome,
  severity,
  stream: AuditStream.AUTHENTICATION,
});

const AUDIT_EVENT_CLASSIFICATIONS = {
  [AuditAction.ACCOUNT_LOCKED]: connection(
    AuditOutcome.FAILURE,
    AuditSeverity.WARNING,
  ),
  // A password or code check refused by the rate limiter (31 October 2026):
  // one event per block, written by the limiter itself.
  [AuditAction.ATTEMPTS_BLOCKED]: connection(
    AuditOutcome.FAILURE,
    AuditSeverity.WARNING,
  ),
  [AuditAction.AUDIT_EXPORT]: activity(
    AuditStream.SYSTEM,
    AuditSeverity.CRITICAL,
  ),
  // Opening the activity journal (30 October 2026): whoever watches is
  // watched too, on the security timeline.
  [AuditAction.AUDIT_VIEW]: activity(AuditStream.SECURITY),
  // The retention cleanup deleting journal events (31 October 2026): the
  // deletion of a log is itself logged, next to its readings.
  [AuditAction.AUDIT_PURGE]: activity(AuditStream.SECURITY),
  [AuditAction.BACKGROUND_JOB_UPDATE]: activity(
    AuditStream.SYSTEM,
    AuditSeverity.WARNING,
  ),
  [AuditAction.INTERNAL_ANNOUNCEMENT_PIN_UPDATE]: activity(AuditStream.SYSTEM),
  [AuditAction.INTERNAL_ANNOUNCEMENT_PUBLISH]: activity(AuditStream.SYSTEM),
  [AuditAction.LOGIN_FAILED]: connection(
    AuditOutcome.FAILURE,
    AuditSeverity.WARNING,
  ),
  [AuditAction.LOGIN_SUCCESS]: connection(AuditOutcome.SUCCESS),
  [AuditAction.LOGOUT]: connection(AuditOutcome.NEUTRAL),
  [AuditAction.MFA_DISABLED]: activity(
    AuditStream.SECURITY,
    AuditSeverity.WARNING,
  ),
  [AuditAction.MFA_ENABLED]: activity(AuditStream.SECURITY),
  [AuditAction.MFA_RECOVERY_CODE_USED]: activity(
    AuditStream.SECURITY,
    AuditSeverity.WARNING,
  ),
  [AuditAction.MFA_RECOVERY_CODES_REGENERATED]: activity(
    AuditStream.SECURITY,
    AuditSeverity.WARNING,
  ),
  [AuditAction.MFA_RESET]: activity(
    AuditStream.SECURITY,
    AuditSeverity.CRITICAL,
  ),
  [AuditAction.NOTIFICATION_SEND]: activity(AuditStream.SYSTEM),
  [AuditAction.PASSWORD_CHANGE]: activity(AuditStream.SECURITY),
  [AuditAction.PASSWORD_RESET]: activity(
    AuditStream.SECURITY,
    AuditSeverity.WARNING,
  ),
  [AuditAction.GAME_CREATE]: activity(AuditStream.SYSTEM),
  [AuditAction.GAME_DELETE]: activity(
    AuditStream.SYSTEM,
    AuditSeverity.WARNING,
  ),
  [AuditAction.GAME_REORDER]: activity(AuditStream.SYSTEM),
  [AuditAction.GAME_UPDATE]: activity(AuditStream.SYSTEM),
  [AuditAction.FUNCTION_CREATE]: activity(AuditStream.SYSTEM),
  [AuditAction.FUNCTION_DELETE]: activity(
    AuditStream.SYSTEM,
    AuditSeverity.WARNING,
  ),
  [AuditAction.FUNCTION_REORDER]: activity(AuditStream.SYSTEM),
  [AuditAction.FUNCTION_UPDATE]: activity(AuditStream.SYSTEM),
  [AuditAction.TEAM_CREATE]: activity(AuditStream.SYSTEM),
  [AuditAction.TEAM_DELETE]: activity(
    AuditStream.SYSTEM,
    AuditSeverity.WARNING,
  ),
  [AuditAction.TEAM_REORDER]: activity(AuditStream.SYSTEM),
  [AuditAction.TEAM_UPDATE]: activity(AuditStream.SYSTEM),
  [AuditAction.PERSON_CREATE]: activity(AuditStream.IDENTITY),
  [AuditAction.PERSON_DELETE]: activity(
    AuditStream.IDENTITY,
    AuditSeverity.CRITICAL,
  ),
  [AuditAction.PERSON_UPDATE]: activity(AuditStream.IDENTITY),
  [AuditAction.PASSAGE_CREATE]: activity(AuditStream.IDENTITY),
  [AuditAction.PASSAGE_DELETE]: activity(
    AuditStream.IDENTITY,
    AuditSeverity.WARNING,
  ),
  [AuditAction.PASSAGE_UPDATE]: activity(AuditStream.IDENTITY),
  [AuditAction.LEGAL_ENTITY_CREATE]: activity(AuditStream.SYSTEM),
  [AuditAction.LEGAL_ENTITY_DELETE]: activity(
    AuditStream.SYSTEM,
    AuditSeverity.WARNING,
  ),
  [AuditAction.LEGAL_ENTITY_UPDATE]: activity(AuditStream.SYSTEM),
  [AuditAction.FINANCIAL_ACCOUNT_CREATE]: activity(AuditStream.SYSTEM),
  [AuditAction.FINANCIAL_ACCOUNT_DELETE]: activity(
    AuditStream.SYSTEM,
    AuditSeverity.WARNING,
  ),
  [AuditAction.FINANCIAL_ACCOUNT_UPDATE]: activity(AuditStream.SYSTEM),
  [AuditAction.ORGANIZATION_CREATE]: activity(AuditStream.SYSTEM),
  [AuditAction.ORGANIZATION_DELETE]: activity(
    AuditStream.SYSTEM,
    AuditSeverity.WARNING,
  ),
  [AuditAction.ORGANIZATION_UPDATE]: activity(AuditStream.SYSTEM),
  [AuditAction.ORGANIZATION_CONTACT_CREATE]: activity(AuditStream.SYSTEM),
  [AuditAction.ORGANIZATION_CONTACT_DELETE]: activity(AuditStream.SYSTEM),
  [AuditAction.ORGANIZATION_CONTACT_UPDATE]: activity(AuditStream.SYSTEM),
  [AuditAction.PARTNER_CONTACTS_UPDATE]: activity(AuditStream.SYSTEM),
  [AuditAction.PARTNER_CREATE]: activity(AuditStream.SYSTEM),
  [AuditAction.PARTNER_DELETE]: activity(
    AuditStream.SYSTEM,
    AuditSeverity.CRITICAL,
  ),
  [AuditAction.PARTNER_FOLLOW_UP_COMPLETE]: activity(AuditStream.SYSTEM),
  [AuditAction.PARTNER_FOLLOW_UP_CREATE]: activity(AuditStream.SYSTEM),
  [AuditAction.PARTNER_FOLLOW_UP_DELETE]: activity(
    AuditStream.SYSTEM,
    AuditSeverity.WARNING,
  ),
  [AuditAction.PARTNER_FOLLOW_UP_UPDATE]: activity(AuditStream.SYSTEM),
  [AuditAction.PARTNER_MERGE]: activity(
    AuditStream.SYSTEM,
    AuditSeverity.CRITICAL,
  ),
  [AuditAction.PARTNER_PERIOD_CREATE]: activity(AuditStream.SYSTEM),
  [AuditAction.PARTNER_PERIOD_UPDATE]: activity(AuditStream.SYSTEM),
  [AuditAction.PARTNER_STATUS_UPDATE]: activity(AuditStream.SYSTEM),
  [AuditAction.PARTNER_UPDATE]: activity(AuditStream.SYSTEM),
  [AuditAction.PERMISSION_UPDATE]: activity(
    AuditStream.AUTHORIZATION,
    AuditSeverity.CRITICAL,
  ),
  [AuditAction.SESSION_INVALIDATE]: activity(
    AuditStream.SECURITY,
    AuditSeverity.WARNING,
  ),
  [AuditAction.STEP_UP_FAILED]: {
    eventKind: AuditEventKind.ACTIVITY,
    outcome: AuditOutcome.FAILURE,
    severity: AuditSeverity.WARNING,
    stream: AuditStream.SECURITY,
  },
  [AuditAction.STEP_UP_SUCCESS]: activity(AuditStream.SECURITY),
  [AuditAction.SYSTEM_SETTING_UPDATE]: activity(
    AuditStream.SYSTEM,
    AuditSeverity.CRITICAL,
  ),
  [AuditAction.USER_ACTIVATE]: activity(AuditStream.IDENTITY),
  [AuditAction.USER_CREATE]: activity(AuditStream.IDENTITY),
  [AuditAction.USER_DEACTIVATE]: activity(
    AuditStream.IDENTITY,
    AuditSeverity.WARNING,
  ),
  [AuditAction.USER_DELETE]: activity(
    AuditStream.IDENTITY,
    AuditSeverity.CRITICAL,
  ),
  [AuditAction.USER_UPDATE]: activity(AuditStream.IDENTITY),
} as const satisfies Record<AuditAction, AuditEventClassification>;

export const getAuditEventClassification = (
  action: AuditAction,
): AuditEventClassification => {
  // Prisma guarantees action belongs to the closed AuditAction enum and the
  // satisfies clause above guarantees a corresponding classification.
  // eslint-disable-next-line security/detect-object-injection
  return AUDIT_EVENT_CLASSIFICATIONS[action];
};

export const toAuditIdentitySnapshot = (
  user: AuditSnapshotSource,
): AuditIdentitySnapshot => {
  const displayName = `${user.firstName.trim()} ${user.lastName.trim()}`.trim();

  return {
    displayName: displayName || user.loginName,
    loginName: user.loginName,
    role: user.role,
  };
};
