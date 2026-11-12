'use client';

import { Check, RotateCcw } from 'lucide-react';
import React, { type FC, useCallback, useEffect, useState } from 'react';

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
import { SearchSelect, type SearchSelectGroup } from '$ui/search-select';
import { Skeleton } from '$ui/skeleton';
import { ApiClientError } from '$utils/api.utils';

import {
  createTournamentRequest,
  fetchTournamentChoices,
} from '../tournament.api';
import {
  TOURNAMENT_EDITION_MAX_LENGTH,
  TOURNAMENT_NAME_MAX_LENGTH,
} from '../tournament.constants';
import type {
  TournamentChoices,
  TournamentDetail,
} from '../types/tournament.types';
import { TournamentOrganizerField } from './TournamentOrganizerField';
import {
  describedBy,
  FieldError,
  type TournamentDates,
  TournamentDatesFields,
} from './TournamentParts';

const ID = 'tournament-dialog';

type Field =
  | 'edition'
  | 'endOn'
  | 'gameId'
  | 'name'
  | 'organizerId'
  | 'startOn'
  | 'teamId';
type FieldErrors = Partial<Record<Field, string>>;
const FIELDS: readonly Field[] = [
  'edition',
  'endOn',
  'gameId',
  'name',
  'organizerId',
  'startOn',
  'teamId',
];

const errorsOf = (error: ApiClientError): FieldErrors =>
  Object.fromEntries(
    FIELDS.map((field) => [
      field,
      Object.entries(error.details ?? {}).find(
        ([path]) => path.split('.')[0] === field,
      )?.[1]?.[0],
    ]),
  ) as FieldErrors;

type Props = {
  /** Who manages the organisations adds an organiser by its name. */
  canAddOrganizers: boolean;
  /** Who only sees chosen teams engages one at once. */
  mustChooseTeam: boolean;
  onClose: () => void;
  onCreated: (tournament: TournamentDetail) => void;
};

/**
 * Adds a tournament in a window (11 November 2026): its name and game, the
 * only fields asked (12 November 2026); its dates, organiser and engaged
 * team when already known; its record then opens for the rest.
 */
