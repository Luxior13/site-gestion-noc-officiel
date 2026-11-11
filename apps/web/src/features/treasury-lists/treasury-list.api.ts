import { apiFetchJson, jsonRequest } from '$utils/api.utils';

import {
  TREASURY_LIST_SLUGS,
  type TreasuryChoiceKind,
  type TreasuryList,
} from './treasury-list.constants';
import type {
  TreasuryChoiceInput,
  TreasuryChoiceItem,
} from './types/treasury-list.types';

const listUrl = (list: TreasuryList): string =>
  // eslint-disable-next-line security/detect-object-injection
  `/api/finances/listes/${TREASURY_LIST_SLUGS[list]}`;
const choiceUrl = (list: TreasuryList, id: string): string =>
  `${listUrl(list)}/${encodeURIComponent(id)}`;

export const fetchTreasuryChoices = (
  list: TreasuryList,
  signal?: AbortSignal,
): Promise<TreasuryChoiceItem[]> =>
  apiFetchJson<TreasuryChoiceItem[]>(listUrl(list), {
    cache: 'no-store',
    signal,
  });

export const createTreasuryChoiceRequest = (
  list: TreasuryList,
  input: TreasuryChoiceInput,
): Promise<TreasuryChoiceItem> =>
  apiFetchJson<TreasuryChoiceItem>(listUrl(list), jsonRequest('POST', input));

export const addCommonTreasuryChoicesRequest = (
  list: TreasuryList,
): Promise<TreasuryChoiceItem[]> =>
  apiFetchJson<TreasuryChoiceItem[]>(
    `${listUrl(list)}/courantes`,
    jsonRequest('POST', {}),
  );

export const updateTreasuryChoiceRequest = (
  list: TreasuryList,
  id: string,
  input: TreasuryChoiceInput & { expectedVersion: number },
): Promise<TreasuryChoiceItem> =>
  apiFetchJson<TreasuryChoiceItem>(
    choiceUrl(list, id),
    jsonRequest('PATCH', input),
  );

export const reorderTreasuryChoicesRequest = (
  list: TreasuryList,
  input: Readonly<{ ids: readonly string[]; kind: TreasuryChoiceKind }>,
): Promise<TreasuryChoiceItem[]> =>
  apiFetchJson<TreasuryChoiceItem[]>(
    `${listUrl(list)}/ordre`,
    jsonRequest('POST', input),
  );

export const deleteTreasuryChoiceRequest = (
  list: TreasuryList,
  id: string,
  expectedVersion: number,
): Promise<{ id: string }> =>
  apiFetchJson<{ id: string }>(
    choiceUrl(list, id),
    jsonRequest('DELETE', { expectedVersion }),
  );
