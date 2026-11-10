'use client';

import {
  ExternalLink,
  Gamepad2,
  Mail,
  Network,
  Phone,
  Plus,
  RotateCcw,
} from 'lucide-react';
import React, { type FC, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ContentState } from '$components/layout/ContentState';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '$ui/select';
import { ApiClientError } from '$utils/api.utils';

import { mutatePersonChild } from '../person.api';
import {
  getPersonSocialNetwork,
  PERSON_LIMITS,
  type PersonNetworkKind,
  personNetworkKind,
} from '../person.constants';
import { accountIdFromUrl } from '../person.utils';
import type {
  PersonDetail,
  PersonEmailItem,
  PersonPhoneItem,
  PersonSocialProfileItem,
} from '../types/person.types';
import { PersonChildDialog } from './PersonChildDialog';
import {
  CollectionCard,
  CopyAction,
  EditAction,
  EmptyCollection,
  formatPhoneForDisplay,
  phoneHref,
  RowTypeIcon,
} from './PersonCollectionParts';
import { PersonRelativesCards } from './PersonRelativesCards';
import { PersonSocialNetworkIcon } from './PersonSocialNetworkIcon';

type ChildKind = 'email' | 'phone' | 'social';
type ChildItem = PersonEmailItem | PersonPhoneItem | PersonSocialProfileItem;

type EditorState = {
  item: ChildItem | null;
  kind: ChildKind;
  /** For a profile: of a social network, or a game account. */
  networkKind?: PersonNetworkKind;
} | null;

type DeleteState = {
  item: ChildItem;
  kind: ChildKind;
} | null;

type PersonCollectionsSectionProps = {
  canUpdate: boolean;
  onChange: (person: PersonDetail) => void;
  onReload: () => Promise<PersonDetail>;
  person: PersonDetail;
};

const ItemMetadata: FC<{ isPrimary: boolean; parts: string[] }> = ({
  isPrimary,
  parts,
}) => (
  <p className="text-muted-foreground mt-0.5 text-xs break-words">
    {parts.join(' · ')}
    {isPrimary && (
      <>
        <span aria-hidden="true"> · </span>
        <span className="text-success">Principal</span>
      </>
    )}
  </p>
);

/** « ID 123456789012345678 » for a Discord or Steam account, else nothing. */
const accountIdLabel = (item: PersonSocialProfileItem): string | null => {
  const id = accountIdFromUrl(item.networkKey, item.profileUrl);

  return id ? `ID ${id}` : null;
};

/** The value a person reads for an item: address, number or profile. */
const getChildItemDisplay = (item: ChildItem): string =>
  'email' in item
    ? item.email
    : 'phone' in item
      ? formatPhoneForDisplay(item.phone, (item as PersonPhoneItem).countryCode)
      : ((item as PersonSocialProfileItem).identifier ??
        accountIdLabel(item as PersonSocialProfileItem) ??
        (item as PersonSocialProfileItem).profileUrl ??
        'Profil');

const EmailRow: FC<{
  canUpdate: boolean;
  item: PersonEmailItem;
  onEdit: () => void;
}> = ({ canUpdate, item, onEdit }) => (
  <li className="border-border-divider flex min-w-0 items-center gap-2 border-b py-2.5 last:border-0">
    <RowTypeIcon>
      <Mail />
    </RowTypeIcon>
    <div className="min-w-0 flex-1">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        <a
          className="hover:text-primary-emphasis -my-[13px] max-w-full truncate py-[13px] text-sm font-medium hover:underline sm:my-0 sm:py-0"
          href={`mailto:${item.email}`}
        >
          {item.email}
        </a>
      </div>
      <ItemMetadata isPrimary={item.isPrimary} parts={[item.label]} />
    </div>
    <div className="flex shrink-0 items-center gap-1">
      {canUpdate && <EditAction label="cet email" onEdit={onEdit} />}
      <CopyAction label="Email" value={item.email} />
    </div>
  </li>
);