export const TournamentDialog: FC<Props> = ({
  canAddOrganizers,
  mustChooseTeam,
  onClose,
  onCreated,
}) => {
  const [choices, setChoices] = useState<TournamentChoices | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [name, setName] = useState('');
  const [edition, setEdition] = useState('');
  const [gameId, setGameId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [dates, setDates] = useState<TournamentDates>({
    datePrecision: 'DAY',
    endOn: '',
    startOn: '',
  });
  const [organizerId, setOrganizerId] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback((signal?: AbortSignal): void => {
    setLoadFailed(false);
    fetchTournamentChoices(signal)
      .then((next) => {
        setChoices(next);
        // One game alone is chosen by itself.
        if (next.games.length === 1) setGameId(next.games[0]?.id ?? '');
      })
      .catch(() => {
        if (!signal?.aborted) setLoadFailed(true);
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);

    return (): void => controller.abort();
  }, [load]);

  const game = choices?.games.find((entry) => entry.id === gameId);
  const gameGroups: SearchSelectGroup[] = [
    {
      options: (choices?.games ?? []).map((entry) => ({
        label: entry.name,
        note: entry.isActive ? undefined : 'inactif',
        value: entry.id,
      })),
    },
  ];
  const teamGroups: SearchSelectGroup[] = [
    {
      options: [
        ...(mustChooseTeam
          ? []
          : [{ label: 'Aucune pour l’instant', value: '' }]),
        ...(game?.teams ?? []).map((team) => ({
          label: team.name,
          note: team.isActive ? undefined : 'inactive',
          value: team.id,
        })),
      ],
    },
  ];

  const create = async (): Promise<void> => {
    if (busy) return;
    const missing: FieldErrors = {
      endOn:
        dates.startOn && dates.endOn && dates.endOn < dates.startOn
          ? 'La fin ne précède pas le début'
          : undefined,
      gameId: gameId ? undefined : 'Choisissez le jeu',
      name: name.trim() ? undefined : 'Le nom est obligatoire',
      teamId:
        mustChooseTeam && !teamId ? 'Choisissez l’équipe engagée' : undefined,
    };
    if (Object.values(missing).some(Boolean)) {
      setErrors(missing);

      return;
    }
    setBusy(true);
    setErrors({});
    setFormError(null);
    try {
      onCreated(
        await createTournamentRequest({
          datePrecision: dates.datePrecision,
          edition: edition.trim() || null,
          endOn: dates.endOn || null,
          gameId,
          name,
          organizerId: organizerId || null,
          startOn: dates.startOn || null,
          teamId: teamId || null,
        }),
      );
    } catch (error) {
      if (error instanceof ApiClientError) {
        const next = errorsOf(error);
        setErrors(next);
        setFormError(Object.values(next).some(Boolean) ? null : error.message);
      } else {
        setFormError('La demande n’a pas abouti. Réessayez.');
      }
    } finally {
      setBusy(false);
    }
  };

  const clear = (field: Field): void =>
    setErrors((current) => ({ ...current, [field]: undefined }));

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
            <DialogTitle>Ajouter un tournoi</DialogTitle>
            <DialogDescription>
              Seuls le nom et le jeu sont demandés ; la fiche s’ouvre ensuite
              pour la préparation et le line-up.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
            {formError && (
              <p className="text-destructive text-sm" role="alert">
                {formError}
              </p>
            )}
            {loadFailed ? (
              <div className="space-y-2" role="alert">
                <p className="text-destructive text-sm">
                  Les jeux et les organisateurs ne peuvent pas être chargés.
                </p>
                <Button
                  onClick={() => load()}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <RotateCcw className="size-4" />
                  Réessayer
                </Button>
              </div>
            ) : !choices ? (
              <div aria-label="Chargement" className="space-y-3" role="status">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor={`${ID}-name`} required>
                      Nom
                    </Label>
                    <Input
                      aria-describedby={describedBy(
                        errors.name && `${ID}-name-error`,
                      )}
                      aria-invalid={Boolean(errors.name)}
                      autoFocus
                      disabled={busy}
                      id={`${ID}-name`}
                      maxLength={TOURNAMENT_NAME_MAX_LENGTH}
                      onChange={(event) => {
                        setName(event.target.value);
                        clear('name');
                      }}
                      placeholder="Ex. Lyon e-Sport"
                      value={name}
                    />
                    <FieldError id={`${ID}-name-error`} message={errors.name} />
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor={`${ID}-edition`}>Édition</Label>
                    <Input
                      aria-describedby={describedBy(
                        `${ID}-edition-hint`,
                        errors.edition && `${ID}-edition-error`,
                      )}
                      aria-invalid={Boolean(errors.edition)}
                      disabled={busy}
                      id={`${ID}-edition`}
                      maxLength={TOURNAMENT_EDITION_MAX_LENGTH}
                      onChange={(event) => {
                        setEdition(event.target.value);
                        clear('edition');
                      }}
                      placeholder="Ex. Saison 2"
                      value={edition}
                    />
                  </div>
                  <p
                    className="text-muted-foreground -mt-2 text-xs sm:col-span-2"
                    id={`${ID}-edition-hint`}
                  >
                    Facultatif : ce qui distingue deux tournois du même nom, «
                    Saison 2 », « Split 1 », « 2027 ».
                  </p>
                  <FieldError
                    id={`${ID}-edition-error`}
                    message={errors.edition}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="min-w-0 space-y-1.5">
                    <Label
                      htmlFor={`${ID}-game`}
                      id={`${ID}-game-label`}
                      required
                    >
                      Jeu
                    </Label>
                    <SearchSelect
                      aria-describedby={describedBy(
                        errors.gameId && `${ID}-game-error`,
                      )}
                      aria-invalid={Boolean(errors.gameId)}
                      disabled={busy}
                      emptyText="Aucun jeu trouvé"
                      groups={gameGroups}
                      id={`${ID}-game`}
                      labelId={`${ID}-game-label`}
                      onValueChange={(next) => {
                        setGameId(next);
                        // The team was of the other game.
                        setTeamId('');
                        clear('gameId');
                      }}
                      placeholder="Choisir un jeu"
                      searchLabel="Rechercher un jeu"
                      value={gameId}
                    />
                    <FieldError
                      id={`${ID}-game-error`}
                      message={errors.gameId}
                    />
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <Label
                      htmlFor={`${ID}-team`}
                      id={`${ID}-team-label`}
                      required={mustChooseTeam}
                    >
                      Équipe engagée
                    </Label>
                    <SearchSelect
                      aria-describedby={describedBy(
                        `${ID}-team-hint`,
                        errors.teamId && `${ID}-team-error`,
                      )}
                      aria-invalid={Boolean(errors.teamId)}
                      disabled={busy || !game}
                      emptyText="Aucune équipe trouvée"
                      groups={teamGroups}
                      id={`${ID}-team`}
                      labelId={`${ID}-team-label`}
                      onValueChange={(next) => {
                        setTeamId(next);
                        clear('teamId');
                      }}
                      placeholder={
                        mustChooseTeam
                          ? 'Choisir une équipe'
                          : 'Aucune pour l’instant'
                      }
                      searchLabel="Rechercher une équipe"
                      value={teamId}
                    />
                    <p
                      className="text-muted-foreground text-xs"
                      id={`${ID}-team-hint`}
                    >
                      {mustChooseTeam
                        ? 'Votre compte voit seulement ses équipes : le tournoi s’ajoute avec l’une d’elles.'
                        : 'Facultatif : d’autres équipes s’engagent ensuite dans la fiche.'}
                    </p>
                    <FieldError
                      id={`${ID}-team-error`}
                      message={errors.teamId}
                    />
                  </div>
                  <TournamentDatesFields
                    disabled={busy}
                    errors={errors}
                    idPrefix={`${ID}-dates`}
                    onChange={(next) => {
                      setDates((current) => ({ ...current, ...next }));
                      clear('startOn');
                      clear('endOn');
                    }}
                    value={dates}
                  />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <Label
                    htmlFor={`${ID}-organizer`}
                    id={`${ID}-organizer-label`}
                  >
                    Organisateur
                  </Label>
                  <TournamentOrganizerField
                    aria-describedby={describedBy(
                      `${ID}-organizer-hint`,
                      errors.organizerId && `${ID}-organizer-error`,
                    )}
                    aria-invalid={Boolean(errors.organizerId)}
                    canAdd={canAddOrganizers}
                    disabled={busy}
                    id={`${ID}-organizer`}
                    labelId={`${ID}-organizer-label`}
                    onError={(message) =>
                      setErrors((current) => ({
                        ...current,
                        organizerId: message,
                      }))
                    }
                    onValueChange={(next) => {
                      setOrganizerId(next);
                      clear('organizerId');
                    }}
                    organizers={choices?.organizers ?? []}
                    value={organizerId}
                  />
                  <p
                    className="text-muted-foreground text-xs"
                    id={`${ID}-organizer-hint`}
                  >
                    {canAddOrganizers
                      ? 'Facultatif : tapez son nom ; un organisateur absent s’ajoute aux organisations.'
                      : 'Facultatif : les organisations de type Organisateur, que gère le bureau.'}
                  </p>
                  <FieldError
                    id={`${ID}-organizer-error`}
                    message={errors.organizerId}
                  />
                </div>
              </>
            )}
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
            <Button disabled={busy || !choices} loading={busy} type="submit">
              {!busy && <Check className="size-4" />}
              {busy ? 'Enregistrement…' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
