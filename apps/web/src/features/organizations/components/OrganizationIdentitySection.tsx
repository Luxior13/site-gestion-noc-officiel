'use client';

import { Building2, MapPin } from 'lucide-react';
import React, { type FC, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

import { RubricCard } from '$components/layout/RubricCard';
import { SectionActionBar } from '$components/layout/SectionActionBar';
import { UnsavedNavigationDialog } from '$components/layout/UnsavedNavigationDialog';
import { useUnsavedNavigationGuard } from '$hooks/useUnsavedNavigationGuard';
import { Input } from '$ui/input';
import { Label } from '$ui/label';
import { Textarea } from '$ui/textarea';
import { ApiClientError } from '$utils/api.utils';

import { updateOrganizationRequest } from '../organization.api';
import {
  ORGANIZATION_ACTION_BAR_SLOT,
  ORGANIZATION_ADDRESS_MAX_LENGTH,
  ORGANIZATION_NAME_MAX_LENGTH,
  ORGANIZATION_WEBSITE_MAX_LENGTH,
  type OrganizationKind,
} from '../organization.constants';
import type { OrganizationDetail } from '../types/organization.types';
import { OrganizationKindsField } from './OrganizationKindsField';

const ID = 'organization-identity';
const FORM_ID = `${ID}-form`;

type Draft = {
  address: string;
  kinds: readonly OrganizationKind[];
  name: string;
  siretNumber: string;
  website: string;
};

type FieldKey = keyof Draft;
type FieldErrors = Partial<Record<FieldKey, string>>;

const DRAFT_KEYS: readonly FieldKey[] = [
  'address',
  'kinds',
  'name',
  'siretNumber',
  'website',
];

const toDraft = (organization: OrganizationDetail): Draft => ({
  address: organization.address ?? '',
  kinds: organization.kinds,
  name: organization.name,
  siretNumber: organization.siretNumber ?? '',
  website: organization.website ?? '',
});

/** One field of two drafts, compared as it is saved. */
const sameField = (left: Draft, right: Draft, key: FieldKey): boolean =>
  key === 'kinds'
    ? left.kinds.join() === right.kinds.join()
    : // Keys come from the closed Draft type.
      // eslint-disable-next-line security/detect-object-injection
      left[key].trim() === right[key].trim();

const isSameDraft = (left: Draft, right: Draft): boolean =>
  DRAFT_KEYS.every((key) => sameField(left, right, key));

const fieldErrorsOf = (error: ApiClientError): FieldErrors => {
  const details = error.details ?? {};

  return Object.fromEntries(
    DRAFT_KEYS.map((key) => [
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
  onChange: (organization: OrganizationDetail) => void;
  onDirtyChange: (dirty: boolean) => void;
  onReload: () => Promise<OrganizationDetail>;
  organization: OrganizationDetail;
};

/**
 * An organisation's identity, edited in place (gabarit B): its name and
 * kinds, then its site, SIRET and address; the shared save bar appears once
 * a value changes.
 */
export const OrganizationIdentitySection: FC<Props> = ({
  canUpdate,
  onChange,
  onDirtyChange,
  onReload,
  organization,
}) => {
  const [base, setBase] = useState(organization);
  const [draft, setDraft] = useState<Draft>(() => toDraft(organization));
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
    setActionBarSlot(document.getElementById(ORGANIZATION_ACTION_BAR_SLOT));

    return (): void => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  // A newer version from the page never replaces a draft: it is adopted only
  // when untouched, or through « Actualiser ». Contacts keep versions of
  // their own and never stale the identity.
  useEffect(() => {
    if (operationRef.current || organization.version <= baseRef.current.version)
      return;
    if (dirtyRef.current) {
      setConflict(true);

      return;
    }
    setBase(organization);
    setDraft(toDraft(organization));
  }, [organization]);

  const focus = (target: 'error' | 'field' | 'invalid'): void => {
    requestAnimationFrame(() => {
      if (!mountedRef.current) return;
      const destination =
        target === 'error'
          ? errorRef.current
          : formRef.current?.querySelector<HTMLElement>(
              target === 'invalid'
                ? '[aria-invalid="true"]:not(:disabled), [aria-invalid="true"] button:not(:disabled)'
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
      kinds: draft.kinds.length > 0 ? undefined : 'Choisissez au moins un type',
      name: draft.name.trim() ? undefined : 'Le nom est obligatoire',
    };
    if (missing.name || missing.kinds) {
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
      const saved = await updateOrganizationRequest(organization.id, {
        address: draft.address.trim() || null,
        expectedVersion: base.version,
        kinds: draft.kinds,
        name: draft.name,
        siretNumber: draft.siretNumber.trim() || null,
        website: draft.website.trim() || null,
      });
      if (!mountedRef.current) return;
      baseRef.current = saved;
      dirtyRef.current = false;
      setBase(saved);
      setDraft(toDraft(saved));
      onChange(saved);
      toast.success('Organisation mise à jour');
    } catch (caught) {
      if (!mountedRef.current) return;
      const fieldErrors =
        caught instanceof ApiClientError ? fieldErrorsOf(caught) : {};
      const hasFieldErrors = Object.values(fieldErrors).some(Boolean);
      if (caught instanceof ApiClientError && caught.status === 409) {
        if (hasFieldErrors) {
          // A name already taken by another organisation.
          setErrors(fieldErrors);
          focus('invalid');

          return;
        }
        setConflict(true);
        setSubmitError(
          'L’organisation a changé. Actualisez la version avant de confirmer votre saisie.',
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
        'Le résultat de l’enregistrement n’a pas pu être confirmé. Actualisez la version pour vérifier l’organisation avant de réessayer. Votre saisie est conservée.',
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
            icon={<Building2 />}
            id={`${ID}-identity-title`}
            title="Identité"
          >
            <div className="grid min-w-0 gap-4">
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
                  maxLength={ORGANIZATION_NAME_MAX_LENGTH}
                  onChange={(event) => change({ name: event.target.value })}
                  value={draft.name}
                />
                <FieldError id={`${ID}-name-error`} message={errors.name} />
              </div>
              <OrganizationKindsField
                disabled={disabled}
                error={errors.kinds}
                idPrefix={`${ID}-kinds`}
                onChange={(kinds) => {
                  change({ kinds });
                  setErrors((current) => ({ ...current, kinds: undefined }));
                }}
                value={draft.kinds}
              />
            </div>
          </RubricCard>
          <RubricCard
            icon={<MapPin />}
            id={`${ID}-identifiers-title`}
            title="Site, identifiants et adresse"
          >
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor={`${ID}-website`}>Site web</Label>
                <Input
                  aria-describedby={describedBy(
                    errors.website && `${ID}-website-error`,
                  )}
                  aria-invalid={Boolean(errors.website)}
                  disabled={disabled}
                  id={`${ID}-website`}
                  inputMode="url"
                  maxLength={ORGANIZATION_WEBSITE_MAX_LENGTH}
                  onChange={(event) => change({ website: event.target.value })}
                  placeholder="noctambule.gg"
                  spellCheck={false}
                  value={draft.website}
                />
                <FieldError
                  id={`${ID}-website-error`}
                  message={errors.website}
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
                  14 chiffres, pour une organisation française qui en a un.
                </p>
                <FieldError
                  id={`${ID}-siret-error`}
                  message={errors.siretNumber}
                />
              </div>
              <div className="min-w-0 space-y-1.5 sm:col-span-2">
                <Label htmlFor={`${ID}-address`}>Adresse</Label>
                <Textarea
                  aria-describedby={describedBy(
                    errors.address && `${ID}-address-error`,
                  )}
                  aria-invalid={Boolean(errors.address)}
                  disabled={disabled}
                  id={`${ID}-address`}
                  maxLength={ORGANIZATION_ADDRESS_MAX_LENGTH}
                  onChange={(event) => change({ address: event.target.value })}
                  placeholder="Adresse postale, utile pour une facture ou un reçu"
                  rows={2}
                  value={draft.address}
                />
                <FieldError
                  id={`${ID}-address-error`}
                  message={errors.address}
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
                ? 'La modification de cette organisation n’est plus autorisée.'
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
            ? 'Les modifications de cette organisation ne sont pas enregistrées.'
            : 'Vous avez des modifications non enregistrées sur cette organisation. Quitter la page abandonnera votre saisie.'
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
