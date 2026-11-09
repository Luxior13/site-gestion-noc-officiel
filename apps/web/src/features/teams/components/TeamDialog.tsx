'use client';

import { Check } from 'lucide-react';
import React, { type FC, useState } from 'react';

import { ApproximateDateField } from '$components/forms/ApproximateDateField';
import type { GameItem } from '$features/games/types/game.types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '$ui/select';
import { Switch } from '$ui/switch';
import { compareActiveThenRank } from '$utils/active-order.utils';
import { ApiClientError } from '$utils/api.utils';
import {
  type ApproximateDate,
  getLocalToday,
} from '$utils/approximate-date.utils';

import { createTeamRequest } from '../team.api';
import { TEAM_NAME_MAX_LENGTH } from '../team.constants';
import type { TeamDetail } from '../types/team.types';

type Draft = {
  founded: ApproximateDate;
  /** Chosen explicitly: it never changes once the team exists. */
  gameId: string;
  isActive: boolean;
  name: string;
};

type FieldErrors = Partial<Record<'founded' | 'gameId' | 'name', string>>;

const ID = 'team-dialog';

const fieldErrorsOf = (error: ApiClientError): FieldErrors => {
  const details = error.details ?? {};
  const first = (prefix: string): string | undefined =>
    Object.entries(details).find(
      ([key]) => key === prefix || key.startsWith(`${prefix}.`),
    )?.[1]?.[0];

  return {
    founded: first('founded'),
    gameId: first('gameId'),
    name: first('name'),
  };
};

type Props = {
  /**
   * Every game, active first: an inactive game still records past or upcoming
   * teams (owner, 8 November 2026).
   */
  games: readonly GameItem[];
  onClose: () => void;
  onCreated: (team: TeamDetail) => void;
};

const TeamDialogContent: FC<Props> = ({ games, onClose, onCreated }) => {
  const [draft, setDraft] = useState<Draft>({
    // Prefilled with today, like a game's first opening.
    founded: { date: getLocalToday(), precision: 'DAY' },
    // No default game, since it never changes; unless there is only one.
    gameId: games.length === 1 ? (games[0]?.id ?? '') : '',
    isActive: true,
    name: '',
  });
  const game = games.find((entry) => entry.id === draft.gameId);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const change = (next: Partial<Draft>): void => {
    setDraft((current) => ({ ...current, ...next }));
    setFormError(null);
  };

  const create = async (): Promise<void> => {
    if (busy) return;
    const missing: FieldErrors = {
      gameId: draft.gameId ? undefined : 'Choisissez un jeu',
      name: draft.name.trim() ? undefined : 'Le nom est obligatoire',
    };
    if (missing.gameId || missing.name) {
      setErrors(missing);

      return;
    }
    setBusy(true);
    setErrors({});
    setFormError(null);
    try {
      onCreated(await createTeamRequest(draft));
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
            <DialogTitle>Ajouter une équipe</DialogTitle>
            <DialogDescription>
              Sa fiche s’ouvre ensuite, pour la compléter.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
            {formError && (
              <p className="text-destructive text-sm" role="alert">
                {formError}
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor={`${ID}-game`} required>
                Jeu
              </Label>
              <Select
                disabled={busy}
                onValueChange={(gameId) => {
                  change({ gameId });
                  setErrors((current) => ({ ...current, gameId: undefined }));
                }}
                value={draft.gameId}
              >
                <SelectTrigger
                  aria-describedby={`${ID}-game-hint${errors.gameId ? ` ${ID}-game-error` : ''}`}
                  // The first choice to make, unless the only game is set.
                  autoFocus={games.length !== 1}
                  aria-invalid={Boolean(errors.gameId)}
                  className="w-full"
                  id={`${ID}-game`}
                >
                  <SelectValue placeholder="Choisir un jeu" />
                </SelectTrigger>
                <SelectContent>
                  {/* A choice: the active games first, then the inactive
                      ones, marked, each in the dragged order (PREF-Q10). */}
                  {[...games].sort(compareActiveThenRank).map((entry) => (
                    <SelectItem key={entry.id} value={entry.id}>
                      {entry.isActive ? entry.name : `${entry.name} (inactif)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p
                className="text-muted-foreground text-xs"
                id={`${ID}-game-hint`}
              >
                {game && !game.isActive
                  ? 'Ce jeu est inactif : l’équipe s’ajoute à son historique, passée ou à venir. '
                  : ''}
                Le jeu ne change plus une fois l’équipe créée : un autre jeu,
                c’est une autre équipe.
              </p>
              {errors.gameId && (
                <p
                  className="text-destructive text-xs"
                  id={`${ID}-game-error`}
                  role="alert"
                >
                  {errors.gameId}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${ID}-name`} required>
                Nom
              </Label>
              <Input
                aria-describedby={errors.name ? `${ID}-name-error` : undefined}
                aria-invalid={Boolean(errors.name)}
                autoFocus={games.length === 1}
                disabled={busy}
                id={`${ID}-name`}
                maxLength={TEAM_NAME_MAX_LENGTH}
                onChange={(event) => change({ name: event.target.value })}
                placeholder="Ex. Noctambule Academy"
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
            <ApproximateDateField
              disabled={busy}
              error={errors.founded}
              idPrefix={`${ID}-founded`}
              label="Création"
              onChange={(founded) => change({ founded })}
              value={draft.founded}
            />
            <div className="border-border-default bg-surface-inset flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5">
              <div>
                <Label className="leading-5" htmlFor={`${ID}-active`}>
                  Active
                </Label>
                <p className="text-muted-foreground text-xs">
                  Une équipe inactive reste dans l’historique.
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
 * Adds a team under its game in a window (four fields, « Créer » of gabarit
 * B); the team's record then opens, where it is edited and deleted.
 */
export const TeamDialog: FC<Props & { open: boolean }> = ({
  open,
  ...props
}) => (open ? <TeamDialogContent {...props} /> : null);
