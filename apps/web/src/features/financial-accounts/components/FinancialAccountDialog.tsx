'use client';

import { Check } from 'lucide-react';
import React, { type FC, useState } from 'react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '$ui/select';
import { ApiClientError } from '$utils/api.utils';
import { getLocalToday } from '$utils/approximate-date.utils';
import { parseEuroAmount } from '$utils/money.utils';

import { holdersOn } from '../account-holders';
import { createFinancialAccountRequest } from '../financial-account.api';
import {
  ACCOUNT_NAME_MAX_LENGTH,
  type FinancialAccountKind,
  INSTITUTION_MAX_LENGTH,
} from '../financial-account.constants';
import type {
  AccountHolder,
  FinancialAccountItem,
} from '../types/financial-account.types';
import {
  AccountKindSelect,
  AmountField,
  DayField,
  FieldError,
} from './AccountFields';

type Draft = {
  balance: string;
  entityId: string | null;
  institution: string;
  kind: FinancialAccountKind;
  name: string;
  openingOn: string;
};

type FieldKey =
  | 'entityId'
  | 'institution'
  | 'kind'
  | 'name'
  | 'openingBalanceCents'
  | 'openingOn';
type FieldErrors = Partial<Record<FieldKey, string>>;

const ID = 'financial-account-dialog';

const fieldErrorsOf = (error: ApiClientError): FieldErrors => {
  const details = error.details ?? {};
  const first = (prefix: string): string | undefined =>
    Object.entries(details).find(
      ([key]) => key === prefix || key.startsWith(`${prefix}.`),
    )?.[1]?.[0];

  return {
    entityId: first('entityId'),
    institution: first('institution'),
    kind: first('kind'),
    name: first('name'),
    openingBalanceCents: first('openingBalanceCents'),
    openingOn: first('openingOn'),
  };
};

type Props = {
  holders: readonly AccountHolder[];
  onClose: () => void;
  onCreated: (account: FinancialAccountItem) => void;
};

