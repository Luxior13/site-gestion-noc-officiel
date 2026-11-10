'use client';

import { LifeBuoy, Plus, ShieldCheck, UserRound } from 'lucide-react';
import Link from 'next/link';
import React, { type FC, useState } from 'react';

import { personDetailPath } from '$constants/routes.constants';
import { useUser } from '$context/UserContext';
import { Button } from '$ui/button';

import {
  LEGAL_GUARDIAN_RELATION_LABELS,
  PERSON_LIMITS,
} from '../person.constants';
import { getPersonCapabilities } from '../person.permissions';
import type {
  PersonDetail,
  PersonEmergencyContactItem,
  PersonLegalGuardianItem,
} from '../types/person.types';
import { PersonAvatarFrame } from './PersonAvatar';
import {
  CollectionCard,
  CopyAction,
  EditAction,
  EmptyCollection,
  formatPhoneForDisplay,
  phoneHref,
  RowTypeIcon,
} from './PersonCollectionParts';
import {
  EmergencyContactDialog,
  LegalGuardianDialog,
} from './PersonRelativeDialogs';

type Props = {
  canUpdate: boolean;
  onChange: (person: PersonDetail) => void;
  onReload: () => Promise<PersonDetail>;
  person: PersonDetail;
};

type Editor =
  | { item: PersonEmergencyContactItem | null; kind: 'emergency' }
  | { item: PersonLegalGuardianItem | null; kind: 'guardian' }
  | null;

const AddButton: FC<{
  disabled: boolean;
  label: string;
  onClick: () => void;
}> = ({ disabled, label, onClick }) => (
  <Button
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    size="sm"
    type="button"
    variant="outline"
  >
    <Plus className="size-4" />
    Ajouter
  </Button>
);

/** A link to a record: its avatar, then its name in bold (9 November 2026). */
const PersonLine: FC<{
  details: readonly (string | null)[];
  person:
    | PersonLegalGuardianItem['guardian']
    | PersonDetail['represents'][number]['person'];
}> = ({ details, person }) => (
  <>
    <PersonAvatarFrame person={person} />
    <div className="min-w-0 flex-1">
      <Link
        className="hover:text-primary-emphasis -my-[13px] block max-w-full py-[13px] text-sm font-semibold [overflow-wrap:anywhere] hover:underline sm:my-0 sm:py-0"
        href={personDetailPath(person.id)}
      >
        {person.displayName}
      </Link>
      <p className="text-muted-foreground mt-0.5 text-xs break-words">
        {details.filter(Boolean).join(' · ')}
      </p>
    </div>
  </>
);

/**
 * The people around a person, in the Coordonnées tab (10 November 2026):
 * who to call in an emergency, and the legal representatives, each a record
 * of the Répertoire with its own coordinates. A representative's record
 * shows, read only, whom it represents.
 */
