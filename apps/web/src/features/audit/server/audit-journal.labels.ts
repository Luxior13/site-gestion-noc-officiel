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
  FINANCIAL_ACCOUNT_CREATE: 'Compte ouvert',
  FINANCIAL_ACCOUNT_DELETE: 'Compte supprimé',
  FINANCIAL_ACCOUNT_UPDATE: 'Compte modifié',
  FINANCIAL_OPERATION_CREATE: 'Opération ajoutée',
  FINANCIAL_OPERATION_DELETE: 'Opération supprimée',
  FINANCIAL_OPERATION_UPDATE: 'Opération modifiée',
  FUNCTION_CREATE: 'Fonction ajoutée',
  FUNCTION_DELETE: 'Fonction supprimée',
  FUNCTION_REORDER: 'Ordre des fonctions modifié',
  FUNCTION_UPDATE: 'Fonction modifiée',
  GAME_CREATE: 'Jeu ajouté',
  GAME_DELETE: 'Jeu supprimé',
  GAME_REORDER: 'Ordre des jeux modifié',
  GAME_UPDATE: 'Jeu modifié',
  INTERNAL_ANNOUNCEMENT_PIN_UPDATE: 'Annonce épinglée ou désépinglée',
  INTERNAL_ANNOUNCEMENT_PUBLISH: 'Annonce publiée',
  LEGAL_ENTITY_CREATE: 'Entité ajoutée',
  LEGAL_ENTITY_DELETE: 'Entité supprimée',
  LEGAL_ENTITY_UPDATE: 'Entité modifiée',
  LOGIN_FAILED: 'Connexion échouée',
  LOGIN_SUCCESS: 'Connexion',
  LOGOUT: 'Déconnexion',
  MFA_DISABLED: 'Double authentification désactivée',
  MFA_ENABLED: 'Double authentification activée',
  MFA_RECOVERY_CODE_USED: 'Code de secours utilisé',
  MFA_RECOVERY_CODES_REGENERATED: 'Codes de secours renouvelés',
  MFA_RESET: 'Double authentification réinitialisée',
  NOTIFICATION_SEND: 'Notification envoyée',
  ORGANIZATION_CONTACT_CREATE: 'Contact ajouté',
  ORGANIZATION_CONTACT_DELETE: 'Contact supprimé',
  ORGANIZATION_CONTACT_UPDATE: 'Contact modifié',
  ORGANIZATION_CREATE: 'Organisation ajoutée',
  ORGANIZATION_DELETE: 'Organisation supprimée',
  ORGANIZATION_UPDATE: 'Organisation modifiée',
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
  PASSAGE_CREATE: 'Passage ajouté',
  PASSAGE_DELETE: 'Passage supprimé',
  PASSAGE_UPDATE: 'Passage modifié',
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
  TEAM_REORDER: 'Ordre des équipes modifié',
  TEAM_UPDATE: 'Équipe modifiée',
  TOURNAMENT_CREATE: 'Tournoi ajouté',
  TOURNAMENT_DELETE: 'Tournoi supprimé',
  TOURNAMENT_ENTRY_CREATE: 'Équipe engagée',
  TOURNAMENT_ENTRY_DELETE: 'Équipe retirée d’un tournoi',
  TOURNAMENT_ENTRY_UPDATE: 'Participation modifiée',
  TOURNAMENT_UPDATE: 'Tournoi modifié',
  TREASURY_CHOICE_CREATE: 'Valeur de liste ajoutée',
  TREASURY_CHOICE_DELETE: 'Valeur de liste supprimée',
  TREASURY_CHOICE_REORDER: 'Ordre d’une liste modifié',
  TREASURY_CHOICE_UPDATE: 'Valeur de liste modifiée',
  USER_ACTIVATE: 'Compte réactivé',
  USER_CREATE: 'Compte créé',
  USER_DEACTIVATE: 'Compte désactivé',
  USER_DELETE: 'Compte supprimé',
  USER_UPDATE: 'Compte modifié',
};

export const PERSON_SECTION_LABELS: Readonly<Record<string, string>> = {
  contacts: 'Coordonnées',
  emergency: 'Contact d’urgence',
  guardians: 'Représentant légal',
  identity: 'Identité',
  online: 'En ligne',
  social: 'Réseaux',
  structure: 'Structure',
};

export const PERSON_FIELD_LABELS: Readonly<Record<string, string>> = {
  birthDate: 'Date de naissance',
  // An emergency contact (10 November 2026).
  contactName: 'Nom',
  email: 'Email',
  firstName: 'Prénom',
  // A legal representative: the record linked, then how it stands.
  guardian: 'Fiche',
  guardianRelation: 'Lien',
  identifier: 'Identifiant',
  isPrimary: 'Principal',
  label: 'Libellé',
  lastName: 'Nom',
  nationality: 'Nationalité',
  networkKey: 'Réseau',
  nickname: 'Pseudo',
  // Another pseudo of the record (10 November 2026).
  otherNickname: 'Autre pseudo',
  otherNicknameNote: 'Précision',
  otherNicknameUntil: 'Jusqu’à',
  phone: 'Téléphone',
  profileUrl: 'Lien du profil',
  relation: 'Lien',
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
  // A new order of the active games, as dragged (9 November 2026).
  ['order', 'Ordre'],
];

