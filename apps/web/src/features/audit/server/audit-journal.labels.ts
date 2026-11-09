import 'server-only';

import type { AuditAction } from '@repo/database';

/**
 * French wording of every persisted action. `Record<AuditAction, …>` makes a
 * new action without a label a type error, and the journal tests check it
 * against the Prisma enum.
 */
export const JOURNAL_ACTION_LABELS: Record<AuditAction, string> = {
  ACCOUNT_LOCKED: 'Compte verrouillé',
  ATTEMPTS_BLOCKED: 'Tentatives bloquées',
  AUDIT_EXPORT: 'Journal exporté',
  AUDIT_PURGE: 'Journal purgé',
  AUDIT_VIEW: 'Journal consulté',
  BACKGROUND_JOB_UPDATE: 'Tâche de fond modifiée',
  FUNCTION_CREATE: 'Fonction ajoutée',
  FUNCTION_DELETE: 'Fonction supprimée',
  FUNCTION_UPDATE: 'Fonction modifiée',
  GAME_CREATE: 'Jeu ajouté',
  GAME_DELETE: 'Jeu supprimé',
  GAME_UPDATE: 'Jeu modifié',
  INTERNAL_ANNOUNCEMENT_PIN_UPDATE: 'Annonce épinglée ou désépinglée',
  INTERNAL_ANNOUNCEMENT_PUBLISH: 'Annonce publiée',
  LOGIN_FAILED: 'Connexion échouée',
  LOGIN_SUCCESS: 'Connexion',
  LOGOUT: 'Déconnexion',
  MFA_DISABLED: 'Double authentification désactivée',
  MFA_ENABLED: 'Double authentification activée',
  MFA_RECOVERY_CODE_USED: 'Code de secours utilisé',
  MFA_RECOVERY_CODES_REGENERATED: 'Codes de secours renouvelés',
  MFA_RESET: 'Double authentification réinitialisée',
  NOTIFICATION_SEND: 'Notification envoyée',
  PARTNER_CONTACTS_UPDATE: 'Contacts partenaire modifiés',
  PARTNER_CREATE: 'Partenaire créé',
  PARTNER_DELETE: 'Partenaire supprimé',
  PARTNER_FOLLOW_UP_COMPLETE: 'Suivi partenaire terminé',
  PARTNER_FOLLOW_UP_CREATE: 'Suivi partenaire créé',
  PARTNER_FOLLOW_UP_DELETE: 'Suivi partenaire supprimé',
  PARTNER_FOLLOW_UP_UPDATE: 'Suivi partenaire modifié',
  PARTNER_MERGE: 'Partenaires fusionnés',
  PARTNER_PERIOD_CREATE: 'Période partenaire créée',
  PARTNER_PERIOD_UPDATE: 'Période partenaire modifiée',
  PARTNER_STATUS_UPDATE: 'Statut partenaire modifié',
  PARTNER_UPDATE: 'Partenaire modifié',
  PASSWORD_CHANGE: 'Mot de passe changé',
  PASSWORD_RESET: 'Mot de passe réinitialisé',
  PERMISSION_UPDATE: 'Autorisations modifiées',
  PERSON_CREATE: 'Fiche créée',
  PERSON_DELETE: 'Fiche supprimée',
  PERSON_UPDATE: 'Fiche modifiée',
  SESSION_INVALIDATE: 'Sessions fermées',
  STEP_UP_FAILED: 'Confirmation d’identité échouée',
  STEP_UP_SUCCESS: 'Identité confirmée',
  SYSTEM_SETTING_UPDATE: 'Paramètre modifié',
  TEAM_CREATE: 'Équipe ajoutée',
  TEAM_DELETE: 'Équipe supprimée',
  TEAM_UPDATE: 'Équipe modifiée',
  USER_ACTIVATE: 'Compte réactivé',
  USER_CREATE: 'Compte créé',
  USER_DEACTIVATE: 'Compte désactivé',
  USER_DELETE: 'Compte supprimé',
  USER_UPDATE: 'Compte modifié',
};