export const PersonRelativesCards: FC<Props> = ({
  canUpdate,
  onChange,
  onReload,
  person,
}) => {
  const { userData } = useUser();
  const [editor, setEditor] = useState<Editor>(null);
  // A minor, or an unknown age: the representatives are asked for; not on
  // the record of someone who represents others, unless one is already linked.
  const showGuardians =
    person.legalGuardians.length > 0 ||
    person.isAdult === false ||
    (person.isAdult === null && person.represents.length === 0);
  const close = (): void => setEditor(null);
  const dialog = { onClose: close, onReload, onSaved: onChange, person };

  return (
    <>
      <CollectionCard
        addAction={
          canUpdate ? (
            <AddButton
              disabled={
                person.emergencyContacts.length >=
                PERSON_LIMITS.emergencyContacts
              }
              label="Ajouter un contact d’urgence"
              onClick={() => setEditor({ item: null, kind: 'emergency' })}
            />
          ) : undefined
        }
        count={person.emergencyContacts.length}
        icon={<LifeBuoy />}
        title="Contacts d’urgence"
      >
        {person.emergencyContacts.length === 0 ? (
          <EmptyCollection>Aucun contact d’urgence renseigné.</EmptyCollection>
        ) : (
          <ul>
            {person.emergencyContacts.map((item) => (
              <li
                className="border-border-divider flex min-w-0 items-center gap-2 border-b py-2.5 last:border-0"
                key={item.id}
              >
                <RowTypeIcon>
                  <LifeBuoy />
                </RowTypeIcon>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-medium [overflow-wrap:anywhere]">
                      {item.name}
                    </span>
                    <a
                      className="hover:text-primary-emphasis -my-[13px] py-[13px] text-sm tabular-nums hover:underline sm:my-0 sm:py-0"
                      href={phoneHref(item.phone, item.countryCode)}
                    >
                      {formatPhoneForDisplay(item.phone, item.countryCode)}
                    </a>
                  </div>
                  {item.relation && (
                    <p className="text-muted-foreground mt-0.5 text-xs break-words">
                      {item.relation}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {canUpdate && (
                    <EditAction
                      label={`le contact d’urgence ${item.name}`}
                      onEdit={() => setEditor({ item, kind: 'emergency' })}
                    />
                  )}
                  <CopyAction label="Numéro" value={item.phone} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CollectionCard>

      {showGuardians && (
        <CollectionCard
          addAction={
            canUpdate ? (
              <AddButton
                disabled={
                  person.legalGuardians.length >= PERSON_LIMITS.legalGuardians
                }
                label="Ajouter un représentant légal"
                onClick={() => setEditor({ item: null, kind: 'guardian' })}
              />
            ) : undefined
          }
          count={person.legalGuardians.length}
          icon={<ShieldCheck />}
          title="Représentants légaux"
        >
          {person.legalGuardians.length === 0 ? (
            <EmptyCollection>
              {person.isAdult === false
                ? 'Aucun représentant légal renseigné pour cette personne mineure.'
                : 'Aucun représentant légal renseigné. Ils concernent une personne mineure.'}
            </EmptyCollection>
          ) : (
            <ul>
              {person.legalGuardians.map((item) => (
                <li
                  className="border-border-divider flex min-w-0 items-center gap-2.5 border-b py-2.5 last:border-0"
                  key={item.id}
                >
                  <PersonLine
                    details={[
                      LEGAL_GUARDIAN_RELATION_LABELS[item.relation],
                      item.guardian.primaryPhone &&
                        formatPhoneForDisplay(item.guardian.primaryPhone),
                      item.guardian.primaryEmail,
                    ]}
                    person={item.guardian}
                  />
                  {canUpdate && (
                    <div className="flex shrink-0 items-center gap-1">
                      <EditAction
                        label={`le représentant ${item.guardian.displayName}`}
                        onEdit={() => setEditor({ item, kind: 'guardian' })}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CollectionCard>
      )}

      {person.represents.length > 0 && (
        <CollectionCard
          count={person.represents.length}
          icon={<UserRound />}
          title="Représentant légal de"
        >
          <ul>
            {person.represents.map((item) => (
              <li
                className="border-border-divider flex min-w-0 items-center gap-2.5 border-b py-2.5 last:border-0"
                key={item.id}
              >
                <PersonLine
                  details={[
                    LEGAL_GUARDIAN_RELATION_LABELS[item.relation],
                    item.age === null
                      ? null
                      : `${item.age} an${item.age > 1 ? 's' : ''}`,
                  ]}
                  person={item.person}
                />
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-2 text-xs">
            Le lien se modifie sur la fiche de la personne représentée.
          </p>
        </CollectionCard>
      )}

      {editor?.kind === 'emergency' && (
        <EmergencyContactDialog
          key={editor.item ? `${editor.item.id}:${editor.item.version}` : 'new'}
          item={editor.item}
          {...dialog}
        />
      )}
      {editor?.kind === 'guardian' && (
        <LegalGuardianDialog
          canCreatePerson={getPersonCapabilities(userData).canCreate}
          key={editor.item ? `${editor.item.id}:${editor.item.version}` : 'new'}
          item={editor.item}
          {...dialog}
        />
      )}
    </>
  );
};
