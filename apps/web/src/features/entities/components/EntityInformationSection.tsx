'use client';

import { BadgeCheck, Landmark, MapPin } from 'lucide-react';
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
import { Textarea } from '$ui/textarea';
import { ApiClientError } from '$utils/api.utils';
import type { ApproximateDate } from '$utils/approximate-date.utils';

import { updateEntityRequest } from '../entity.api';
import {
  ENTITY_ACTION_BAR_SLOT,
  ENTITY_NAME_MAX_LENGTH,
  HEAD_OFFICE_MAX_LENGTH,
  type LegalForm,
  OTHER_FORM_MAX_LENGTH,
} from '../entity.constants';
import type { LegalEntityItem } from '../types/entity.types';
import { LegalFormSelect } from './LegalFormSelect';

const ID = 'entity-detail';
const FORM_ID = `${ID}-form`;

type Draft = {
  end: ApproximateDate;
  ended: boolean;
  form: LegalForm;
  headOffice: string;
  isPrincipal: boolean;
  name: string;
  otherForm: string;
  rnaNumber: string;
  siretNumber: string;
  start: ApproximateDate;
};

type FieldKey =
  | 'end'
  | 'form'
  | 'headOffice'
  | 'isPrincipal'
  | 'name'
  | 'otherForm'
  | 'rnaNumber'
  | 'siretNumber'
  | 'start';
type FieldErrors = Partial<Record<FieldKey, string>>;

const FIELD_KEYS: readonly FieldKey[] = [
  'end',
  'form',
  'headOffice',
  'isPrincipal',
  'name',
  'otherForm',
  'rnaNumber',
  'siretNumber',
  'start',
];

const toDraft = (entity: LegalEntityItem): Draft => ({
  end: entity.end ?? entity.start,
  ended: entity.end !== null,
  form: entity.form,
  headOffice: entity.headOffice ?? '',
  isPrincipal: entity.isPrincipal,
  name: entity.name,
  otherForm: entity.otherForm ?? '',
  rnaNumber: entity.rnaNumber ?? '',
  siretNumber: entity.siretNumber ?? '',
  start: entity.start,
});

const sameDate = (left: ApproximateDate, right: ApproximateDate): boolean =>
  left.date === right.date && left.precision === right.precision;

/** One field of two drafts, compared as it is saved. */
const sameField = (left: Draft, right: Draft, key: keyof Draft): boolean => {
  if (key === 'start') return sameDate(left.start, right.start);
  if (key === 'end')
    return !left.ended || !right.ended || sameDate(left.end, right.end);
  // Keys come from the closed Draft type.
  // eslint-disable-next-line security/detect-object-injection
  const [first, second] = [left[key], right[key]];

  return typeof first === 'string' && typeof second === 'string'
    ? first.trim() === second.trim()
    : first === second;
};

const DRAFT_KEYS: readonly (keyof Draft)[] = [
  'end',
  'ended',
  'form',
  'headOffice',
  'isPrincipal',
  'name',
  'otherForm',
  'rnaNumber',
  'siretNumber',
  'start',
];

const isSameDraft = (left: Draft, right: Draft): boolean =>
  DRAFT_KEYS.every((key) => sameField(left, right, key));

const fieldErrorsOf = (error: ApiClientError): FieldErrors => {
  const details = error.details ?? {};

  return Object.fromEntries(
    FIELD_KEYS.map((key) => [
      key,
      Object.entries(details).find(
        ([path]) => path === key || path.startsWith(`${key}.`),
      )?.[1]?.[0],
    ]),
  ) as FieldErrors;
};

const FieldError: FC<{ id: string; message?: string }> = ({ id, message }) =>
  message ? (
    <p className="text-destructive text-xs" id={id} role="alert">
      {message}
    </p>
  ) : null;

const describedBy = (
  ...ids: (false | string | undefined)[]
): string | undefined => ids.filter(Boolean).join(' ') || undefined;

