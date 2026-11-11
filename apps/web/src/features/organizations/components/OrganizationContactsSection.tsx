'use client';

import { Plus, UserRound, Users } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import React, { type FC, useState } from 'react';

import { personDetailPath } from '$constants/routes.constants';
import { PersonAvatarFrame } from '$features/persons/components/PersonAvatar';
import {
  CollectionCard,
  EditAction,
  EmptyCollection,
  formatPhoneForDisplay,
  phoneHref,
  RowTypeIcon,
} from '$features/persons/components/PersonCollectionParts';
import { Button } from '$ui/button';

import { ORGANIZATION_CONTACTS_LIMIT } from '../organization.constants';
import type {
  OrganizationContactItem,
  OrganizationDetail,
} from '../types/organization.types';

// The window loads when it opens: it brings the record search.
const OrganizationContactDialog = dynamic(() =>
  import('./OrganizationContactDialog').then(
    (module) => module.OrganizationContactDialog,
  ),
);

const LINK =
  'hover:text-primary-emphasis -my-[13px] py-[13px] [overflow-wrap:anywhere] hover:underline sm:my-0 sm:py-0';

/** Who it is: a record of the Répertoire opens; a name stays a name. */
const ContactName: FC<{ contact: OrganizationContactItem }> = ({ contact }) =>
  contact.person ? (
    <Link
      className={`${LINK} block max-w-full text-sm font-semibold`}
      href={personDetailPath(contact.person.id)}
    >
      {contact.person.displayName}
    </Link>
  ) : (
    <span className="text-sm font-semibold [overflow-wrap:anywhere]">
      {contact.name}
    </span>
  );

type Props = {
  canLinkPersons: boolean;
  canManage: boolean;
  onChange: (organization: OrganizationDetail) => void;
  onReload: () => Promise<OrganizationDetail>;
  organization: OrganizationDetail;
};

type Editor = { item: OrganizationContactItem | null } | null;

/**
 * The people to reach at an organisation (11 November 2026), by name: a
 * name, or the record of the Répertoire of someone who already has one;
 * their role, email and number. Who manages adds and edits them in a window.
 */
export const OrganizationContactsSection: FC<Props> = ({
  canLinkPersons,
  canManage,
  onChange,
  onReload,
  organization,
}) => {
  const [editor, setEditor] = useState<Editor>(null);
  const { contacts } = organization;
  const full = contacts.length >= ORGANIZATION_CONTACTS_LIMIT;

  return (
    <>
      <h2 className="sr-only">Contacts</h2>
      <CollectionCard
        addAction={
          canManage ? (
            <Button
              aria-label="Ajouter un contact"
              disabled={full}
              onClick={() => setEditor({ item: null })}
              size="sm"
              type="button"
              variant="outline"
            >
              <Plus className="size-4" />
              Ajouter
            </Button>
          ) : undefined
        }
        count={contacts.length}
        icon={<Users />}
        title="Contacts"
      >
        {contacts.length === 0 ? (
          <EmptyCollection>
            Aucun contact pour l’instant. Ajoutez la personne à joindre dans
            cette organisation.
          </EmptyCollection>
        ) : (
          <ul>
            {contacts.map((contact) => (
              <li
                className="border-border-divider flex min-w-0 items-center gap-2.5 border-b py-2.5 last:border-0"
                key={contact.id}
              >
                {contact.person ? (
                  <PersonAvatarFrame person={contact.person} />
                ) : (
                  <span className="bg-surface-inset border-border-default rounded-tile flex size-9 shrink-0 items-center justify-center border">
                    <RowTypeIcon>
                      <UserRound />
                    </RowTypeIcon>
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <ContactName contact={contact} />
                  {contact.role && (
                    <p className="text-muted-foreground mt-0.5 text-xs break-words">
                      {contact.role}
                    </p>
                  )}
                  {(contact.email || contact.phone) && (
                    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                      {contact.email && (
                        <a className={LINK} href={`mailto:${contact.email}`}>
                          {contact.email}
                        </a>
                      )}
                      {contact.phone && (
                        <a
                          className={`${LINK} tabular-nums`}
                          href={phoneHref(contact.phone)}
                        >
                          {formatPhoneForDisplay(contact.phone)}
                        </a>
                      )}
                    </p>
                  )}
                </div>
                {canManage && (
                  <EditAction
                    label={`le contact ${contact.name}`}
                    onEdit={() => setEditor({ item: contact })}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </CollectionCard>
      {full && canManage && (
        <p className="text-muted-foreground px-1 text-xs">
          {ORGANIZATION_CONTACTS_LIMIT} contacts au plus : retirez d’abord ceux
          qui sont partis.
        </p>
      )}
      {editor && (
        <OrganizationContactDialog
          canLinkPersons={canLinkPersons}
          item={editor.item}
          onClose={() => setEditor(null)}
          onReload={onReload}
          onSaved={onChange}
          organization={organization}
        />
      )}
    </>
  );
};
