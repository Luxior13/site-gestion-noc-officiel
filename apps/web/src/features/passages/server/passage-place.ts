import 'server-only';

import type { Prisma } from '@prisma/client';

import { FEATURES } from '$constants/feature-registry.constants';
import { PERMISSIONS } from '$constants/permissions.constants';
import { ServiceError, serviceErrors } from '$server/service-error';
import { ErrorCode } from '$types/api.types';

import type { PassageScope } from '../types/passage.types';

type TeamRef = Readonly<{
  gameId: string;
  gameName: string;
  id: string;
  name: string;
}>;

/**
 * Where a passage is kept (9 November 2026): the Roster of a team, with the
 * functions of its game, or the Effectif of the structure, Bureau & staff,
 * with the structure's functions. Each says itself in its own words.
 */
export type PassagePlace = Readonly<{
  /** The list of functions to choose from: the team's game, or none. */
  gameId: string | null;
  /** « Noctambule Academy (Valorant) », « Bureau & staff ». */
  label: string;
  team: TeamRef | null;
}>;

const STRUCTURE_PLACE: PassagePlace = {
  gameId: null,
  label: FEATURES.staff.label,
  team: null,
};

/**
 * Who may change the passages of a place, known from the request alone so
 * it is checked before anything is read: a team's roster follows the teams,
 * the structure's Bureau & staff.
 */
export const managePermissionOf = (scope: PassageScope): string =>
  scope.type === 'team' ? PERMISSIONS.TEAMS.MANAGE : PERMISSIONS.STAFF.MANAGE;

const teamMissing = (): ServiceError =>
  serviceErrors.notFound('Cette équipe n’existe plus. Rechargez la page.');

export const resolvePlace = async (
  client: Prisma.TransactionClient,
  scope: PassageScope,
): Promise<PassagePlace> => {
  if (scope.type === 'structure') return STRUCTURE_PLACE;
  const team = await client.team.findUnique({
    select: {
      game: { select: { name: true } },
      gameId: true,
      id: true,
      name: true,
    },
    where: { id: scope.teamId },
  });
  if (!team) throw teamMissing();
  const ref: TeamRef = {
    gameId: team.gameId,
    gameName: team.game.name,
    id: team.id,
    name: team.name,
  };

  return {
    gameId: ref.gameId,
    label: `${ref.name} (${ref.gameName})`,
    team: ref,
  };
};

/** The passages of a place: a team's, or those without team. */
export const teamIdOf = (place: PassagePlace): string | null =>
  place.team?.id ?? null;

/**
 * Where the journal files a passage: the team and its game, under the Jeux
 * page; or Bureau & staff, in the Structure pole.
 */
export const placeAuditMetadata = (
  place: PassagePlace,
): Record<string, string> =>
  place.team
    ? {
        gameId: place.team.gameId,
        gameName: place.team.gameName,
        teamId: place.team.id,
        teamName: place.team.name,
        ...FEATURES.games.audit,
      }
    : { scopeName: place.label, ...FEATURES.staff.audit };

const fieldError = (
  status: 400 | 409,
  field: string,
  message: string,
): ServiceError =>
  new ServiceError(
    status === 409 ? ErrorCode.CONFLICT : ErrorCode.VALIDATION_ERROR,
    message,
    status,
    { details: { [field]: [message] } },
  );

type PlaceTexts = Readonly<{
  /** « du jeu de l’équipe », « de la structure ». */
  functions: string;
  /** « le Roster », « l’Effectif ». */
  list: string;
  /** « dans l’équipe », « dans la structure ». */
  within: string;
}>;

const TEAM_TEXTS: PlaceTexts = {
  functions: 'du jeu de l’équipe',
  list: 'le Roster',
  within: 'dans l’équipe',
};
const STRUCTURE_TEXTS: PlaceTexts = {
  functions: 'de la structure',
  list: 'l’Effectif',
  within: 'dans la structure',
};

/**
 * The refusals of a passage, said in the words of its place: known from the
 * request alone, so a refusal of the base is said the same way.
 */
export const placeErrors = (
  type: PassageScope['type'],
): Readonly<{
  changed: () => ServiceError;
  field: typeof fieldError;
  functionOutside: () => ServiceError;
  missing: () => ServiceError;
  overlapping: (field: 'at' | 'start') => ServiceError;
}> => {
  const texts = type === 'team' ? TEAM_TEXTS : STRUCTURE_TEXTS;

  return {
    changed: () =>
      serviceErrors.conflict(
        `Ce passage a été modifié entre-temps. Rechargez ${texts.list} avant de recommencer.`,
      ),
    field: fieldError,
    functionOutside: () =>
      fieldError(
        400,
        'functionId',
        `Choisissez une fonction ${texts.functions}.`,
      ),
    missing: () =>
      serviceErrors.notFound(
        `Ce passage n’existe plus. Rechargez ${texts.list}.`,
      ),
    // The base refuses two identical passages at once (`PersonPassage_no_overlap`).
    overlapping: (field) =>
      fieldError(
        409,
        field,
        `Cette personne a déjà cette fonction ${texts.within} sur cette période.`,
      ),
  };
};