const PhoneRow: FC<{
  canUpdate: boolean;
  item: PersonPhoneItem;
  onEdit: () => void;
}> = ({ canUpdate, item, onEdit }) => (
  <li className="border-border-divider flex min-w-0 items-center gap-2 border-b py-2.5 last:border-0">
    <RowTypeIcon>
      <Phone />
    </RowTypeIcon>
    <div className="min-w-0 flex-1">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        <a
          className="hover:text-primary-emphasis -my-[13px] max-w-full truncate py-[13px] text-sm font-medium tabular-nums hover:underline sm:my-0 sm:py-0"
          href={phoneHref(item.phone, item.countryCode)}
        >
          {formatPhoneForDisplay(item.phone, item.countryCode)}
        </a>
      </div>
      <ItemMetadata isPrimary={item.isPrimary} parts={[item.label]} />
    </div>
    <div className="flex shrink-0 items-center gap-1">
      {canUpdate && <EditAction label="ce téléphone" onEdit={onEdit} />}
      <CopyAction label="Numéro" value={item.phone} />
    </div>
  </li>
);

const SocialRow: FC<{
  canUpdate: boolean;
  item: PersonSocialProfileItem;
  onEdit: () => void;
}> = ({ canUpdate, item, onEdit }) => {
  const network = getPersonSocialNetwork(item.networkKey);
  // A Discord or Steam account shows its name, then its ID (10 November 2026).
  const accountId = accountIdFromUrl(item.networkKey, item.profileUrl);
  const visibleValue =
    item.identifier ?? accountIdLabel(item) ?? item.profileUrl ?? 'Profil';
  const copyValue = accountId ?? item.profileUrl ?? item.identifier;

  return (
    <li className="border-border-divider flex min-w-0 items-center gap-2 border-b py-2.5 last:border-0">
      <PersonSocialNetworkIcon
        className="text-muted-foreground size-4 shrink-0"
        networkKey={item.networkKey}
      />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {item.profileUrl ? (
            <a
              className="hover:text-primary-emphasis -my-[13px] flex min-w-0 items-center gap-1 truncate py-[13px] text-sm font-medium hover:underline sm:my-0 sm:py-0"
              href={item.profileUrl}
              rel="noreferrer"
              target="_blank"
            >
              <span className="truncate">{visibleValue}</span>
              <ExternalLink className="size-3 shrink-0" />
            </a>
          ) : (
            <span className="truncate text-sm font-medium">{visibleValue}</span>
          )}
        </div>
        <ItemMetadata
          isPrimary={item.isPrimary}
          parts={[
            network?.label ?? item.networkKey,
            ...(accountId && item.identifier ? [`ID ${accountId}`] : []),
            item.label,
          ]}
        />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {canUpdate && (
          <EditAction
            label={
              personNetworkKind(item.networkKey) === 'game'
                ? 'ce compte'
                : 'ce profil'
            }
            onEdit={onEdit}
          />
        )}
        {copyValue && (
          <CopyAction
            label={
              accountId
                ? 'ID du compte'
                : item.profileUrl
                  ? 'Lien du profil'
                  : 'Identifiant'
            }
            value={copyValue}
          />
        )}
      </div>
    </li>
  );
};

