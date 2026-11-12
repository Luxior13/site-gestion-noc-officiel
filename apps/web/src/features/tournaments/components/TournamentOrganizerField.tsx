'use client';

import React, { type FC, useState } from 'react';

import { addOrganizerRequest } from '$features/organizations/organization.api';
import { SearchSelect } from '$ui/search-select';
import { ApiClientError } from '$utils/api.utils';

type Named = Readonly<{ id: string; name: string }>;

type Props = {
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  /** Who manages the organisations adds one from its typed name. */
  canAdd: boolean;
  /** The current organiser, offered even no longer an Organisateur. */
  current?: Named | null;
  disabled?: boolean;
  id: string;
  labelId: string;
  /** An organiser that could not be added, said under the field. */
  onError: (message: string) => void;
  onValueChange: (value: string) => void;
  organizers: readonly Named[];
  value: string;
};

/**
 * A tournament's organiser, typed (owner, 12 November 2026: « un champ où
 * je peux écrire, si la fiche existe elle est proposée, sinon […] créer la
 * fiche avec le type organisateur »): its name finds the organisers; a name
 * absent from them is added to the organisations as an Organisateur, or
 * given that kind when it is already there, without leaving the
 * tournament. Who does not manage the organisations chooses among them.
 */
export const TournamentOrganizerField: FC<Props> = ({
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  canAdd,
  current,
  disabled,
  id,
  labelId,
  onError,
  onValueChange,
  organizers,
  value,
}) => {
  // Added here, until the organisers are read again.
  const [added, setAdded] = useState<readonly Named[]>([]);
  const [adding, setAdding] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const offered = [...(current ? [current] : []), ...organizers, ...added]
    .filter(
      (entry, index, all) =>
        all.findIndex((other) => other.id === entry.id) === index,
    )
    .sort((first, second) => first.name.localeCompare(second.name, 'fr'));

  const add = async (name: string): Promise<void> => {
    setAdding(name);
    setNotice(null);
    try {
      const { organizer, outcome } = await addOrganizerRequest(name);
      setAdded((list) => [...list, organizer]);
      onValueChange(organizer.id);
      setNotice(
        outcome === 'created'
          ? `${organizer.name} ajouté aux organisations, de type Organisateur.`
          : outcome === 'kind-added'
            ? `${organizer.name} était déjà dans les organisations : type Organisateur ajouté à sa fiche.`
            : null,
      );
    } catch (error) {
      onError(
        error instanceof ApiClientError
          ? (error.details?.name?.[0] ?? error.message)
          : 'L’ajout n’a pas abouti. Réessayez.',
      );
    } finally {
      setAdding(null);
    }
  };

  return (
    <>
      <SearchSelect
        aria-describedby={describedBy}
        aria-invalid={invalid}
        create={
          canAdd
            ? {
                label: (name: string): string =>
                  `Ajouter « ${name} » aux organisateurs`,
                onCreate: (name: string): void => void add(name),
              }
            : undefined
        }
        disabled={disabled || adding !== null}
        emptyText="Aucun organisateur trouvé"
        groups={[
          {
            options: [
              { label: 'Aucun', value: '' },
              ...offered.map((entry) => ({
                label: entry.name,
                value: entry.id,
              })),
            ],
          },
        ]}
        id={id}
        labelId={labelId}
        onValueChange={(next) => {
          setNotice(null);
          onValueChange(next);
        }}
        placeholder="Aucun"
        searchLabel={
          canAdd
            ? 'Rechercher ou ajouter un organisateur'
            : 'Rechercher un organisateur'
        }
        value={value}
      />
      {(adding || notice) && (
        <p className="text-muted-foreground text-xs" role="status">
          {adding ? `Ajout de ${adding} aux organisations…` : notice}
        </p>
      )}
    </>
  );
};
