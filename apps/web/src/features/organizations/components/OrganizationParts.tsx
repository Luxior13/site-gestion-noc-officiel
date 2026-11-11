import { Building2 } from 'lucide-react';
import React, { type FC } from 'react';

import { StatusBadge } from '$ui/status-badge';
import { cn } from '$utils/css.utils';

import {
  ORGANIZATION_KIND_LABELS,
  type OrganizationKind,
} from '../organization.constants';

/** The tile of an organisation, until it has a logo. */
export const OrganizationAvatar: FC<{ className?: string }> = ({
  className,
}) => (
  <span
    aria-hidden="true"
    className={cn(
      'rounded-tile border-border-default bg-surface-inset text-muted-foreground flex size-9 shrink-0 items-center justify-center border',
      className,
    )}
  >
    <Building2 className="size-4" />
  </span>
);

/** « Sponsor », « Fournisseur »… a neutral pastille per kind. */
export const OrganizationKinds: FC<{
  kinds: readonly OrganizationKind[];
}> = ({ kinds }) => (
  <span className="flex flex-wrap gap-1.5">
    {kinds.map((kind) => (
      <StatusBadge key={kind} tone="muted">
        {/* Kinds come from the closed list. */}
        {/* eslint-disable-next-line security/detect-object-injection */}
        {ORGANIZATION_KIND_LABELS[kind]}
      </StatusBadge>
    ))}
  </span>
);
