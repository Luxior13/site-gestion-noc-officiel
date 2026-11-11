import { apiFetchJson, jsonRequest } from '$utils/api.utils';

import type {
  FinancialAccountCreateInput,
  FinancialAccountInput,
  FinancialAccountItem,
  FinancialAccountsOverview,
} from './types/financial-account.types';

const ACCOUNTS_API = '/api/finances/comptes';
const accountUrl = (id: string): string =>
  `${ACCOUNTS_API}/${encodeURIComponent(id)}`;

export const fetchFinancialAccounts = (
  signal?: AbortSignal,
): Promise<FinancialAccountsOverview> =>
  apiFetchJson<FinancialAccountsOverview>(ACCOUNTS_API, {
    cache: 'no-store',
    signal,
  });

export const fetchFinancialAccount = (
  id: string,
  signal?: AbortSignal,
): Promise<FinancialAccountItem> =>
  apiFetchJson<FinancialAccountItem>(accountUrl(id), {
    cache: 'no-store',
    signal,
  });

export const createFinancialAccountRequest = (
  input: FinancialAccountCreateInput,
): Promise<FinancialAccountItem> =>
  apiFetchJson<FinancialAccountItem>(ACCOUNTS_API, jsonRequest('POST', input));

export const updateFinancialAccountRequest = (
  id: string,
  input: FinancialAccountInput & { expectedVersion: number },
): Promise<FinancialAccountItem> =>
  apiFetchJson<FinancialAccountItem>(
    accountUrl(id),
    jsonRequest('PATCH', input),
  );

export const deleteFinancialAccountRequest = (
  id: string,
  expectedVersion: number,
): Promise<{ id: string }> =>
  apiFetchJson<{ id: string }>(
    accountUrl(id),
    jsonRequest('DELETE', { expectedVersion }),
  );
