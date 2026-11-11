import { apiFetchJson, jsonRequest } from '$utils/api.utils';

import type {
  LegalEntityCreateInput,
  LegalEntityInput,
  LegalEntityItem,
} from './types/entity.types';

const ENTITIES_API = '/api/structure/entites';
const entityUrl = (id: string): string =>
  `${ENTITIES_API}/${encodeURIComponent(id)}`;

export const fetchEntities = (
  signal?: AbortSignal,
): Promise<LegalEntityItem[]> =>
  apiFetchJson<LegalEntityItem[]>(ENTITIES_API, { cache: 'no-store', signal });

export const fetchEntity = (
  id: string,
  signal?: AbortSignal,
): Promise<LegalEntityItem> =>
  apiFetchJson<LegalEntityItem>(entityUrl(id), { cache: 'no-store', signal });

export const createEntityRequest = (
  input: LegalEntityCreateInput,
): Promise<LegalEntityItem> =>
  apiFetchJson<LegalEntityItem>(ENTITIES_API, jsonRequest('POST', input));

export const updateEntityRequest = (
  id: string,
  input: LegalEntityInput & { expectedVersion: number },
): Promise<LegalEntityItem> =>
  apiFetchJson<LegalEntityItem>(entityUrl(id), jsonRequest('PATCH', input));

export const deleteEntityRequest = (
  id: string,
  expectedVersion: number,
): Promise<{ id: string }> =>
  apiFetchJson<{ id: string }>(
    entityUrl(id),
    jsonRequest('DELETE', { expectedVersion }),
  );
