'use client';

import { RotateCcw } from 'lucide-react';
import React, { type FC, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { RelativeDialogFrame } from '$features/persons/components/PersonRecordDialog';
import { Button } from '$ui/button';
import { Input } from '$ui/input';
import { Label } from '$ui/label';
import { SearchSelect, type SearchSelectGroup } from '$ui/search-select';
import { ApiClientError } from '$utils/api.utils';
import { getLocalToday } from '$utils/approximate-date.utils';

import {
  createTournamentEntryRequest,
  deleteTournamentEntryRequest,
  fetchTournamentChoices,
  updateTournamentEntryRequest,
} from '../tournament.api';
import { TOURNAMENT_PLACEMENT_MAX } from '../tournament.constants';
import { tournamentStateOn } from '../tournament.ui';
import type {
  TournamentDetail,
  TournamentEntryItem,
  TournamentTeamRef,
} from '../types/tournament.types';
import { describedBy, FieldError } from './TournamentParts';

const ID = 'tournament-entry';

type Field = 'placementFrom' | 'placementTo' | 'teamId';
type Errors = Partial<Record<Field, string>>;

/** « 3 », or none; anything else is said at once. */
const placeOf = (text: string): number | null | undefined => {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);

  return Number.isInteger(value) &&
    value >= 1 &&
    value <= TOURNAMENT_PLACEMENT_MAX
    ? value
    : undefined;
};

type Props = {
  /** Null to engage a team. */
  entry: TournamentEntryItem | null;
  onClose: () => void;
  onReload: () => Promise<TournamentDetail>;
  /** The record after the change; null when it left the account's scope. */
  onSaved: (tournament: TournamentDetail | null) => void;
  tournament: TournamentDetail;
};

/**
 * One of our teams in a tournament (11 November 2026): the team, chosen in
 * one menu, and its final placement, one place or a shared range, asked at
 * the engagement only of a finished tournament. Who played is not kept
 * (owner, 13 November 2026: « seulement les équipes suffisent »).
 * « Retirer l’équipe » on the left, confirmed apart.
 */
