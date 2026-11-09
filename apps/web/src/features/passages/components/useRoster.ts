'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchRoster } from '../passage.api';
import { STRUCTURE_PASSAGES } from '../passage.constants';
import type { PassageRoster, PassageScope } from '../types/passage.types';

type RosterState = Readonly<{
  /** Every write answers the whole roster, taken as is. */
  accept: (next: PassageRoster) => void;
  error: Error | null;
  load: () => Promise<void>;
  retry: () => Promise<void>;
  roster: PassageRoster | null;
}>;

/**
 * The passages of a place, read by the tab that shows them: the Roster or
 * the Effectif (what is there and coming), or the former members, from the
 * same answer.
 */
export const useRoster = (requested: PassageScope): RosterState => {
  const [roster, setRoster] = useState<PassageRoster | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(false);
  // One place per mount, whatever object the page passes on each render.
  const teamId = requested.type === 'team' ? requested.teamId : null;

  useEffect(() => {
    mountedRef.current = true;

    return (): void => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (): Promise<void> => {
    const fresh = await fetchRoster(
      teamId === null ? STRUCTURE_PASSAGES : { teamId, type: 'team' },
    );
    if (mountedRef.current) {
      setRoster(fresh);
      setError(null);
    }
  }, [teamId]);

  const retry = useCallback(async (): Promise<void> => {
    setError(null);
    setRoster(null);
    try {
      await load();
    } catch (caught) {
      if (mountedRef.current)
        setError(
          caught instanceof Error
            ? caught
            : new Error('Chargement impossible.'),
        );
    }
  }, [load]);

  useEffect(() => {
    void retry();
  }, [retry]);

  return { accept: setRoster, error, load, retry, roster };
};
