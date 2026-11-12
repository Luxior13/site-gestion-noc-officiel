'use client';

import { RotateCcw } from 'lucide-react';
import React, { type FC, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { PersonPicker } from '$features/persons/components/PersonPicker';
import { RelativeDialogFrame } from '$features/persons/components/PersonRecordDialog';
import type { PersonRef } from '$features/persons/types/person.types';
import { Button } from '$ui/button';
import { Checkbox } from '$ui/checkbox';
import { Input } from '$ui/input';
import { Label } from '$ui/label';
import { SearchSelect, type SearchSelectGroup } from '$ui/search-select';
import { Skeleton } from '$ui/skeleton';
import { ApiClientError } from '$utils/api.utils';

import {
  createTournamentEntryRequest,
  deleteTournamentEntryRequest,
  fetchLineupCandidates,
  fetchTournamentChoices,
  searchTournamentPersonsRequest,
  updateTournamentEntryRequest,
} from '../tournament.api';
import {
  TOURNAMENT_LINEUP_MAX,
  TOURNAMENT_PLACEMENT_MAX,
} from '../tournament.constants';
import type {
  TournamentDetail,
  TournamentEntryItem,
  TournamentLineupMemberItem,
  TournamentTeamRef,
} from '../types/tournament.types';
import { describedBy, FieldError } from './TournamentParts';

const ID = 'tournament-entry';

type Field = 'lineup' | 'placementFrom' | 'placementTo' | 'teamId';
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
 * One of our teams in a tournament (11 November 2026): the team, then its
 * line-up chosen in its Roster at the tournament's dates (players checked
 * at first), a stand-in from the Répertoire if needed, and its final
 * placement, one place or a shared range. « Retirer l’équipe » on the left,
 * confirmed apart.
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
  const [candidates, setCandidates] = useState<
    readonly TournamentLineupMemberItem[] | null
  >(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<readonly string[]>(
    entry?.lineup.map((member) => member.person.id) ?? [],
  );
  // Stand-ins: in the line-up without a passage in the Roster then.
  const [standIns, setStandIns] = useState<readonly PersonRef[]>(
    entry?.lineup
      .filter((member) => member.function === null)
      .map((member) => member.person) ?? [],
  );
  const [picked, setPicked] = useState<PersonRef | null>(null);
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

  // The team's Roster at the tournament's dates.
  useEffect(() => {
    if (!teamId) return;
    const controller = new AbortController();
    setCandidates(null);
    fetchLineupCandidates(tournament.id, teamId, controller.signal)
      .then((next) => {
        setCandidates(next);
        // A new line-up starts with the team's players.
        if (!entry)
          setSelected(
            next
              .filter((member) => member.function?.kind === 'PLAYER')
              .map((member) => member.person.id),
          );
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadFailed(true);
      });

    return (): void => controller.abort();
  }, [attempt, entry, teamId, tournament.id]);

  const toggle = (personId: string, checked: boolean): void => {
    setSelected((current) =>
      checked
        ? [...current, personId]
        : current.filter((id) => id !== personId),
    );
    setErrors((current) => ({ ...current, lineup: undefined }));
  };

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
      lineup:
        selected.length > TOURNAMENT_LINEUP_MAX
          ? `${TOURNAMENT_LINEUP_MAX} personnes au plus`
          : undefined,
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
      lineup: selected,
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
  const candidateIds = new Set(
    (candidates ?? []).map((member) => member.person.id),
  );
  const groups: readonly {
    label: string;
    members: readonly TournamentLineupMemberItem[];
  }[] = [
    {
      label: 'Joueurs',
      members: (candidates ?? []).filter(
        (member) => member.function?.kind === 'PLAYER',
      ),
    },
    {
      label: 'Encadrement',
      members: (candidates ?? []).filter(
        (member) => member.function?.kind === 'STAFF',
      ),
    },
    {
      label: 'Remplaçants ponctuels',
      members: standIns
        .filter((person) => !candidateIds.has(person.id))
        .map((person) => ({ function: null, person })),
    },
  ].filter((group) => group.members.length > 0);
  const teamName =
    entry?.team.name ?? teams?.find((team) => team.id === teamId)?.name ?? '';

  return (
    <RelativeDialogFrame
      busy={busy}
      canSave={!stale && Boolean(teamId)}
      confirm={
        entry
          ? {
              description:
                'L’équipe et son line-up disparaissent du tournoi ; le journal d’activité garde la trace du retrait.',
              label: 'Retirer l’équipe',
              title: `Retirer ${entry.team.name} du tournoi ?`,
            }
          : null
      }
      description={
        entry
          ? 'Son line-up, pris dans son Roster aux dates du tournoi, et son classement final.'
          : 'Une de nos équipes du jeu du tournoi, avec son line-up et, une fois connu, son classement.'
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
            Le Roster de l’équipe ne peut pas être chargé.
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
              setStandIns([]);
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
      {teamId && (
        <fieldset
          aria-describedby={describedBy(
            `${ID}-lineup-hint`,
            errors.lineup && `${ID}-lineup-error`,
          )}
          className="min-w-0 space-y-2"
        >
          <legend className="font-form mb-1.5 text-[14px] leading-5 font-semibold">
            Line-up
          </legend>
          <p className="text-muted-foreground text-xs" id={`${ID}-lineup-hint`}>
            Les membres du Roster de {teamName} aux dates du tournoi : cochez
            ceux qui y participent, remplaçants compris.
          </p>
          {candidates === null && !loadFailed ? (
            <div
              aria-label="Chargement du Roster"
              className="space-y-2"
              role="status"
            >
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          ) : groups.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Personne dans le Roster de cette équipe aux dates du tournoi.
              Ajoutez un remplaçant ponctuel ci-dessous, ou complétez le Roster.
            </p>
          ) : (
            groups.map((group) => (
              <div className="space-y-1.5" key={group.label}>
                <p className="text-muted-foreground text-xs font-medium">
                  {group.label}
                </p>
                <div className="grid gap-1.5">
                  {group.members.map((member) => {
                    const id = `${ID}-member-${member.person.id}`;

                    return (
                      <Label
                        className="border-border-default hover:border-ring/70 has-[button[data-state=checked]]:border-primary/60 has-[button[data-state=checked]]:bg-primary/5 min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 font-normal has-[button:disabled]:cursor-not-allowed has-[button:disabled]:opacity-60"
                        htmlFor={id}
                        key={member.person.id}
                      >
                        <Checkbox
                          checked={selected.includes(member.person.id)}
                          disabled={busy}
                          id={id}
                          onCheckedChange={(state) =>
                            toggle(member.person.id, state === true)
                          }
                        />
                        <span className="min-w-0 flex-1 text-sm leading-5 font-medium [overflow-wrap:anywhere]">
                          {member.person.displayName}
                        </span>
                        <span className="text-muted-foreground shrink-0 text-xs">
                          {member.function?.name ?? 'Hors Roster'}
                        </span>
                      </Label>
                    );
                  })}
                </div>
              </div>
            ))
          )}
          <FieldError id={`${ID}-lineup-error`} message={errors.lineup} />
          <PersonPicker
            autoFocus={false}
            canCreatePerson={false}
            disabled={busy || candidates === null}
            exclude={[...candidateIds, ...standIns.map((person) => person.id)]}
            hint="Facultatif : quelqu’un hors du Roster aux dates du tournoi, qui a joué cette fois. Il est marqué « Hors Roster »."
            idPrefix={`${ID}-stand-in`}
            label="Ajouter un remplaçant ponctuel"
            onChange={(person) => {
              if (!person) return setPicked(null);
              setStandIns((current) => [...current, person]);
              setSelected((current) => [...current, person.id]);
              setPicked(null);
            }}
            onSearch={() => undefined}
            required={false}
            search={searchTournamentPersonsRequest}
            value={picked}
          />
        </fieldset>
      )}
      <fieldset className="min-w-0 space-y-1.5">
        <legend className="font-form mb-1.5 text-[14px] leading-5 font-semibold">
          Classement final
        </legend>
        <p
          className="text-muted-foreground text-xs"
          id={`${ID}-placement-hint`}
        >
          Une place, ou une place partagée : 3 à 4 pour « 3e–4e », 5 à 8 pour un
          Top 8. Vide tant que le tournoi n’est pas fini.
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
    </RelativeDialogFrame>
  );
};