export const TournamentEntryDialog: FC<Props> = ({
  entry,
  onClose,
  onReload,
  onSaved,
  tournament,
}) => {
  const [teams, setTeams] = useState<readonly TournamentTeamRef[] | null>(
    entry ? [entry.team] : null,
  );
  const [teamId, setTeamId] = useState(entry?.team.id ?? '');
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [placementFrom, setPlacementFrom] = useState(
    entry?.placementFrom ? String(entry.placementFrom) : '',
  );
  const [placementTo, setPlacementTo] = useState(
    entry?.placementTo && entry.placementTo !== entry.placementFrom
      ? String(entry.placementTo)
      : '',
  );
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState(false);
  const operationRef = useRef(false);
  const engaged = tournament.entries.map((item) => item.team.id);
  // Before the end, the placement is not known yet: it waits for « Modifier ».
  const asksPlacement =
    entry !== null ||
    tournamentStateOn(tournament, getLocalToday()) === 'finished';

  // The teams of the game not engaged yet, to engage one.
  useEffect(() => {
    if (entry) return;
    const controller = new AbortController();
    fetchTournamentChoices(controller.signal)
      .then((choices) => {
        const free = (
          choices.games.find((game) => game.id === tournament.game.id)?.teams ??
          []
        ).filter((team) => !engaged.includes(team.id));
        setTeams(free);
        if (free.length === 1) setTeamId(free[0]?.id ?? '');
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadFailed(true);
      });

    return (): void => controller.abort();
    // The engaged teams are read once, when the window opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, entry, tournament.game.id]);

  const run = async (
    action: () => Promise<TournamentDetail | null>,
    done: string,
  ): Promise<void> => {
    if (operationRef.current) return;
    operationRef.current = true;
    setBusy(true);
    setErrors({});
    setFormError(null);
    try {
      onSaved(await action());
      toast.success(done);
      onClose();
    } catch (error) {
      if (!(error instanceof ApiClientError)) {
        setFormError('La demande n’a pas abouti. Réessayez.');
      } else if (error.details && Object.keys(error.details).length > 0) {
        setErrors(
          Object.fromEntries(
            Object.entries(error.details).map(([key, messages]) => [
              key.split('.')[0] ?? key,
              messages[0],
            ]),
          ),
        );
      } else {
        setFormError(error.message);
        setStale([404, 409].includes(error.status));
      }
    } finally {
      operationRef.current = false;
      setBusy(false);
    }
  };

  const reload = async (): Promise<void> => {
    if (operationRef.current) return;
    operationRef.current = true;
    setBusy(true);
    try {
      onSaved(await onReload());
      onClose();
    } catch {
      setFormError('Actualisation impossible. Réessayez.');
    } finally {
      operationRef.current = false;
      setBusy(false);
    }
  };

  const save = (): void => {
    if (stale) return;
    const from = placeOf(placementFrom);
    const to = placeOf(placementTo);
    const next: Errors = {
      placementFrom:
        from === undefined ? 'Une place, de 1 à 10 000' : undefined,
      placementTo:
        to === undefined
          ? 'Une place, de 1 à 10 000'
          : to !== null && from === null
            ? 'Indiquez d’abord la première place'
            : to !== null && from && to < from
              ? 'La dernière place suit la première'
              : undefined,
      teamId: teamId ? undefined : 'Choisissez l’équipe engagée',
    };
    if (Object.values(next).some(Boolean)) {
      setErrors(next);

      return;
    }
    const input = {
      placementFrom: from ?? null,
      placementTo: to ?? from ?? null,
    };
    void (entry
      ? run(
          () =>
            updateTournamentEntryRequest(tournament.id, entry.id, {
              ...input,
              expectedVersion: entry.version,
            }),
          'Participation modifiée',
        )
      : run(
          () =>
            createTournamentEntryRequest(tournament.id, { ...input, teamId }),
          'Équipe engagée',
        ));
  };

  const teamGroups: SearchSelectGroup[] = [
    {
      options: (teams ?? []).map((team) => ({
        label: team.name,
        note: team.isActive ? undefined : 'inactive',
        value: team.id,
      })),
    },
  ];

  return (
    <RelativeDialogFrame
      busy={busy}
      canSave={!stale && Boolean(teamId)}
      confirm={
        entry
          ? {
              description:
                'L’équipe disparaît du tournoi ; le journal d’activité garde la trace du retrait.',
              label: 'Retirer l’équipe',
              title: `Retirer ${entry.team.name} du tournoi ?`,
            }
          : null
      }
      description={
        entry
          ? 'Son classement final, une fois le tournoi fini.'
          : asksPlacement
            ? 'Une de nos équipes du jeu du tournoi, et son classement final.'
            : 'Une de nos équipes du jeu du tournoi ; son classement se saisira dans «\u00a0Modifier\u00a0», une fois le tournoi fini.'
      }
      onClose={onClose}
      onRemove={() =>
        entry &&
        void run(
          () =>
            deleteTournamentEntryRequest(
              tournament.id,
              entry.id,
              entry.version,
            ),
          'Équipe retirée du tournoi',
        )
      }
      onSubmit={save}
      submitLabel={entry ? 'Enregistrer' : 'Engager'}
      title={
        entry ? `Participation de ${entry.team.name}` : 'Engager une équipe'
      }
    >
      {formError && (
        <div className="space-y-2" role="alert">
          <p className="text-destructive text-sm">{formError}</p>
          {stale && (
            <Button
              disabled={busy}
              onClick={() => void reload()}
              size="sm"
              type="button"
              variant="outline"
            >
              <RotateCcw className="size-4" />
              Actualiser le tournoi
            </Button>
          )}
        </div>
      )}
      {loadFailed && (
        <div className="space-y-2" role="alert">
          <p className="text-destructive text-sm">
            Les équipes du jeu ne peuvent pas être chargées.
          </p>
          <Button
            onClick={() => {
              setLoadFailed(false);
              setAttempt((value) => value + 1);
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            <RotateCcw className="size-4" />
            Réessayer
          </Button>
        </div>
      )}
      {!entry && (
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor={`${ID}-team`} id={`${ID}-team-label`} required>
            Équipe
          </Label>
          <SearchSelect
            aria-describedby={describedBy(errors.teamId && `${ID}-team-error`)}
            aria-invalid={Boolean(errors.teamId)}
            autoFocus
            disabled={busy || teams === null}
            emptyText="Aucune équipe trouvée"
            groups={teamGroups}
            id={`${ID}-team`}
            labelId={`${ID}-team-label`}
            onValueChange={(next) => {
              setTeamId(next);
              setErrors((current) => ({ ...current, teamId: undefined }));
            }}
            placeholder={
              teams && teams.length === 0
                ? 'Toutes les équipes sont engagées'
                : 'Choisir une équipe'
            }
            searchLabel="Rechercher une équipe"
            value={teamId}
          />
          <FieldError id={`${ID}-team-error`} message={errors.teamId} />
        </div>
      )}
      {asksPlacement && (
        <fieldset className="min-w-0 space-y-1.5">
          <legend className="font-form mb-1.5 text-[14px] leading-5 font-semibold">
            Classement final
          </legend>
          <p
            className="text-muted-foreground text-xs"
            id={`${ID}-placement-hint`}
          >
            Une place, ou une place partagée : 3 à 4 pour « 3e–4e », 5 à 8 pour
            un Top 8. Vide tant que le tournoi n’est pas fini.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
            <div className="min-w-0 space-y-1">
              <Label className="text-xs font-medium" htmlFor={`${ID}-from`}>
                Place
              </Label>
              <Input
                aria-describedby={describedBy(
                  `${ID}-placement-hint`,
                  errors.placementFrom && `${ID}-from-error`,
                )}
                aria-invalid={Boolean(errors.placementFrom)}
                disabled={busy}
                id={`${ID}-from`}
                inputMode="numeric"
                maxLength={5}
                onChange={(event) => {
                  setPlacementFrom(event.target.value);
                  setErrors((current) => ({
                    ...current,
                    placementFrom: undefined,
                  }));
                }}
                placeholder="Ex. 3"
                value={placementFrom}
              />
              <FieldError
                id={`${ID}-from-error`}
                message={errors.placementFrom}
              />
            </div>
            <div className="min-w-0 space-y-1">
              <Label className="text-xs font-medium" htmlFor={`${ID}-to`}>
                à la place
              </Label>
              <Input
                aria-describedby={describedBy(
                  `${ID}-placement-hint`,
                  errors.placementTo && `${ID}-to-error`,
                )}
                aria-invalid={Boolean(errors.placementTo)}
                disabled={busy}
                id={`${ID}-to`}
                inputMode="numeric"
                maxLength={5}
                onChange={(event) => {
                  setPlacementTo(event.target.value);
                  setErrors((current) => ({
                    ...current,
                    placementTo: undefined,
                  }));
                }}
                placeholder="Ex. 4"
                value={placementTo}
              />
              <FieldError id={`${ID}-to-error`} message={errors.placementTo} />
            </div>
          </div>
        </fieldset>
      )}
    </RelativeDialogFrame>
  );
};
