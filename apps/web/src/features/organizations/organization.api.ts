import type { PersonSuggestions } from '$features/persons/types/person.types';
import { apiFetchJson, jsonRequest } from '$utils/api.utils';

import type {
  OrganizationContactInput,
  OrganizationCreateInput,
  OrganizationDetail,
  OrganizationInput,
  OrganizationItem,
} from './types/organization.types';

const ORGANIZATIONS_API = '/api/relations/organisations';
const organizationUrl = (id: string): string =>
  `${ORGANIZATIONS_API}/${encodeURIComponent(id)}`;
const contactsUrl = (id: string, contactId?: string): string =>
  contactId
    ? `${organizationUrl(id)}/contacts/${encodeURIComponent(contactId)}`
    : `${organizationUrl(id)}/contacts`;

export const fetchOrganizations = (
  signal?: AbortSignal,
): Promise<OrganizationItem[]> =>
  apiFetchJson<OrganizationItem[]>(ORGANIZATIONS_API, {
    cache: 'no-store',
    signal,
  });

export const fetchOrganization = (
  id: string,
  signal?: AbortSignal,
): Promise<OrganizationDetail> =>
  apiFetchJson<OrganizationDetail>(organizationUrl(id), {
    cache: 'no-store',
    signal,
  });

export const createOrganizationRequest = (
  input: OrganizationCreateInput,
): Promise<OrganizationDetail> =>
  apiFetchJson<OrganizationDetail>(
    ORGANIZATIONS_API,
    jsonRequest('POST', input),
  );

export const updateOrganizationRequest = (
  id: string,
  input: OrganizationInput & { expectedVersion: number },
): Promise<OrganizationDetail> =>
  apiFetchJson<OrganizationDetail>(
    organizationUrl(id),
    jsonRequest('PATCH', input),
  );

export const deleteOrganizationRequest = (
  id: string,
  expectedVersion: number,
): Promise<{ id: string }> =>
  apiFetchJson<{ id: string }>(
    organizationUrl(id),
    jsonRequest('DELETE', { expectedVersion }),
  );

/** Adds, edits or removes a contact; the organisation comes back whole. */
export const mutateOrganizationContact = ({
  contactId,
  id,
  method,
  payload,
}: {
  contactId?: string;
  id: string;
  method: 'DELETE' | 'PATCH' | 'POST';
  payload:
    | (OrganizationContactInput & { expectedVersion?: number })
    | { expectedVersion: number };
}): Promise<OrganizationDetail> =>
  apiFetchJson<OrganizationDetail>(
    contactsUrl(id, contactId),
    jsonRequest(method, payload),
  );

/** Records of the Répertoire to link to a contact (11 November 2026). */
export const searchContactPersonsRequest = (
  query: string,
  signal?: AbortSignal,
): Promise<PersonSuggestions> =>
  apiFetchJson<PersonSuggestions>(
    `${ORGANIZATIONS_API}/personnes?${new URLSearchParams({ q: query })}`,
    { cache: 'no-store', signal },
  );
