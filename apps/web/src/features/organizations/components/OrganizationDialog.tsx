'use client';

import { Check } from 'lucide-react';
import React, { type FC, useState } from 'react';

import { Button } from '$ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '$ui/dialog';
import { Input } from '$ui/input';
import { Label } from '$ui/label';
import { ApiClientError } from '$utils/api.utils';

import { createOrganizationRequest } from '../organization.api';
import {
  ORGANIZATION_NAME_MAX_LENGTH,
  type OrganizationKind,
} from '../organization.constants';
import type { OrganizationDetail } from '../types/organization.types';
import { OrganizationKindsField } from './OrganizationKindsField';

type FieldErrors = Partial<Record<'kinds' | 'name', string>>;

const ID = 'organization-dialog';

const firstDetail = (error: ApiClientError, key: string): string | undefined =>
  Object.entries(error.details ?? {}).find(
    ([path]) => path === key || path.startsWith(`${key}.`),
  )?.[1]?.[0];

const FieldError: FC<{ id: string; message?: string }> = ({ id, message }) =>
  message ? (
    <p className="text-destructive text-xs" id={id} role="alert">
      {message}
    </p>
  ) : null;

type Props = {
  onClose: () => void;
  onCreated: (organization: OrganizationDetail) => void;
};

/**
 * Adds an organisation in a window: its name and what it is to the
 * structure; its record then opens for its site, address, identifiers and
 * contacts (11 November 2026).
 */
export const OrganizationDialog: FC<Props> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [kinds, setKinds] = useState<OrganizationKind[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async (): Promise<void> => {
    if (busy) return;
    const missing: FieldErrors = {
      kinds: kinds.length > 0 ? undefined : 'Choisissez au moins un type',
      name: name.trim() ? undefined : 'Le nom est obligatoire',
    };
    if (missing.name || missing.kinds) {
      setErrors(missing);

      return;
    }
    setBusy(true);
    setErrors({});
    setFormError(null);
    try {
      onCreated(await createOrganizationRequest({ kinds, name }));
    } catch (error) {
      if (error instanceof ApiClientError) {
        const next: FieldErrors = {
          kinds: firstDetail(error, 'kinds'),
          name: firstDetail(error, 'name'),
        };
        setErrors(next);
        setFormError(next.name || next.kinds ? null : error.message);
      } else {
        setFormError('La demande n’a pas abouti. Réessayez.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        aria-busy={busy || undefined}
        className="flex h-[100svh] max-h-[100svh] flex-col overflow-hidden p-0 sm:h-auto sm:max-h-[85svh] sm:max-w-xl"
        fullscreenOnMobile
      >
        <form
          autoComplete="off"
          className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto]"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void create();
          }}
        >
          <DialogHeader className="bg-surface-panel-header border-border-divider border-b px-4 py-4 pr-14 text-left sm:px-5">
            <DialogTitle>Ajouter une organisation</DialogTitle>
            <DialogDescription>
              Sa fiche s’ouvre ensuite pour son site, son adresse, ses
              identifiants et ses contacts.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
            {formError && (
              <p className="text-destructive text-sm" role="alert">
                {formError}
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor={`${ID}-name`} required>
                Nom
              </Label>
              <Input
                aria-describedby={errors.name ? `${ID}-name-error` : undefined}
                aria-invalid={Boolean(errors.name)}
                autoFocus
                disabled={busy}
                id={`${ID}-name`}
                maxLength={ORGANIZATION_NAME_MAX_LENGTH}
                onChange={(event) => {
                  setName(event.target.value);
                  setFormError(null);
                }}
                placeholder="Ex. LDLC, Mairie de Lyon"
                value={name}
              />
              <FieldError id={`${ID}-name-error`} message={errors.name} />
            </div>
            <OrganizationKindsField
              disabled={busy}
              error={errors.kinds}
              idPrefix={`${ID}-kinds`}
              onChange={(next) => {
                setKinds(next);
                setErrors((current) => ({ ...current, kinds: undefined }));
              }}
              value={kinds}
            />
          </div>
          <DialogFooter className="border-border-divider bg-surface-inset border-t px-4 py-4 sm:px-5">
            <Button
              disabled={busy}
              onClick={onClose}
              type="button"
              variant="outline"
            >
              Annuler
            </Button>
            <Button disabled={busy} loading={busy} type="submit">
              {!busy && <Check className="size-4" />}
              {busy ? 'Enregistrement…' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
