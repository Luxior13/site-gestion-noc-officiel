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
  createFunctionRequest,
  deleteFunctionRequest,
  updateFunctionRequest,
} from '../member-function.api';
import {
  functionKindsOf,
  type FunctionScope,
  type FunctionScopeType,
  MEMBER_FUNCTION_NAME_MAX_LENGTH,
  type MemberFunctionKind,
  memberFunctionKindLabel,
} from '../member-function.constants';
import type { MemberFunctionItem } from '../types/member-function.types';

type Draft = { isActive: boolean; kind: MemberFunctionKind | ''; name: string };
type FieldErrors = Partial<Record<'kind' | 'name', string>>;

const ID = 'member-function-dialog';

/** What each kind holds, under the choice, and an example of a name. */
const KIND_HINTS: ReadonlyMap<
  FunctionScopeType,
  Readonly<{ example: string; hint: string }>
> = new Map([
  [
    'game',
    {
      example: 'Ex. Coach',
      hint: 'Joueur : sur la feuille de match. Encadrement : coach, manager, analyste…',
    },
  ],
  [
    'structure',
    {
      example: 'Ex. Graphiste',
      hint: 'Bureau : les mandats élus (président, trésorier, secrétaire…). Staff : graphiste, monteur, community manager, bénévole…',
    },
  ],
]);

type Props = {
  /** Null to add a function, the function to edit it. */
  item: MemberFunctionItem | null;
  onClose: () => void;
  onDeleted: (id: string) => void;
  /** Reloads the list after a conflict; the window then closes. */
  onReload: () => Promise<unknown>;
  onSaved: (item: MemberFunctionItem) => void;
  scope: FunctionScope;
  /** Whose functions: « d’une équipe de Valorant », « de la structure… ». */
  subject: string;
};

const MemberFunctionDialogContent: FC<Props> = ({
  item,
  onClose,
  onDeleted,
  onReload,
  onSaved,
  scope,
  subject,
}) => {
  const texts = KIND_HINTS.get(scope.type);
  const [draft, setDraft] = useState<Draft>(() =>
    item
      ? { isActive: item.isActive, kind: item.kind, name: item.name }
      : { isActive: true, kind: '', name: '' },
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  // A version conflict or a function gone: only reloading helps.
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const operationRef = useRef(false);
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
        ? await updateFunctionRequest(scope, item.id, {
            ...input,
            expectedVersion: item.version,
          })
        : await createFunctionRequest(scope, input);
      toast.success(item ? 'Fonction modifiée' : 'Fonction ajoutée');
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
      await deleteFunctionRequest(scope, item.id, item.version);
      toast.success('Fonction supprimée');
      onDeleted(item.id);
    } catch (error) {
      setDeleteError(
        error instanceof ApiClientError
          ? error.message
          : 'La suppression n’a pas abouti. Réessayez.',
      );
      // Changed, already used or gone: the list must be read again.
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
              <DialogTitle>
                {item ? 'Modifier la fonction' : 'Ajouter une fonction'}
              </DialogTitle>
              <DialogDescription>
                Ce que fait un membre {subject}.
              </DialogDescription>
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
                  maxLength={MEMBER_FUNCTION_NAME_MAX_LENGTH}
                  onChange={(event) => {
                    change({ name: event.target.value });
                    setErrors((current) => ({ ...current, name: undefined }));
                  }}
                  placeholder={texts?.example}
                  value={draft.name}
                />
                {item && (
                  <p
                    className="text-muted-foreground text-xs"
                    id={`${ID}-name-hint`}
                  >
                    Renommer sert à corriger une faute. Une fonction qui change
                    de nature s’ajoute à part ; l’ancienne devient inactive et
                    reste sur les passages qui l’ont eue.
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
              <div className="space-y-1.5">
                <Label htmlFor={`${ID}-kind`} required>
                  Type
                </Label>
                <Select
                  disabled={busy}
                  onValueChange={(kind) => {
                    change({ kind: kind as MemberFunctionKind });
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
                    {functionKindsOf(scope.type).map((kind) => (
                      <SelectItem key={kind} value={kind}>
                        {memberFunctionKindLabel(kind, scope.type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p
                  className="text-muted-foreground text-xs"
                  id={`${ID}-kind-hint`}
                >
                  {texts?.hint}
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
              <div className="border-border-default bg-surface-inset flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5">
                <div>
                  <Label className="leading-5" htmlFor={`${ID}-active`}>
                    Active
                  </Label>
                  <p
                    className="text-muted-foreground text-xs"
                    id={`${ID}-active-hint`}
                  >
                    Une fonction inactive n’est plus proposée en premier ; elle
                    reste choisissable pour un passage ancien.
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
              {item && item.passageCount > 0 && (
                // Said instead of a deletion the server and the base refuse.
                <p className="text-muted-foreground text-xs">
                  Utilisée dans{' '}
                  {item.passageCount > 1
                    ? `${item.passageCount} passages`
                    : 'un passage'}{' '}
                  : rendez-la inactive plutôt que de la supprimer.
                </p>
              )}
            </div>
            <DialogFooter className="border-border-divider bg-surface-inset border-t px-4 py-4 sm:justify-between sm:px-5">
              {item && item.passageCount === 0 && (
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
                Supprimer la fonction {item.name} ?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Seule une fonction créée par erreur, jamais utilisée, se
                supprime. Le journal d’activité garde la trace de la
                suppression.
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

/**
 * Adds or edits a function of a game or of the structure in a window: a
 * function has no record (owner, 9 November 2026). Deleting it is offered
 * here, confirmed apart.
 */
export const MemberFunctionDialog: FC<Props & { open: boolean }> = ({
  open,
  ...props
}) =>
  open ? (
    <MemberFunctionDialogContent
      key={props.item ? `${props.item.id}:${props.item.version}` : 'new'}
      {...props}
    />
  ) : null;
