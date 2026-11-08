'use client';

import { Gamepad2 } from 'lucide-react';
import React, { type FC, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

import { ApproximateDateField } from '$components/forms/ApproximateDateField';
import { RubricCard } from '$components/layout/RubricCard';
import { SectionActionBar } from '$components/layout/SectionActionBar';
import { UnsavedNavigationDialog } from '$components/layout/UnsavedNavigationDialog';
import { useUnsavedNavigationGuard } from '$hooks/useUnsavedNavigationGuard';
import { Input } from '$ui/input';
import { Label } from '$ui/label';
import { Switch } from '$ui/switch';
import { ApiClientError } from '$utils/api.utils';
import type { ApproximateDate } from '$utils/approximate-date.utils';

import { updateGameRequest } from '../game.api';
import {
  GAME_NAME_MAX_LENGTH,
  GAME_SHORT_NAME_MAX_LENGTH,
} from '../game.constants';
import type { GameItem } from '../types/game.types';

/** Where the record page renders the save bar, outside the section. */
export const GAME_ACTION_BAR_SLOT = 'game-record-action-bar';

const ID = 'game-detail';
const FORM_ID = `${ID}-form`;

type Draft = {
  firstOpened: ApproximateDate;
  isActive: boolean;
  name: string;
  shortName: string;
};

type FieldErrors = Partial<
  Record<'firstOpened' | 'name' | 'shortName', string>
>;

const toDraft = (game: GameItem): Draft => ({
  firstOpened: game.firstOpened,
  isActive: game.isActive,
  name: game.name,
  shortName: game.shortName ?? '',
});

const sameDate = (left: ApproximateDate, right: ApproximateDate): boolean =>
  left.date === right.date && left.precision === right.precision;

const isSameDraft = (left: Draft, right: Draft): boolean =>
  left.name.trim() === right.name.trim() &&
  left.shortName.trim() === right.shortName.trim() &&
  left.isActive === right.isActive &&
  sameDate(left.firstOpened, right.firstOpened);

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

const FieldError: FC<{ id: string; message?: string }> = ({ id, message }) =>
  message ? (
    <p className="text-destructive text-xs" id={id} role="alert">
      {message}
    </p>
  ) : null;

type Props = {
  canUpdate: boolean;
  game: GameItem;
  onChange: (game: GameItem) => void;
  onReload: () => Promise<GameItem>;
};

/**
 * A game's information, edited in place (gabarit B), as a team's: the fields
 * are always shown and the shared save bar appears once a value changes.
 */
export const GameInformationSection: FC<Props> = ({
  canUpdate,
  game,
  onChange,
  onReload,
}) => {
  const [base, setBase] = useState(game);
  const [draft, setDraft] = useState<Draft>(() => toDraft(game));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [conflict, setConflict] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);
  const [pendingDiscard, setPendingDiscard] = useState(false);
  const [actionBarSlot, setActionBarSlot] = useState<HTMLElement | null>(null);
  const mountedRef = useRef(false);
  const operationRef = useRef(false);
  const baseRef = useRef(base);
  const dirtyRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const isDirty = !isSameDraft(draft, toDraft(base));
  const isBusy = isSaving || isRefreshing;
  const disabled = !canUpdate || isBusy;
  baseRef.current = base;
  dirtyRef.current = isDirty;
  const {
    cancelPendingNavigation,
    confirmPendingNavigation,
    pendingNavigationHref,
    restoreFocus,
  } = useUnsavedNavigationGuard(isDirty, () => {
    mountedRef.current = false;
  });

  useEffect(() => {
    mountedRef.current = true;
    setActionBarSlot(document.getElementById(GAME_ACTION_BAR_SLOT));

    return (): void => {
      mountedRef.current = false;
    };
  }, []);

  // A newer version from the page never replaces a draft: it is adopted only
  // through « Actualiser ».
  useEffect(() => {
    if (operationRef.current || game.version <= baseRef.current.version) return;
    if (dirtyRef.current) {
      setConflict(true);

      return;
    }
    setBase(game);
    setDraft(toDraft(game));
  }, [game]);

  const focus = (target: 'error' | 'field' | 'invalid'): void => {
    requestAnimationFrame(() => {
      if (!mountedRef.current) return;
      const destination =
        target === 'error'
          ? errorRef.current
          : formRef.current?.querySelector<HTMLElement>(
              target === 'invalid'
                ? '[aria-invalid="true"]:not(:disabled)'
                : 'input:not(:disabled)',
            );
      destination?.focus();
    });
  };

  const change = (next: Partial<Draft>): void => {
    setDraft((current) => ({ ...current, ...next }));
    setSubmitError(null);
  };

  const save = async (): Promise<void> => {
    if (operationRef.current || !canUpdate || conflict || !isDirty) return;
    if (!draft.name.trim()) {
      setErrors({ name: 'Le nom est obligatoire' });
      focus('invalid');

      return;
    }
    operationRef.current = true;
    setIsSaving(true);
    setErrors({});
    setSubmitError(null);
    setRefreshNotice(null);
    try {
      const saved = await updateGameRequest(game.id, {
        expectedVersion: base.version,
        firstOpened: draft.firstOpened,
        isActive: draft.isActive,
        name: draft.name,
        shortName: draft.shortName.trim() || null,
      });
      if (!mountedRef.current) return;
      baseRef.current = saved;
      dirtyRef.current = false;
      setBase(saved);
      setDraft(toDraft(saved));
      onChange(saved);
      toast.success('Jeu mis à jour');
    } catch (caught) {
      if (!mountedRef.current) return;
      const fieldErrors =
        caught instanceof ApiClientError ? fieldErrorsOf(caught) : {};
      const hasFieldErrors = Object.values(fieldErrors).some(Boolean);
      if (caught instanceof ApiClientError && caught.status === 409) {
        if (hasFieldErrors) {
          // A name already taken: the field says it.
          setErrors(fieldErrors);
          focus('invalid');

          return;
        }
        setConflict(true);
        setSubmitError(
          'Le jeu a changé. Actualisez la version avant de confirmer votre saisie.',
        );
        focus('error');

        return;
      }
      if (caught instanceof ApiClientError && caught.status < 500) {
        setErrors(fieldErrors);
        setSubmitError(hasFieldErrors ? null : caught.message);
        focus(hasFieldErrors ? 'invalid' : 'error');

        return;
      }
      setConflict(true);
      setSubmitError(
        'Le résultat de l’enregistrement n’a pas pu être confirmé. Actualisez la version pour vérifier le jeu avant de réessayer. Votre saisie est conservée.',
      );
      focus('error');
    } finally {
      operationRef.current = false;
      if (mountedRef.current) setIsSaving(false);
    }
  };

  const discard = (): void => {
    if (operationRef.current) return;
    setDraft(toDraft(baseRef.current));
    setErrors({});
    setSubmitError(null);
    setRefreshNotice(null);
    setPendingDiscard(false);
  };

  const refresh = async (): Promise<void> => {
    if (operationRef.current) return;
    operationRef.current = true;
    setIsRefreshing(true);
    setSubmitError(null);
    const previous = toDraft(baseRef.current);
    try {
      const fresh = await onReload();
      if (!mountedRef.current) return;
      const latest = toDraft(fresh);
      // Keep what was typed, take the server's value for untouched fields.
      setDraft((current) => ({
        firstOpened: sameDate(current.firstOpened, previous.firstOpened)
          ? latest.firstOpened
          : current.firstOpened,
        isActive:
          current.isActive === previous.isActive
            ? latest.isActive
            : current.isActive,
        name:
          current.name.trim() === previous.name ? latest.name : current.name,
        shortName:
          current.shortName.trim() === previous.shortName
            ? latest.shortName
            : current.shortName,
      }));
      baseRef.current = fresh;
      setBase(fresh);
      setConflict(false);
      setRefreshNotice(
        'Version actualisée. Vos modifications sont conservées ; les autres champs sont à jour. Vérifiez avant d’enregistrer.',
      );
      focus('field');
    } catch {
      if (!mountedRef.current) return;
      setSubmitError(
        'Actualisation impossible. Votre saisie est conservée ; réessayez avant d’enregistrer.',
      );
      focus('error');
    } finally {
      operationRef.current = false;
      if (mountedRef.current) setIsRefreshing(false);
    }
  };

  return (
    <>
      <section id={ID}>
        {/* A record without tabs: the title stays for screen readers. */}
        <h2 className="sr-only" id={`${ID}-title`} tabIndex={-1}>
          Informations
        </h2>
        <form
          aria-busy={isBusy || undefined}
          aria-labelledby={`${ID}-title`}
          autoComplete="off"
          className="space-y-3"
          id={FORM_ID}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
          ref={formRef}
        >
          {submitError && (
            <p
              className="text-destructive text-sm"
              ref={errorRef}
              role="alert"
              tabIndex={-1}
            >
              {submitError}
            </p>
          )}
          {refreshNotice && (
            <p className="text-muted-foreground text-sm" role="status">
              {refreshNotice}
            </p>
          )}
          <RubricCard icon={<Gamepad2 />} id={`${ID}-game-title`} title="Jeu">
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor={`${ID}-name`} required>
                  Nom
                </Label>
                <Input
                  aria-describedby={
                    [
                      canUpdate && `${ID}-name-hint`,
                      errors.name && `${ID}-name-error`,
                    ]
                      .filter(Boolean)
                      .join(' ') || undefined
                  }
                  aria-invalid={Boolean(errors.name)}
                  disabled={disabled}
                  id={`${ID}-name`}
                  maxLength={GAME_NAME_MAX_LENGTH}
                  onChange={(event) => change({ name: event.target.value })}
                  value={draft.name}
                />
                {canUpdate && (
                  <p
                    className="text-muted-foreground text-xs"
                    id={`${ID}-name-hint`}
                  >
                    Renommer sert à corriger une faute ; un nouveau jeu (CS2
                    après CS:GO) s’ajoute à part.
                  </p>
                )}
                <FieldError id={`${ID}-name-error`} message={errors.name} />
              </div>
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor={`${ID}-short-name`}>Nom court</Label>
                <Input
                  aria-describedby={
                    errors.shortName ? `${ID}-short-name-error` : undefined
                  }
                  aria-invalid={Boolean(errors.shortName)}
                  className="max-w-40"
                  disabled={disabled}
                  id={`${ID}-short-name`}
                  maxLength={GAME_SHORT_NAME_MAX_LENGTH}
                  onChange={(event) =>
                    change({ shortName: event.target.value })
                  }
                  placeholder="Ex. VAL"
                  value={draft.shortName}
                />
                <FieldError
                  id={`${ID}-short-name-error`}
                  message={errors.shortName}
                />
              </div>
              <ApproximateDateField
                disabled={disabled}
                error={errors.firstOpened}
                idPrefix={`${ID}-first-opened`}
                label="Première ouverture"
                onChange={(firstOpened) => change({ firstOpened })}
                subject="première ouverture"
                value={draft.firstOpened}
              />
              <div className="border-border-default bg-surface-inset flex items-center justify-between gap-4 self-end rounded-lg border px-3 py-2.5">
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
                  disabled={disabled}
                  id={`${ID}-active`}
                  onCheckedChange={(isActive) => change({ isActive })}
                />
              </div>
            </div>
          </RubricCard>
        </form>
      </section>

      {(isDirty || conflict) &&
        actionBarSlot &&
        createPortal(
          <SectionActionBar
            conflict={conflict}
            hasChanges={isDirty}
            isResolvingConflict={isRefreshing}
            isSaving={isSaving}
            onCancel={() => {
              if (!operationRef.current) setPendingDiscard(true);
            }}
            onResolveConflict={() => void refresh()}
            saveDisabled={!canUpdate}
            saveDisabledReason={
              !canUpdate
                ? 'La modification de ce jeu n’est plus autorisée.'
                : undefined
            }
            saveForm={FORM_ID}
            saveType="submit"
          />,
          actionBarSlot,
        )}

      <UnsavedNavigationDialog
        cancelLabel={pendingDiscard ? 'Continuer la modification' : 'Rester'}
        confirmLabel={
          pendingDiscard
            ? 'Abandonner les modifications'
            : 'Quitter sans enregistrer'
        }
        contentClassName="sm:max-w-lg"
        description={
          pendingDiscard
            ? 'Les modifications de ce jeu ne sont pas enregistrées.'
            : 'Vous avez des modifications non enregistrées sur ce jeu. Quitter la page abandonnera votre saisie.'
        }
        onCancel={() => {
          setPendingDiscard(false);
          cancelPendingNavigation();
        }}
        onCloseAutoFocus={(event) => {
          if (!pendingDiscard) restoreFocus(event);
        }}
        onConfirm={() => {
          if (pendingDiscard) discard();
          else confirmPendingNavigation();
        }}
        open={pendingDiscard || pendingNavigationHref !== null}
        title={
          pendingDiscard
            ? 'Annuler les modifications ?'
            : 'Quitter sans enregistrer ?'
        }
      />
    </>
  );
};