const PersonCollectionsContent: FC<PersonCollectionsSectionProps> = ({
  canUpdate,
  onChange,
  onReload,
  person,
}) => {
  const [conflict, setConflict] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const operationRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;

    return (): void => {
      mountedRef.current = false;
      requestRef.current?.abort();
    };
  }, []);
  const [deleteState, setDeleteState] = useState<DeleteState>(null);
  const [editor, setEditor] = useState<EditorState>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [replacementId, setReplacementId] = useState('');
  const [version, setVersion] = useState(person.version);
  const addEmailRef = useRef<HTMLButtonElement>(null);
  const addPhoneRef = useRef<HTMLButtonElement>(null);
  const addSocialRef = useRef<HTMLButtonElement>(null);
  const addGameRef = useRef<HTMLButtonElement>(null);
  // Game accounts have their own card (10 November 2026).
  const socialProfiles = person.socialProfiles.filter(
    (profile) => personNetworkKind(profile.networkKey) === 'social',
  );
  const gameAccounts = person.socialProfiles.filter(
    (profile) => personNetworkKind(profile.networkKey) === 'game',
  );

  const alternatives = ((): ChildItem[] => {
    if (!deleteState?.item.isPrimary) return [];
    if (deleteState.kind === 'email') {
      return person.emails.filter((item) => item.id !== deleteState.item.id);
    }
    if (deleteState.kind === 'phone') {
      return person.phones.filter((item) => item.id !== deleteState.item.id);
    }
    const social = deleteState.item as PersonSocialProfileItem;

    return person.socialProfiles.filter(
      (item) => item.id !== social.id && item.networkKey === social.networkKey,
    );
  })();
  const requiresReplacement = Boolean(
    deleteState?.item.isPrimary && alternatives.length > 0,
  );

  const openDelete = (kind: ChildKind, item: ChildItem): void => {
    setDeleteError(null);
    setDeleteState({ item, kind });
    setReplacementId('');
    setConflict(false);
    setVersion(person.version);
  };

  const handleDelete = async (): Promise<void> => {
    if (!canUpdate || operationRef.current || !mountedRef.current || conflict)
      return;
    if (!deleteState || (requiresReplacement && !replacementId)) return;
    operationRef.current = true;
    setDeleteError(null);
    const deletedKind = deleteState.kind;
    const deletedGame =
      'networkKey' in deleteState.item &&
      personNetworkKind(deleteState.item.networkKey) === 'game';
    setIsDeleting(true);
    setConflict(false);
    const controller = new AbortController();
    requestRef.current = controller;
    const timer = window.setTimeout(() => controller.abort(), 30_000);
    try {
      const kind =
        deleteState.kind === 'email'
          ? 'emails'
          : deleteState.kind === 'phone'
            ? 'telephones'
            : 'reseaux-sociaux';
      const result = await mutatePersonChild({
        childId: deleteState.item.id,
        kind,
        method: 'DELETE',
        payload: {
          personVersion: version,
          replacementPrimaryId: replacementId || null,
          version: deleteState.item.version,
        },
        personId: person.id,
        signal: controller.signal,
      });
      if (!mountedRef.current) return;
      onChange(result.person);
      setEditor(null);
      setDeleteState(null);
      toast.success('Information supprimée');
      requestAnimationFrame(() => {
        const target =
          deletedKind === 'email'
            ? addEmailRef.current
            : deletedKind === 'phone'
              ? addPhoneRef.current
              : deletedGame
                ? addGameRef.current
                : addSocialRef.current;
        target?.focus();
      });
    } catch (caught) {
      if (!mountedRef.current) return;
      if (caught instanceof ApiClientError && caught.status === 409) {
        setConflict(true);
      } else if (
        !(caught instanceof ApiClientError) ||
        caught.status >= 500 ||
        caught.code === 'INVALID_RESPONSE'
      ) {
        setConflict(true);
        setDeleteError(
          'Le résultat de la suppression n’a pas pu être confirmé. Actualisez la fiche pour vérifier cette information avant de réessayer.',
        );
      } else {
        if ([401, 403, 404, 410].includes(caught.status))
          void onReload().catch(() => {});
        setDeleteError(
          caught instanceof Error ? caught.message : 'Suppression impossible',
        );
      }
    } finally {
      window.clearTimeout(timer);
      if (requestRef.current === controller) requestRef.current = null;
      operationRef.current = false;
      if (mountedRef.current) setIsDeleting(false);
    }
  };

  const refreshDeleteVersion = async (): Promise<void> => {
    if (!deleteState || operationRef.current || !mountedRef.current) return;
    operationRef.current = true;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const fresh = await onReload();
      if (!mountedRef.current) return;
      const collection =
        deleteState.kind === 'email'
          ? fresh.emails
          : deleteState.kind === 'phone'
            ? fresh.phones
            : fresh.socialProfiles;
      const freshItem = collection.find(
        (item) => item.id === deleteState.item.id,
      );
      if (!freshItem) {
        setDeleteState(null);
        setEditor(null);
        toast.info('Cette information a déjà été supprimée');

        return;
      }
      setDeleteState({ item: freshItem, kind: deleteState.kind });
      setReplacementId('');
      setVersion(fresh.version);
      setConflict(false);
      toast.info(
        'Version actualisée ; vérifiez le remplacement avant de confirmer',
      );
    } catch {
      if (mountedRef.current)
        setDeleteError(
          'Actualisation impossible. Réessayez avant de supprimer.',
        );
    } finally {
      operationRef.current = false;
      if (mountedRef.current) setIsDeleting(false);
    }
  };

  return (
    <>
      {/* One column, like the other record tabs (27 October 2026). */}
      <div className="space-y-3">
        <CollectionCard
          addAction={
            canUpdate ? (
              <Button
                ref={addEmailRef}
                aria-label="Ajouter un email"
                disabled={person.emails.length >= PERSON_LIMITS.emails}
                onClick={() => setEditor({ item: null, kind: 'email' })}
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus className="size-4" />
                Ajouter
              </Button>
            ) : undefined
          }
          count={person.emails.length}
          icon={<Mail />}
          title="Emails"
        >
          {person.emails.length === 0 ? (
            <EmptyCollection>Aucun email renseigné.</EmptyCollection>
          ) : (
            <ul>
              {person.emails.map((item) => (
                <EmailRow
                  canUpdate={canUpdate}
                  item={item}
                  key={item.id}
                  onEdit={() => setEditor({ item, kind: 'email' })}
                />
              ))}
            </ul>
          )}
        </CollectionCard>

        <CollectionCard
          addAction={
            canUpdate ? (
              <Button
                ref={addPhoneRef}
                aria-label="Ajouter un téléphone"
                disabled={person.phones.length >= PERSON_LIMITS.phones}
                onClick={() => setEditor({ item: null, kind: 'phone' })}
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus className="size-4" />
                Ajouter
              </Button>
            ) : undefined
          }
          count={person.phones.length}
          icon={<Phone />}
          title="Téléphones"
        >
          {person.phones.length === 0 ? (
            <EmptyCollection>Aucun téléphone renseigné.</EmptyCollection>
          ) : (
            <ul>
              {person.phones.map((item) => (
                <PhoneRow
                  canUpdate={canUpdate}
                  item={item}
                  key={item.id}
                  onEdit={() => setEditor({ item, kind: 'phone' })}
                />
              ))}
            </ul>
          )}
        </CollectionCard>

        <CollectionCard
          addAction={
            canUpdate ? (
              <Button
                ref={addSocialRef}
                aria-label="Ajouter un profil social"
                disabled={
                  person.socialProfiles.length >= PERSON_LIMITS.socialProfiles
                }
                onClick={() =>
                  setEditor({
                    item: null,
                    kind: 'social',
                    networkKind: 'social',
                  })
                }
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus className="size-4" />
                Ajouter
              </Button>
            ) : undefined
          }
          count={socialProfiles.length}
          icon={<Network />}
          title="Réseaux sociaux"
        >
          {socialProfiles.length === 0 ? (
            <EmptyCollection>Aucun profil social renseigné.</EmptyCollection>
          ) : (
            <ul>
              {socialProfiles.map((item) => (
                <SocialRow
                  canUpdate={canUpdate}
                  item={item}
                  key={item.id}
                  onEdit={() =>
                    setEditor({ item, kind: 'social', networkKind: 'social' })
                  }
                />
              ))}
            </ul>
          )}
        </CollectionCard>

        {/* A platform's account, not a game's: one Riot account plays
            several games (10 November 2026). */}
        <CollectionCard
          addAction={
            canUpdate ? (
              <Button
                ref={addGameRef}
                aria-label="Ajouter un compte de jeu"
                disabled={
                  person.socialProfiles.length >= PERSON_LIMITS.socialProfiles
                }
                onClick={() =>
                  setEditor({ item: null, kind: 'social', networkKind: 'game' })
                }
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus className="size-4" />
                Ajouter
              </Button>
            ) : undefined
          }
          count={gameAccounts.length}
          icon={<Gamepad2 />}
          title="Comptes de jeu"
        >
          {gameAccounts.length === 0 ? (
            <EmptyCollection>Aucun compte de jeu renseigné.</EmptyCollection>
          ) : (
            <ul>
              {gameAccounts.map((item) => (
                <SocialRow
                  canUpdate={canUpdate}
                  item={item}
                  key={item.id}
                  onEdit={() =>
                    setEditor({ item, kind: 'social', networkKind: 'game' })
                  }
                />
              ))}
            </ul>
          )}
        </CollectionCard>

        <PersonRelativesCards
          canUpdate={canUpdate}
          onChange={onChange}
          onReload={onReload}
          person={person}
        />
      </div>

      {editor && (
        <PersonChildDialog
          canEdit={canUpdate}
          defaultPrimary={
            editor.kind === 'email'
              ? person.emails.length === 0
              : editor.kind === 'phone'
                ? person.phones.length === 0
                : !person.socialProfiles.some(
                    (profile) =>
                      profile.networkKey ===
                      (editor.networkKind === 'game' ? 'riot' : 'discord'),
                  )
          }
          item={editor.item}
          kind={editor.kind}
          networkKind={editor.networkKind}
          onDelete={() => {
            if (!editor.item) return;
            const collection =
              editor.kind === 'email'
                ? person.emails
                : editor.kind === 'phone'
                  ? person.phones
                  : person.socialProfiles;
            const current = collection.find(
              (item) => item.id === editor.item?.id,
            );
            if (current) openDelete(editor.kind, current);
          }}
          onOpenChange={(open) => {
            if (!open) setEditor(null);
          }}
          onPersonChange={onChange}
          onReload={onReload}
          open
          person={person}
        />
      )}

      <AlertDialog
        open={Boolean(deleteState)}
        onOpenChange={(open) => {
          if (!open && !operationRef.current) setDeleteState(null);
        }}
      >
        <AlertDialogContent
          aria-busy={isDeleting || undefined}
          className={requiresReplacement ? 'sm:max-w-lg' : 'sm:max-w-md'}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="break-words">
              {deleteState
                ? `Supprimer ${getChildItemDisplay(deleteState.item)} ?`
                : 'Supprimer ?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette suppression est immédiate et sera enregistrée dans le
              journal d’activité.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p role="alert" className="text-destructive text-sm">
              {deleteError}
            </p>
          )}
          {requiresReplacement && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Choisissez le nouveau principal avant de continuer.
              </p>
              <Select
                disabled={isDeleting}
                onValueChange={setReplacementId}
                value={replacementId}
              >
                <SelectTrigger
                  aria-label="Nouveau principal"
                  className="w-full min-w-0"
                >
                  <SelectValue placeholder="Sélectionner…" />
                </SelectTrigger>
                <SelectContent>
                  {alternatives.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {getChildItemDisplay(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {conflict && (
            <ContentState
              action={
                <Button
                  disabled={isDeleting}
                  onClick={() => void refreshDeleteVersion()}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <RotateCcw className="size-4" />
                  Actualiser
                </Button>
              }
              description="La fiche a changé. Actualisez sa version avant de réessayer."
              kind="warning"
              title="Modification concurrente"
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <Button
              disabled={
                isDeleting ||
                conflict ||
                (requiresReplacement && !replacementId)
              }
              onClick={() => void handleDelete()}
              type="button"
              variant="destructive"
            >
              Supprimer
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const PersonCollectionsSection: FC<PersonCollectionsSectionProps> = (
  props,
) => (
  <PersonCollectionsContent
    key={`${props.person.id}:${props.canUpdate}`}
    {...props}
  />
);
