'use client';

import { Plus, Tags } from 'lucide-react';
import React, { type FC, useState } from 'react';

import { RubricCard } from '$components/layout/RubricCard';
import { Badge } from '$ui/badge';
import { Button } from '$ui/button';
import { DatePicker } from '$ui/date-picker';
import { Input } from '$ui/input';
import { Label } from '$ui/label';
import {
  APPROXIMATE_DATE_FIRST_YEAR,
  type ApproximateDate,
  formatApproximateDate,
} from '$utils/approximate-date.utils';

import {
  OTHER_NICKNAME_NOTE_SUGGESTIONS,
  PERSON_LIMITS,
} from '../person.constants';
import type {
  PersonDetail,
  PersonOtherNicknameItem,
} from '../types/person.types';
import { EditAction, EmptyCollection } from './PersonCollectionParts';
import {
  type DialogBase,
  type Errors,
  FieldError,
  RelativeDialogFrame,
  useRelativeRequest,
} from './PersonRecordDialog';

type Props = {
  canUpdate: boolean;
  onChange: (person: PersonDetail) => void;
  onReload: () => Promise<PersonDetail>;
  person: PersonDetail;
};

/** « jusqu’en 2023 », « jusqu’en mars 2023 » or « jusqu’au 15 mars 2023 ». */
const untilText = (until: ApproximateDate): string =>
  `${until.precision === 'DAY' ? 'jusqu’au' : 'jusqu’en'} ${formatApproximateDate(until)}`;

const ID = 'other-nickname';

/** A pseudo, what it is, and until when it was used, if known. */
const OtherNicknameDialog: FC<
  DialogBase & { item: PersonOtherNicknameItem | null }
> = ({ item, ...base }) => {
  const [nickname, setNickname] = useState(item?.nickname ?? '');
  const [note, setNote] = useState(item?.note ?? '');
  const [until, setUntil] = useState<ApproximateDate | null>(
    item?.until ?? null,
  );
  // Its own versions: the record's version does not move (10 November 2026).
  const request = useRelativeRequest(base, 'autres-pseudos', {
    withPersonVersion: false,
  });
  const { busy, errors, setErrors } = request;
  const changed =
    !item ||
    nickname.trim() !== item.nickname ||
    (note.trim() || null) !== item.note ||
    until?.date !== item.until?.date ||
    until?.precision !== item.until?.precision;
  const error = (key: string): string | undefined =>
    // `key` is one of this window's fields.
    // eslint-disable-next-line security/detect-object-injection
    errors[key];

  const save = (): void => {
    if (request.stale) return;
    if (!nickname.trim()) {
      setErrors({ nickname: 'Renseignez le pseudo' } satisfies Errors);

      return;
    }
    if (!changed) {
      base.onClose();

      return;
    }
    const payload = { nickname, note: note || null, until };
    void (item
      ? request.run(
          'PATCH',
          { ...payload, version: item.version },
          'Pseudo modifié',
          item.id,
        )
      : request.run('POST', payload, 'Pseudo ajouté'));
  };

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
              title: `Supprimer le pseudo ${item.nickname} ?`,
            }
          : null
      }
      description="Un ancien pseudo, un compte secondaire ou un nom en jeu : la recherche du Répertoire le trouve."
      onClose={base.onClose}
      onRemove={() =>
        item &&
        void request.run(
          'DELETE',
          { version: item.version },
          'Pseudo supprimé',
          item.id,
        )
      }
      onSubmit={save}
      submitLabel={item ? 'Enregistrer' : 'Ajouter'}
      title={item ? 'Modifier le pseudo' : 'Ajouter un autre pseudo'}
    >
      {request.feedback}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${ID}-nickname`} required>
            Pseudo
          </Label>
          <Input
            aria-describedby={
              error('nickname') ? `${ID}-nickname-error` : undefined
            }
            aria-invalid={Boolean(error('nickname'))}
            autoFocus
            disabled={busy}
            id={`${ID}-nickname`}
            maxLength={80}
            onChange={(event) => setNickname(event.target.value)}
            value={nickname}
          />
          <FieldError id={`${ID}-nickname-error`} message={error('nickname')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${ID}-note`}>Précision</Label>
          <Input
            aria-describedby={error('note') ? `${ID}-note-error` : undefined}
            aria-invalid={Boolean(error('note'))}
            disabled={busy}
            id={`${ID}-note`}
            list={`${ID}-notes`}
            maxLength={40}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Ancien pseudo, compte secondaire…"
            value={note}
          />
          <datalist id={`${ID}-notes`}>
            {OTHER_NICKNAME_NOTE_SUGGESTIONS.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
          <FieldError id={`${ID}-note-error`} message={error('note')} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`${ID}-until`} id={`${ID}-until-label`}>
            Utilisé jusqu’à
          </Label>
          <DatePicker
            aria-describedby={
              error('until') ? `${ID}-until-error` : `${ID}-until-hint`
            }
            aria-invalid={Boolean(error('until'))}
            clearable
            disabled={busy}
            id={`${ID}-until`}
            labelId={`${ID}-until-label`}
            maxYear={new Date().getFullYear()}
            minYear={APPROXIMATE_DATE_FIRST_YEAR}
            onChange={setUntil}
            placeholder="Non renseigné"
            value={until}
          />
          <FieldError id={`${ID}-until-error`} message={error('until')} />
          {!error('until') && (
            <p
              className="text-muted-foreground text-xs"
              id={`${ID}-until-hint`}
            >
              Pour un ancien pseudo, si on la connaît : l’année suffit.
            </p>
          )}
        </div>
      </div>
    </RelativeDialogFrame>
  );
};

