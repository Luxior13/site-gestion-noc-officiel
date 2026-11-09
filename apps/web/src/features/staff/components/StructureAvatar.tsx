import { BriefcaseBusiness } from 'lucide-react';
import React, { type FC } from 'react';

import { getNavigationSpaceToneClasses } from '$constants/navigation-theme.constants';
import { cn } from '$utils/css.utils';

/**
 * Picture of the structure itself (Bureau & staff), in the Structure pole's
 * tone, as a team's crest is in the Esport one. Decorative: the name sits
 * beside it.
 */
export const StructureAvatar: FC<{ className?: string }> = ({ className }) => (
  <span
    aria-hidden="true"
    className={cn(
      'flex size-full items-center justify-center border',
      getNavigationSpaceToneClasses('legal').icon,
      className,
    )}
  >
    <BriefcaseBusiness className="size-1/2" />
  </span>
);
