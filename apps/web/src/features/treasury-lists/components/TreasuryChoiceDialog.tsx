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
import { Input } from '$ui/input';
import { Label } from '$ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '$ui/select';
import { Switch } from '$ui/switch';
import { ApiClientError } from '$utils/api.utils';

import {
  createTreasuryChoiceRequest,
  deleteTreasuryChoiceRequest,
  updateTreasuryChoiceRequest,
} from '../treasury-list.api';
import {
  TREASURY_CHOICE_NAME_MAX_LENGTH,
  type TreasuryChoiceKind,
  type TreasuryList,
} from '../treasury-list.constants';
import type { TreasuryChoiceItem } from '../types/treasury-list.types';

type Draft = { isActive: boolean; kind: TreasuryChoiceKind | ''; name: string };
type FieldErrors = Partial<Record<'kind' | 'name', string>>;

const ID = 'treasury-choice-dialog';

/** The titles and words of each list, feminine or masculine. */
const TEXTS: Readonly<
  Record<
    TreasuryList,
    Readonly<{
      active: string;
      add: string;
      added: string;
      deleted: string;
      description: string;
      edit: string;
      edited: string;
      example: string;
      inactiveHint: string;
      makeInactive: string;
      used: string;
    }>
  >
> = {
  categories: {
    active: 'Active',
    add: 'Ajouter une catégorie',
    added: 'Catégorie ajoutée',
    deleted: 'Catégorie supprimée',
    description:
      'Ce que représente une entrée ou une sortie d’argent, pour les totaux et le bilan.',
    edit: 'Modifier la catégorie',
    edited: 'Catégorie modifiée',
    example: 'Ex. Matériel',
    inactiveHint:
      'Inactive, elle n’est plus proposée en premier ; elle reste choisissable pour une opération ancienne.',
    makeInactive: 'rendez-la inactive plutôt que de la supprimer',
    used: 'Utilisée',
  },
  'payment-methods': {
    active: 'Actif',
    add: 'Ajouter un moyen de paiement',
    added: 'Moyen de paiement ajouté',
    deleted: 'Moyen de paiement supprimé',
    description:
      'Comment l’argent est passé, pour retrouver une opération sur un relevé.',
    edit: 'Modifier le moyen de paiement',
    edited: 'Moyen de paiement modifié',
    example: 'Ex. Virement',
    inactiveHint:
      'Inactif, il n’est plus proposé en premier ; il reste choisissable pour une opération ancienne.',
    makeInactive: 'rendez-le inactif plutôt que de le supprimer',
    used: 'Utilisé',
  },
};

type Props = {
  /** Null to add a value, the value to edit it. */
  item: TreasuryChoiceItem | null;
  list: TreasuryList;
  onClose: () => void;
  onDeleted: (id: string) => void;
  /** Reloads the list after a conflict; the window then closes. */
  onReload: () => Promise<unknown>;
  onSaved: (item: TreasuryChoiceItem) => void;
};

const operationsLabel = (count: number): string =>
  count > 1 ? `${count} opérations` : 'une opération';

/**
 * Adds or edits a value of a list of the treasury in a window: a value has no
 * record. A category says whether it classes money received or paid, fixed
 * once an operation uses it. Deleting is offered here for an unused value,
 * confirmed apart.
 */
