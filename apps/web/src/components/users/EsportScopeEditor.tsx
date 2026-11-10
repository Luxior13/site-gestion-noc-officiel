'use client';

import React, { type FC, useCallback, useEffect, useId, useState } from 'react';

import {
  ESPORT_SCOPE_DESCRIPTIONS,
  ESPORT_SCOPE_KINDS,
  ESPORT_SCOPE_LABELS,
  type EsportScopeKind,
  type EsportScopeOptions,
  type EsportScopeValue,
  isEmptyEsportScope,
  normalizeEsportScope,
} from '$constants/esport-scope.constants';
import { Badge } from '$ui/badge';
import { Button } from '$ui/button';
import { Checkbox } from '$ui/checkbox';
import { Label } from '$ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '$ui/select';
import { apiFetchJson } from '$utils/api.utils';

import { PermissionInfoButton } from './PermissionInfoButton';
import styles from './PermissionsEditor.module.css';

const TITLE = 'Jeux et équipes visibles';
const DETAILS =
  'Les autorisations Esport de ce compte ne valent que pour ces jeux ou ces équipes : le reste n’existe pas pour lui. Une fonction tenue dans un Roster (Manager, Coach…) n’ouvre jamais rien ; l’accès se règle ici.';

type Choice = Readonly<{ id: string; isActive: boolean; name: string }>;

const SCOPE_OPTIONS = ESPORT_SCOPE_KINDS.map((option) => ({
  // eslint-disable-next-line security/detect-object-injection
  label: ESPORT_SCOPE_LABELS[option],
  option,
}));

const toggle = (ids: readonly string[], id: string, on: boolean): string[] =>
  on
    ? [...ids.filter((item) => item !== id), id]
    : ids.filter((item) => item !== id);

const ChoiceList: FC<{
  chosen: readonly string[];
  describedBy?: string;
  disabled: boolean;
  feminine: boolean;
  items: readonly Choice[];
  legend: string;
  legendVisible: boolean;
  onToggle: (id: string, on: boolean) => void;
}> = ({
  chosen,
  describedBy,
  disabled,
  feminine,
  items,
  legend,
  legendVisible,
  onToggle,
}) => (
  <fieldset aria-describedby={describedBy} className={styles.scopeGroup}>
    <legend className={legendVisible ? styles.scopeLegend : 'sr-only'}>
      {legend}
    </legend>
    <div className={styles.scopeGrid}>
      {items.map((item) => (
        <Label className={styles.scopeOption} key={item.id}>
          <Checkbox
            checked={chosen.includes(item.id)}
            disabled={disabled}
            onCheckedChange={(state) => onToggle(item.id, state === true)}
          />
          <span>
            {item.name}
            {!item.isActive && (
              <span className="text-muted-foreground">
                {feminine ? ' (inactive)' : ' (inactif)'}
              </span>
            )}
          </span>
        </Label>
      ))}
    </div>
  </fieldset>
);

type EsportScopeEditorProps = {
  /** The account holds « Consulter les jeux »: otherwise the row reads blocked. */
  active: boolean;
  canEdit: boolean;
  /** Who may change it; otherwise the scope only reads. */
  changed: boolean;
  disabled: boolean;
  /** An administrator always sees every game. */
  isAdmin: boolean;
  onChange: (value: EsportScopeValue) => void;
  value: EsportScopeValue;
};

/**
 * Which games and teams an account reaches in the Esport pole (owner,
 * 10 November 2026: « c'est l'utilisateur et ses autorisations qui font, pas
 * un rôle dans une équipe »), on the Jeux page of its authorizations, under
 * its access. Every game, chosen games (their teams, future ones included) or
 * chosen teams; saved with the other authorizations.
 */
