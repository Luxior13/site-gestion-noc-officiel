import React, { type FC } from 'react';

import { StatusBadge } from '$ui/status-badge';

import { PERSON_STRUCTURE_STATUS_LABELS } from '../person.constants';
import { getStructureStatusTone } from '../person.ui';
import type { PersonStructureStatus } from '../types/person.types';

/**
 * Structure status shared by the directory and the record hero. Being outside
 * the structure is a neutral category, not an alert (decision of 2026-10-20);
 * a former member takes the mauve grey of what is past, as « Ancien » in a
 * roster (10 November 2026).
 */
export const PersonStatusBadge: FC<{
  status: PersonStructureStatus;
}> = ({ status }) => (
  <StatusBadge data-status={status} tone={getStructureStatusTone(status)}>
    {/* `status` comes from the closed list of the statuses. */}
    {/* eslint-disable-next-line security/detect-object-injection */}
    {PERSON_STRUCTURE_STATUS_LABELS[status]}
  </StatusBadge>
);
