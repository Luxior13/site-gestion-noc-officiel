'use client';

import { ArrowRightLeft, Check, RotateCcw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import React, { type FC, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ApproximateDateField } from '$components/forms/ApproximateDateField';
import { personDetailPath } from '$constants/routes.constants';
import { PersonAvatarFrame } from '$features/persons/components/PersonAvatar';
import { PersonPicker } from '$features/persons/components/PersonPicker';
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
import { Label } from '$ui/label';
import { Switch } from '$ui/switch';
import { ApiClientError } from '$utils/api.utils';
import {
  type ApproximateDate,
  getLocalToday,
} from '$utils/approximate-date.utils';

import {
  changePassageFunctionRequest,
  createPassageRequest,
  deletePassageRequest,
  searchPassagePersonsRequest,
  updatePassageRequest,
} from '../passage.api';
import { passageStateOn, placeWordsOf } from '../passage.ui';
import type {
  PassageFunction,
  PassageItem,
  PassagePerson,
  PassageRoster,
} from '../types/passage.types';
import { FunctionSelect } from './PassageFields';
import type { PassagePlaceView } from './PassageLines';

const ID = 'passage-dialog';

type FieldErrors = Partial<
  Record<'at' | 'end' | 'functionId' | 'personId' | 'start', string>
>;

type Props = {
  /** Who may open a record of the Répertoire, and create one. */
  canCreatePerson: boolean;
  canViewPersons: boolean;
  former?: boolean;
  /** Adds a former member (their tab): no « En cours », both dates. */
  functions: readonly PassageFunction[];
  /** Null to add a member, the passage to correct it. */
  item: PassageItem | null;
  onClose: () => void;
  onReload: () => Promise<unknown>;
  onSaved: (roster: PassageRoster) => void;
  /** A team, or the structure: its words and its list of functions. */
  place: Pick<PassagePlaceView, 'name' | 'scope'>;
};

const today = (): ApproximateDate => ({
  date: getLocalToday(),
  precision: 'DAY',
});

const fieldErrorsOf = (error: ApiClientError): FieldErrors => {
  const details = error.details ?? {};
  const first = (prefix: string): string | undefined =>
    Object.entries(details).find(
      ([key]) => key === prefix || key.startsWith(`${prefix}.`),
    )?.[1]?.[0];

  return {
    at: first('at'),
    end: first('end'),
    functionId: first('functionId'),
    personId: first('personId'),
    start: first('start'),
  };
};

const PassageDialogContent: FC<Props> = ({
  canCreatePerson,
  canViewPersons,
  former = false,
  functions,
  item,
  onClose,
  onReload,
  onSaved,
  place,
}) => {
  const words = placeWordsOf(place.scope.type);
  const [mode, setMode] = useState<'change' | 'edit'>('edit');
  const [person, setPerson] = useState<PassagePerson | null>(
    item?.person ?? null,
  );
  const [functionId, setFunctionId] = useState(item?.function.id ?? '');
  const [start, setStart] = useState<ApproximateDate>(item?.start ?? today());
  const [ongoing, setOngoing] = useState(item ? !item.end : !former);
  const [end, setEnd] = useState<ApproximateDate>(item?.end ?? today());
  const [nextFunctionId, setNextFunctionId] = useState('');
  const [at, setAt] = useState<ApproximateDate>(today());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const operationRef = useRef(false);
  const current = item
    ? functions.find((f) => f.id === item.function.id)
    : null;
  const isDirty =
    !item ||
    functionId !== item.function.id ||
    start.date !== item.start.date ||
    start.precision !== item.start.precision ||
    ongoing !== !item.end ||
    (!ongoing &&
      (end.date !== item.end?.date || end.precision !== item.end?.precision));

  const run = async (
    request: () => Promise<PassageRoster>,
    done: string,
  ): Promise<void> => {
    if (operationRef.current) return;
    operationRef.current = true;
    setBusy(true);
    setErrors({});
    setFormError(null);
    try {
      onSaved(await request());
      toast.success(done);
    } catch (error) {
      if (!(error instanceof ApiClientError)) {
        setFormError('La demande n’a pas abouti. Réessayez.');
      } else {
        const fields = fieldErrorsOf(error);
        if (Object.values(fields).some(Boolean)) setErrors(fields);
        else {
          setFormError(error.message);
          setStale([404, 409].includes(error.status));
        }
      }
    } finally {
      operationRef.current = false;
      setBusy(false);
    }
  };

  const save = (): void => {
    if (stale) return;
    const missing: FieldErrors = {
      functionId: functionId ? undefined : 'Choisissez une fonction',
      personId: person ? undefined : 'Choisissez une personne',
    };
    if (missing.functionId || missing.personId) {
      setErrors(missing);

      return;
    }
    if (item && !isDirty) return onClose();
    const input = { end: ongoing ? null : end, functionId, start };
    // Said where the passage goes: the two tabs never mix (9 November 2026).
    const gone = passageStateOn(input, getLocalToday()) === 'former';
    void run(
      () =>
        item
          ? updatePassageRequest(place.scope, item.id, {
              ...input,
              expectedVersion: item.version,
            })
          : createPassageRequest(place.scope, {
              ...input,
              personId: person?.id ?? '',
            }),
      item
        ? gone && passageStateOn(item, getLocalToday()) !== 'former'
          ? 'Passage terminé : il rejoint les anciens membres'
          : 'Passage modifié'
        : gone
          ? 'Ancien membre ajouté'
          : `Membre ajouté ${words.toList}`,
    );
  };

  const change = (): void => {
    if (!item || stale) return;
    if (!nextFunctionId) {
      setErrors({ functionId: 'Choisissez la nouvelle fonction' });

      return;
    }
    void run(
      () =>
        changePassageFunctionRequest(place.scope, item.id, {
          at,
          expectedVersion: item.version,
          functionId: nextFunctionId,
        }),
      'Fonction changée',
    );
  };

  const remove = (): void => {
    if (!item) return;
    void run(
      () => deletePassageRequest(place.scope, item.id, item.version),
      'Passage supprimé',
    ).finally(() => setConfirmDelete(false));
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
          Recharger {words.theList}
        </Button>
      )}
    </div>
  );

  const changing = mode === 'change' && item;

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
              if (changing) change();
              else save();
            }}
          >
            <DialogHeader className="bg-surface-panel-header border-border-divider border-b px-4 py-4 pr-14 text-left sm:px-5">
              <DialogTitle>
                {changing
                  ? 'Changer de fonction'
                  : item
                    ? 'Modifier le passage'
                    : former
                      ? 'Ajouter un ancien membre'
                      : 'Ajouter un membre'}
              </DialogTitle>
              <DialogDescription>
                {changing
                  ? `${item.person.displayName} quitte la fonction ${item.function.name} à cette date et commence la nouvelle.`
                  : former && !item
                    ? `Une personne passée par ${place.name}, avec sa fonction et ses dates.`
                    : `Une personne dans ${place.name}, avec une fonction, depuis une date.`}
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              {feedback}
              {changing ? (
                <>
                  <FunctionSelect
                    disabled={busy}
                    error={errors.functionId}
                    exclude={item.function.id}
                    functions={functions}
                    functionScope={words.functionScope}
                    id={`${ID}-next-function`}
                    label="Nouvelle fonction"
                    onChange={(value) => {
                      setNextFunctionId(value);
                      setErrors({});
                    }}
                    value={nextFunctionId}
                  />
                  <ApproximateDateField
                    disabled={busy}
                    error={errors.at}
                    idPrefix={`${ID}-at`}
                    label="À partir du"
                    onChange={setAt}
                    value={at}
                  />
                </>
              ) : (
                <>
                  {item ? (
                    <div className="space-y-1.5">
                      <Label>Personne</Label>
                      {/* The person as the picker shows a chosen one. */}
                      <div className="border-border-default bg-surface-inset flex items-center gap-2.5 rounded-lg border px-3 py-2">
                        <PersonAvatarFrame person={item.person} />
                        <span className="min-w-0 flex-1 font-semibold [overflow-wrap:anywhere]">
                          {item.person.displayName}
                        </span>
                        {canViewPersons && (
                          <Link
                            className="text-primary-emphasis shrink-0 text-sm underline-offset-4 hover:underline"
                            href={personDetailPath(item.person.id)}
                          >
                            Ouvrir la fiche
                          </Link>
                        )}
                      </div>
                    </div>
                  ) : (
                    <PersonPicker
                      canCreatePerson={canCreatePerson}
                      disabled={busy}
                      error={errors.personId}
                      idPrefix={ID}
                      onChange={(next) => {
                        setPerson(next);
                        setErrors((value) => ({
                          ...value,
                          personId: undefined,
                        }));
                      }}
                      onSearch={() =>
                        setErrors((value) =>
                          value.personId
                            ? { ...value, personId: undefined }
                            : value,
                        )
                      }
                      search={searchPassagePersonsRequest}
                      value={person}
                    />
                  )}
                  <FunctionSelect
                    disabled={busy}
                    error={errors.functionId}
                    functions={functions}
                    functionScope={words.functionScope}
                    id={`${ID}-function`}
                    label="Fonction"
                    onChange={(value) => {
                      setFunctionId(value);
                      setErrors((current) => ({
                        ...current,
                        functionId: undefined,
                      }));
                    }}
                    value={functionId}
                  />
                  {current && !current.isActive && (
                    <p className="text-muted-foreground -mt-2 text-xs">
                      Fonction inactive : elle reste celle de ce passage.
                    </p>
                  )}
                  {item && (
                    // Next to the field it concerns, never in the footer
                    // (owner, 9 November 2026: « ça crée un plus gros
                    // footer »): a correction here, a new function there.
                    <div className="-mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                      <p className="text-muted-foreground text-xs">
                        Ce champ corrige la fonction sur tout le passage.
                      </p>
                      <Button
                        disabled={busy || stale}
                        onClick={() => {
                          setMode('change');
                          setErrors({});
                          setFormError(null);
                        }}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <ArrowRightLeft className="size-4" />
                        Changer de fonction
                      </Button>
                    </div>
                  )}
                  <ApproximateDateField
                    disabled={busy}
                    error={errors.start}
                    idPrefix={`${ID}-start`}
                    label="Début"
                    onChange={setStart}
                    value={start}
                  />
                  <div className="border-border-default bg-surface-inset flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5">
                    <div>
                      <Label className="leading-5" htmlFor={`${ID}-ongoing`}>
                        En cours
                      </Label>
                      <p
                        className="text-muted-foreground text-xs"
                        id={`${ID}-ongoing-hint`}
                      >
                        Retirez-le pour saisir la date de fin du passage.
                      </p>
                    </div>
                    <Switch
                      aria-describedby={`${ID}-ongoing-hint`}
                      checked={ongoing}
                      disabled={busy}
                      id={`${ID}-ongoing`}
                      onCheckedChange={(value) => {
                        setOngoing(value);
                        setErrors((current) => ({
                          ...current,
                          end: undefined,
                        }));
                      }}
                    />
                  </div>
                  {!ongoing && (
                    <ApproximateDateField
                      disabled={busy}
                      error={errors.end}
                      idPrefix={`${ID}-end`}
                      label="Fin"
                      onChange={setEnd}
                      value={end}
                    />
                  )}
                </>
              )}
            </div>
            <DialogFooter className="border-border-divider bg-surface-inset border-t px-4 py-4 sm:justify-between sm:px-5">
              {item && !changing && (
                <Button
                  disabled={busy}
                  onClick={() => setConfirmDelete(true)}
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
                  onClick={() => {
                    if (changing) {
                      setMode('edit');
                      setErrors({});
                      setFormError(null);
                    } else onClose();
                  }}
                  type="button"
                  variant="outline"
                >
                  {changing ? 'Retour' : 'Annuler'}
                </Button>
                <Button
                  disabled={
                    busy || stale || Boolean(item && !changing && !isDirty)
                  }
                  loading={busy && !confirmDelete}
                  type="submit"
                >
                  {!busy && <Check className="size-4" />}
                  {busy && !confirmDelete
                    ? 'Enregistrement…'
                    : changing
                      ? 'Changer de fonction'
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
                Supprimer le passage de {item.person.displayName} ?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Seul un passage saisi par erreur se supprime. Pour un départ,
                retirez plutôt « En cours » et saisissez la date de fin. Le
                journal d’activité garde la trace de la suppression.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
              <Button
                disabled={busy}
                loading={busy}
                onClick={remove}
                type="button"
                variant="destructive"
              >
                Supprimer
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

/**
 * Adds a member to a team's roster or the structure's Effectif, or corrects a
 * passage, in a window: a passage has no record (owner, 9 November 2026).
 * « Changer de fonction » ends it and begins another in one step.
 */
export const PassageDialog: FC<Props & { open: boolean }> = ({
  open,
  ...props
}) =>
  open ? (
    <PassageDialogContent
      key={props.item ? `${props.item.id}:${props.item.version}` : 'new'}
      {...props}
    />
  ) : null;
