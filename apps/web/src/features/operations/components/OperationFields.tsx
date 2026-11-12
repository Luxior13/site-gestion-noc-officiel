'use client';

import React, { type FC } from 'react';

import {
  AmountField,
  DayField,
  FieldError,
} from '$features/financial-accounts/components/AccountFields';
import { PersonPicker } from '$features/persons/components/PersonPicker';
import type { PersonRef } from '$features/persons/types/person.types';
import { Button } from '$ui/button';
import { Input } from '$ui/input';
import { Label } from '$ui/label';
import { SearchSelect, type SearchSelectGroup } from '$ui/search-select';
import { Textarea } from '$ui/textarea';
import { compareActiveThenRank } from '$utils/active-order.utils';
import { centsToInput, parseEuroAmount } from '$utils/money.utils';

import { searchOperationPersonsRequest } from '../operation.api';
import {
  OPERATION_KIND_LABELS,
  OPERATION_KINDS,
  OPERATION_LABEL_MAX_LENGTH,
  OPERATION_NOTE_MAX_LENGTH,
  type OperationKind,
} from '../operation.constants';
import type {
  OperationChoices,
  OperationInput,
  OperationItem,
} from '../types/operation.types';

export type OperationDraft = {
  accountId: string;
  amount: string;
  /** « team:… », « game:… », or empty. */
  assignment: string;
  categoryId: string;
  kind: OperationKind;
  label: string;
  note: string;
  occurredOn: string;
  organizationId: string;
  paymentMethodId: string;
  person: PersonRef | null;
  toAccountId: string;
  tournamentId: string;
};

type OperationField =
  | 'accountId'
  | 'amountCents'
  | 'assignment'
  | 'categoryId'
  | 'kind'
  | 'label'
  | 'note'
  | 'occurredOn'
  | 'organizationId'
  | 'paymentMethodId'
  | 'personId'
  | 'toAccountId'
  | 'tournamentId';
export type OperationErrors = Partial<Record<OperationField, string>>;

const FIELDS: readonly OperationField[] = [
  'accountId',
  'amountCents',
  'assignment',
  'categoryId',
  'kind',
  'label',
  'note',
  'occurredOn',
  'organizationId',
  'paymentMethodId',
  'personId',
  'toAccountId',
  'tournamentId',
];

/** The server's messages, by field: `teamId` and `gameId` are one field. */
export const operationErrorsOf = (
  details: Record<string, string[]> | undefined,
): OperationErrors =>
  Object.fromEntries(
    FIELDS.map((field) => [
      field,
      Object.entries(details ?? {}).find(([path]) => {
        const key = path.split('.')[0];

        return (
          key === field ||
          (field === 'assignment' && (key === 'teamId' || key === 'gameId'))
        );
      })?.[1]?.[0],
    ]),
  ) as OperationErrors;

/** The open accounts on that day: one alone is chosen by itself. */
const openAccountsOn = (
  choices: OperationChoices,
  day: string,
): OperationChoices['accounts'] =>
  choices.accounts.filter(
    (account) =>
      account.openingOn <= day &&
      (!account.closedOn || account.closedOn >= day),
  );

/** A new operation: today, the only open account if there is one. */
export const newOperationDraft = (
  choices: OperationChoices,
  today: string,
  preset: Readonly<{ accountId?: string; kind?: OperationKind }> = {},
): OperationDraft => {
  const open = openAccountsOn(choices, today);

  return {
    accountId:
      preset.accountId ?? (open.length === 1 ? (open[0]?.id ?? '') : ''),
    amount: '',
    assignment: '',
    categoryId: '',
    kind: preset.kind ?? 'EXPENSE',
    label: '',
    note: '',
    occurredOn: today,
    organizationId: '',
    paymentMethodId: '',
    person: null,
    toAccountId: '',
    tournamentId: '',
  };
};

export const operationDraftOf = (item: OperationItem): OperationDraft => ({
  accountId: item.account.id,
  amount: centsToInput(item.amountCents),
  assignment: item.assignment
    ? `${item.assignment.kind}:${item.assignment.id}`
    : '',
  categoryId: item.category?.id ?? '',
  kind: item.kind,
  label: item.label ?? '',
  note: item.note ?? '',
  occurredOn: item.occurredOn,
  organizationId: item.organization?.id ?? '',
  paymentMethodId: item.paymentMethod?.id ?? '',
  person: item.person,
  toAccountId: item.toAccount?.id ?? '',
  tournamentId: item.tournament?.id ?? '',
});

