import React, { type FC } from 'react';

import { cn } from '$utils/css.utils';

/**
 * The flag of a country, before its name in a choice (owner, 10 November
 * 2026: « possible d'avoir les drapeaux à l'intérieur ? »). An image served
 * by the site (`public/assets/flags`, country-flag-icons, MIT): emoji flags
 * show as two letters on Windows. Decorative, the name beside it says the
 * country; loaded only when shown.
 */
export const CountryFlag: FC<{ className?: string; code: string }> = ({
  className,
  code,
}) => (
  // A 700-byte SVG of the site: the image optimizer adds nothing here.
  // eslint-disable-next-line @next/next/no-img-element
  <img
    alt=""
    aria-hidden="true"
    className={cn(
      'ring-border-default h-3.5 w-[21px] shrink-0 rounded-[2px] object-cover ring-1',
      className,
    )}
    decoding="async"
    height={14}
    loading="lazy"
    src={`/assets/flags/${encodeURIComponent(code)}.svg`}
    width={21}
  />
);