const FinancialAccountDialogContent: FC<Props> = ({
  holders,
  onClose,
  onCreated,
}) => {
  const [draft, setDraft] = useState<Draft>({
    balance: '',
    entityId: null,
    institution: '',
    kind: 'BANK',
    name: '',
    openingOn: getLocalToday(),
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // One entity on the opening day: it applies by itself, nobody chooses
  // (cadrage, règle 3). Several: the principal one is proposed first.
  const candidates = holdersOn(holders, draft.openingOn);
  const chosenEntityId =
    candidates.length > 1
      ? (candidates.find((holder) => holder.id === draft.entityId)?.id ??
        candidates[0]?.id ??
        null)
      : null;
  const change = (next: Partial<Draft>): void => {
    setDraft((current) => ({ ...current, ...next }));
    setFormError(null);
  };

  const create = async (): Promise<void> => {
    if (busy) return;
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

      return;
    }
    setBusy(true);
    setErrors({});
    setFormError(null);
    try {
      onCreated(
        await createFinancialAccountRequest({
          entityId: chosenEntityId,
          institution:
            draft.kind === 'CASH' ? null : draft.institution.trim() || null,
          kind: draft.kind,
          name: draft.name,
          openingBalanceCents: cents,
          openingOn: draft.openingOn,
        }),
      );
    } catch (error) {
      if (error instanceof ApiClientError) {
        const nextErrors = fieldErrorsOf(error);
        setErrors(nextErrors);
        setFormError(
          Object.values(nextErrors).some(Boolean) ? null : error.message,
        );
      } else {
        setFormError('La demande n’a pas abouti. Réessayez.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        aria-busy={busy || undefined}
        className="flex h-[100svh] max-h-[100svh] flex-col overflow-hidden p-0 sm:h-auto sm:max-h-[85svh] sm:max-w-lg"
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
            <DialogTitle>Ajouter un compte</DialogTitle>
            <DialogDescription>
              Un compte bancaire, un compte en ligne ou une caisse, avec son
              solde au jour où le site commence à le suivre.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
            {formError && (
              <p className="text-destructive text-sm" role="alert">
                {formError}
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor={`${ID}-name`} required>
                Nom
              </Label>
              <Input
                aria-describedby={errors.name ? `${ID}-name-error` : undefined}
                aria-invalid={Boolean(errors.name)}
                autoFocus
                disabled={busy}
                id={`${ID}-name`}
                maxLength={ACCOUNT_NAME_MAX_LENGTH}
                onChange={(event) => change({ name: event.target.value })}
                placeholder="Ex. Compte courant"
                value={draft.name}
              />
              <FieldError id={`${ID}-name-error`} message={errors.name} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor={`${ID}-kind`} required>
                  Type
                </Label>
                <AccountKindSelect
                  disabled={busy}
                  error={errors.kind}
                  id={`${ID}-kind`}
                  onChange={(kind) => change({ kind })}
                  value={draft.kind}
                />
                <FieldError id={`${ID}-kind-error`} message={errors.kind} />
              </div>
              {draft.kind !== 'CASH' && (
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor={`${ID}-institution`}>Établissement</Label>
                  <Input
                    aria-describedby={
                      errors.institution ? `${ID}-institution-error` : undefined
                    }
                    aria-invalid={Boolean(errors.institution)}
                    disabled={busy}
                    id={`${ID}-institution`}
                    maxLength={INSTITUTION_MAX_LENGTH}
                    onChange={(event) =>
                      change({ institution: event.target.value })
                    }
                    placeholder={
                      draft.kind === 'ONLINE'
                        ? 'Ex. PayPal'
                        : 'Ex. Crédit Agricole'
                    }
                    value={draft.institution}
                  />
                  <FieldError
                    id={`${ID}-institution-error`}
                    message={errors.institution}
                  />
                </div>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <AmountField
                disabled={busy}
                error={errors.openingBalanceCents}
                hintId={`${ID}-opening-hint`}
                id={`${ID}-balance`}
                label="Solde de départ"
                onChange={(balance) => change({ balance })}
                value={draft.balance}
              />
              <DayField
                disabled={busy}
                error={errors.openingOn}
                idPrefix={`${ID}-opening`}
                label="À la date du"
                onChange={(openingOn) => change({ openingOn })}
                value={draft.openingOn}
              />
            </div>
            <p
              className="text-muted-foreground -mt-2 text-xs"
              id={`${ID}-opening-hint`}
            >
              Le solde réel du compte ce jour-là, relevé ou caisse comptée : le
              site part de lui, l’historique d’avant reste dans votre ancien
              suivi.
            </p>
            {candidates.length > 1 && (
              <div className="space-y-1.5">
                <Label htmlFor={`${ID}-entity`} required>
                  Entité titulaire
                </Label>
                <Select
                  disabled={busy}
                  onValueChange={(entityId) => change({ entityId })}
                  value={chosenEntityId ?? undefined}
                >
                  <SelectTrigger
                    aria-describedby={`${ID}-entity-hint${errors.entityId ? ` ${ID}-entity-error` : ''}`}
                    aria-invalid={Boolean(errors.entityId)}
                    className="w-full"
                    id={`${ID}-entity`}
                  >
                    <SelectValue placeholder="Choisir une entité" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.map((holder) => (
                      <SelectItem key={holder.id} value={holder.id}>
                        {holder.isPrincipal
                          ? `${holder.name} (principale)`
                          : holder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p
                  className="text-muted-foreground text-xs"
                  id={`${ID}-entity-hint`}
                >
                  Plusieurs entités existent à cette date ; le compte restera à
                  celle choisie.
                </p>
                <FieldError
                  id={`${ID}-entity-error`}
                  message={errors.entityId}
                />
              </div>
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
            <Button disabled={busy} loading={busy} type="submit">
              {!busy && <Check className="size-4" />}
              {busy ? 'Enregistrement…' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Opens an account in a window; its record then opens (10 November 2026).
 * The entity is asked only when several exist on the opening day.
 */
export const FinancialAccountDialog: FC<Props & { open: boolean }> = ({
  open,
  ...props
}) => (open ? <FinancialAccountDialogContent {...props} /> : null);