export const EsportScopeEditor: FC<EsportScopeEditorProps> = ({
  active,
  canEdit,
  changed,
  disabled,
  isAdmin,
  onChange,
  value,
}) => {
  const titleId = useId();
  const errorId = useId();
  const kind: EsportScopeKind = isAdmin ? 'ALL' : value.kind;
  // Keys come from the closed EsportScopeKind list.
  // eslint-disable-next-line security/detect-object-injection
  const kindLabel = ESPORT_SCOPE_LABELS[kind];
  // eslint-disable-next-line security/detect-object-injection
  const kindDescription = ESPORT_SCOPE_DESCRIPTIONS[kind];
  // Controls stay in place while saving, only disabled.
  const editable = canEdit && !isAdmin;
  const [options, setOptions] = useState<EsportScopeOptions | null>(null);
  const [loadError, setLoadError] = useState(false);
  const needsOptions = kind !== 'ALL';

  const load = useCallback(async (signal?: AbortSignal): Promise<void> => {
    setLoadError(false);
    try {
      setOptions(
        await apiFetchJson<EsportScopeOptions>(
          '/api/users/esport-scope-options',
          { cache: 'no-store', signal },
        ),
      );
    } catch {
      if (!signal?.aborted) setLoadError(true);
    }
  }, []);

  useEffect(() => {
    if (!needsOptions || options) return;
    const controller = new AbortController();
    void load(controller.signal);

    return (): void => controller.abort();
  }, [load, needsOptions, options]);

  const empty = editable && isEmptyEsportScope(normalizeEsportScope(value));
  const games = options?.games ?? [];
  const teams = options?.teams ?? [];
  const chosen = kind === 'GAMES' ? value.gameIds : value.teamIds;
  // Read-only: the choices said in words, as the journal says them.
  const chosenNames =
    kind === 'GAMES'
      ? games
          .filter((game) => chosen.includes(game.id))
          .map((game) => game.name)
      : teams
          .filter((team) => chosen.includes(team.id))
          .map(
            (team) =>
              `${team.name} (${games.find((game) => game.id === team.gameId)?.name ?? '…'})`,
          );
  const teamGroups = games
    .map((game) => ({
      game,
      teams: teams.filter((team) => team.gameId === game.id),
    }))
    .filter((group) => group.teams.length > 0);

  const renderChoices = (): React.ReactNode => {
    if (loadError)
      return (
        <p className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
          Les jeux et les équipes n’ont pas pu être chargés.
          <Button
            className="h-auto px-1 py-0 text-xs"
            onClick={() => void load()}
            size="sm"
            type="button"
            variant="link"
          >
            Réessayer
          </Button>
        </p>
      );
    if (!options)
      return (
        <p className="text-muted-foreground text-xs" role="status">
          Chargement des jeux et des équipes…
        </p>
      );
    if (!editable)
      return (
        <p className="text-foreground text-xs leading-5">
          {chosenNames.length > 0 ? chosenNames.join(', ') : 'Aucun choix.'}
        </p>
      );
    if (kind === 'GAMES')
      return games.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          Aucun jeu pour l’instant.
        </p>
      ) : (
        <ChoiceList
          chosen={value.gameIds}
          describedBy={empty ? errorId : undefined}
          disabled={disabled}
          feminine={false}
          items={games}
          legend="Jeux choisis"
          legendVisible={false}
          onToggle={(id, on) =>
            onChange({ ...value, gameIds: toggle(value.gameIds, id, on) })
          }
        />
      );

    return teamGroups.length === 0 ? (
      <p className="text-muted-foreground text-xs">
        Aucune équipe pour l’instant.
      </p>
    ) : (
      teamGroups.map(({ game, teams: gameTeams }) => (
        <ChoiceList
          chosen={value.teamIds}
          describedBy={empty ? errorId : undefined}
          disabled={disabled}
          feminine
          items={gameTeams}
          key={game.id}
          legend={game.name}
          legendVisible
          onToggle={(id, on) =>
            onChange({ ...value, teamIds: toggle(value.teamIds, id, on) })
          }
        />
      ))
    );
  };

  return (
    <div
      aria-labelledby={titleId}
      className={styles.row}
      data-blocked={!active}
      data-esport-scope
      role="group"
    >
      <div className={styles.rowSummary}>
        <div className={styles.rowHeading}>
          <h4
            className="text-foreground min-w-0 text-sm font-semibold"
            id={titleId}
          >
            {TITLE}
          </h4>
          {changed && (
            <span
              aria-label="Modifiée, non enregistrée"
              className="bg-warning size-1.5 shrink-0 rounded-full"
              role="img"
            />
          )}
          <PermissionInfoButton description={DETAILS} label={TITLE} />
        </div>
        <p className="text-muted-foreground text-xs leading-5">
          {isAdmin
            ? 'Un administrateur voit toujours tous les jeux et toutes les équipes.'
            : kindDescription}
        </p>
        {!active && (
          <p className={styles.blockedReason}>
            Sans « Consulter les jeux », ce réglage reste sans effet.
          </p>
        )}
      </div>
      <div className={styles.rowControls}>
        {editable ? (
          <Select
            disabled={disabled}
            onValueChange={(next) =>
              onChange({ ...value, kind: next as EsportScopeKind })
            }
            value={kind}
          >
            <SelectTrigger
              aria-labelledby={titleId}
              className="w-48 max-w-full min-w-0"
              variant="compact"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent variant="compact">
              {SCOPE_OPTIONS.map(({ label, option }) => (
                <SelectItem key={option} value={option}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="outline">{kindLabel}</Badge>
        )}
      </div>
      {needsOptions && (
        <div className={styles.scopeChoices}>
          {renderChoices()}
          {empty && options && (
            <p className="text-destructive text-xs" id={errorId}>
              {kind === 'GAMES'
                ? 'Choisissez au moins un jeu.'
                : 'Choisissez au moins une équipe.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
