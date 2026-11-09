import { apiFetchJson, jsonRequest } from '$utils/api.utils';

import type {
  TeamDetail,
  TeamInput,
  TeamItem,
  TeamUpdateInput,
} from './types/team.types';

const TEAMS_API = '/api/equipes';
const teamUrl = (id: string): string =>
  `${TEAMS_API}/${encodeURIComponent(id)}`;

export const fetchTeams = (signal?: AbortSignal): Promise<TeamItem[]> =>
  apiFetchJson<TeamItem[]>(TEAMS_API, { cache: 'no-store', signal });

export const fetchTeam = (
  id: string,
  signal?: AbortSignal,
): Promise<TeamDetail> =>
  apiFetchJson<TeamDetail>(teamUrl(id), { cache: 'no-store', signal });

/** Answers every team of the game, in the new order. */
export const reorderTeamsRequest = (
  gameId: string,
  ids: readonly string[],
): Promise<TeamItem[]> =>
  apiFetchJson<TeamItem[]>(
    `/api/jeux/${encodeURIComponent(gameId)}/equipes/ordre`,
    jsonRequest('PUT', { ids }),
  );

export const createTeamRequest = (input: TeamInput): Promise<TeamDetail> =>
  apiFetchJson<TeamDetail>(TEAMS_API, jsonRequest('POST', input));

export const updateTeamRequest = (
  id: string,
  input: TeamUpdateInput & { expectedVersion: number },
): Promise<TeamDetail> =>
  apiFetchJson<TeamDetail>(teamUrl(id), jsonRequest('PATCH', input));

export const deleteTeamRequest = (
  id: string,
  expectedVersion: number,
): Promise<{ id: string }> =>
  apiFetchJson<{ id: string }>(
    teamUrl(id),
    jsonRequest('DELETE', { expectedVersion }),
  );
