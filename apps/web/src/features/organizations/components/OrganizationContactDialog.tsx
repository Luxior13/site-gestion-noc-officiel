'use client';

import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { RotateCcw } from 'lucide-react';
import React, { type FC, useRef, useState } from 'react';
import { toast } from 'sonner';

import { PhoneCountrySelect } from '$components/forms/PhoneCountrySelect';
import { PersonPicker } from '$features/persons/components/PersonPicker';
import {
  FieldError,
  RelativeDialogFrame,
} from '$features/persons/components/PersonRecordDialog';
import type { PersonRef } from '$features/persons/types/person.types';
import { Button } from '$ui/button';
import { Input } from '$ui/input';
import { Label } from '$ui/label';
import { ApiClientError } from '$utils/api.utils';

import {
  mutateOrganizationContact,
  searchContactPersonsRequest,
} from '../organization.api';
import {
  CONTACT_NAME_MAX_LENGTH,
  CONTACT_ROLE_MAX_LENGTH,
} from '../organization.constants';
import type {
  OrganizationContactItem,
  OrganizationDetail,
} from '../types/organization.types';

const ID = 'organization-contact';

type Errors = Partial<
  Record<'email' | 'name' | 'personId' | 'phone' | 'role', string>
>;

type Props = {
  /** Who may link a record of the Répertoire, and so read it. */
  canLinkPersons: boolean;
  item: OrganizationContactItem | null;
  onClose: () => void;
  onReload: () => Promise<OrganizationDetail>;
  onSaved: (organization: OrganizationDetail) => void;
  organization: OrganizationDetail;
};

/** « +33612345678 » back to its country and « 06 12 34 56 78 ». */
const phoneDraft = (
  phone: string | null,
): { country: string; number: string } => {
  const parsed = phone ? parsePhoneNumberFromString(phone) : undefined;

  return {
    country: parsed?.country ?? 'FR',
    number: parsed?.formatNational() ?? phone ?? '',
  };
};

/**
 * A person to reach at an organisation (11 November 2026): a name, or the
 * record of the Répertoire when the person already has one, then a role, an
 * email and a number. Supprimer on the left, confirmed apart, as the windows
 * of a record's contacts.
 */
