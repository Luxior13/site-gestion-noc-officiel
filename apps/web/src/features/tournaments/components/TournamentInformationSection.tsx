'use client';

import { ClipboardList, ExternalLink, Trophy } from 'lucide-react';
import Link from 'next/link';
import React, { type FC, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

import { RubricCard } from '$components/layout/RubricCard';
import { SectionActionBar } from '$components/layout/SectionActionBar';
import { UnsavedNavigationDialog } from '$components/layout/UnsavedNavigationDialog';
import { organizationDetailPath } from '$constants/routes.constants';
import { useUnsavedNavigationGuard } from '$hooks/useUnsavedNavigationGuard';
import { Input } from '$ui/input';
import { Label } from '$ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '$ui/select';
import { ApiClientError } from '$utils/api.utils';
import { centsToInput, parseEuroAmount } from '$utils/money.utils';

import {
  fetchTournamentChoices,
  updateTournamentRequest,
} from '../tournament.api';
import {
  TOURNAMENT_ACTION_BAR_SLOT,
  TOURNAMENT_EDITION_MAX_LENGTH,
  TOURNAMENT_FORMAT_LABELS,
  TOURNAMENT_FORMATS,
  TOURNAMENT_LINK_MAX_LENGTH,
  TOURNAMENT_LOCATION_MAX_LENGTH,
  TOURNAMENT_NAME_MAX_LENGTH,
  type TournamentDatePrecision,
  type TournamentFormat,
} from '../tournament.constants';
import type {
  TournamentDetail,
  TournamentInput,
} from '../types/tournament.types';
import { TournamentOrganizerField } from './TournamentOrganizerField';
import {
  describedBy,
  FieldError,
  TournamentDatesFields,
  TournamentDayField,
} from './TournamentParts';

const ID = 'tournament-information';
const FORM_ID = `${ID}-form`;

type Draft = {
  datePrecision: TournamentDatePrecision;
  edition: string;
  endOn: string;
  entryFee: string;
  format: TournamentFormat;
  linkUrl: string;
  location: string;
  name: string;
  organizerId: string;
  registrationDeadlineOn: string;
  startOn: string;
};
type FieldKey = keyof Draft;
type FieldErrors = Partial<Record<FieldKey, string>>;
const DRAFT_KEYS = [
  'datePrecision',
  'edition',
  'endOn',
  'entryFee',
  'format',
  'location',
  'name',
  'organizerId',
  'registrationDeadlineOn',
  'linkUrl',
  'startOn',
] as const satisfies readonly FieldKey[];

/** The server's field names, as the draft says them. */
const SERVER_FIELDS: Readonly<Record<string, FieldKey>> = {
  entryFeeCents: 'entryFee',
};

const toDraft = (tournament: TournamentDetail): Draft => ({
  datePrecision: tournament.datePrecision,
  edition: tournament.edition ?? '',
  endOn: tournament.endOn ?? '',
  entryFee:
    tournament.entryFeeCents === null
      ? ''
      : centsToInput(tournament.entryFeeCents),
  format: tournament.format,
  linkUrl: tournament.linkUrl ?? '',
  location: tournament.location ?? '',
  name: tournament.name,
  organizerId: tournament.organizer?.id ?? '',
  registrationDeadlineOn: tournament.registrationDeadlineOn ?? '',
  startOn: tournament.startOn ?? '',
});

const sameField = (left: Draft, right: Draft, key: FieldKey): boolean => {
  // Keys come from the closed Draft type.
  // eslint-disable-next-line security/detect-object-injection
  const [a, b] = [left[key], right[key]];

  return typeof a === 'string' && typeof b === 'string'
    ? a.trim() === b.trim()
    : a === b;
};

const isSameDraft = (left: Draft, right: Draft): boolean =>
  DRAFT_KEYS.every((key) => sameField(left, right, key));

const fieldErrorsOf = (error: ApiClientError): FieldErrors => {
  const errors: FieldErrors = {};
  for (const [path, messages] of Object.entries(error.details ?? {})) {
    const key = path.split('.')[0] ?? path;
    const field: FieldKey | undefined =
      // eslint-disable-next-line security/detect-object-injection
      SERVER_FIELDS[key] ?? DRAFT_KEYS.find((entry) => entry === key);
    // eslint-disable-next-line security/detect-object-injection
    if (field && !errors[field]) errors[field] = messages[0];
  }

  return errors;
};

/** What is sent, or the errors said at once. */
/** What is sent, or the errors said at once; « Annulé » is an action apart. */
const inputOf = (
  draft: Draft,
  isCancelled: boolean,
): { errors: FieldErrors } | { input: TournamentInput } => {
  const fee = draft.entryFee.trim() ? parseEuroAmount(draft.entryFee) : null;
  const errors: FieldErrors = {
    endOn:
      draft.endOn && draft.startOn && draft.endOn < draft.startOn
        ? 'La fin ne précède pas le début'
        : undefined,
    entryFee:
      draft.entryFee.trim() && (fee === null || fee < 0)
        ? 'Montant invalide, par exemple 50 ou 12,50'
        : undefined,
    name: draft.name.trim() ? undefined : 'Le nom est obligatoire',
  };
  if (Object.values(errors).some(Boolean)) return { errors };

  return {
    input: {
      datePrecision: draft.datePrecision,
      edition: draft.edition.trim() || null,
      endOn: draft.endOn || null,
      entryFeeCents: fee,
      format: draft.format,
      isCancelled,
      linkUrl: draft.linkUrl.trim() || null,
      location: draft.format === 'LAN' ? draft.location.trim() || null : null,
      name: draft.name,
      organizerId: draft.organizerId || null,
      registrationDeadlineOn: draft.registrationDeadlineOn || null,
      startOn: draft.startOn || null,
    },
  };
};

type Props = {
  canAddOrganizers: boolean;
  canOpenOrganizations: boolean;
  canUpdate: boolean;
  onChange: (tournament: TournamentDetail) => void;
  onDirtyChange: (dirty: boolean) => void;
  onReload: () => Promise<TournamentDetail>;
  tournament: TournamentDetail;
};

/**
 * A tournament's information, edited in place (gabarit B, 11 November
 * 2026), only what helps prepare it (12 November 2026): what it is, who
 * organises it, where and when if known, then the closing of the
 * registration, the fee and the rules; the shared save bar appears once a
 * value changes. The game, fixed at the creation, reads in the header.
 */
export const TournamentInformationSection: FC<Props> = ({
  canAddOrganizers,
  canOpenOrganizations,
  canUpdate,
  onChange,
  onDirtyChange,
  onReload,
  tournament,
}) => {
  const [base, setBase] = useState(tournament);
  const [draft, setDraft] = useState<Draft>(() => toDraft(tournament));
  const [organizers, setOrganizers] = useState<
    readonly { id: string; name: string }[]
  >([]);
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
    setActionBarSlot(document.getElementById(TOURNAMENT_ACTION_BAR_SLOT));

    return (): void => {
      mountedRef.current = false;
    };
  }, []);

  // Only who edits needs the organisers to choose from.
  useEffect(() => {
    if (!canUpdate) return;
    const controller = new AbortController();
    fetchTournamentChoices(controller.signal)
      .then((choices) => setOrganizers(choices.organizers))
      .catch(() => undefined);

    return (): void => controller.abort();
  }, [canUpdate]);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  // A newer version never replaces a draft; the engaged teams keep their own.
  useEffect(() => {
    if (operationRef.current || tournament.version <= baseRef.current.version)
      return;
    if (dirtyRef.current) {
      setConflict(true);

      return;
    }
    setBase(tournament);
    setDraft(toDraft(tournament));
  }, [tournament]);

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
    setErrors((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([key]) => !(key in next)),
      ),
    );
  };

  const save = async (): Promise<void> => {
    if (operationRef.current || !canUpdate || conflict || !isDirty) return;
    const result = inputOf(draft, base.isCancelled);
    if ('errors' in result) {
      setErrors(result.errors);
      focus('invalid');

      return;
    }
    operationRef.current = true;
    setIsSaving(true);
    setErrors({});
    setSubmitError(null);
    setRefreshNotice(null);
    try {
      const saved = await updateTournamentRequest(tournament.id, {
        ...result.input,
        expectedVersion: base.version,
      });
      if (!mountedRef.current) return;
      baseRef.current = saved;
      dirtyRef.current = false;
      setBase(saved);
      setDraft(toDraft(saved));
      onChange(saved);
      toast.success('Tournoi mis à jour');
    } catch (caught) {
      if (!mountedRef.current) return;
      const fieldErrors =
        caught instanceof ApiClientError ? fieldErrorsOf(caught) : {};
      const hasFieldErrors = Object.values(fieldErrors).some(Boolean);
      if (caught instanceof ApiClientError && caught.status === 409) {
        setConflict(true);
        setSubmitError(
          'Le tournoi a changé. Actualisez la version avant de confirmer votre saisie.',
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
        'Le résultat de l’enregistrement n’a pas pu être confirmé. Actualisez la version pour vérifier le tournoi avant de réessayer. Votre saisie est conservée.',
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
      setDraft(
        (current) =>
          Object.fromEntries(
            DRAFT_KEYS.map((key) => [
              key,
              // eslint-disable-next-line security/detect-object-injection
              sameField(current, previous, key) ? latest[key] : current[key],
            ]),
          ) as Draft,
      );
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
          <RubricCard
            icon={<Trophy />}
            id={`${ID}-tournament-title`}
            title="Tournoi"
          >
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor={`${ID}-name`} required>
                  Nom
                </Label>
                <Input
                  aria-describedby={describedBy(
                    errors.name && `${ID}-name-error`,
                  )}
                  aria-invalid={Boolean(errors.name)}
                  disabled={disabled}
                  id={`${ID}-name`}
                  maxLength={TOURNAMENT_NAME_MAX_LENGTH}
                  onChange={(event) => change({ name: event.target.value })}
                  value={draft.name}
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
                  disabled={disabled}
                  id={`${ID}-edition`}
                  maxLength={TOURNAMENT_EDITION_MAX_LENGTH}
                  onChange={(event) => change({ edition: event.target.value })}
                  placeholder="Ex. Saison 2"
                  value={draft.edition}
                />
                <p
                  className="text-muted-foreground text-xs"
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
              <div className="min-w-0 space-y-1.5 sm:col-span-2">
                <Label htmlFor={`${ID}-organizer`} id={`${ID}-organizer-label`}>
                  Organisateur
                </Label>
                <TournamentOrganizerField
                  aria-describedby={describedBy(
                    errors.organizerId && `${ID}-organizer-error`,
                  )}
                  aria-invalid={Boolean(errors.organizerId)}
                  canAdd={canAddOrganizers}
                  current={base.organizer}
                  disabled={disabled}
                  id={`${ID}-organizer`}
                  labelId={`${ID}-organizer-label`}
                  onError={(message) =>
                    setErrors((current) => ({
                      ...current,
                      organizerId: message,
                    }))
                  }
                  onValueChange={(organizerId) => change({ organizerId })}
                  organizers={organizers}
                  value={draft.organizerId}
                />
                {canOpenOrganizations &&
                  base.organizer &&
                  draft.organizerId === base.organizer.id && (
                    <Link
                      className="text-primary-emphasis inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline"
                      href={organizationDetailPath(base.organizer.id)}
                    >
                      <ExternalLink aria-hidden="true" className="size-3" />
                      Ouvrir sa fiche
                    </Link>
                  )}
                <FieldError
                  id={`${ID}-organizer-error`}
                  message={errors.organizerId}
                />
              </div>
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor={`${ID}-format`} id={`${ID}-format-label`}>
                  Format
                </Label>
                <Select
                  disabled={disabled}
                  onValueChange={(format) =>
                    change({ format: format as TournamentFormat })
                  }
                  value={draft.format}
                >
                  <SelectTrigger
                    aria-labelledby={`${ID}-format-label`}
                    className="w-full min-w-0"
                    id={`${ID}-format`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TOURNAMENT_FORMATS.map((format) => (
                      <SelectItem key={format} value={format}>
                        {/* eslint-disable-next-line security/detect-object-injection */}
                        {TOURNAMENT_FORMAT_LABELS[format]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {draft.format === 'LAN' ? (
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor={`${ID}-location`}>Lieu</Label>
                  <Input
                    aria-describedby={describedBy(
                      errors.location && `${ID}-location-error`,
                    )}
                    aria-invalid={Boolean(errors.location)}
                    disabled={disabled}
                    id={`${ID}-location`}
                    maxLength={TOURNAMENT_LOCATION_MAX_LENGTH}
                    onChange={(event) =>
                      change({ location: event.target.value })
                    }
                    placeholder="Ex. Lyon, Eurexpo"
                    value={draft.location}
                  />
                  <FieldError
                    id={`${ID}-location-error`}
                    message={errors.location}
                  />
                </div>
              ) : (
                <div aria-hidden="true" className="max-sm:hidden" />
              )}
              <TournamentDatesFields
                disabled={disabled}
                errors={errors}
                idPrefix={`${ID}-dates`}
                onChange={change}
                value={draft}
              />
            </div>
          </RubricCard>
          <RubricCard
            icon={<ClipboardList />}
            id={`${ID}-preparation-title`}
            title="Préparation"
          >
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <TournamentDayField
                disabled={disabled}
                error={errors.registrationDeadlineOn}
                hint="Facultatif : pour ne pas la rater."
                idPrefix={`${ID}-registration`}
                label="Fin des inscriptions"
                onChange={(registrationDeadlineOn) =>
                  change({ registrationDeadlineOn })
                }
                value={draft.registrationDeadlineOn}
              />
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor={`${ID}-fee`}>Frais d’inscription</Label>
                <Input
                  aria-describedby={describedBy(
                    `${ID}-fee-hint`,
                    errors.entryFee && `${ID}-fee-error`,
                  )}
                  aria-invalid={Boolean(errors.entryFee)}
                  disabled={disabled}
                  id={`${ID}-fee`}
                  inputMode="decimal"
                  maxLength={16}
                  onChange={(event) => change({ entryFee: event.target.value })}
                  placeholder="Ex. 50"
                  value={draft.entryFee}
                />
                <p
                  className="text-muted-foreground text-xs"
                  id={`${ID}-fee-hint`}
                >
                  En euros, par équipe ; 0 si gratuit. Le paiement se saisit
                  dans Opérations.
                </p>
                <FieldError id={`${ID}-fee-error`} message={errors.entryFee} />
              </div>
              <div className="min-w-0 space-y-1.5 sm:col-span-2">
                <Label htmlFor={`${ID}-rules`}>Lien du tournoi</Label>
                <Input
                  aria-describedby={describedBy(
                    `${ID}-rules-hint`,
                    errors.linkUrl && `${ID}-rules-error`,
                  )}
                  aria-invalid={Boolean(errors.linkUrl)}
                  disabled={disabled}
                  id={`${ID}-rules`}
                  inputMode="url"
                  maxLength={TOURNAMENT_LINK_MAX_LENGTH}
                  onChange={(event) => change({ linkUrl: event.target.value })}
                  placeholder="Ex. start.gg/tournament/lyon-esport"
                  spellCheck={false}
                  value={draft.linkUrl}
                />
                <p
                  className="text-muted-foreground text-xs"
                  id={`${ID}-rules-hint`}
                >
                  Facultatif : sa page d’inscription, de règlement ou de bracket
                  (start.gg, Toornament…).
                </p>
                {base.linkUrl && draft.linkUrl.trim() === base.linkUrl && (
                  <a
                    className="text-primary-emphasis inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline"
                    href={base.linkUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <ExternalLink aria-hidden="true" className="size-3" />
                    Ouvrir la page
                    <span className="sr-only"> (nouvel onglet)</span>
                  </a>
                )}
                <FieldError id={`${ID}-rules-error`} message={errors.linkUrl} />
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
                ? 'La modification de ce tournoi n’est plus autorisée.'
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
            ? 'Les modifications de ce tournoi ne sont pas enregistrées.'
            : 'Vous avez des modifications non enregistrées sur ce tournoi. Quitter la page abandonnera votre saisie.'
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
