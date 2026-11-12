import type { PersonSuggestions } from '$features/persons/types/person.types';
import { apiFetchJson, jsonRequest } from '$utils/api.utils';

import type {
  TournamentChoices,
  TournamentCreateInput,
  TournamentDetail,
  TournamentEntryInput,
  TournamentInput,
  TournamentItem,
  TournamentLineupCandidate,
} from './types/tournament.types';

const TOURNAMENTS_API = '/api/tournois';
const tournamentUrl = (id: string): string =>
  `${TOURNAMENTS_API}/${encodeURIComponent(id)}`;
const entryUrl = (id: string, entryId?: string): string =>
  entryId
    ? `${tournamentUrl(id)}/participants/${encodeURIComponent(entryId)}`
    : `${tournamentUrl(id)}/participants`;

/** Every tournament of the scope, or those of a team or a person. */
export const fetchTournaments = (
  filters: Readonly<{ personId?: string; teamId?: string }> = {},
  signal?: AbortSignal,
): Promise<TournamentItem[]> => {
  const params = new URLSearchParams();
  if (filters.teamId) params.set('equipe', filters.teamId);
  if (filters.personId) params.set('personne', filters.personId);
  const query = params.toString();

  return apiFetchJson<TournamentItem[]>(
    query ? `${TOURNAMENTS_API}?${query}` : TOURNAMENTS_API,
    { cache: 'no-store', signal },
  );
};

export const fetchTournament = (
  id: string,
  signal?: AbortSignal,
): Promise<TournamentDetail> =>
  apiFetchJson<TournamentDetail>(tournamentUrl(id), {
    cache: 'no-store',
    signal,
  });

export const fetchTournamentChoices = (
  signal?: AbortSignal,
): Promise<TournamentChoices> =>
  apiFetchJson<TournamentChoices>(`${TOURNAMENTS_API}/choix`, {
    cache: 'no-store',
    signal,
  });

export const createTournamentRequest = (
  input: TournamentCreateInput,
): Promise<TournamentDetail> =>
  apiFetchJson<TournamentDetail>(TOURNAMENTS_API, jsonRequest('POST', input));

export const updateTournamentRequest = (
  id: string,
  input: TournamentInput & { expectedVersion: number },
): Promise<TournamentDetail> =>
  apiFetchJson<TournamentDetail>(
    tournamentUrl(id),
    jsonRequest('PATCH', input),
  );

export const deleteTournamentRequest = (
  id: string,
  expectedVersion: number,
): Promise<{ id: string }> =>
  apiFetchJson<{ id: string }>(
    tournamentUrl(id),
    jsonRequest('DELETE', { expectedVersion }),
  );

/** The members of a team's Roster at the tournament's dates. */
export const fetchLineupCandidates = (
  id: string,
  teamId: string,
  signal?: AbortSignal,
): Promise<TournamentLineupCandidate[]> =>
  apiFetchJson<TournamentLineupCandidate[]>(
    `${tournamentUrl(id)}/candidats?${new URLSearchParams({ equipe: teamId })}`,
    { cache: 'no-store', signal },
  );

export const createTournamentEntryRequest = (
  id: string,
  input: TournamentEntryInput & { teamId: string },
): Promise<TournamentDetail> =>
  apiFetchJson<TournamentDetail>(entryUrl(id), jsonRequest('POST', input));

export const updateTournamentEntryRequest = (
  id: string,
  entryId: string,
  input: TournamentEntryInput & { expectedVersion: number },
): Promise<TournamentDetail> =>
  apiFetchJson<TournamentDetail>(
    entryUrl(id, entryId),
    jsonRequest('PATCH', input),
  );

/** Null when the tournament leaves the account's scope. */
export const deleteTournamentEntryRequest = (
  id: string,
  entryId: string,
  expectedVersion: number,
): Promise<TournamentDetail | null> =>
  apiFetchJson<TournamentDetail | null>(
    entryUrl(id, entryId),
    jsonRequest('DELETE', { expectedVersion }),
  );

/** Records of the Répertoire to add as a stand-in. */
export const searchTournamentPersonsRequest = (
  query: string,
  signal?: AbortSignal,
): Promise<PersonSuggestions> =>
  apiFetchJson<PersonSuggestions>(
    `${TOURNAMENTS_API}/personnes?${new URLSearchParams({ q: query })}`,
    { cache: 'no-store', signal },
  );