export const TreasuryChoiceDialog: FC<Props> = ({
  item,
  list,
  onClose,
  onDeleted,
  onReload,
  onSaved,
}) => {
  // eslint-disable-next-line security/detect-object-injection
  const texts = TEXTS[list];
  const isCategory = list === 'categories';
  const [draft, setDraft] = useState<Draft>(() =>
    item
      ? { isActive: item.isActive, kind: item.kind, name: item.name }
      : {
          isActive: true,
          kind: isCategory ? '' : 'PAYMENT_METHOD',
          name: '',
        },
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const operationRef = useRef(false);
  const used = (item?.useCount ?? 0) > 0;
  const isDirty =
    !item ||
    draft.name.trim() !== item.name ||
    draft.kind !== item.kind ||
    draft.isActive !== item.isActive;

  const change = (next: Partial<Draft>): void => {
    setDraft((current) => ({ ...current, ...next }));
    setFormError(null);
  };

  const failure = (error: unknown): void => {
    if (!(error instanceof ApiClientError)) {
      setFormError('La demande n’a pas abouti. Réessayez.');

      return;
    }
    const name = error.details?.name?.[0];
    const kind = error.details?.kind?.[0];
    if (name || kind) {
      setErrors({ kind, name });

      return;
    }
    setFormError(error.message);
    setStale([404, 409].includes(error.status));
  };

  const save = async (): Promise<void> => {
    if (operationRef.current || stale) return;
    const nextErrors: FieldErrors = {
      kind: draft.kind ? undefined : 'Choisissez un type',
      name: draft.name.trim() ? undefined : 'Le nom est obligatoire',
    };
    if (nextErrors.kind || nextErrors.name || !draft.kind) {
      setErrors(nextErrors);

      return;
    }
    if (!isDirty) return onClose();
    operationRef.current = true;
    setBusy(true);
    setErrors({});
    setFormError(null);
    const input = {
      isActive: draft.isActive,
      kind: draft.kind,
      name: draft.name,
    };
    try {
      const saved = item
        ? await updateTreasuryChoiceRequest(list, item.id, {
            ...input,
            expectedVersion: item.version,
          })
        : await createTreasuryChoiceRequest(list, input);
      toast.success(item ? texts.edited : texts.added);
      onSaved(saved);
    } catch (error) {
      failure(error);
    } finally {
      operationRef.current = false;
      setBusy(false);
    }
  };

  const remove = async (): Promise<void> => {
    if (!item || operationRef.current) return;
    operationRef.current = true;
    setBusy(true);
    setDeleteError(null);
    try {
      await deleteTreasuryChoiceRequest(list, item.id, item.version);
      toast.success(texts.deleted);
      onDeleted(item.id);
    } catch (error) {
      setDeleteError(
        error instanceof ApiClientError
          ? error.message
          : 'La suppression n’a pas abouti. Réessayez.',
      );
      if (error instanceof ApiClientError && [404, 409].includes(error.status))
        setStale(true);
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
      await onReload();
      onClose();
    } catch {
      setFormError('Actualisation impossible. Réessayez.');
    } finally {
      operationRef.current = false;
      setBusy(false);
    }
  };

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
              void save();
            }}
          >
            <DialogHeader className="bg-surface-panel-header border-border-divider border-b px-4 py-4 pr-14 text-left sm:px-5">
              <DialogTitle>{item ? texts.edit : texts.add}</DialogTitle>
              <DialogDescription>{texts.description}</DialogDescription>
            </DialogHeader>
            <div className="min-h-0 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              {formError && (
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
                      Recharger la liste
                    </Button>
                  )}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor={`${ID}-name`} required>
                  Nom
                </Label>
                <Input
                  aria-describedby={
                    `${item ? `${ID}-name-hint` : ''}${errors.name ? ` ${ID}-name-error` : ''}`.trim() ||
                    undefined
                  }
                  aria-invalid={Boolean(errors.name)}
                  autoFocus
                  disabled={busy}
                  id={`${ID}-name`}
                  maxLength={TREASURY_CHOICE_NAME_MAX_LENGTH}
                  onChange={(event) => {
                    change({ name: event.target.value });
                    setErrors((current) => ({ ...current, name: undefined }));
                  }}
                  placeholder={texts.example}
                  value={draft.name}
                />
                {item && (
                  <p
                    className="text-muted-foreground text-xs"
                    id={`${ID}-name-hint`}
                  >
                    Renommer sert à corriger une faute : le nouveau nom
                    s’affiche aussi sur les opérations passées.
                  </p>
                )}
                {errors.name && (
                  <p
                    className="text-destructive text-xs"
                    id={`${ID}-name-error`}
                    role="alert"
                  >
                    {errors.name}
                  </p>
                )}
              </div>
              {isCategory && (
                <div className="space-y-1.5">
                  <Label htmlFor={`${ID}-kind`} required>
                    Type
                  </Label>
                  <Select
                    disabled={busy || used}
                    onValueChange={(kind) => {
                      change({ kind: kind as TreasuryChoiceKind });
                      setErrors((current) => ({ ...current, kind: undefined }));
                    }}
                    value={draft.kind}
                  >
                    <SelectTrigger
                      aria-describedby={`${ID}-kind-hint${errors.kind ? ` ${ID}-kind-error` : ''}`}
                      aria-invalid={Boolean(errors.kind)}
                      className="w-full"
                      id={`${ID}-kind`}
                    >
                      <SelectValue placeholder="Choisir un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCOME_CATEGORY">Entrée</SelectItem>
                      <SelectItem value="EXPENSE_CATEGORY">Sortie</SelectItem>
                    </SelectContent>
                  </Select>
                  <p
                    className="text-muted-foreground text-xs"
                    id={`${ID}-kind-hint`}
                  >
                    {used
                      ? 'Elle a déjà servi : elle garde son type.'
                      : 'Entrée : de l’argent reçu. Sortie : de l’argent versé.'}
                  </p>
                  {errors.kind && (
                    <p
                      className="text-destructive text-xs"
                      id={`${ID}-kind-error`}
                      role="alert"
                    >
                      {errors.kind}
                    </p>
                  )}
                </div>
              )}
              <div className="border-border-default bg-surface-inset flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5">
                <div>
                  <Label className="leading-5" htmlFor={`${ID}-active`}>
                    {texts.active}
                  </Label>
                  <p
                    className="text-muted-foreground text-xs"
                    id={`${ID}-active-hint`}
                  >
                    {texts.inactiveHint}
                  </p>
                </div>
                <Switch
                  aria-describedby={`${ID}-active-hint`}
                  checked={draft.isActive}
                  disabled={busy}
                  id={`${ID}-active`}
                  onCheckedChange={(isActive) => change({ isActive })}
                />
              </div>
              {item && used && (
                // Said instead of a deletion the server and the base refuse.
                <p className="text-muted-foreground text-xs">
                  {texts.used} par {operationsLabel(item.useCount)} :{' '}
                  {texts.makeInactive}.
                </p>
              )}
            </div>
            <DialogFooter className="border-border-divider bg-surface-inset border-t px-4 py-4 sm:justify-between sm:px-5">
              {item && !used && (
                <Button
                  disabled={busy}
                  onClick={() => {
                    setDeleteError(null);
                    setConfirmDelete(true);
                  }}
                  type="button"
                  variant="destructive"
                >
                  <Trash2 className="size-4" />
                  Supprimer
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
                  disabled={busy || stale || (item !== null && !isDirty)}
                  loading={busy && !confirmDelete}
                  type="submit"
                >
                  {!busy && <Check className="size-4" />}
                  {busy && !confirmDelete
                    ? 'Enregistrement…'
                    : item
                      ? 'Enregistrer'
                      : 'Ajouter'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {item && (
        <AlertDialog
          open={confirmDelete}
          onOpenChange={(open) => {
            if (!open && !operationRef.current) setConfirmDelete(false);
          }}
        >
          <AlertDialogContent
            aria-busy={busy || undefined}
            className="sm:max-w-md"
          >
            <AlertDialogHeader>
              <AlertDialogTitle className="break-words">
                Supprimer {item.name} ?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Seule une valeur créée par erreur, jamais utilisée, se supprime.
                Le journal d’activité garde la trace de la suppression.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {deleteError && (
              <p className="text-destructive text-sm" role="alert">
                {deleteError}
              </p>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
              {stale ? (
                <Button
                  disabled={busy}
                  onClick={() => void reload()}
                  type="button"
                  variant="outline"
                >
                  <RotateCcw className="size-4" />
                  Recharger la liste
                </Button>
              ) : (
                <Button
                  disabled={busy}
                  loading={busy}
                  onClick={() => void remove()}
                  type="button"
                  variant="destructive"
                >
                  Supprimer
                </Button>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
