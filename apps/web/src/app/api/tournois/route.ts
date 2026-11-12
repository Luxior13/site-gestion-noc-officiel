import type { NextRequest, NextResponse } from 'next/server';

import { PERMISSIONS } from '$constants/permissions.constants';
import {
  tournamentCreateSchema,
  tournamentQuerySchema,
} from '$features/tournaments/schemas/tournament.schemas';
import { createTournament } from '$features/tournaments/server/tournament.service';
import { listTournaments } from '$features/tournaments/server/tournament-read';
import { requireAuth, requirePermission } from '$server/api-auth';
import {
  apiErrors,
  apiSuccess,
  parseJsonBody,
  zodErrorDetails,
} from '$server/api-response';
import { readActorEsportScope } from '$server/esport-scope';
import { serviceErrorResponse } from '$server/service-error';

/**
 * The tournaments of the reader's Esport scope (11 November 2026), the
 * latest first; those a team played (`equipe`), or whose line-up holds a
 * record of the Répertoire (`personne`, with `persons:view`).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(auth.user, PERMISSIONS.TOURNAMENTS.VIEW);
  if (!permission.success) return permission.response;
  const query = tournamentQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!query.success) return apiErrors.validation('Recherche invalide');
  if (query.data.personne) {
    const persons = requirePermission(auth.user, PERMISSIONS.PERSONS.VIEW);
    if (!persons.success) return persons.response;
  }

  try {
    return apiSuccess(
      await listTournaments(await readActorEsportScope(auth.user), {
        personId: query.data.personne,
        teamId: query.data.equipe,
      }),
    );
  } catch (error) {
    return serviceErrorResponse(error, { action: 'TOURNAMENT_LIST', request });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const permission = requirePermission(
    auth.user,
    PERMISSIONS.TOURNAMENTS.MANAGE,
  );
  if (!permission.success) return permission.response;
  const body = await parseJsonBody(request);
  if (!body.success) return body.response;
  const parsed = tournamentCreateSchema.safeParse(body.data);
  if (!parsed.success)
    return apiErrors.validation(
      'Informations du tournoi invalides',
      zodErrorDetails(parsed.error),
    );

  try {
    return apiSuccess(
      await createTournament(parsed.data, {
        actor: auth.user,
        session: auth.session,
      }),
      201,
    );
  } catch (error) {
    return serviceErrorResponse(error, {
      action: 'TOURNAMENT_CREATE',
      request,
    });
  }
}
