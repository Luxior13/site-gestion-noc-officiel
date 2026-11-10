'use client';

import { Check, RotateCcw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import React, { type FC, useRef, useState } from 'react';
import { toast } from 'sonner';

import { personDetailPath } from '$constants/routes.constants';
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
import { CountryFlag } from '$ui/country-flag';
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
import { PHONE_COUNTRY_OPTIONS } from '$utils/phone-country-options';

import {
  mutatePersonChild,
  searchPersonSuggestionsRequest,
} from '../person.api';
import {
  EMERGENCY_RELATION_SUGGESTIONS,
  LEGAL_GUARDIAN_RELATION_LABELS,
  LEGAL_GUARDIAN_RELATIONS,
  type LegalGuardianRelation,
} from '../person.constants';
import { getPersonDisplayName } from '../person.ui';
import type {
  PersonDetail,
  PersonEmergencyContactItem,
  PersonLegalGuardianItem,
  PersonRef,
} from '../types/person.types';
import { PersonAvatarFrame } from './PersonAvatar';
import { PersonPicker } from './PersonPicker';

/*
 * Windows of the emergency contacts and legal representatives (10 November
 * 2026), as the window of a passage: Supprimer on the left, Annuler and the
 * main action on the right, the removal confirmed apart.
 */

type Kind = 'contacts-urgence' | 'representants-legaux';
type Errors = Record<string, string | undefined>;

type DialogBase = {
  onClose: () => void;
  onReload: () => Promise<PersonDetail>;
  onSaved: (person: PersonDetail) => void;
  person: PersonDetail;
};

const FieldError: FC<{ id: string; message?: string }> = ({ id, message }) =>
  message ? (
    <p className="text-destructive text-xs" id={id} role="alert">
      {message}
    </p>
  ) : null;

/** One request at a time; a stale record offers to reload it. */
const useRelativeRequest = (
  base: DialogBase,
  kind: Kind,
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
        payload: { ...payload, personVersion: base.person.version },
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
const RelativeDialogFrame: FC<{
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

const ID = 'emergency-contact';

/** Who to call in an emergency: a name, the link, a number. */
export const EmergencyContactDialog: FC<
  DialogBase & { item: PersonEmergencyContactItem | null }
> = ({ item, ...base }) => {
  const [name, setName] = useState(item?.name ?? '');
  const [relation, setRelation] = useState(item?.relation ?? '');
  const [countryCode, setCountryCode] = useState(item?.countryCode ?? 'FR');
  const [phone, setPhone] = useState(item?.phone ?? '');
  const request = useRelativeRequest(base, 'contacts-urgence');
  const { busy, errors, setErrors } = request;
  const changed =
    !item ||
    name.trim() !== item.name ||
    (relation.trim() || null) !== item.relation ||
    countryCode !== item.countryCode ||
    phone.trim() !== item.phone;

  const save = (): void => {
    if (request.stale) return;
    const missing: Errors = {
      name: name.trim() ? undefined : 'Renseignez le nom',
      phone: phone.trim() ? undefined : 'Renseignez le numéro',
    };
    if (missing.name || missing.phone) return setErrors(missing);
    if (!changed) return base.onClose();
    const payload = { countryCode, name, phone, relation: relation || null };
    void (item
      ? request.run(
          'PATCH',
          { ...payload, version: item.version },
          'Contact d’urgence modifié',
          item.id,
        )
      : request.run('POST', payload, 'Contact d’urgence ajouté'));
  };

  const field = (key: string): { error?: string; ids?: string } => ({
    // `key` is one of this window's fields.
    // eslint-disable-next-line security/detect-object-injection
    error: errors[key],
    // eslint-disable-next-line security/detect-object-injection
    ids: errors[key] ? `${ID}-${key}-error` : undefined,
  });

  return (
    <RelativeDialogFrame
      busy={busy}
      canSave={!request.stale && changed}
      confirm={
        item
          ? {
              description:
                'La suppression est immédiate et sera enregistrée dans le journal d’activité.',
              label: 'Supprimer',
              title: `Supprimer le contact d’urgence ${item.name} ?`,
            }
          : null
      }
      description="La personne à appeler en cas d’urgence, par exemple pendant un événement."
      onClose={base.onClose}
      onRemove={() =>
        item &&
        void request.run(
          'DELETE',
          { version: item.version },
          'Contact d’urgence supprimé',
          item.id,
        )
      }
      onSubmit={save}
      submitLabel={item ? 'Enregistrer' : 'Ajouter'}
      title={
        item ? 'Modifier le contact d’urgence' : 'Ajouter un contact d’urgence'
      }
    >
      {request.feedback}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${ID}-name`} required>
            Nom
          </Label>
          <Input
            aria-describedby={field('name').ids}
            aria-invalid={Boolean(field('name').error)}
            autoFocus
            disabled={busy}
            id={`${ID}-name`}
            maxLength={100}
            onChange={(event) => setName(event.target.value)}
            placeholder="Prénom et nom"
            value={name}
          />
          <FieldError id={`${ID}-name-error`} message={field('name').error} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${ID}-relation`}>Lien</Label>
          <Input
            aria-describedby={field('relation').ids}
            aria-invalid={Boolean(field('relation').error)}
            disabled={busy}
            id={`${ID}-relation`}
            list={`${ID}-relations`}
            maxLength={40}
            onChange={(event) => setRelation(event.target.value)}
            placeholder="Parent, conjoint…"
            value={relation}
          />
          <datalist id={`${ID}-relations`}>
            {EMERGENCY_RELATION_SUGGESTIONS.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
          <FieldError
            id={`${ID}-relation-error`}
            message={field('relation').error}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${ID}-country`} required>
            Pays
          </Label>
          <Select
            disabled={busy}
            onValueChange={setCountryCode}
            value={countryCode}
          >
            <SelectTrigger className="w-full min-w-0" id={`${ID}-country`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PHONE_COUNTRY_OPTIONS.map(([code, label]) => (
                <SelectItem key={code} value={code}>
                  <CountryFlag code={code} />
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${ID}-phone`} required>
            Numéro
          </Label>
          <Input
            aria-describedby={field('phone').ids}
            aria-invalid={Boolean(field('phone').error)}
            disabled={busy}
            id={`${ID}-phone`}
            maxLength={40}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="06 12 34 56 78"
            type="tel"
            value={phone}
          />
          <FieldError id={`${ID}-phone-error`} message={field('phone').error} />
        </div>
      </div>
    </RelativeDialogFrame>
  );
};

const GUARDIAN_ID = 'legal-guardian';

/**
 * A legal representative: another record of the Répertoire, chosen once,
 * with how it stands to the person. Another representative is another link.
 */
export const LegalGuardianDialog: FC<
  DialogBase & {
    canCreatePerson: boolean;
    item: PersonLegalGuardianItem | null;
  }
> = ({ canCreatePerson, item, ...base }) => {
  const [guardian, setGuardian] = useState<PersonRef | null>(
    item?.guardian ?? null,
  );
  const [relation, setRelation] = useState<LegalGuardianRelation>(
    item?.relation ?? 'PARENT',
  );
  const request = useRelativeRequest(base, 'representants-legaux');
  const { busy, errors, setErrors } = request;
  const changed = !item || relation !== item.relation;
  const personName = getPersonDisplayName(base.person);

  const save = (): void => {
    if (request.stale) return;
    if (!guardian)
      return setErrors({ guardianId: 'Choisissez la fiche du représentant' });
    if (!changed) return base.onClose();
    void (item
      ? request.run(
          'PATCH',
          { relation, version: item.version },
          'Lien modifié',
          item.id,
        )
      : request.run(
          'POST',
          { guardianId: guardian.id, relation },
          'Représentant légal ajouté',
        ));
  };

  return (
    <RelativeDialogFrame
      busy={busy}
      canSave={!request.stale && changed}
      confirm={
        item
          ? {
              description:
                'Sa fiche reste dans le Répertoire. Le journal d’activité garde la trace du retrait.',
              label: 'Retirer',
              title: `Retirer ${item.guardian.displayName} des représentants légaux de ${personName} ?`,
            }
          : null
      }
      description={
        item
          ? `Le lien de ce représentant avec ${personName}.`
          : `Une fiche du Répertoire, avec ses propres coordonnées, qui représente ${personName}.`
      }
      onClose={base.onClose}
      onRemove={() =>
        item &&
        void request.run(
          'DELETE',
          { version: item.version },
          'Représentant légal retiré',
          item.id,
        )
      }
      onSubmit={save}
      submitLabel={item ? 'Enregistrer' : 'Ajouter'}
      title={
        item
          ? 'Modifier le représentant légal'
          : 'Ajouter un représentant légal'
      }
    >
      {request.feedback}
      {item ? (
        <div className="space-y-1.5">
          <Label>Représentant</Label>
          {/* The record as the picker shows a chosen one. */}
          <div className="border-border-default bg-surface-inset flex items-center gap-2.5 rounded-lg border px-3 py-2">
            <PersonAvatarFrame person={item.guardian} />
            <span className="min-w-0 flex-1 font-semibold [overflow-wrap:anywhere]">
              {item.guardian.displayName}
            </span>
            <Link
              className="text-primary-emphasis shrink-0 text-sm underline-offset-4 hover:underline"
              href={personDetailPath(item.guardian.id)}
            >
              Ouvrir la fiche
            </Link>
          </div>
        </div>
      ) : (
        <PersonPicker
          canCreatePerson={canCreatePerson}
          disabled={busy}
          error={errors.guardianId}
          exclude={[
            base.person.id,
            ...base.person.legalGuardians.map((link) => link.guardian.id),
          ]}
          idPrefix={GUARDIAN_ID}
          label="Représentant"
          onChange={(next) => {
            setGuardian(next);
            setErrors({});
          }}
          onSearch={() => setErrors({})}
          search={searchPersonSuggestionsRequest}
          value={guardian}
        />
      )}
      <div className="space-y-1.5">
        <Label htmlFor={`${GUARDIAN_ID}-relation`} required>
          Lien
        </Label>
        <Select
          disabled={busy}
          onValueChange={(next) => setRelation(next as LegalGuardianRelation)}
          value={relation}
        >
          <SelectTrigger
            aria-describedby={
              errors.relation ? `${GUARDIAN_ID}-relation-error` : undefined
            }
            aria-invalid={Boolean(errors.relation)}
            className="w-full min-w-0"
            id={`${GUARDIAN_ID}-relation`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LEGAL_GUARDIAN_RELATIONS.map((value) => (
              <SelectItem key={value} value={value}>
                {/* `value` comes from the closed relation list. */}
                {/* eslint-disable-next-line security/detect-object-injection */}
                {LEGAL_GUARDIAN_RELATION_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError
          id={`${GUARDIAN_ID}-relation-error`}
          message={errors.relation}
        />
      </div>
    </RelativeDialogFrame>
  );
};
