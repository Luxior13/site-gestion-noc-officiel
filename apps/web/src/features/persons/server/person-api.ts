import 'server-only';

import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

import { apiError, apiErrors } from '$server/api-response';
import { UserActionAuthorizationError } from '$server/user-action-authorization';
import { ErrorCode } from '$types/api.types';

import { PersonDomainError } from './person-errors';

/** PostgreSQL « undefined table » and « undefined column », through Prisma. */
const MISSING_SCHEMA_SQL_STATES: ReadonlySet<string> = new Set([
  '42P01',
  '42703',
]);

/**
 * A database not yet migrated answers an explicit 503 instead of a generic
 * error (SYS-11, 31 October 2026): the deployment must apply the migrations.
 */
const isMissingSchemaError = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  (error.code === 'P2021' ||
    error.code === 'P2022' ||
    (error.code === 'P2010' &&
      typeof error.meta?.code === 'string' &&
      MISSING_SCHEMA_SQL_STATES.has(error.meta.code)));

export const handlePersonApiError = async (
  action: string,
  error: unknown,
  request?: Request,
): Promise<NextResponse> => {
  // Every response built by apiError is already private and no-store.
  const correlated = <T extends NextResponse>(response: T): T => {
    const requestId = request?.headers.get('x-request-id');
    if (requestId) response.headers.set('x-request-id', requestId);

    return response;
  };
  if (error instanceof UserActionAuthorizationError) {
    return correlated(apiError(error.code, error.message, error.status));
  }
  if (error instanceof PersonDomainError) {
    switch (error.code) {
      case 'PERSON_NOT_FOUND':
        return correlated(apiErrors.notFound(error.message));
      case 'PERSON_VERSION_CONFLICT':
        return correlated(
          apiError(ErrorCode.PERSON_VERSION_CONFLICT, error.message, 409),
        );
      case 'PRIMARY_CONFLICT':
        return correlated(
          apiError(ErrorCode.PRIMARY_CONFLICT, error.message, 409),
        );
      case 'PERSON_GUARDIAN_CONFLICT':
      case 'PERSON_HAS_OPERATIONS':
      case 'PERSON_HAS_PASSAGES':
      case 'PERSON_NICKNAME_CONFLICT':
        return correlated(apiError(ErrorCode.CONFLICT, error.message, 409));
      case 'PERSON_FEATURE_NOT_CONFIGURED':
        return correlated(
          apiError(ErrorCode.PERSON_FEATURE_NOT_CONFIGURED, error.message, 503),
        );
    }
  }
  if (error instanceof RangeError) {
    const messages: Record<string, string> = {
      INVALID_CURSOR: 'Curseur de pagination invalide',
      PERSON_EMAIL_LIMIT: 'La fiche contient déjà 10 emails',
      PERSON_EMERGENCY_CONTACT_LIMIT:
        'La fiche contient déjà 5 contacts d’urgence',
      PERSON_LEGAL_GUARDIAN_LIMIT:
        'La fiche contient déjà 4 représentants légaux',
      PERSON_OTHER_NICKNAME_LIMIT: 'La fiche contient déjà 20 autres pseudos',
      PERSON_PHONE_LIMIT: 'La fiche contient déjà 10 téléphones',
      PERSON_SOCIAL_NETWORK_DEPRECATED:
        'Ce réseau n’accepte plus de nouveaux profils',
      PERSON_SOCIAL_PROFILE_LIMIT:
        'La fiche contient déjà 20 profils de réseaux sociaux',
    };

    return correlated(
      apiErrors.badRequest(messages[error.message] ?? 'Données invalides'),
    );
  }
  if (isMissingSchemaError(error)) {
    return correlated(
      apiError(
        ErrorCode.PERSON_FEATURE_NOT_CONFIGURED,
        'Le Répertoire attend une mise à jour de la base de données. Réessayez après le déploiement.',
        503,
      ),
    );
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    return correlated(
      apiError(
        ErrorCode.CONFLICT,
        'Cette information existe déjà sur cette fiche',
        409,
      ),
    );
  }

  return await apiErrors.internal(action, error, request);
};
