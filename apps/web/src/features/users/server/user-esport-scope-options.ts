import 'server-only';

import type { EsportScopeOptions } from '$constants/esport-scope.constants';
import { listGames } from '$features/games/server/game.service';
import { listTeams } from '$features/teams/server/team.service';
import { FULL_ESPORT_SCOPE } from '$server/esport-scope';

/**
 * Every game and team, in their dragged order, to choose from in the
 * authorizations editor, whatever the reader's own Esport rights.
 */
export const listEsportScopeOptions = async (): Promise<EsportScopeOptions> => {
  const [games, teams] = await Promise.all([
    listGames(FULL_ESPORT_SCOPE),
    listTeams(FULL_ESPORT_SCOPE),
  ]);

  return {
    games: games.map(({ id, isActive, name }) => ({ id, isActive, name })),
    teams: teams.map(({ gameId, id, isActive, name }) => ({
      gameId,
      id,
      isActive,
      name,
    })),
  };
};
