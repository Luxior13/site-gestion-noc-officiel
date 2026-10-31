'use client';

import { History } from 'lucide-react';
import Link from 'next/link';
import React, { type FC } from 'react';

import { FEATURES } from '$constants/feature-registry.constants';
import { hasPermission, PERMISSIONS } from '$constants/permissions.constants';
import { useUser } from '$context/UserContext';
import { Button } from '$ui/button';

import {
  buildJournalParams,
  DEFAULT_JOURNAL_QUERY,
} from '../types/audit-journal.types';

type JournalHistoryLinkProps =
  | { person: string; targetProtected?: never; type?: never; user?: never }
  | { person?: never; targetProtected: boolean; type?: never; user: string }
  | { person?: never; targetProtected?: never; type: 'settings'; user?: never };

/**
 * « Historique » on a record (30 October 2026): the journal over its whole
 * retention, narrowed to this account or person. It replaces the field
 * provenance hints removed on 27 October and shows only to journal readers.
 * « Voir dans le journal » opens the settings changes the same way (AC-50).
 */
export const JournalHistoryLink: FC<JournalHistoryLinkProps> = ({
  person,
  targetProtected = false,
  type,
  user,
}) => {
  const { userData } = useUser();
  const canView =
    !!userData &&
    (userData.isProtected ||
      hasPermission(
        userData.role,
        PERMISSIONS.AUDIT.VIEW,
        userData.permissions,
      ));
  // The protected account's events stay hidden from every other reader.
  if (!canView || (targetProtected && !userData.isProtected)) return null;
  const params = buildJournalParams({
    ...DEFAULT_JOURNAL_QUERY,
    period: '1y',
    person: person ?? null,
    type: type ?? DEFAULT_JOURNAL_QUERY.type,
    user: user ?? null,
  });

  return (
    <Button asChild size="sm" variant="outline">
      <Link href={`${FEATURES.systemActivity.href}?${params}`}>
        <History aria-hidden="true" />
        {type ? 'Voir dans le journal' : 'Historique'}
      </Link>
    </Button>
  );
};