export const PERSON_SECTION_LABELS: Readonly<Record<string, string>> = {
  contacts: 'Coordonnées',
  identity: 'Identité',
  social: 'Réseaux',
  structure: 'Structure',
};

export const PERSON_FIELD_LABELS: Readonly<Record<string, string>> = {
  birthDate: 'Date de naissance',
  email: 'Email',
  firstName: 'Prénom',
  identifier: 'Identifiant',
  isPrimary: 'Principal',
  label: 'Libellé',
  lastName: 'Nom',
  networkKey: 'Réseau',
  nickname: 'Pseudo',
  phone: 'Téléphone',
  profileUrl: 'Lien du profil',
  structureStatus: 'Statut dans la structure',
};

/** Game fields recorded in `before` / `after`, in display order. */
export const GAME_FIELD_LABELS: ReadonlyArray<readonly [string, string]> = [
  ['name', 'Nom'],
  ['shortName', 'Nom court'],
  ['firstOpened', 'Première ouverture'],
  ['isActive', 'Actif'],
  // Removed with a game created by mistake (9 November 2026).
  ['functions', 'Fonctions'],
];

/** Team fields recorded in `before` / `after`, in display order. */
export const TEAM_FIELD_LABELS: ReadonlyArray<readonly [string, string]> = [
  ['game', 'Jeu'],
  ['name', 'Nom'],
  ['founded', 'Création'],
  ['isActive', 'Active'],
];

/** Function fields recorded in `before` / `after`, in display order. */
export const FUNCTION_FIELD_LABELS: ReadonlyArray<readonly [string, string]> = [
  ['game', 'Jeu'],
  ['name', 'Nom'],
  ['kind', 'Type'],
  ['isActive', 'Active'],
];

/** Account fields recorded in `before` / `after`, in display order. */
export const USER_FIELD_LABELS: ReadonlyArray<readonly [string, string]> = [
  ['firstName', 'Prénom'],
  ['lastName', 'Nom'],
  ['loginName', 'Identifiant'],
  ['contactEmail', 'Email de contact'],
  ['role', 'Rôle'],
  ['isActive', 'Compte actif'],
];

/** Steps of a « Tentatives bloquées » event, as the rate limiter writes them. */
export const BLOCKED_ATTEMPT_STEPS: Readonly<Record<string, string>> = {
  contact_email: 'Changement de l’email de contact',
  login: 'Connexion',
  mfa_manage: 'Gestion de la double authentification',
  mfa_reset: 'Réinitialisation d’une double authentification',
  mfa_setup: 'Activation de la double authentification',
  password_change: 'Changement de mot de passe',
  step_up: 'Confirmation d’identité',
};

export const BLOCKED_ATTEMPT_PROOFS: Readonly<Record<string, string>> = {
  code: 'Code de double authentification',
  password: 'Mot de passe',
};

/** Every reason the login service writes (audit of 31 October 2026). */
export const LOGIN_FAILURE_REASONS: Readonly<Record<string, string>> = {
  ACCOUNT_DISABLED: 'Compte désactivé',
  // Written before 31 October 2026, when both cases shared one reason.
  INVALID_CREDENTIALS: 'Identifiant ou mot de passe incorrect',
  MFA_INVALID: 'Code de double authentification incorrect ou expiré',
  MFA_SETUP_INVALID:
    'Code incorrect ou expiré à l’activation de la double authentification',
  MFA_STATE_INCONSISTENT: 'Double authentification du compte incohérente',
  PASSWORD_INVALID: 'Mot de passe incorrect',
  UNKNOWN_LOGIN: 'Identifiant inconnu',
};

/** Reasons of a refused proof before a sensitive action (`recordRefusedProof`). */
export const STEP_UP_FAILURE_REASONS: Readonly<Record<string, string>> = {
  NEW_TOTP_INVALID: 'Code de la nouvelle application incorrect ou expiré',
  PASSWORD_INVALID: 'Mot de passe incorrect',
  PROOF_REPLAYED: 'Code déjà utilisé',
  SECURITY_STATE_CHANGED: 'Session à renouveler',
  TOTP_INVALID: 'Code de double authentification incorrect ou expiré',
};
