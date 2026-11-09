import { apiFetchJson, jsonRequest } from '$utils/api.utils';

import type {
  PassageChangeInput,
  PassageCreateInput,
  PassageInput,
  PassagePersonResults,
  TeamRoster,
} from './types/passage.types';

const rosterUrl = (teamId: string): string =>
  `/api/equipes/${encodeURIComponent(teamId)}/passages`;
const passageUrl = (teamId: string, id: string): string =>
  `${rosterUrl(teamId)}/${encodeURIComponent(id)}`;

export const fetchTeamRoster = (
  teamId: string,
  signal?: AbortSignal,
): Promise<TeamRoster> =>
  apiFetchJson<TeamRoster>(rosterUrl(teamId), { cache: 'no-store', signal });

/** Every mutation answers the whole roster, in its order. */
export const createPassageRequest = (
  teamId: string,
  input: PassageCreateInput,
): Promise<TeamRoster> =>
  apiFetchJson<TeamRoster>(rosterUrl(teamId), jsonRequest('POST', input));

export const updatePassageRequest = (
  teamId: string,
  id: string,
  input: PassageInput & { expectedVersion: number },
): Promise<TeamRoster> =>
  apiFetchJson<TeamRoster>(passageUrl(teamId, id), jsonRequest('PATCH', input));

export const changePassageFunctionRequest = (
  teamId: string,
  id: string,
  input: PassageChangeInput,
): Promise<TeamRoster> =>
  apiFetchJson<TeamRoster>(
    `${passageUrl(teamId, id)}/changement`,
    jsonRequest('POST', input),
  );

export const deletePassageRequest = (
  teamId: string,
  id: string,
  expectedVersion: number,
): Promise<TeamRoster> =>
  apiFetchJson<TeamRoster>(
    passageUrl(teamId, id),
    jsonRequest('DELETE', { expectedVersion }),
  );

/** Records of the Répertoire by pseudo or name, for the person picker. */
export const searchPassagePersonsRequest = (
  query: string,
  signal?: AbortSignal,
): Promise<PassagePersonResults> =>
  apiFetchJson<PassagePersonResults>(
    `/api/passages/personnes?${new URLSearchParams({ q: query })}`,
    { cache: 'no-store', signal },
  );
