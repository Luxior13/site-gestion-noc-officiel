import { apiFetchJson, jsonRequest } from '$utils/api.utils';

import type { GameInput, GameItem } from './types/game.types';

const GAMES_API = '/api/jeux';
const gameUrl = (id: string): string =>
  `${GAMES_API}/${encodeURIComponent(id)}`;

export const fetchGames = (signal?: AbortSignal): Promise<GameItem[]> =>
  apiFetchJson<GameItem[]>(GAMES_API, { cache: 'no-store', signal });

export const fetchGame = (
  id: string,
  signal?: AbortSignal,
): Promise<GameItem> =>
  apiFetchJson<GameItem>(gameUrl(id), { cache: 'no-store', signal });

/** Answers every game, in the new order. */
export const reorderGamesRequest = (
  ids: readonly string[],
): Promise<GameItem[]> =>
  apiFetchJson<GameItem[]>(`${GAMES_API}/ordre`, jsonRequest('PUT', { ids }));

export const createGameRequest = (input: GameInput): Promise<GameItem> =>
  apiFetchJson<GameItem>(GAMES_API, jsonRequest('POST', input));

export const updateGameRequest = (
  id: string,
  input: GameInput & { expectedVersion: number },
): Promise<GameItem> =>
  apiFetchJson<GameItem>(gameUrl(id), jsonRequest('PATCH', input));

export const deleteGameRequest = (
  id: string,
  expectedVersion: number,
): Promise<{ id: string }> =>
  apiFetchJson<{ id: string }>(
    gameUrl(id),
    jsonRequest('DELETE', { expectedVersion }),
  );