/**
 * The other pseudos of a person (owner, 10 November 2026: « ok go »), first
 * card of the En ligne tab: a former one, a second account, a nickname. Read
 * and written with the coordinates' right, as the networks and game accounts
 * beside them; the Répertoire's search finds the record by them, to
 * recognize someone who changed names.
 */
export const PersonOtherNicknamesCard: FC<Props> = ({
  canUpdate,
  onChange,
  onReload,
  person,
}) => {
  const [editor, setEditor] = useState<{
    item: PersonOtherNicknameItem | null;
  } | null>(null);
  const items = person.otherNicknames;

  return (
    <>
      <RubricCard
        aside={
          <div className="flex items-center gap-2">
            <Badge variant="outline">{items.length}</Badge>
            {canUpdate && (
              <Button
                aria-label="Ajouter un autre pseudo"
                disabled={items.length >= PERSON_LIMITS.otherNicknames}
                onClick={() => setEditor({ item: null })}
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus className="size-4" />
                Ajouter
              </Button>
            )}
          </div>
        }
        contentClassName="p-3 sm:p-4"
        icon={<Tags />}
        id="person-online-other-nicknames-title"
        title="Autres pseudos"
      >
        {items.length === 0 ? (
          <EmptyCollection>Aucun autre pseudo.</EmptyCollection>
        ) : (
          <ul>
            {items.map((item) => (
              <li
                className="border-border-divider flex min-w-0 items-center gap-2 border-b py-2.5 last:border-0"
                key={item.id}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium [overflow-wrap:anywhere]">
                    {item.nickname}
                  </p>
                  {(item.note || item.until) && (
                    <p className="text-muted-foreground mt-0.5 text-xs break-words">
                      {[item.note, item.until && untilText(item.until)]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>
                {canUpdate && (
                  <EditAction
                    label={`le pseudo ${item.nickname}`}
                    onEdit={() => setEditor({ item })}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </RubricCard>
      {editor && (
        <OtherNicknameDialog
          item={editor.item}
          key={editor.item ? `${editor.item.id}:${editor.item.version}` : 'new'}
          onClose={() => setEditor(null)}
          onReload={onReload}
          onSaved={onChange}
          person={person}
        />
      )}
    </>
  );
};
