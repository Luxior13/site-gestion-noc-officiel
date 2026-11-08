import { Gamepad2 } from 'lucide-react';
import React, { type FC } from 'react';

import { getNavigationSpaceToneClasses } from '$constants/navigation-theme.constants';
import { cn } from '$utils/css.utils';

/**
 * Picture of a game in a list, framed like a record's avatar in the
 * Répertoire. A default controller for now; the game's real image will take
 * its place (owner, 8 November 2026). Decorative: the name sits beside it.
 */
export const GameAvatar: FC<{ className?: string }> = ({ className }) => (
  <span
    aria-hidden="true"
    className={cn(
      'rounded-tile flex size-9 shrink-0 items-center justify-center border',
      getNavigationSpaceToneClasses('esport').icon,
      className,
    )}
  >
    {/* About 16 px in a list (36 px), scaled in a record's header. */}
    <Gamepad2 className="size-[45%]" />
  </span>
);
