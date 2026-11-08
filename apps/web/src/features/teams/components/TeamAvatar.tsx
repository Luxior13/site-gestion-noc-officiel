import { Shield } from 'lucide-react';
import React, { type FC } from 'react';

import { getNavigationSpaceToneClasses } from '$constants/navigation-theme.constants';
import { cn } from '$utils/css.utils';

/**
 * Picture of a team on its record: a crest in the Esport tone until the
 * team's logo takes its place, like a game's controller. Decorative: the name
 * sits beside it.
 */
export const TeamAvatar: FC<{ className?: string }> = ({ className }) => (
  <span
    aria-hidden="true"
    className={cn(
      'flex size-full items-center justify-center border',
      getNavigationSpaceToneClasses('esport').icon,
      className,
    )}
  >
    <Shield className="size-1/2" />
  </span>
);
