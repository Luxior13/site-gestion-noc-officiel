import { apiFetchJson, jsonRequest } from '$utils/api.utils';

import type {
  MemberFunctionInput,
  MemberFunctionItem,
} from './types/member-function.types';

const gameFunctionsUrl = (gameId: string): string =>
  `/api/jeux/${encodeURIComponent(gameId)}/fonctions`;
const gameFunctionUrl = (gameId: string, id: string): string =>
  `${gameFunctionsUrl(gameId)}/${encodeURIComponent(id)}`;

export const fetchGameFunctions = (
  gameId: string,
  signal?: AbortSignal,
): Promise<MemberFunctionItem[]> =>
  apiFetchJson<MemberFunctionItem[]>(gameFunctionsUrl(gameId), {
    cache: 'no-store',
    signal,
  });

export const createGameFunctionRequest = (
  gameId: string,
  input: MemberFunctionInput,
): Promise<MemberFunctionItem> =>
  apiFetchJson<MemberFunctionItem>(
    gameFunctionsUrl(gameId),
    jsonRequest('POST', input),
  );

export const addCommonGameFunctionsRequest = (
  gameId: string,
): Promise<MemberFunctionItem[]> =>
  apiFetchJson<MemberFunctionItem[]>(
    `${gameFunctionsUrl(gameId)}/courantes`,
    jsonRequest('POST', {}),
  );

export const updateGameFunctionRequest = (
  gameId: string,
  id: string,
  input: MemberFunctionInput & { expectedVersion: number },
): Promise<MemberFunctionItem> =>
  apiFetchJson<MemberFunctionItem>(
    gameFunctionUrl(gameId, id),
    jsonRequest('PATCH', input),
  );

export const deleteGameFunctionRequest = (
  gameId: string,
  id: string,
  expectedVersion: number,
): Promise<{ id: string }> =>
  apiFetchJson<{ id: string }>(
    gameFunctionUrl(gameId, id),
    jsonRequest('DELETE', { expectedVersion }),
  );
