import 'server-only';

export type PersonDomainErrorCode =
  | 'PERSON_FEATURE_NOT_CONFIGURED'
  | 'PERSON_GUARDIAN_CONFLICT'
  | 'PERSON_HAS_OPERATIONS'
  | 'PERSON_HAS_PASSAGES'
  | 'PERSON_NICKNAME_CONFLICT'
  | 'PERSON_NOT_FOUND'
  | 'PERSON_VERSION_CONFLICT'
  | 'PRIMARY_CONFLICT';

export class PersonDomainError extends Error {
  public constructor(
    public readonly code: PersonDomainErrorCode,
    message: string,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'PersonDomainError';
  }
}

export const personErrors = {
  featureNotConfigured: (): PersonDomainError =>
    new PersonDomainError(
      'PERSON_FEATURE_NOT_CONFIGURED',
      'La protection des données du répertoire n’est pas configurée',
    ),
  /**
   * A legal representative link refused (10 November 2026): the person
   * themselves, a representative already linked, or a record that still
   * represents someone and so cannot be deleted.
   */
  guardianConflict: (message: string): PersonDomainError =>
    new PersonDomainError('PERSON_GUARDIAN_CONFLICT', message),
  /**
   * A record that paid or was paid stays: the treasury keeps who it was
   * (11 November 2026).
   */
  hasOperations: (count: number): PersonDomainError =>
    new PersonDomainError(
      'PERSON_HAS_OPERATIONS',
      `Cette fiche a payé ou reçu de l’argent dans ${count > 1 ? `${count} opérations` : 'une opération'} : elle reste, pour l’historique de la trésorerie.`,
    ),
  /** A record in a roster stays: the registre keeps who was there. */
  hasPassages: (count: number): PersonDomainError =>
    new PersonDomainError(
      'PERSON_HAS_PASSAGES',
      `Cette fiche figure dans ${count > 1 ? `${count} passages` : 'un passage'} d’un Roster : elle reste dans le registre et ne se supprime pas.`,
    ),
  /** Another pseudo already there, or the main one (10 November 2026). */
  nicknameConflict: (message: string): PersonDomainError =>
    new PersonDomainError('PERSON_NICKNAME_CONFLICT', message),
  notFound: (): PersonDomainError =>
    new PersonDomainError('PERSON_NOT_FOUND', 'Fiche introuvable'),
  primaryConflict: (message: string): PersonDomainError =>
    new PersonDomainError('PRIMARY_CONFLICT', message),
  versionConflict: (): PersonDomainError =>
    new PersonDomainError(
      'PERSON_VERSION_CONFLICT',
      'Cette fiche a été modifiée. Rechargez-la avant de réessayer.',
    ),
} as const;
