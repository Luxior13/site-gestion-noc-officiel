'use client';

import { Ban, RotateCcw, Undo2 } from 'lucide-react';
import React, { type FC, useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '$ui/alert-dialog';
import { Button } from '$ui/button';
import { ApiClientError } from '$utils/api.utils';

import { updateTournamentRequest } from '../tournament.api';
import { tournamentTitle } from '../tournament.ui';
import type {
  TournamentDetail,
  TournamentInput,
} from '../types/tournament.types';

/** The tournament as it is, its cancellation changed. */
const inputOf = (
  tournament: TournamentDetail,
  isCancelled: boolean,
): TournamentInput & { expectedVersion: number } => ({
  datePrecision: tournament.datePrecision,
  edition: tournament.edition,
  endOn: tournament.endOn,
  entryFeeCents: tournament.entryFeeCents,
  expectedVersion: tournament.version,
  format: tournament.format,
  isCancelled,
  linkUrl: tournament.linkUrl,
  location: tournament.location,
  name: tournament.name,
  organizerId: tournament.organizer?.id ?? null,
  registrationDeadlineOn: tournament.registrationDeadlineOn,
  startOn: tournament.startOn,
});

/**
 * « Annuler le tournoi » (owner, 12 November 2026): an action of the record,
 * not a field, offered when the tournament can no longer be deleted because
 * operations name it (a fee paid); it stays in the history, said
 * « Annulé ». A cancelled tournament can be restored.
 */
export const TournamentCancelAction: FC<{
  onChange: (tournament: TournamentDetail) => void;
  onReload: () => Promise<TournamentDetail>;
  tournament: TournamentDetail;
}> = ({ onChange, onReload, tournament }) => {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const cancelled = tournament.isCancelled;

  const run = async (isCancelled: boolean): Promise<void> => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const saved = await updateTournamentRequest(
        tournament.id,
        inputOf(tournament, isCancelled),
      );
      onChange(saved);
      setOpen(false);
      toast.success(isCancelled ? 'Tournoi annulé' : 'Tournoi rétabli');
    } catch (caught) {
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : 'La demande n’a pas abouti. Réessayez.',
      );
      setStale(caught instanceof ApiClientError && caught.status === 409);
    } finally {
      setBusy(false);
    }
  };

  const reload = async (): Promise<void> => {
    setBusy(true);
    try {
      onChange(await onReload());
      setError(null);
      setStale(false);
    } catch {
      setError('Actualisation impossible. Réessayez.');
    } finally {
      setBusy(false);
    }
  };

  const feedback = error && (
    <div className="space-y-2" role="alert">
      <p className="text-destructive text-sm">{error}</p>
      {stale && (
        <Button
          disabled={busy}
          onClick={() => void reload()}
          size="sm"
          type="button"
          variant="outline"
        >
          <RotateCcw aria-hidden="true" className="size-4" />
          Actualiser le tournoi
        </Button>
      )}
    </div>
  );

  return (
    <section
      aria-labelledby="tournament-cancel-title"
      className="border-border-default bg-surface-inset flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
    >
      <div className="min-w-0 flex-1 basis-64 space-y-0.5">
        <h3 className="text-sm font-semibold" id="tournament-cancel-title">
          {cancelled ? 'Tournoi annulé' : 'Annuler le tournoi'}
        </h3>
        <p className="text-muted-foreground text-xs">
          {cancelled
            ? 'Il reste dans la liste et l’historique, marqué « Annulé ».'
            : 'Des opérations le nomment : il ne se supprime plus. S’il n’a pas lieu, ou si l’équipe se retire, annulez-le : il reste dans l’historique, marqué « Annulé ».'}
        </p>
        {!open && feedback}
      </div>
      {cancelled ? (
        <Button
          disabled={busy}
          loading={busy}
          onClick={() => void run(false)}
          size="sm"
          type="button"
          variant="outline"
        >
          {!busy && <Undo2 aria-hidden="true" className="size-4" />}
          Rétablir le tournoi
        </Button>
      ) : (
        <AlertDialog
          onOpenChange={(next) => {
            if (!busy) setOpen(next);
          }}
          open={open}
        >
          <AlertDialogTrigger asChild>
            <Button size="sm" type="button" variant="outline">
              <Ban aria-hidden="true" className="size-4" />
              Annuler le tournoi
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent
            aria-busy={busy || undefined}
            className="sm:max-w-lg"
          >
            <AlertDialogHeader>
              <AlertDialogTitle>
                Annuler le tournoi {tournamentTitle(tournament)} ?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Il reste dans la liste et l’historique, marqué « Annulé », avec
                ses équipes et ses opérations. Vous pourrez le rétablir.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {feedback}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Garder</AlertDialogCancel>
              <Button
                disabled={busy || stale}
                loading={busy}
                onClick={() => void run(true)}
                type="button"
                variant="destructive"
              >
                {!busy && <Ban aria-hidden="true" className="size-4" />}
                Annuler le tournoi
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </section>
  );
};
