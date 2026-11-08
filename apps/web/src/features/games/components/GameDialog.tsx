'use client';

import { Check } from 'lucide-react';
import React, { type FC, useState } from 'react';

import { ApproximateDateField } from '$components/forms/ApproximateDateField';
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
import { Switch } from '$ui/switch';
import { ApiClientError } from '$utils/api.utils';
import {
  type ApproximateDate,
  getLocalToday,
} from '$utils/approximate-date.utils';

import { createGameRequest } from '../game.api';
import {
  GAME_NAME_MAX_LENGTH,
  GAME_SHORT_NAME_MAX_LENGTH,
} from '../game.constants';
import type { GameItem } from '../types/game.types';

type Draft = {
  firstOpened: ApproximateDate;
  isActive: boolean;
  name: string;
  shortName: string;
};

type FieldErrors = Partial<
  Record<'firstOpened' | 'name' | 'shortName', string>
>;

const ID = 'game-dialog';

const fieldErrorsOf = (error: ApiClientError): FieldErrors => {
  const details = error.details ?? {};
  const first = (prefix: string): string | undefined =>
    Object.entries(details).find(
      ([key]) => key === prefix || key.startsWith(`${prefix}.`),
    )?.[1]?.[0];

  return {
    firstOpened: first('firstOpened'),
    name: first('name'),
    shortName: first('shortName'),
  };
};

type Props = {
  onClose: () => void;
  onCreated: (game: GameItem) => void;
};

const GameDialogContent: FC<Props> = ({ onClose, onCreated }) => {
  const [draft, setDraft] = useState<Draft>({
    // The first opening is prefilled with today (decision of 8 November 2026).
    firstOpened: { date: getLocalToday(), precision: 'DAY' },
    isActive: true,
    name: '',
    shortName: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const change = (next: Partial<Draft>): void => {
    setDraft((current) => ({ ...current, ...next }));
    setFormError(null);
  };

  const create = async (): Promise<void> => {
    if (busy) return;
    if (!draft.name.trim()) {
      setErrors({ name: 'Le nom est obligatoire' });

      return;
    }
    setBusy(true);
    setErrors({});
    setFormError(null);
    try {
      onCreated(
        await createGameRequest({
          firstOpened: draft.firstOpened,
          isActive: draft.isActive,
          name: draft.name,
          shortName: draft.shortName.trim() || null,
        }),
      );
    } catch (error) {
      if (error instanceof ApiClientError) {
        const nextErrors = fieldErrorsOf(error);
        setErrors(nextErrors);
        setFormError(
          Object.values(nextErrors).some(Boolean) ? null : error.message,
        );
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
        className="flex h-[100svh] max-h-[100svh] flex-col overflow-hidden p-0 sm:h-auto sm:max-h-[85svh] sm:max-w-lg"
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
            <DialogTitle>Ajouter un jeu</DialogTitle>
            <DialogDescription>
              Une section de la structure ; sa fiche s’ouvre ensuite, pour la
              compléter.
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
                maxLength={GAME_NAME_MAX_LENGTH}
                onChange={(event) => change({ name: event.target.value })}
                placeholder="Ex. Valorant"
                value={draft.name}
              />
              {errors.name && (
                <p
                  className="text-destructive text-xs"
                  id={`${ID}-name-error`}
                  role="alert"
                >
                  {errors.name}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${ID}-short-name`}>Nom court</Label>
              <Input
                aria-describedby={`${ID}-short-name-hint${errors.shortName ? ` ${ID}-short-name-error` : ''}`}
                aria-invalid={Boolean(errors.shortName)}
                className="max-w-40"
                disabled={busy}
                id={`${ID}-short-name`}
                maxLength={GAME_SHORT_NAME_MAX_LENGTH}
                onChange={(event) => change({ shortName: event.target.value })}
                placeholder="Ex. VAL"
                value={draft.shortName}
              />
              <p
                className="text-muted-foreground text-xs"
                id={`${ID}-short-name-hint`}
              >
                Facultatif, pour les affichages serrés : VAL, LoL, CS2…
              </p>
              {errors.shortName && (
                <p
                  className="text-destructive text-xs"
                  id={`${ID}-short-name-error`}
                  role="alert"
                >
                  {errors.shortName}
                </p>
              )}
            </div>
            <ApproximateDateField
              disabled={busy}
              error={errors.firstOpened}
              idPrefix={`${ID}-first-opened`}
              label="Première ouverture"
              onChange={(firstOpened) => change({ firstOpened })}
              subject="première ouverture"
              value={draft.firstOpened}
            />
            <div className="border-border-default bg-surface-inset flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5">
              <div>
                <Label className="leading-5" htmlFor={`${ID}-active`}>
                  Actif
                </Label>
                <p className="text-muted-foreground text-xs">
                  Un jeu inactif reste dans l’historique et reçoit encore des
                  équipes.
                </p>
              </div>
              <Switch
                checked={draft.isActive}
                disabled={busy}
                id={`${ID}-active`}
                onCheckedChange={(isActive) => change({ isActive })}
              />
            </div>
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

/**
 * Adds a game in a window (four fields); its record then opens, where it is
 * edited and deleted (8 November 2026).
 */
export const GameDialog: FC<Props & { open: boolean }> = ({
  open,
  ...props
}) => (open ? <GameDialogContent {...props} /> : null);