/**
 * What is sent, or the errors the window says at once. Who cannot read the
 * Répertoire leaves `personId` out, so an edit keeps the link.
 */
export const operationInputOf = (
  draft: OperationDraft,
  canLinkPersons: boolean,
): { errors: OperationErrors } | { input: OperationInput } => {
  const amountCents = parseEuroAmount(draft.amount);
  const errors: OperationErrors = {
    accountId: draft.accountId ? undefined : 'Choisissez un compte',
    amountCents:
      amountCents === null
        ? 'Montant invalide, par exemple 120,50'
        : amountCents <= 0
          ? 'Le montant est supérieur à zéro : le sens donne le signe'
          : undefined,
    ...(draft.kind === 'TRANSFER'
      ? {
          toAccountId: draft.toAccountId
            ? undefined
            : 'Choisissez le compte d’arrivée',
        }
      : {
          categoryId: draft.categoryId ? undefined : 'Choisissez une catégorie',
          label: draft.label.trim() ? undefined : 'Le libellé est obligatoire',
        }),
  };
  if (Object.values(errors).some(Boolean) || amountCents === null)
    return { errors };
  const [assignmentKind, assignmentId] = draft.assignment.split(':');

  return {
    input: {
      accountId: draft.accountId,
      amountCents,
      categoryId: draft.categoryId || null,
      gameId: assignmentKind === 'game' ? (assignmentId ?? null) : null,
      kind: draft.kind,
      label: draft.label.trim() || null,
      note: draft.note.trim() || null,
      occurredOn: draft.occurredOn,
      organizationId: draft.organizationId || null,
      paymentMethodId: draft.paymentMethodId || null,
      ...(canLinkPersons ? { personId: draft.person?.id ?? null } : {}),
      teamId: assignmentKind === 'team' ? (assignmentId ?? null) : null,
      toAccountId: draft.toAccountId || null,
      tournamentId: draft.tournamentId || null,
    },
  };
};

/** The game of « team:… » or « game:… »; null for none. */
const assignmentGameOf = (
  choices: OperationChoices,
  assignment: string,
): string | null => {
  const [kind, id] = assignment.split(':');
  if (kind === 'game') return id ?? null;
  if (kind === 'team')
    return (
      choices.games.find((game) => game.teams.some((team) => team.id === id))
        ?.id ?? null
    );

  return null;
};

type Props = {
  canLinkPersons: boolean;
  choices: OperationChoices;
  disabled: boolean;
  draft: OperationDraft;
  errors: OperationErrors;
  idPrefix: string;
  /** The kind is chosen in the window only: an operation keeps it. */
  kindEditable: boolean;
  onChange: (next: Partial<OperationDraft>) => void;
  /** A record linked but hidden from who cannot read the Répertoire. */
  personHidden: boolean;
};

const describedBy = (
  ...ids: (false | string | undefined)[]
): string | undefined => ids.filter(Boolean).join(' ') || undefined;

/**
 * The fields of an operation (owner, « ok go », 11 November 2026): the
 * kind first, then the day and the amount, the account, and for money
 * received or paid its label, category, payment method, payer or payee, and
 * team or game; a transfer names its second account. Shared by the window
 * that adds one and the record that edits it.
 */
