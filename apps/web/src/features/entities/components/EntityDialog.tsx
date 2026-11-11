'use client';

import { Check } from 'lucide-react';
import React, { type FC, useState } from 'react';

import { ApproximateDateField } from '$components/forms/ApproximateDateField';
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
import { Switch } from '$ui/switch';
import { ApiClientError } from '$utils/api.utils';
import {
  type ApproximateDate,
  getLocalToday,
} from '$utils/approximate-date.utils';

import { createEntityRequest } from '../entity.api';
import {
  ENTITY_NAME_MAX_LENGTH,
  type LegalForm,
  OTHER_FORM_MAX_LENGTH,
} from '../entity.constants';
import type { LegalEntityItem } from '../types/entity.types';
import { LegalFormSelect } from './LegalFormSelect';

type Draft = {
  end: ApproximateDate;
  ended: boolean;
  form: LegalForm;
  name: string;
  otherForm: string;
  start: ApproximateDate;
};

type FieldErrors = Partial<
  Record<'end' | 'form' | 'name' | 'otherForm' | 'start', string>
>;

const ID = 'entity-dialog';

const fieldErrorsOf = (error: ApiClientError): FieldErrors => {
  const details = error.details ?? {};
  const first = (prefix: string): string | undefined =>
    Object.entries(details).find(
      ([key]) => key === prefix || key.startsWith(`${prefix}.`),
    )?.[1]?.[0];

  return {
    end: first('end'),
    form: first('form'),
    name: first('name'),
    otherForm: first('otherForm'),
    start: first('start'),
  };
};

const FieldError: FC<{ id: string; message?: string }> = ({ id, message }) =>
  message ? (
    <p className="text-destructive text-xs" id={id} role="alert">
      {message}
    </p>
  ) : null;

type Props = {
  onClose: () => void;
  onCreated: (entity: LegalEntityItem) => void;
};

const EntityDialogContent: FC<Props> = ({ onClose, onCreated }) => {
  const today = getLocalToday();
  const [draft, setDraft] = useState<Draft>({
    end: { date: today, precision: 'DAY' },
    ended: false,
    form: 'ASSOCIATION',
    name: '',
    otherForm: '',
    start: { date: today, precision: 'DAY' },
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const change = (next: Partial<Draft>): void => {
    setDraft((current) => ({ ...current, ...next }));
    setFormError(null);
  };

  const create = async (): Promise<void> => {
    if (busy) return;
    const missing: FieldErrors = {
      name: draft.name.trim() ? undefined : 'La dénomination est obligatoire',
      otherForm:
        draft.form === 'OTHER' && !draft.otherForm.trim()
          ? 'Précisez la forme juridique'
          : undefined,
    };
    if (missing.name || missing.otherForm) {
      setErrors(missing);

      return;
    }
    setBusy(true);
    setErrors({});
    setFormError(null);
    try {
      onCreated(
        await createEntityRequest({
          end: draft.ended ? draft.end : null,
          form: draft.form,
          name: draft.name,
          otherForm: draft.form === 'OTHER' ? draft.otherForm.trim() : null,
          start: draft.start,
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
            <DialogTitle>Ajouter une entité</DialogTitle>
            <DialogDescription>
              L’association, une société, ou la période d’avant ; sa fiche
              s’ouvre ensuite pour ses identifiants et son siège.
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
                Dénomination
              </Label>
              <Input
                aria-describedby={errors.name ? `${ID}-name-error` : undefined}
                aria-invalid={Boolean(errors.name)}
                autoFocus
                disabled={busy}
                id={`${ID}-name`}
                maxLength={ENTITY_NAME_MAX_LENGTH}
                onChange={(event) => change({ name: event.target.value })}
                placeholder="Ex. Noctambule"
                value={draft.name}
              />
              <FieldError id={`${ID}-name-error`} message={errors.name} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${ID}-form`} required>
                Forme juridique
              </Label>
              <LegalFormSelect
                disabled={busy}
                error={errors.form}
                id={`${ID}-form`}
                onChange={(form) => change({ form })}
                value={draft.form}
              />
              <FieldError id={`${ID}-form-error`} message={errors.form} />
            </div>
            {draft.form === 'OTHER' && (
              <div className="space-y-1.5">
                <Label htmlFor={`${ID}-other-form`} required>
                  Nom de la forme
                </Label>
                <Input
                  aria-describedby={
                    errors.otherForm ? `${ID}-other-form-error` : undefined
                  }
                  aria-invalid={Boolean(errors.otherForm)}
                  disabled={busy}
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
            )}
            <ApproximateDateField
              disabled={busy}
              error={errors.start}
              idPrefix={`${ID}-start`}
              label="Début"
              onChange={(start) => change({ start })}
              value={draft.start}
            />
            <div className="border-border-default bg-surface-inset flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5">
              <div>
                <Label className="leading-5" htmlFor={`${ID}-ongoing`}>
                  Existe toujours
                </Label>
                <p
                  className="text-muted-foreground text-xs"
                  id={`${ID}-ongoing-hint`}
                >
                  Retirez-le pour saisir sa fin : dissolution, ou fin de la
                  période d’avant.
                </p>
              </div>
              <Switch
                aria-describedby={`${ID}-ongoing-hint`}
                checked={!draft.ended}
                disabled={busy}
                id={`${ID}-ongoing`}
                onCheckedChange={(ongoing) => {
                  change({ ended: !ongoing });
                  setErrors((current) => ({ ...current, end: undefined }));
                }}
              />
            </div>
            {draft.ended && (
              <ApproximateDateField
                disabled={busy}
                error={errors.end}
                idPrefix={`${ID}-end`}
                label="Fin"
                onChange={(end) => change({ end })}
                value={draft.end}
              />
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
 * Adds an entity in a window (name, form, dates); its record then opens,
 * where its identifiers and seat are entered (10 November 2026).
 */
export const EntityDialog: FC<Props & { open: boolean }> = ({
  open,
  ...props
}) => (open ? <EntityDialogContent {...props} /> : null);
