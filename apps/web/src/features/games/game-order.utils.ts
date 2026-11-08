import type { GameItem } from './types/game.types';

/**
 * Order of the games: active ones first, then by name, so the sections that
 * run today lead the list (owner, 8 November 2026).
 */
export const compareGames = (
  left: Pick<GameItem, 'isActive' | 'name'>,
  right: Pick<GameItem, 'isActive' | 'name'>,
): number =>
  Number(right.isActive) - Number(left.isActive) ||
  left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' });
