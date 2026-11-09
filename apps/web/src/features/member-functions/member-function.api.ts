import { apiFetchJson, jsonRequest } from '$utils/api.utils';

import type {
  FunctionScope,
  MemberFunctionKind,
} from './member-function.constants';
import type {
  MemberFunctionInput,
  MemberFunctionItem,
} from './types/member-function.types';

/** A game's functions under its record, the structure's under Bureau & staff. */
const functionsUrl = (scope: FunctionScope): string =>
  scope.type === 'game'
    ? `/api/jeux/${encodeURIComponent(scope.gameId)}/fonctions`
    : '/api/structure/fonctions';
const functionUrl = (scope: FunctionScope, id: string): string =>
  `${functionsUrl(scope)}/${encodeURIComponent(id)}`;

export const fetchFunctions = (
  scope: FunctionScope,
  signal?: AbortSignal,
): Promise<MemberFunctionItem[]> =>
  apiFetchJson<MemberFunctionItem[]>(functionsUrl(scope), {
    cache: 'no-store',
    signal,
  });

export const createFunctionRequest = (
  scope: FunctionScope,
  input: MemberFunctionInput,
): Promise<MemberFunctionItem> =>
  apiFetchJson<MemberFunctionItem>(
    functionsUrl(scope),
    jsonRequest('POST', input),
  );

export const addCommonFunctionsRequest = (
  scope: FunctionScope,
): Promise<MemberFunctionItem[]> =>
  apiFetchJson<MemberFunctionItem[]>(
    `${functionsUrl(scope)}/courantes`,
    jsonRequest('POST', {}),
  );

export const updateFunctionRequest = (
  scope: FunctionScope,
  id: string,
  input: MemberFunctionInput & { expectedVersion: number },
): Promise<MemberFunctionItem> =>
  apiFetchJson<MemberFunctionItem>(
    functionUrl(scope, id),
    jsonRequest('PATCH', input),
  );

/** Answers every function of the list, in its new order. */
export const reorderFunctionsRequest = (
  scope: FunctionScope,
  input: Readonly<{ ids: readonly string[]; kind: MemberFunctionKind }>,
): Promise<MemberFunctionItem[]> =>
  apiFetchJson<MemberFunctionItem[]>(
    `${functionsUrl(scope)}/ordre`,
    jsonRequest('PUT', input),
  );

export const deleteFunctionRequest = (
  scope: FunctionScope,
  id: string,
  expectedVersion: number,
): Promise<{ id: string }> =>
  apiFetchJson<{ id: string }>(
    functionUrl(scope, id),
    jsonRequest('DELETE', { expectedVersion }),
  );
