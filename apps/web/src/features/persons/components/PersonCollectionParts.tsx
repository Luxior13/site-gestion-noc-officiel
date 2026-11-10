'use client';

import {
  type CountryCode,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';
import { Copy, Pencil } from 'lucide-react';
import React, { type FC } from 'react';
import { toast } from 'sonner';

import { Badge } from '$ui/badge';
import { Button } from '$ui/button';
import { Card, CardContent, CardHeader } from '$ui/card';
import { ServiceIcon } from '$ui/service-icon';

/*
 * Pieces shared by the cards of the Coordonnées tab: the contacts, and the
 * emergency contacts and legal representatives (10 November 2026).
 */

export const EditAction: FC<{
  label: string;
  onEdit: () => void;
}> = ({ label, onEdit }) => (
  <Button
    aria-label={`Modifier ${label}`}
    onClick={onEdit}
    size="icon"
    type="button"
    variant="ghost"
  >
    <Pencil className="size-3.5" />
  </Button>
);

export const CopyAction: FC<{ label: string; value: string }> = ({
  label,
  value,
}) => {
  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copié`);
    } catch {
      toast.error('Copie impossible');
    }
  };

  return (
    <Button
      aria-label={`Copier ${label.toLowerCase()}`}
      onClick={() => void handleCopy()}
      size="icon"
      type="button"
      variant="ghost"
    >
      <Copy className="size-3.5" />
    </Button>
  );
};

/** One contact collection (27 October 2026): title, count and add action. */
export const CollectionCard: FC<{
  addAction?: React.ReactNode;
  children: React.ReactNode;
  count: number;
  icon: React.ReactNode;
  title: string;
}> = ({ addAction, children, count, icon, title }) => (
  <Card>
    <CardHeader className="flex-row items-center justify-between gap-3 p-3.5 sm:p-4">
      <div className="flex min-w-0 items-center gap-2">
        <ServiceIcon className="border-primary/30 bg-primary/10 text-primary-emphasis size-7 [&_svg]:size-3.5">
          {icon}
        </ServiceIcon>
        <h2 className="text-sm font-semibold">{title}</h2>
        <Badge variant="outline">{count}</Badge>
      </div>
      {addAction}
    </CardHeader>
    <CardContent className="p-3 sm:p-4">{children}</CardContent>
  </Card>
);

/**
 * « +33 6 12 34 56 78 »: readable number, the stored value is unchanged. A
 * number typed « 06… » is read with its country (10 November 2026), as the
 * call link is.
 */
export const formatPhoneForDisplay = (
  phone: string,
  countryCode?: string,
): string =>
  parsePhoneNumberFromString(
    phone,
    countryCode as CountryCode | undefined,
  )?.formatInternational() ?? phone;

/** `tel:+33612345678`, whatever way the number was typed. */
export const phoneHref = (phone: string, countryCode?: string): string =>
  `tel:${parsePhoneNumberFromString(phone, countryCode as CountryCode | undefined)?.number ?? phone}`;

export const RowTypeIcon: FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <span
    aria-hidden="true"
    className="text-muted-foreground shrink-0 [&_svg]:size-4"
  >
    {children}
  </span>
);

export const EmptyCollection: FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <p className="text-muted-foreground border-border-divider rounded-lg border border-dashed px-3 py-4 text-center text-sm">
    {children}
  </p>
);