/** Team fields recorded in `before` / `after`, in display order. */
export const TEAM_FIELD_LABELS: ReadonlyArray<readonly [string, string]> = [
  ['game', 'Jeu'],
  ['name', 'Nom'],
  ['founded', 'Création'],
  ['isActive', 'Active'],
  // A new order of a game's active teams, as dragged (9 November 2026).
  ['order', 'Ordre'],
];

/** Function fields recorded in `before` / `after`, in display order. */
export const FUNCTION_FIELD_LABELS: ReadonlyArray<readonly [string, string]> = [
  ['game', 'Jeu'],
  ['name', 'Nom'],
  ['kind', 'Type'],
  ['isActive', 'Active'],
  // A new order of one group, as its managers dragged it (9 November 2026).
  ['order', 'Ordre'],
];

/** Passage fields recorded in `before` / `after`, in display order. */
export const PASSAGE_FIELD_LABELS: ReadonlyArray<readonly [string, string]> = [
  ['team', 'Équipe'],
  ['function', 'Fonction'],
  ['start', 'Début'],
  ['end', 'Fin'],
];

/** Legal entity fields recorded in `before` / `after`, in display order. */
export const LEGAL_ENTITY_FIELD_LABELS: ReadonlyArray<
  readonly [string, string]
> = [
  ['name', 'Dénomination'],
  ['form', 'Forme'],
  ['start', 'Début'],
  ['end', 'Fin'],
  ['rnaNumber', 'Numéro RNA'],
  ['siretNumber', 'SIRET'],
  ['headOffice', 'Siège'],
  ['isPrincipal', 'Entité principale'],
];

/** Financial account fields recorded in `before` / `after`, in display order. */
export const FINANCIAL_ACCOUNT_FIELD_LABELS: ReadonlyArray<
  readonly [string, string]
> = [
  ['entity', 'Entité'],
  ['name', 'Nom'],
  ['kind', 'Type'],
  ['institution', 'Établissement'],
  ['openingBalance', 'Solde de départ'],
  ['openingOn', 'Date du solde de départ'],
  ['closedOn', 'Clôture'],
];

/** Operation fields recorded in `before` / `after`, in display order. */
export const FINANCIAL_OPERATION_FIELD_LABELS: ReadonlyArray<
  readonly [string, string]
> = [
  ['kind', 'Sens'],
  ['occurredOn', 'Date'],
  ['amount', 'Montant'],
  ['account', 'Compte'],
  ['toAccount', 'Vers le compte'],
  ['label', 'Libellé'],
  ['category', 'Catégorie'],
  ['paymentMethod', 'Moyen de paiement'],
  ['organization', 'Organisation'],
  ['person', 'Fiche du Répertoire'],
  ['assignment', 'Équipe ou jeu'],
  ['tournament', 'Tournoi'],
  ['note', 'Note'],
];

/** A value of a list of the treasury: category or payment method. */
export const TREASURY_CHOICE_FIELD_LABELS: ReadonlyArray<
  readonly [string, string]
> = [
  ['kind', 'Liste'],
  ['name', 'Nom'],
  ['isActive', 'Active'],
  ['order', 'Ordre'],
];

/** Organisation fields recorded in `before` / `after`, in display order. */
export const ORGANIZATION_FIELD_LABELS: ReadonlyArray<
  readonly [string, string]
> = [
  ['name', 'Nom'],
  ['kinds', 'Types'],
  ['website', 'Site web'],
  ['siretNumber', 'SIRET'],
  ['address', 'Adresse'],
];

/** Contact fields of an organisation, in display order. */
export const ORGANIZATION_CONTACT_FIELD_LABELS: ReadonlyArray<
  readonly [string, string]
> = [
  ['person', 'Fiche du Répertoire'],
  ['name', 'Nom'],
  ['role', 'Fonction'],
  ['email', 'Email'],
  ['phone', 'Téléphone'],
];

/** Tournament fields recorded in `before` / `after`, in display order. */
export const TOURNAMENT_FIELD_LABELS: ReadonlyArray<readonly [string, string]> =
  [
    ['name', 'Nom'],
    ['edition', 'Édition'],
    ['game', 'Jeu'],
    ['organizer', 'Organisateur'],
    ['format', 'Format'],
    ['location', 'Lieu'],
    ['dates', 'Dates'],
    ['linkUrl', 'Lien du tournoi'],
    ['entryFee', 'Frais d’inscription'],
    ['registrationDeadline', 'Fin des inscriptions'],
    ['cancelled', 'Annulé'],
  ];

/**
 * What an engaged team holds: its placement, and its line-up in the events
 * written until 13 November 2026, when line-ups stopped being kept.
 */
export const TOURNAMENT_ENTRY_FIELD_LABELS: ReadonlyArray<
  readonly [string, string]
> = [
  ['team', 'Équipe'],
  ['lineup', 'Line-up'],
  ['placement', 'Classement'],
];

/** Account fields recorded in `before` / `after`, in display order. */
export const USER_FIELD_LABELS: ReadonlyArray<readonly [string, string]> = [
  ['firstName', 'Prénom'],
  ['lastName', 'Nom'],
  ['loginName', 'Identifiant'],
  ['contactEmail', 'Email de contact'],
  ['role', 'Rôle'],
  // Said in words when changed (10 November 2026).
  ['esportScope', 'Jeux et équipes visibles'],
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
