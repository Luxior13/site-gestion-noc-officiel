'use client';

import { CalendarX2, Coins, Wallet } from 'lucide-react';
import React, { type FC, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

import { RubricCard } from '$components/layout/RubricCard';
import { SectionActionBar } from '$components/layout/SectionActionBar';
import { UnsavedNavigationDialog } from '$components/layout/UnsavedNavigationDialog';
import { useUnsavedNavigationGuard } from '$hooks/useUnsavedNavigationGuard';
import { Input } from '$ui/input';
import { Label } from '$ui/label';
import { Switch } from '$ui/switch';
import { ApiClientError } from '$utils/api.utils';
import { getLocalToday } from '$utils/approximate-date.utils';
import { centsToInput, parseEuroAmount } from '$utils/money.utils';

import { updateFinancialAccountRequest } from '../financial-account.api';
import {
  ACCOUNT_NAME_MAX_LENGTH,
  FINANCIAL_ACCOUNT_ACTION_BAR_SLOT,
  type FinancialAccountKind,
  INSTITUTION_MAX_LENGTH,
} from '../financial-account.constants';
import type { FinancialAccountItem } from '../types/financial-account.types';
import {
  AccountKindSelect,
  AmountField,
  DayField,
  FieldError,
} from './AccountFields';

const ID = 'financial-account-detail';
const FORM_ID = `${ID}-form`;

type Draft = {
  balance: string;
  closed: boolean;
  closedOn: string;
  institution: string;
  kind: FinancialAccountKind;
  name: string;
  openingOn: string;
};

type FieldKey =
  | 'closedOn'
  | 'institution'
  | 'kind'
  | 'name'
  | 'openingBalanceCents'
  | 'openingOn';
type FieldErrors = Partial<Record<FieldKey, string>>;

const FIELD_KEYS: readonly FieldKey[] = [
  'closedOn',
  'institution',
  'kind',
  'name',
  'openingBalanceCents',
  'openingOn',
];
const DRAFT_KEYS: readonly (keyof Draft)[] = [
  'balance',
  'closed',
  'closedOn',
  'institution',
  'kind',
  'name',
  'openingOn',
];

const toDraft = (account: FinancialAccountItem): Draft => ({
  balance: centsToInput(account.openingBalanceCents),
  closed: account.closedOn !== null,
  closedOn: account.closedOn ?? getLocalToday(),
  institution: account.institution ?? '',
  kind: account.kind,
  name: account.name,
  openingOn: account.openingOn,
});

/** One field of two drafts, compared as it is saved. */
const sameField = (left: Draft, right: Draft, key: keyof Draft): boolean => {
  if (key === 'closedOn')
    return !left.closed || !right.closed || left.closedOn === right.closedOn;
  if (key === 'balance')
    return parseEuroAmount(left.balance) === parseEuroAmount(right.balance);
  if (key === 'institution')
    return (
      left.kind === 'CASH' ||
      left.institution.trim() === right.institution.trim()
    );
  if (key === 'name') return left.name.trim() === right.name.trim();

  // eslint-disable-next-line security/detect-object-injection
  return left[key] === right[key];
};

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

type Props = {
  account: FinancialAccountItem;
  canUpdate: boolean;
  onChange: (account: FinancialAccountItem) => void;
  onReload: () => Promise<FinancialAccountItem>;
};

/**
 * An account's information, edited in place (gabarit B): name, kind and
 * bank, the opening balance, the closing. Its entity is shown, never
 * changed: it was fixed when the account was opened.
 */
export const FinancialAccountInformationSection: FC<Props> = ({
  account,
  canUpdate,
  onChange,
  onReload,
}) => {
  const [base, setBase] = useState(account);
  const [draft, setDraft] = useState<Draft>(() => toDraft(account));
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
    setActionBarSlot(
      document.getElementById(FINANCIAL_ACCOUNT_ACTION_BAR_SLOT),
    );

    return (): void => {
      mountedRef.current = false;
    };
  }, []);

  // A newer version from the page never replaces a draft: it is adopted only
  // through « Actualiser ».
  useEffect(() => {
    if (operationRef.current || account.version <= baseRef.current.version)
      return;
    if (dirtyRef.current) {
      setConflict(true);

      return;
    }
    setBase(account);
    setDraft(toDraft(account));
  }, [account]);

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
    const cents = parseEuroAmount(draft.balance);
    const missing: FieldErrors = {
      name: draft.name.trim() ? undefined : 'Le nom est obligatoire',
      openingBalanceCents:
        cents === null
          ? 'Saisissez un montant, par exemple 1 234,56'
          : draft.kind === 'CASH' && cents < 0
            ? 'Une caisse ne peut pas être en dessous de zéro'
            : undefined,
    };
    if (missing.name || missing.openingBalanceCents || cents === null) {
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
      const saved = await updateFinancialAccountRequest(account.id, {
        closedOn: draft.closed ? draft.closedOn : null,
        expectedVersion: base.version,
        institution:
          draft.kind === 'CASH' ? null : draft.institution.trim() || null,
        kind: draft.kind,
        name: draft.name,
        openingBalanceCents: cents,
        openingOn: draft.openingOn,
      });
      if (!mountedRef.current) return;
      baseRef.current = saved;
      dirtyRef.current = false;
      setBase(saved);
      setDraft(toDraft(saved));
      onChange(saved);
      toast.success('Compte mis à jour');
    } catch (caught) {
      if (!mountedRef.current) return;
      const fieldErrors =
        caught instanceof ApiClientError ? fieldErrorsOf(caught) : {};
      const hasFieldErrors = Object.values(fieldErrors).some(Boolean);
      if (caught instanceof ApiClientError && caught.status === 409) {
        if (hasFieldErrors) {
          setErrors(fieldErrors);
          focus('invalid');

          return;
        }
        setConflict(true);
        setSubmitError(
          'Le compte a changé. Actualisez la version avant de confirmer votre saisie.',
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
        'Le résultat de l’enregistrement n’a pas pu être confirmé. Actualisez la version pour vérifier le compte avant de réessayer. Votre saisie est conservée.',
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
          <RubricCard
            icon={<Wallet />}
            id={`${ID}-account-title`}
            title="Compte"
          >
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-1.5 sm:col-span-2">
                <Label htmlFor={`${ID}-name`} required>
                  Nom
                </Label>
                <Input
                  aria-describedby={
                    errors.name ? `${ID}-name-error` : undefined
                  }
                  aria-invalid={Boolean(errors.name)}
                  disabled={disabled}
                  id={`${ID}-name`}
                  maxLength={ACCOUNT_NAME_MAX_LENGTH}
                  onChange={(event) => change({ name: event.target.value })}
                  value={draft.name}
                />
                <FieldError id={`${ID}-name-error`} message={errors.name} />
              </div>
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor={`${ID}-kind`} required>
                  Type
                </Label>
                <AccountKindSelect
                  disabled={disabled}
                  error={errors.kind}
                  id={`${ID}-kind`}
                  onChange={(kind) => change({ kind })}
                  value={draft.kind}
                />
                <FieldError id={`${ID}-kind-error`} message={errors.kind} />
              </div>
              {draft.kind === 'CASH' ? (
                <div aria-hidden="true" className="hidden sm:block" />
              ) : (
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor={`${ID}-institution`}>Établissement</Label>
                  <Input
                    aria-describedby={
                      errors.institution ? `${ID}-institution-error` : undefined
                    }
                    aria-invalid={Boolean(errors.institution)}
                    disabled={disabled}
                    id={`${ID}-institution`}
                    maxLength={INSTITUTION_MAX_LENGTH}
                    onChange={(event) =>
                      change({ institution: event.target.value })
                    }
                    value={draft.institution}
                  />
                  <FieldError
                    id={`${ID}-institution-error`}
                    message={errors.institution}
                  />
                </div>
              )}
              <div className="min-w-0 space-y-1.5 sm:col-span-2">
                <p className="text-sm font-medium" id={`${ID}-entity-label`}>
                  Entité titulaire
                </p>
                <p aria-labelledby={`${ID}-entity-label`} className="text-sm">
                  {account.entity.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  Fixée à l’ouverture : un compte reste à l’entité qui l’a
                  ouvert.
                </p>
              </div>
            </div>
          </RubricCard>
          <RubricCard
            icon={<Coins />}
            id={`${ID}-opening-title`}
            title="Solde de départ"
          >
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <AmountField
                disabled={disabled}
                error={errors.openingBalanceCents}
                hintId={`${ID}-opening-hint`}
                id={`${ID}-balance`}
                label="Solde de départ"
                onChange={(balance) => change({ balance })}
                value={draft.balance}
              />
              <DayField
                disabled={disabled}
                error={errors.openingOn}
                idPrefix={`${ID}-opening`}
                label="À la date du"
                onChange={(openingOn) => change({ openingOn })}
                value={draft.openingOn}
              />
            </div>
            <p
              className="text-muted-foreground mt-3 text-xs"
              id={`${ID}-opening-hint`}
            >
              Le solde réel du compte ce jour-là : les opérations partiront de
              lui.
            </p>
          </RubricCard>
          <RubricCard
            icon={<CalendarX2 />}
            id={`${ID}-closing-title`}
            title="Clôture"
          >
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="border-border-default bg-surface-inset flex items-center justify-between gap-4 self-end rounded-lg border px-3 py-2.5">
                <div>
                  <Label className="leading-5" htmlFor={`${ID}-open`}>
                    Ouvert
                  </Label>
                  <p
                    className="text-muted-foreground text-xs"
                    id={`${ID}-open-hint`}
                  >
                    Retirez-le quand le compte est fermé à la banque ou la
                    caisse vidée.
                  </p>
                </div>
                <Switch
                  aria-describedby={`${ID}-open-hint`}
                  checked={!draft.closed}
                  disabled={disabled}
                  id={`${ID}-open`}
                  onCheckedChange={(open) => {
                    change({ closed: !open });
                    setErrors((current) => ({
                      ...current,
                      closedOn: undefined,
                    }));
                  }}
                />
              </div>
              {draft.closed && (
                <DayField
                  disabled={disabled}
                  error={errors.closedOn}
                  idPrefix={`${ID}-closed`}
                  label="Clôturé le"
                  onChange={(closedOn) => change({ closedOn })}
                  value={draft.closedOn}
                />
              )}
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
                ? 'La modification de ce compte n’est plus autorisée.'
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
            ? 'Les modifications de ce compte ne sont pas enregistrées.'
            : 'Vous avez des modifications non enregistrées sur ce compte. Quitter la page abandonnera votre saisie.'
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