export const OrganizationContactDialog: FC<Props> = ({
  canLinkPersons,
  item,
  onClose,
  onReload,
  onSaved,
  organization,
}) => {
  const initialPhone = phoneDraft(item?.phone ?? null);
  const [name, setName] = useState(item?.name ?? '');
  const [person, setPerson] = useState<PersonRef | null>(item?.person ?? null);
  const [role, setRole] = useState(item?.role ?? '');
  const [email, setEmail] = useState(item?.email ?? '');
  const [phoneCountry, setPhoneCountry] = useState(initialPhone.country);
  const [phone, setPhone] = useState(initialPhone.number);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState(false);
  const operationRef = useRef(false);
  // A record linked by someone who cannot read the Répertoire: its name
  // shows, read only, and the link stays.
  const hiddenLink = Boolean(item?.personLinked) && !canLinkPersons;
  const named = Boolean(person) || hiddenLink;
  const changed =
    !item ||
    (!named && name.trim() !== item.name) ||
    (canLinkPersons && (person?.id ?? null) !== (item.person?.id ?? null)) ||
    (role.trim() || null) !== item.role ||
    (email.trim().toLowerCase() || null) !== item.email ||
    phone.trim() !== initialPhone.number ||
    (phone.trim() !== '' && phoneCountry !== initialPhone.country);
  const linkedElsewhere = organization.contacts
    .filter((contact) => contact.id !== item?.id && contact.person)
    .map((contact) => contact.person?.id ?? '');

  const run = async (
    method: 'DELETE' | 'PATCH' | 'POST',
    payload: Record<string, unknown>,
    done: string,
  ): Promise<void> => {
    if (operationRef.current) return;
    operationRef.current = true;
    setBusy(true);
    setErrors({});
    setFormError(null);
    try {
      const saved = await mutateOrganizationContact({
        contactId: item?.id,
        id: organization.id,
        method,
        payload: payload as { expectedVersion: number },
      });
      onSaved(saved);
      toast.success(done);
      onClose();
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
        setStale([404, 409].includes(error.status));
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
      await onReload();
      onClose();
    } catch {
      setFormError('Actualisation impossible. Réessayez.');
    } finally {
      operationRef.current = false;
      setBusy(false);
    }
  };

  const save = (): void => {
    if (stale) return;
    if (!named && !name.trim()) {
      setErrors({
        name: canLinkPersons
          ? 'Indiquez le nom, ou choisissez une fiche du Répertoire'
          : 'Le nom est obligatoire',
      });

      return;
    }
    if (!changed) return onClose();
    const payload = {
      email: email.trim() || null,
      name: named ? null : name,
      // Left out, the link stays: who cannot read the Répertoire keeps it.
      ...(canLinkPersons ? { personId: person?.id ?? null } : {}),
      phone: phone.trim() || null,
      phoneCountry,
      role: role.trim() || null,
    };
    void (item
      ? run(
          'PATCH',
          { ...payload, expectedVersion: item.version },
          'Contact modifié',
        )
      : run('POST', payload, 'Contact ajouté'));
  };

  const described = (key: keyof Errors, hint?: string): string | undefined =>
    // `key` is one of this window's fields.
    // eslint-disable-next-line security/detect-object-injection
    [hint, errors[key] && `${ID}-${key}-error`].filter(Boolean).join(' ') ||
    undefined;

  return (
    <RelativeDialogFrame
      busy={busy}
      canSave={!stale && changed}
      confirm={
        item
          ? {
              description:
                'Le contact disparaît de l’organisation ; le journal d’activité garde la trace de la suppression.',
              label: 'Supprimer',
              title: `Supprimer le contact ${item.name} ?`,
            }
          : null
      }
      description="Une personne à joindre dans cette organisation."
      onClose={onClose}
      onRemove={() =>
        item &&
        void run(
          'DELETE',
          { expectedVersion: item.version },
          'Contact supprimé',
        )
      }
      onSubmit={save}
      submitLabel={item ? 'Enregistrer' : 'Ajouter'}
      title={item ? 'Modifier le contact' : 'Ajouter un contact'}
    >
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
              Actualiser l’organisation
            </Button>
          )}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor={`${ID}-name`} required={!canLinkPersons && !named}>
          Nom
        </Label>
        <Input
          aria-describedby={described(
            'name',
            named || canLinkPersons ? `${ID}-name-hint` : undefined,
          )}
          aria-invalid={Boolean(errors.name)}
          autoFocus={!named}
          disabled={busy || named}
          id={`${ID}-name`}
          maxLength={CONTACT_NAME_MAX_LENGTH}
          onChange={(event) => setName(event.target.value)}
          placeholder="Prénom et nom"
          value={person ? person.displayName : name}
        />
        {(named || canLinkPersons) && (
          <p className="text-muted-foreground text-xs" id={`${ID}-name-hint`}>
            {named
              ? 'Le nom de sa fiche du Répertoire.'
              : 'Un nom, ou une fiche du Répertoire ci-dessous si la personne en a déjà une.'}
          </p>
        )}
        <FieldError id={`${ID}-name-error`} message={errors.name} />
      </div>
      {canLinkPersons && (
        <PersonPicker
          autoFocus={false}
          canCreatePerson={false}
          disabled={busy}
          error={errors.personId}
          exclude={linkedElsewhere}
          hint="Facultatif : seulement pour une personne qui a déjà une fiche, un membre qui travaille chez un sponsor par exemple."
          idPrefix={`${ID}-record`}
          label="Fiche du Répertoire"
          onChange={(next) => {
            setPerson(next);
            setErrors((current) => ({
              ...current,
              name: undefined,
              personId: undefined,
            }));
          }}
          onSearch={() =>
            setErrors((current) => ({ ...current, personId: undefined }))
          }
          required={false}
          search={searchContactPersonsRequest}
          value={person}
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${ID}-role`}>Fonction</Label>
          <Input
            aria-describedby={described('role')}
            aria-invalid={Boolean(errors.role)}
            disabled={busy}
            id={`${ID}-role`}
            maxLength={CONTACT_ROLE_MAX_LENGTH}
            onChange={(event) => setRole(event.target.value)}
            placeholder="Responsable partenariats…"
            value={role}
          />
          <FieldError id={`${ID}-role-error`} message={errors.role} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${ID}-email`}>Email</Label>
          <Input
            aria-describedby={described('email')}
            aria-invalid={Boolean(errors.email)}
            disabled={busy}
            id={`${ID}-email`}
            inputMode="email"
            maxLength={254}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="prenom@exemple.fr"
            spellCheck={false}
            type="email"
            value={email}
          />
          <FieldError id={`${ID}-email-error`} message={errors.email} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${ID}-country`} id={`${ID}-country-label`}>
            Pays du numéro
          </Label>
          <PhoneCountrySelect
            disabled={busy}
            id={`${ID}-country`}
            labelId={`${ID}-country-label`}
            onChange={setPhoneCountry}
            value={phoneCountry}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${ID}-phone`}>Téléphone</Label>
          <Input
            aria-describedby={described('phone')}
            aria-invalid={Boolean(errors.phone)}
            disabled={busy}
            id={`${ID}-phone`}
            maxLength={40}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="06 12 34 56 78"
            type="tel"
            value={phone}
          />
          <FieldError id={`${ID}-phone-error`} message={errors.phone} />
        </div>
      </div>
    </RelativeDialogFrame>
  );
};
