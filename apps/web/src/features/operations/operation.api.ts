import type { PersonSuggestions } from '$features/persons/types/person.types';
import { apiFetchJson, jsonRequest } from '$utils/api.utils';

import { OPERATION_KIND_SLUGS } from './operation.constants';
import type {
  GameFinanceRow,
  OperationChoices,
  OperationFilters,
  OperationInput,
  OperationItem,
  OperationsPage,
} from './types/operation.types';

const OPERATIONS_API = '/api/finances/operations';
const operationUrl = (id: string): string =>
  `${OPERATIONS_API}/${encodeURIComponent(id)}`;

/** The list's query, as the server reads it. */
const queryOf = (filters: OperationFilters): string => {
  const params = new URLSearchParams();
  if (filters.page > 1) params.set('page', String(filters.page));
  if (filters.kind) params.set('sens', OPERATION_KIND_SLUGS[filters.kind]);
  if (filters.q?.trim()) params.set('q', filters.q.trim());
  if (filters.accountId) params.set('compte', filters.accountId);
  if (filters.organizationId)
    params.set('organisation', filters.organizationId);
  if (filters.teamId) params.set('equipe', filters.teamId);
  if (filters.gameId) params.set('jeu', filters.gameId);
  if (filters.personId) params.set('personne', filters.personId);
  const search = params.toString();

  return search ? `?${search}` : '';
};

export const fetchOperations = (
  filters: OperationFilters,
  signal?: AbortSignal,
): Promise<OperationsPage> =>
  apiFetchJson<OperationsPage>(`${OPERATIONS_API}${queryOf(filters)}`, {
    cache: 'no-store',
    signal,
  });

/** A game's money, team by team, then the game itself. */
export const fetchGameFinances = (
  gameId: string,
  signal?: AbortSignal,
): Promise<GameFinanceRow[]> =>
  apiFetchJson<GameFinanceRow[]>(
    `${OPERATIONS_API}/jeux/${encodeURIComponent(gameId)}`,
    { cache: 'no-store', signal },
  );

export const fetchOperation = (
  id: string,
  signal?: AbortSignal,
): Promise<OperationItem> =>
  apiFetchJson<OperationItem>(operationUrl(id), { cache: 'no-store', signal });

export const fetchOperationChoices = (
  signal?: AbortSignal,
): Promise<OperationChoices> =>
  apiFetchJson<OperationChoices>(`${OPERATIONS_API}/choix`, {
    cache: 'no-store',
    signal,
  });

export const createOperationRequest = (
  input: OperationInput,
): Promise<OperationItem> =>
  apiFetchJson<OperationItem>(OPERATIONS_API, jsonRequest('POST', input));

export const updateOperationRequest = (
  id: string,
  input: OperationInput & { expectedVersion: number },
): Promise<OperationItem> =>
  apiFetchJson<OperationItem>(operationUrl(id), jsonRequest('PATCH', input));

export const deleteOperationRequest = (
  id: string,
  expectedVersion: number,
): Promise<{ id: string }> =>
  apiFetchJson<{ id: string }>(
    operationUrl(id),
    jsonRequest('DELETE', { expectedVersion }),
  );

/** Records of the Répertoire who paid or were paid (11 November 2026). */
export const searchOperationPersonsRequest = (
  query: string,
  signal?: AbortSignal,
): Promise<PersonSuggestions> =>
  apiFetchJson<PersonSuggestions>(
    `${OPERATIONS_API}/personnes?${new URLSearchParams({ q: query })}`,
    { cache: 'no-store', signal },
  );