export const OperationFields: FC<Props> = ({
  canLinkPersons,
  choices,
  disabled,
  draft,
  errors,
  idPrefix: ID,
  kindEditable,
  onChange,
  personHidden,
}) => {
  const isTransfer = draft.kind === 'TRANSFER';
  const source = choices.accounts.find(
    (account) => account.id === draft.accountId,
  );
  const accountGroups = (
    candidates: OperationChoices['accounts'],
  ): SearchSelectGroup[] => [
    {
      options: [...candidates]
        .sort(
          (left, right) =>
            Number(left.closedOn !== null) - Number(right.closedOn !== null),
        )
        .map((account) => ({
          label: account.name,
          note: account.closedOn ? 'clôturé' : undefined,
          value: account.id,
        })),
    },
  ];
  const listGroup = (
    items: OperationChoices['paymentMethods'],
    none?: string,
  ): SearchSelectGroup[] => [
    {
      options: [
        ...(none ? [{ label: none, value: '' }] : []),
        ...[...items].sort(compareActiveThenRank).map((item) => ({
          label: item.name,
          note: item.isActive ? undefined : 'inactif',
          value: item.id,
        })),
      ],
    },
  ];
  const categories =
    draft.kind === 'INCOME'
      ? choices.incomeCategories
      : choices.expenseCategories;
  const assignmentGroups: SearchSelectGroup[] = [
    { options: [{ label: 'Aucune', value: '' }] },
    ...[...choices.games].sort(compareActiveThenRank).map((game) => ({
      label: game.name,
      options: [
        {
          label: `${game.name} (tout le jeu)`,
          note: game.isActive ? undefined : 'inactif',
          value: `game:${game.id}`,
        },
        ...[...game.teams].sort(compareActiveThenRank).map((team) => ({
          label: team.name,
          note: team.isActive ? undefined : 'inactive',
          value: `team:${team.id}`,
        })),
      ],
    })),
  ];
  // The tournaments of the chosen team's or game's, the latest first.
  const assignmentGame = assignmentGameOf(choices, draft.assignment);
  const tournamentGroups: SearchSelectGroup[] = [
    {
      options: [
        { label: 'Aucun', value: '' },
        ...choices.tournaments
          .filter(
            (tournament) =>
              !assignmentGame || tournament.gameId === assignmentGame,
          )
          .map((tournament) => ({
            label: tournament.name,
            note: `${tournament.gameName} · ${tournament.datesLabel}`,
            value: tournament.id,
          })),
      ],
    },
  ];
  const payer = draft.kind === 'INCOME' ? 'Payé par' : 'Payé à';

  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2">
      {kindEditable && (
        <fieldset className="min-w-0 space-y-1.5 sm:col-span-2">
          <legend className="font-form mb-1.5 text-[14px] leading-5 font-semibold">
            Sens
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {OPERATION_KINDS.map((kind) => (
              <Button
                aria-pressed={draft.kind === kind}
                className="aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary-emphasis"
                disabled={disabled}
                key={kind}
                onClick={() =>
                  onChange({
                    categoryId: draft.kind === kind ? draft.categoryId : '',
                    kind,
                  })
                }
                type="button"
                variant="outline"
              >
                {/* A closed list of three kinds. */}
                {/* eslint-disable-next-line security/detect-object-injection */}
                {OPERATION_KIND_LABELS[kind]}
              </Button>
            ))}
          </div>
        </fieldset>
      )}
      <DayField
        disabled={disabled}
        error={errors.occurredOn}
        idPrefix={`${ID}-day`}
        label="Date"
        onChange={(occurredOn) => onChange({ occurredOn })}
        value={draft.occurredOn}
      />
      <AmountField
        disabled={disabled}
        error={errors.amountCents}
        hint={
          isTransfer ? undefined : 'Toujours positif : le sens donne le signe.'
        }
        id={`${ID}-amount`}
        label="Montant"
        onChange={(amount) => onChange({ amount })}
        value={draft.amount}
      />
      <div
        className={
          isTransfer
            ? 'min-w-0 space-y-1.5'
            : 'min-w-0 space-y-1.5 sm:col-span-2'
        }
      >
        <Label htmlFor={`${ID}-account`} id={`${ID}-account-label`} required>
          {isTransfer ? 'Compte de départ' : 'Compte'}
        </Label>
        <SearchSelect
          aria-describedby={
            errors.accountId ? `${ID}-account-error` : undefined
          }
          aria-invalid={Boolean(errors.accountId)}
          disabled={disabled}
          emptyText="Aucun compte trouvé"
          groups={accountGroups(choices.accounts)}
          id={`${ID}-account`}
          labelId={`${ID}-account-label`}
          onValueChange={(accountId) =>
            onChange({
              accountId,
              toAccountId:
                accountId === draft.toAccountId ? '' : draft.toAccountId,
            })
          }
          placeholder="Choisir un compte"
          searchLabel="Rechercher un compte"
          value={draft.accountId}
        />
        <FieldError id={`${ID}-account-error`} message={errors.accountId} />
      </div>
      {isTransfer ? (
        <div className="min-w-0 space-y-1.5">
          <Label
            htmlFor={`${ID}-to-account`}
            id={`${ID}-to-account-label`}
            required
          >
            Compte d’arrivée
          </Label>
          <SearchSelect
            aria-describedby={describedBy(
              `${ID}-to-account-hint`,
              errors.toAccountId && `${ID}-to-account-error`,
            )}
            aria-invalid={Boolean(errors.toAccountId)}
            disabled={disabled}
            emptyText="Aucun compte trouvé"
            groups={accountGroups(
              choices.accounts.filter(
                (account) =>
                  account.id !== draft.accountId &&
                  (!source || account.entityId === source.entityId),
              ),
            )}
            id={`${ID}-to-account`}
            labelId={`${ID}-to-account-label`}
            onValueChange={(toAccountId) => onChange({ toAccountId })}
            placeholder="Choisir un compte"
            searchLabel="Rechercher un compte"
            value={draft.toAccountId}
          />
          <p
            className="text-muted-foreground text-xs"
            id={`${ID}-to-account-hint`}
          >
            L’argent reste dans la structure : ni entrée ni sortie.
          </p>
          <FieldError
            id={`${ID}-to-account-error`}
            message={errors.toAccountId}
          />
        </div>
      ) : (
        <>
          <div className="min-w-0 space-y-1.5 sm:col-span-2">
            <Label htmlFor={`${ID}-label`} required>
              Libellé
            </Label>
            <Input
              aria-describedby={errors.label ? `${ID}-label-error` : undefined}
              aria-invalid={Boolean(errors.label)}
              disabled={disabled}
              id={`${ID}-label`}
              maxLength={OPERATION_LABEL_MAX_LENGTH}
              onChange={(event) => onChange({ label: event.target.value })}
              placeholder={
                draft.kind === 'INCOME'
                  ? 'Ex. Cotisation 2026 Kaiz'
                  : 'Ex. Inscription Lyon e-Sport 2027'
              }
              value={draft.label}
            />
            <FieldError id={`${ID}-label-error`} message={errors.label} />
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label
              htmlFor={`${ID}-category`}
              id={`${ID}-category-label`}
              required
            >
              Catégorie
            </Label>
            <SearchSelect
              aria-describedby={describedBy(
                categories.length === 0 && `${ID}-category-hint`,
                errors.categoryId && `${ID}-category-error`,
              )}
              aria-invalid={Boolean(errors.categoryId)}
              disabled={disabled}
              emptyText="Aucune catégorie trouvée"
              groups={listGroup(categories)}
              id={`${ID}-category`}
              labelId={`${ID}-category-label`}
              onValueChange={(categoryId) => onChange({ categoryId })}
              placeholder="Choisir une catégorie"
              searchLabel="Rechercher une catégorie"
              value={draft.categoryId}
            />
            {categories.length === 0 && (
              <p
                className="text-muted-foreground text-xs"
                id={`${ID}-category-hint`}
              >
                Aucune catégorie de ce sens : ajoutez-en dans Comptes ›
                Catégories.
              </p>
            )}
            <FieldError
              id={`${ID}-category-error`}
              message={errors.categoryId}
            />
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor={`${ID}-method`} id={`${ID}-method-label`}>
              Moyen de paiement
            </Label>
            <SearchSelect
              aria-describedby={
                errors.paymentMethodId ? `${ID}-method-error` : undefined
              }
              aria-invalid={Boolean(errors.paymentMethodId)}
              disabled={disabled}
              emptyText="Aucun moyen trouvé"
              groups={listGroup(choices.paymentMethods, 'Non précisé')}
              id={`${ID}-method`}
              labelId={`${ID}-method-label`}
              onValueChange={(paymentMethodId) => onChange({ paymentMethodId })}
              placeholder="Non précisé"
              searchLabel="Rechercher un moyen de paiement"
              value={draft.paymentMethodId}
            />
            <FieldError
              id={`${ID}-method-error`}
              message={errors.paymentMethodId}
            />
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label
              htmlFor={`${ID}-organization`}
              id={`${ID}-organization-label`}
            >
              {payer} : organisation
            </Label>
            <SearchSelect
              aria-describedby={describedBy(
                `${ID}-payer-hint`,
                errors.organizationId && `${ID}-organization-error`,
              )}
              aria-invalid={Boolean(errors.organizationId)}
              disabled={disabled || Boolean(draft.person) || personHidden}
              emptyText="Aucune organisation trouvée"
              groups={[
                {
                  options: [
                    { label: 'Aucune', value: '' },
                    ...choices.organizations.map((organization) => ({
                      label: organization.name,
                      value: organization.id,
                    })),
                  ],
                },
              ]}
              id={`${ID}-organization`}
              labelId={`${ID}-organization-label`}
              onValueChange={(organizationId) => onChange({ organizationId })}
              placeholder="Aucune"
              searchLabel="Rechercher une organisation"
              value={draft.organizationId}
            />
            <FieldError
              id={`${ID}-organization-error`}
              message={errors.organizationId}
            />
          </div>
          <div className="min-w-0">
            {personHidden ? (
              <div className="space-y-1.5">
                <p className="font-form text-[14px] leading-5 font-semibold">
                  {payer} : fiche du Répertoire
                </p>
                <p className="text-muted-foreground text-sm">
                  Une fiche du Répertoire est liée.
                </p>
              </div>
            ) : canLinkPersons ? (
              <PersonPicker
                autoFocus={false}
                canCreatePerson={false}
                disabled={disabled || Boolean(draft.organizationId)}
                error={errors.personId}
                hint="Facultatif : un membre, un joueur…"
                idPrefix={`${ID}-person`}
                label={`${payer} : fiche du Répertoire`}
                onChange={(person) => onChange({ person })}
                onSearch={() => undefined}
                required={false}
                search={searchOperationPersonsRequest}
                value={draft.person}
              />
            ) : null}
          </div>
          <p
            className="text-muted-foreground -mt-2 text-xs sm:col-span-2"
            id={`${ID}-payer-hint`}
          >
            Facultatif : une organisation ou une fiche du Répertoire, l’une ou
            l’autre.
          </p>
          <div className="min-w-0 space-y-1.5 sm:col-span-2">
            <Label htmlFor={`${ID}-assignment`} id={`${ID}-assignment-label`}>
              Équipe ou jeu concerné
            </Label>
            <SearchSelect
              aria-describedby={describedBy(
                `${ID}-assignment-hint`,
                errors.assignment && `${ID}-assignment-error`,
              )}
              aria-invalid={Boolean(errors.assignment)}
              disabled={disabled}
              emptyText="Aucune équipe trouvée"
              groups={assignmentGroups}
              id={`${ID}-assignment`}
              labelId={`${ID}-assignment-label`}
              onValueChange={(assignment) => {
                // A tournament of another game no longer fits.
                const game = assignmentGameOf(choices, assignment);
                const tournament = choices.tournaments.find(
                  (entry) => entry.id === draft.tournamentId,
                );
                onChange(
                  tournament && game && tournament.gameId !== game
                    ? { assignment, tournamentId: '' }
                    : { assignment },
                );
              }}
              placeholder="Aucune"
              searchLabel="Rechercher une équipe ou un jeu"
              value={draft.assignment}
            />
            <p
              className="text-muted-foreground text-xs"
              id={`${ID}-assignment-hint`}
            >
              Facultatif : l’opération comptera dans les finances de cette
              équipe ou de ce jeu.
            </p>
            <FieldError
              id={`${ID}-assignment-error`}
              message={errors.assignment}
            />
          </div>
          <div className="min-w-0 space-y-1.5 sm:col-span-2">
            <Label htmlFor={`${ID}-tournament`} id={`${ID}-tournament-label`}>
              Tournoi
            </Label>
            <SearchSelect
              aria-describedby={describedBy(
                `${ID}-tournament-hint`,
                errors.tournamentId && `${ID}-tournament-error`,
              )}
              aria-invalid={Boolean(errors.tournamentId)}
              disabled={disabled}
              emptyText="Aucun tournoi trouvé"
              groups={tournamentGroups}
              id={`${ID}-tournament`}
              labelId={`${ID}-tournament-label`}
              onValueChange={(tournamentId) => onChange({ tournamentId })}
              placeholder="Aucun"
              searchLabel="Rechercher un tournoi"
              value={draft.tournamentId}
            />
            <p
              className="text-muted-foreground text-xs"
              id={`${ID}-tournament-hint`}
            >
              Facultatif : une inscription, un gain, un déplacement ; elle se
              lira dans les finances du tournoi.
            </p>
            <FieldError
              id={`${ID}-tournament-error`}
              message={errors.tournamentId}
            />
          </div>
        </>
      )}
      <div className="min-w-0 space-y-1.5 sm:col-span-2">
        <Label htmlFor={`${ID}-note`}>Note</Label>
        <Textarea
          aria-describedby={errors.note ? `${ID}-note-error` : undefined}
          aria-invalid={Boolean(errors.note)}
          disabled={disabled}
          id={`${ID}-note`}
          maxLength={OPERATION_NOTE_MAX_LENGTH}
          onChange={(event) => onChange({ note: event.target.value })}
          placeholder="Précision libre, facultative"
          rows={2}
          value={draft.note}
        />
        <FieldError id={`${ID}-note-error`} message={errors.note} />
      </div>
      {errors.kind && (
        <p className="text-destructive text-sm sm:col-span-2" role="alert">
          {errors.kind}
        </p>
      )}
    </div>
  );
};
