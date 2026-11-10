import React, { type ComponentProps, type FC } from 'react';

import { cn } from '$utils/css.utils';

export type StatusBadgeTone =
  'danger' | 'former' | 'info' | 'muted' | 'success' | 'warning';

const STATUS_BADGE_TONES = new Map<StatusBadgeTone, string>([
  ['danger', 'border-destructive/40 bg-destructive/15 text-destructive'],
  // What is past: a former member, an ended passage (10 November 2026).
  ['former', 'border-former/40 bg-former/12 text-former'],
  ['info', 'border-info/40 bg-info/15 text-info'],
  ['muted', 'border-muted-foreground/35 bg-muted/30 text-muted-foreground'],
  ['success', 'border-success/40 bg-success/15 text-success'],
  ['warning', 'border-warning/40 bg-warning/15 text-warning'],
]);

type StatusBadgeProps = ComponentProps<'span'> & { tone: StatusBadgeTone };

/**
 * Status of an object: tinted surface, thin border and a leading dot, so the
 * meaning never relies on color alone. `muted` is for neutral categories,
 * `former` for what is past.
 */
export const StatusBadge: FC<StatusBadgeProps> = ({
  children,
  className,
  tone,
  ...props
}) => (
  <span
    className={cn(
      'rounded-badge inline-flex w-fit shrink-0 items-center gap-1.5 border px-2 py-0.5 text-xs leading-5 font-medium whitespace-nowrap',
      STATUS_BADGE_TONES.get(tone),
      className,
    )}
    data-slot="status-badge"
    data-tone={tone}
    {...props}
  >
    <span
      aria-hidden="true"
      className="size-1.5 shrink-0 rounded-full bg-current"
    />
    {children}
  </span>
);
