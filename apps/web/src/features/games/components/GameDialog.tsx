'use client';

import { Check, Trash2 } from 'lucide-react';
import React, { type FC, useState } from 'react';

import { ApproximateDateField } from '$components/forms/ApproximateDateField';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '$ui/alert-dialog';
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

import {
  createGameRequest,
  deleteGameRequest,
  updateGameRequest,
} from '../game.api';
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

const draftOf = (game: GameItem | null): Draft =>
  game
    ? {
        firstOpened: game.firstOpened,
        isActive: game.isActive,
        name: game.name,
        shortName: game.shortName ?? '',
      }
    : {
        // The first opening is prefilled with today (decision of 8 November 2026).
        firstOpened: { date: getLocalToday(), precision: 'DAY' },
        isActive: true,
        name: '',
        shortName: '',
      };

const isSameDraft = (left: Draft, right: Draft): boolean =>
  left.name.trim() === right.name.trim() &&
  left.shortName.trim() === right.shortName.trim() &&
  left.isActive === right.isActive &&
  left.firstOpened.date === right.firstOpened.date &&
  left.firstOpened.precision === right.firstOpened.precision;

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
  game: GameItem | null;
  onClose: () => void;
  onDeleted: (id: string) => void;
  onSaved: (game: GameItem) => void;
  /** Teams under the game, as the page currently shows them. */
  teamCount: number;
};

const GameDialogContent: FC<Props> = ({
  game,
  onClose,
  onDeleted,
  onSaved,
  teamCount,
}) => {
  const initial = draftOf(game);
  const [draft, setDraft] = useState<Draft>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isDirty = !isSameDraft(draft, initial);
  const change = (next: Partial<Draft>): void => {
    setDraft((current) => ({ ...current, ...next }));
    setFormError(null);
  };

  const fail = (error: unknown): void => {
    if (error instanceof ApiClientError) {
      const nextErrors = fieldErrorsOf(error);
      setErrors(nextErrors);
      setFormError(
        Object.values(nextErrors).some(Boolean) ? null : error.message,
      );
    } else {
      setFormError('La demande n’a pas abouti. Réessayez.');
    }
  };

  const save = async (): Promise<void> => {
    if (busy) return;
    if (!draft.name.trim()) {
      setErrors({ name: 'Le nom est obligatoire' });

      return;
    }
    setBusy(true);
    setErrors({});
    setFormError(null);
    const input = {
      firstOpened: draft.firstOpened,
      isActive: draft.isActive,
      name: draft.name,
      shortName: draft.shortName.trim() || null,
    };
    try {
      onSaved(
        game
          ? await updateGameRequest(game.id, {
              ...input,
              expectedVersion: game.version,
            })
          : await createGameRequest(input),
      );
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (): Promise<void> => {
    if (!game || busy) return;
    setBusy(true);
    setFormError(null);
    try {
      await deleteGameRequest(game.id, game.version);
      onDeleted(game.id);
    } catch (error) {
      setConfirmDelete(false);
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
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
              void save();
            }}
          >
            <DialogHeader className="bg-surface-panel-header border-border-divider border-b px-4 py-4 pr-14 text-left sm:px-5">
              <DialogTitle>
                {game ? 'Modifier le jeu' : 'Ajouter un jeu'}
              </DialogTitle>
              <DialogDescription>
                {game
                  ? 'Renommer sert à corriger une faute. Pour un nouveau jeu (CS2 après CS:GO), rendez l’ancien inactif et ajoutez-en un nouveau.'
                  : 'Une section de la structure ; ses équipes s’ajoutent ensuite sous le jeu.'}
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
                  aria-describedby={
                    errors.name ? `${ID}-name-error` : undefined
                  }
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
                  onChange={(event) =>
                    change({ shortName: event.target.value })
                  }
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
                    Un jeu inactif reste dans l’historique.
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
            <DialogFooter className="border-border-divider bg-surface-inset border-t px-4 py-4 sm:justify-between sm:px-5">
              {game && teamCount === 0 && (
                <Button
                  disabled={busy}
                  onClick={() => setConfirmDelete(true)}
                  type="button"
                  variant="destructive"
                >
                  <Trash2 className="size-4" />
                  Supprimer
                </Button>
              )}
              {/* Said instead of a delete the base would refuse. */}
              {game && teamCount > 0 && (
                <p className="text-muted-foreground text-xs sm:max-w-60">
                  {`Ce jeu a ${teamCount > 1 ? `${teamCount} équipes` : 'une équipe'} : rendez-le inactif plutôt que de le supprimer.`}
                </p>
              )}
              <div className="flex flex-col-reverse gap-2 sm:ml-auto sm:flex-row">
                <Button
                  disabled={busy}
                  onClick={onClose}
                  type="button"
                  variant="outline"
                >
                  Annuler
                </Button>
                <Button
                  disabled={busy || Boolean(game && !isDirty)}
                  loading={busy}
                  type="submit"
                >
                  {!busy && <Check className="size-4" />}
                  {busy ? 'Enregistrement…' : game ? 'Enregistrer' : 'Ajouter'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {game && (
        <AlertDialog
          onOpenChange={(open) => {
            if (!open && !busy) setConfirmDelete(false);
          }}
          open={confirmDelete}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Supprimer définitivement le jeu {game.name} ?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Il disparaît de la liste ; le journal d’activité garde la trace
                de la suppression.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90 text-white"
                disabled={busy}
                onClick={(event) => {
                  event.preventDefault();
                  void remove();
                }}
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

/** Adds or edits a game in a window: four fields only (gabarit, « Créer »). */
export const GameDialog: FC<Props & { open: boolean }> = ({
  open,
  ...props
}) =>
  open ? <GameDialogContent key={props.game?.id ?? 'new'} {...props} /> : null;
