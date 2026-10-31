import 'server-only';

import { createAuditLogWithHeaders } from './audit-log';
import type { BlockedAttemptStep } from './rate-limiter';

/** Every refused proof shares the identity confirmation timeline. */
export const IDENTITY_CONFIRMATION_AUDIT_LOCATION = {
  pageKey: 'authentication',
  pageLabel: 'Authentification',
  poleKey: 'system',
  poleLabel: 'Système',
  tabKey: 'step-up',
  tabLabel: 'Confirmation d’identité',
} as const;

/** Closed list, labelled by the journal (`STEP_UP_FAILURE_REASONS`). */
export type RefusedProofReason =
  | 'NEW_TOTP_INVALID'
  | 'PASSWORD_INVALID'
  | 'PROOF_REPLAYED'
  | 'SECURITY_STATE_CHANGED'
  | 'TOTP_INVALID';

/**
 * Writes « Confirmation d’identité échouée » when a signed-in account gives a
 * wrong password or code before a sensitive action (rule of 31 October 2026:
 * a security refusal is traced too, not only the block that may follow).
 * Best-effort: a journal failure never changes the refusal answer.
 */
export const recordRefusedProof = async (input: {
  /** Account that was asked for the proof. */
  actorUserId: string;
  metadata?: Record<string, unknown>;
  reason: RefusedProofReason;
  step: BlockedAttemptStep;
}): Promise<void> => {
  await createAuditLogWithHeaders({
    action: 'STEP_UP_FAILED',
    category: 'AUTH',
    description: 'Confirmation d’identité échouée',
    metadata: {
      ...IDENTITY_CONFIRMATION_AUDIT_LOCATION,
      ...input.metadata,
      reason: input.reason,
      step: input.step,
    },
    // The proof belongs to the account asked for it, as for the limiter.
    targetUserId: input.actorUserId,
    userId: input.actorUserId,
  });
};
