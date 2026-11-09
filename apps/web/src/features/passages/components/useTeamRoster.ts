'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchTeamRoster } from '../passage.api';
import type { TeamRoster } from '../types/passage.types';

type TeamRosterState = Readonly<{
  /** Every write answers the whole roster, taken as is. */
  accept: (next: TeamRoster) => void;
  error: Error | null;
  load: () => Promise<void>;
  retry: () => Promise<void>;
  roster: TeamRoster | null;
}>;

/**
 * The passages of a team, read by the tab that shows them: the Roster (what
 * is there and coming) or the former members, from the same answer.
 */
export const useTeamRoster = (teamId: string): TeamRosterState => {
  const [roster, setRoster] = useState<TeamRoster | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return (): void => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (): Promise<void> => {
    const fresh = await fetchTeamRoster(teamId);
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
