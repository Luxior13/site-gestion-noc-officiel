'use client';

import { Check, RotateCcw, Trash2 } from 'lucide-react';
import React, { type FC, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '$ui/alert-dialog';
import { Button } from '$ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '$ui/dialog';
import { ApiClientError } from '$utils/api.utils';

import { mutatePersonChild } from '../person.api';
import type { PersonDetail } from '../types/person.types';

/*
 * The window of an entry of a record (10 November 2026): emergency contact,
 * legal representative, other pseudo. As the window of a passage: Supprimer
 * on the left, Annuler and the main action on the right, the removal
 * confirmed apart.
 */

type Kind = 'autres-pseudos' | 'contacts-urgence' | 'representants-legaux';
export type Errors = Record<string, string | undefined>;

export type DialogBase = {
  onClose: () => void;
  onReload: () => Promise<PersonDetail>;
  onSaved: (person: PersonDetail) => void;
  person: PersonDetail;
};

export const FieldError: FC<{ id: string; message?: string }> = ({
  id,
  message,
}) =>
  message ? (
    <p className="text-destructive text-xs" id={id} role="alert">
      {message}
    </p>
  ) : null;

/**
 * One request at a time; a stale record offers to reload it. The record's
 * version goes with each request, except for a list with versions of its
 * own (the other pseudos).
 */
export const useRelativeRequest = (
  base: DialogBase,
  kind: Kind,
  { withPersonVersion = true }: { withPersonVersion?: boolean } = {},
): {
  busy: boolean;
  errors: Errors;
  feedback: React.ReactNode;
  run: (
    method: 'DELETE' | 'PATCH' | 'POST',
    payload: Record<string, unknown>,
    done: string,
    childId?: string,
  ) => Promise<void>;
  setErrors: React.Dispatch<React.SetStateAction<Errors>>;
  stale: boolean;
} => {
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const operationRef = useRef(false);

  const run = async (
    method: 'DELETE' | 'PATCH' | 'POST',
    payload: Record<string, unknown>,
    done: string,
    childId?: string,
  ): Promise<void> => {
    if (operationRef.current) return;
    operationRef.current = true;
    setBusy(true);
    setErrors({});
    setFormError(null);
    try {
      const result = await mutatePersonChild({
        childId,
        kind,
        method,
        payload: withPersonVersion
          ? { ...payload, personVersion: base.person.version }
          : payload,
        personId: base.person.id,
      });
      base.onSaved(result.person);
      toast.success(done);
      base.onClose();
    } catch (error) {
      if (!(error instanceof ApiClientError)) {
        setFormError('La demande n’a pas abouti. Réessayez.');
      } else if (error.details && Object.keys(error.details).length > 0) {
        setErrors(
          Object.fromEntries(
            Object.entries(error.details).map(([key, messages]) => [
              key.split('.')[0] ?? key,
              messages[0],
            ]),
          ),
        );
      } else {
        setFormError(error.message);
        setStale(
          [404, 409].includes(error.status) && error.code !== 'CONFLICT',
        );
      }
    } finally {
      operationRef.current = false;
      setBusy(false);
    }
  };

  const reload = async (): Promise<void> => {
    if (operationRef.current) return;
    operationRef.current = true;
    setBusy(true);
    try {
      await base.onReload();
      base.onClose();
    } catch {
      setFormError('Actualisation impossible. Réessayez.');
    } finally {
      operationRef.current = false;
      setBusy(false);
    }
  };

  const feedback = formError && (
    <div className="space-y-2" role="alert">
      <p className="text-destructive text-sm">{formError}</p>
      {stale && (
        <Button
          disabled={busy}
          onClick={() => void reload()}
          size="sm"
          type="button"
          variant="outline"
        >
          <RotateCcw className="size-4" />
          Actualiser la fiche
        </Button>
      )}
    </div>
  );

  return { busy, errors, feedback, run, setErrors, stale };
};

/** The frame shared by both windows: header, body, footer, confirmation. */
export const RelativeDialogFrame: FC<{
  busy: boolean;
  canSave: boolean;
  children: React.ReactNode;
  confirm: { description: string; label: string; title: string } | null;
  description: string;
  onClose: () => void;
  onRemove: () => void;
  onSubmit: () => void;
  submitLabel: string;
  title: string;
}> = ({
  busy,
  canSave,
  children,
  confirm,
  description,
  onClose,
  onRemove,
  onSubmit,
  submitLabel,
  title,
}) => {
  const [confirming, setConfirming] = useState(false);

  return (
    <>
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
              // A portal keeps React's event path: a window opened inside a
              // form must never send that form too.
              event.stopPropagation();
              onSubmit();
            }}
          >
            <DialogHeader className="bg-surface-panel-header border-border-divider border-b px-4 py-4 pr-14 text-left sm:px-5">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <div className="min-h-0 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              {children}
            </div>
            <DialogFooter className="border-border-divider bg-surface-inset border-t px-4 py-4 sm:justify-between sm:px-5">
              {confirm && (
                <Button
                  disabled={busy}
                  onClick={() => setConfirming(true)}
                  type="button"
                  variant="destructive"
                >
                  <Trash2 className="size-4" />
                  {confirm.label}
                </Button>
              )}
              <div className="flex flex-col-reverse gap-2 sm:ml-auto sm:flex-row">
                <Button
                  disabled={busy}
                  onClick={onClose}
                  type="button"
                  variant="outline"
                >
                  Annuler
                </Button>
                <Button
                  disabled={busy || !canSave}
                  loading={busy && !confirming}
                  type="submit"
                >
                  {!busy && <Check className="size-4" />}
                  {busy && !confirming ? 'Enregistrement…' : submitLabel}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {confirm && (
        <AlertDialog
          open={confirming}
          onOpenChange={(open) => {
            if (!open && !busy) setConfirming(false);
          }}
        >
          <AlertDialogContent
            aria-busy={busy || undefined}
            className="sm:max-w-md"
          >
            <AlertDialogHeader>
              <AlertDialogTitle className="break-words">
                {confirm.title}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirm.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
              <Button
                disabled={busy}
                loading={busy}
                onClick={onRemove}
                type="button"
                variant="destructive"
              >
                {confirm.label}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
