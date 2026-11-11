'use client';

import { Check, RefreshCw } from 'lucide-react';
import React, { type FC, useEffect, useState } from 'react';

import { Button } from '$ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '$ui/dialog';
import { Skeleton } from '$ui/skeleton';
import { ApiClientError } from '$utils/api.utils';
import { getLocalToday } from '$utils/approximate-date.utils';

import {
  createOperationRequest,
  fetchOperationChoices,
} from '../operation.api';
import type { OperationKind } from '../operation.constants';
import type { OperationChoices, OperationItem } from '../types/operation.types';
import {
  newOperationDraft,
  type OperationDraft,
  type OperationErrors,
  operationErrorsOf,
  OperationFields,
  operationInputOf,
} from './OperationFields';

const ID = 'operation-dialog';

type Props = {
  canLinkPersons: boolean;
  onClose: () => void;
  onCreated: (operation: OperationItem) => void;
  /** An account's movements open the window on that account. */
  preset?: Readonly<{ accountId?: string; kind?: OperationKind }>;
};

/**
 * Adds an operation in a window (owner, « ok go », 11 November 2026):
 * everything an operation holds fits in it, so the list stays in place for
 * the next one; the record opens from the list to correct it.
 */
export const OperationDialog: FC<Props> = ({
  canLinkPersons,
  onClose,
  onCreated,
  preset,
}) => {
  const [choices, setChoices] = useState<OperationChoices | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [draft, setDraft] = useState<OperationDraft | null>(null);
  const [errors, setErrors] = useState<OperationErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoadError(null);
    fetchOperationChoices(controller.signal)
      .then((loaded) => {
        setChoices(loaded);
        setDraft(
          (current) =>
            current ?? newOperationDraft(loaded, getLocalToday(), preset),
        );
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          caught instanceof Error ? caught.message : 'Chargement impossible',
        );
      });

    return (): void => controller.abort();
    // The preset is read once, when the window opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const change = (next: Partial<OperationDraft>): void => {
    setDraft((current) => (current ? { ...current, ...next } : current));
    setErrors((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([key]) =>
            !Object.keys(next).some(
              (changed) =>
                changed === key ||
                (changed === 'amount' && key === 'amountCents') ||
                (changed === 'person' && key === 'personId'),
            ),
        ),
      ),
    );
    setFormError(null);
  };

  const create = async (): Promise<void> => {
    if (busy || !draft) return;
    const result = operationInputOf(draft, canLinkPersons);
    if ('errors' in result) {
      setErrors(result.errors);

      return;
    }
    setBusy(true);
    setErrors({});
    setFormError(null);
    try {
      onCreated(await createOperationRequest(result.input));
    } catch (error) {
      if (error instanceof ApiClientError) {
        const next = operationErrorsOf(error.details);
        setErrors(next);
        setFormError(Object.values(next).some(Boolean) ? null : error.message);
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
        className="flex h-[100svh] max-h-[100svh] flex-col overflow-hidden p-0 sm:h-auto sm:max-h-[90svh] sm:max-w-2xl"
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
            <DialogTitle>Ajouter une opération</DialogTitle>
            <DialogDescription>
              De l’argent reçu, versé, ou passé d’un compte à l’autre.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
            {formError && (
              <p className="text-destructive text-sm" role="alert">
                {formError}
              </p>
            )}
            {loadError ? (
              <div className="space-y-2" role="alert">
                <p className="text-destructive text-sm">{loadError}</p>
                <Button
                  onClick={() => setAttempt((value) => value + 1)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <RefreshCw className="size-4" />
                  Réessayer
                </Button>
              </div>
            ) : choices && draft ? (
              <OperationFields
                canLinkPersons={canLinkPersons}
                choices={choices}
                disabled={busy}
                draft={draft}
                errors={errors}
                idPrefix={ID}
                kindEditable
                onChange={change}
                personHidden={false}
              />
            ) : (
              <div aria-label="Chargement" className="space-y-3" role="status">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
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