type Props = {
  canUpdate: boolean;
  entity: LegalEntityItem;
  onChange: (entity: LegalEntityItem) => void;
  onReload: () => Promise<LegalEntityItem>;
};

/**
 * An entity's identity, edited in place (gabarit B), as a game's: the
 * fields are always shown and the shared save bar appears once a value
 * changes. The period before the association has no identifier nor seat.
 */
export const EntityInformationSection: FC<Props> = ({
  canUpdate,
  entity,
  onChange,
  onReload,
}) => {
  const [base, setBase] = useState(entity);
  const [draft, setDraft] = useState<Draft>(() => toDraft(entity));
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
  const withoutForm = draft.form === 'NONE';
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
    setActionBarSlot(document.getElementById(ENTITY_ACTION_BAR_SLOT));

    return (): void => {
      mountedRef.current = false;
    };
  }, []);

  // A newer version from the page never replaces a draft: it is adopted only
  // through « Actualiser ».
  useEffect(() => {
    if (operationRef.current || entity.version <= baseRef.current.version)
      return;
    if (dirtyRef.current) {
      setConflict(true);

      return;
    }
    setBase(entity);
    setDraft(toDraft(entity));
  }, [entity]);

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
    const missing: FieldErrors = {
      name: draft.name.trim() ? undefined : 'La dénomination est obligatoire',
      otherForm:
        draft.form === 'OTHER' && !draft.otherForm.trim()
          ? 'Précisez la forme juridique'
          : undefined,
    };
    if (missing.name || missing.otherForm) {
      setErrors(missing);
      focus('invalid');

      return;
    }
    operationRef.current = true;
    setIsSaving(true);
    setErrors({});
    setSubmitError(null);
    setRefreshNotice(null);
    try {
      const saved = await updateEntityRequest(entity.id, {
        end: draft.ended ? draft.end : null,
        expectedVersion: base.version,
        form: draft.form,
        headOffice: withoutForm ? null : draft.headOffice.trim() || null,
        isPrincipal: !withoutForm && draft.isPrincipal,
        name: draft.name,
        otherForm: draft.form === 'OTHER' ? draft.otherForm.trim() : null,
        rnaNumber: withoutForm ? null : draft.rnaNumber.trim() || null,
        siretNumber: withoutForm ? null : draft.siretNumber.trim() || null,
        start: draft.start,
      });
      if (!mountedRef.current) return;
      baseRef.current = saved;
      dirtyRef.current = false;
      setBase(saved);
      setDraft(toDraft(saved));
      onChange(saved);
      toast.success('Entité mise à jour');
    } catch (caught) {
      if (!mountedRef.current) return;
      const fieldErrors =
        caught instanceof ApiClientError ? fieldErrorsOf(caught) : {};
      const hasFieldErrors = Object.values(fieldErrors).some(Boolean);
      if (caught instanceof ApiClientError && caught.status === 409) {
        if (hasFieldErrors) {
          // A name taken, or a period that no longer covers an account.
          setErrors(fieldErrors);
          focus('invalid');

          return;
        }
        setConflict(true);
        setSubmitError(
          'L’entité a changé. Actualisez la version avant de confirmer votre saisie.',
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
        'Le résultat de l’enregistrement n’a pas pu être confirmé. Actualisez la version pour vérifier l’entité avant de réessayer. Votre saisie est conservée.',
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

  // The principal entity and one holding accounts keep a legal form.
  const formLocked = base.isPrincipal || base.accountCount > 0;
  const principalHint = withoutForm
    ? 'La période sans forme juridique n’est jamais principale.'
    : base.isPrincipal
      ? 'C’est l’entité principale. Pour en changer, rendez principale une autre entité.'
      : 'Proposée d’avance quand le site ne peut pas déduire l’entité d’un acte ; une seule à la fois, elle remplacera l’actuelle.';

  return (
    <>
      <section id={ID}>
        {/* A record without tabs: the title stays for screen readers. */}
        <h2 className="sr-only" id={`${ID}-title`} tabIndex={-1}>
          Identité
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
            icon={<Landmark />}
            id={`${ID}-identity-title`}
            title="Identité"
          >
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-1.5 sm:col-span-2">
                <Label htmlFor={`${ID}-name`} required>
                  Dénomination
                </Label>
                <Input
                  aria-describedby={describedBy(
                    errors.name && `${ID}-name-error`,
                  )}
                  aria-invalid={Boolean(errors.name)}
                  disabled={disabled}
                  id={`${ID}-name`}
                  maxLength={ENTITY_NAME_MAX_LENGTH}
                  onChange={(event) => change({ name: event.target.value })}
                  value={draft.name}
                />
                <FieldError id={`${ID}-name-error`} message={errors.name} />
              </div>
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor={`${ID}-form`} required>
                  Forme juridique
                </Label>
                <LegalFormSelect
                  disabled={disabled}
                  error={errors.form}
                  excluded={formLocked ? ['NONE'] : []}
                  hintId={formLocked ? `${ID}-form-hint` : undefined}
                  id={`${ID}-form`}
                  onChange={(form) => change({ form })}
                  value={draft.form}
                />
                {formLocked && canUpdate && (
                  <p
                    className="text-muted-foreground text-xs"
                    id={`${ID}-form-hint`}
                  >
                    {base.accountCount > 0
                      ? 'Elle a des comptes : elle garde une forme juridique.'
                      : 'L’entité principale garde une forme juridique.'}
                  </p>
                )}
                <FieldError id={`${ID}-form-error`} message={errors.form} />
              </div>
              {draft.form === 'OTHER' ? (
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor={`${ID}-other-form`} required>
                    Nom de la forme
                  </Label>
                  <Input
                    aria-describedby={describedBy(
                      errors.otherForm && `${ID}-other-form-error`,
                    )}
                    aria-invalid={Boolean(errors.otherForm)}
                    disabled={disabled}
                    id={`${ID}-other-form`}
                    maxLength={OTHER_FORM_MAX_LENGTH}
                    onChange={(event) =>
                      change({ otherForm: event.target.value })
                    }
                    placeholder="Ex. Fondation"
                    value={draft.otherForm}
                  />
                  <FieldError
                    id={`${ID}-other-form-error`}
                    message={errors.otherForm}
                  />
                </div>
              ) : (
                <div aria-hidden="true" className="hidden sm:block" />
              )}
              <ApproximateDateField
                disabled={disabled}
                error={errors.start}
                idPrefix={`${ID}-start`}
                label="Début"
                onChange={(start) => change({ start })}
                value={draft.start}
              />
              <div className="border-border-default bg-surface-inset flex items-center justify-between gap-4 self-end rounded-lg border px-3 py-2.5">
                <div>
                  <Label className="leading-5" htmlFor={`${ID}-ongoing`}>
                    Existe toujours
                  </Label>
                  <p
                    className="text-muted-foreground text-xs"
                    id={`${ID}-ongoing-hint`}
                  >
                    Retirez-le pour saisir sa fin.
                  </p>
                </div>
                <Switch
                  aria-describedby={`${ID}-ongoing-hint`}
                  checked={!draft.ended}
                  disabled={disabled}
                  id={`${ID}-ongoing`}
                  onCheckedChange={(ongoing) => {
                    change({ ended: !ongoing });
                    setErrors((current) => ({ ...current, end: undefined }));
                  }}
                />
              </div>
              {draft.ended && (
                <ApproximateDateField
                  disabled={disabled}
                  error={errors.end}
                  idPrefix={`${ID}-end`}
                  label="Fin"
                  onChange={(end) => change({ end })}
                  value={draft.end}
                />
              )}
            </div>
          </RubricCard>
          {withoutForm ? (
            <p className="text-muted-foreground px-1 text-sm">
              La période sans forme juridique n’a ni identifiant, ni siège, ni
              compte.
            </p>
          ) : (
            <>
              <RubricCard
                icon={<MapPin />}
                id={`${ID}-identifiers-title`}
                title="Identifiants et siège"
              >
                <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor={`${ID}-rna`}>Numéro RNA</Label>
                    <Input
                      aria-describedby={describedBy(
                        `${ID}-rna-hint`,
                        errors.rnaNumber && `${ID}-rna-error`,
                      )}
                      aria-invalid={Boolean(errors.rnaNumber)}
                      autoCapitalize="characters"
                      disabled={disabled}
                      id={`${ID}-rna`}
                      maxLength={20}
                      onChange={(event) =>
                        change({ rnaNumber: event.target.value })
                      }
                      placeholder="W123456789"
                      spellCheck={false}
                      value={draft.rnaNumber}
                    />
                    <p
                      className="text-muted-foreground text-xs"
                      id={`${ID}-rna-hint`}
                    >
                      Pour une association : W suivi de 9 chiffres.
                    </p>
                    <FieldError
                      id={`${ID}-rna-error`}
                      message={errors.rnaNumber}
                    />
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor={`${ID}-siret`}>SIRET</Label>
                    <Input
                      aria-describedby={describedBy(
                        `${ID}-siret-hint`,
                        errors.siretNumber && `${ID}-siret-error`,
                      )}
                      aria-invalid={Boolean(errors.siretNumber)}
                      disabled={disabled}
                      id={`${ID}-siret`}
                      inputMode="numeric"
                      maxLength={20}
                      onChange={(event) =>
                        change({ siretNumber: event.target.value })
                      }
                      placeholder="123 456 789 00012"
                      spellCheck={false}
                      value={draft.siretNumber}
                    />
                    <p
                      className="text-muted-foreground text-xs"
                      id={`${ID}-siret-hint`}
                    >
                      14 chiffres, s’il y en a un.
                    </p>
                    <FieldError
                      id={`${ID}-siret-error`}
                      message={errors.siretNumber}
                    />
                  </div>
                  <div className="min-w-0 space-y-1.5 sm:col-span-2">
                    <Label htmlFor={`${ID}-head-office`}>Siège</Label>
                    <Textarea
                      aria-describedby={describedBy(
                        errors.headOffice && `${ID}-head-office-error`,
                      )}
                      aria-invalid={Boolean(errors.headOffice)}
                      disabled={disabled}
                      id={`${ID}-head-office`}
                      maxLength={HEAD_OFFICE_MAX_LENGTH}
                      onChange={(event) =>
                        change({ headOffice: event.target.value })
                      }
                      placeholder="Adresse du siège"
                      rows={2}
                      value={draft.headOffice}
                    />
                    <FieldError
                      id={`${ID}-head-office-error`}
                      message={errors.headOffice}
                    />
                  </div>
                </div>
              </RubricCard>
              <RubricCard
                icon={<BadgeCheck />}
                id={`${ID}-principal-title`}
                title="Entité principale"
              >
                <div className="border-border-default bg-surface-inset flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5">
                  <div>
                    <Label className="leading-5" htmlFor={`${ID}-principal`}>
                      Entité principale
                    </Label>
                    <p
                      className="text-muted-foreground text-xs"
                      id={`${ID}-principal-hint`}
                    >
                      {principalHint}
                    </p>
                  </div>
                  <Switch
                    aria-describedby={`${ID}-principal-hint`}
                    checked={draft.isPrincipal}
                    disabled={disabled || base.isPrincipal}
                    id={`${ID}-principal`}
                    onCheckedChange={(isPrincipal) => change({ isPrincipal })}
                  />
                </div>
                <FieldError
                  id={`${ID}-principal-error`}
                  message={errors.isPrincipal}
                />
              </RubricCard>
            </>
          )}
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
                ? 'La modification de cette entité n’est plus autorisée.'
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
            ? 'Les modifications de cette entité ne sont pas enregistrées.'
            : 'Vous avez des modifications non enregistrées sur cette entité. Quitter la page abandonnera votre saisie.'
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
