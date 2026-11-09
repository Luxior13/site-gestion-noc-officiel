import 'server-only';

export type PersonDomainErrorCode =
  | 'PERSON_FEATURE_NOT_CONFIGURED'
  | 'PERSON_HAS_PASSAGES'
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
  /** A record in a roster stays: the registre keeps who was there. */
  hasPassages: (count: number): PersonDomainError =>
    new PersonDomainError(
      'PERSON_HAS_PASSAGES',
      `Cette fiche figure dans ${count > 1 ? `${count} passages` : 'un passage'} d’un Roster : elle reste dans le registre et ne se supprime pas.`,
    ),
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
