import { apiFetchJson, jsonRequest } from '$utils/api.utils';

import type {
  PassageChangeInput,
  PassageCreateInput,
  PassageInput,
  PassagePersonResults,
  PassageRoster,
  PassageScope,
  PersonJourney,
} from './types/passage.types';

/** A team's roster under the team, the structure's under Bureau & staff. */
const rosterUrl = (scope: PassageScope): string =>
  scope.type === 'team'
    ? `/api/equipes/${encodeURIComponent(scope.teamId)}/passages`
    : '/api/structure/effectif';
const passageUrl = (scope: PassageScope, id: string): string =>
  `${rosterUrl(scope)}/${encodeURIComponent(id)}`;

export const fetchRoster = (
  scope: PassageScope,
  signal?: AbortSignal,
): Promise<PassageRoster> =>
  apiFetchJson<PassageRoster>(rosterUrl(scope), { cache: 'no-store', signal });

/** Every mutation answers the whole roster, in its order. */
export const createPassageRequest = (
  scope: PassageScope,
  input: PassageCreateInput,
): Promise<PassageRoster> =>
  apiFetchJson<PassageRoster>(rosterUrl(scope), jsonRequest('POST', input));

export const updatePassageRequest = (
  scope: PassageScope,
  id: string,
  input: PassageInput & { expectedVersion: number },
): Promise<PassageRoster> =>
  apiFetchJson<PassageRoster>(
    passageUrl(scope, id),
    jsonRequest('PATCH', input),
  );

export const changePassageFunctionRequest = (
  scope: PassageScope,
  id: string,
  input: PassageChangeInput,
): Promise<PassageRoster> =>
  apiFetchJson<PassageRoster>(
    `${passageUrl(scope, id)}/changement`,
    jsonRequest('POST', input),
  );

export const deletePassageRequest = (
  scope: PassageScope,
  id: string,
  expectedVersion: number,
): Promise<PassageRoster> =>
  apiFetchJson<PassageRoster>(
    passageUrl(scope, id),
    jsonRequest('DELETE', { expectedVersion }),
  );

/** Every passage of a person, for the Parcours tab of their record. */
export const fetchPersonJourney = (
  personId: string,
  signal?: AbortSignal,
): Promise<PersonJourney> =>
  apiFetchJson<PersonJourney>(
    `/api/personnes/${encodeURIComponent(personId)}/parcours`,
    { cache: 'no-store', signal },
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
