'use client';

import { ReceiptText } from 'lucide-react';
import React, { type FC, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

import { RubricCard } from '$components/layout/RubricCard';
import { SectionActionBar } from '$components/layout/SectionActionBar';
import { UnsavedNavigationDialog } from '$components/layout/UnsavedNavigationDialog';
import { useUnsavedNavigationGuard } from '$hooks/useUnsavedNavigationGuard';
import { ApiClientError } from '$utils/api.utils';

import { updateOperationRequest } from '../operation.api';
import { OPERATION_ACTION_BAR_SLOT } from '../operation.constants';
import type { OperationChoices, OperationItem } from '../types/operation.types';
import {
  type OperationDraft,
  operationDraftOf,
  type OperationErrors,
  operationErrorsOf,
  OperationFields,
  operationInputOf,
} from './OperationFields';

const ID = 'operation-detail';
const FORM_ID = `${ID}-form`;

const sameDraft = (left: OperationDraft, right: OperationDraft): boolean =>
  (Object.keys(left) as (keyof OperationDraft)[]).every((key) =>
    key === 'person'
      ? (left.person?.id ?? null) === (right.person?.id ?? null)
      : // Keys come from the closed draft type.
        // eslint-disable-next-line security/detect-object-injection
        String(left[key]).trim() === String(right[key]).trim(),
  );

type Props = {
  canLinkPersons: boolean;
  choices: OperationChoices;
  onChange: (operation: OperationItem) => void;
  onReload: () => Promise<OperationItem>;
  operation: OperationItem;
};

/**
 * An operation edited in place (gabarit B), its fields those of the window;
 * its kind stays. The shared save bar appears once a value changes.
 */
export const OperationEditSection: FC<Props> = ({
  canLinkPersons,
  choices,
  onChange,
  onReload,
  operation,
}) => {
  const [base, setBase] = useState(operation);
  const [draft, setDraft] = useState<OperationDraft>(() =>
    operationDraftOf(operation),
  );
  const [errors, setErrors] = useState<OperationErrors>({});
  const [conflict, setConflict] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingDiscard, setPendingDiscard] = useState(false);
  const [actionBarSlot, setActionBarSlot] = useState<HTMLElement | null>(null);
  const mountedRef = useRef(false);
  const operationRef = useRef(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const isDirty = !sameDraft(draft, operationDraftOf(base));
  const isBusy = isSaving || isRefreshing;
  const {
    cancelPendingNavigation,
    confirmPendingNavigation,
    pendingNavigationHref,
    restoreFocus,
  } = useUnsavedNavigationGuard(isDirty, () => {
    mountedRef.current = false;
  });

  useEffect(() => {
    mountedRef.current = true;
    setActionBarSlot(document.getElementById(OPERATION_ACTION_BAR_SLOT));

    return (): void => {
      mountedRef.current = false;
    };
  }, []);

  const change = (next: Partial<OperationDraft>): void => {
    setDraft((current) => ({ ...current, ...next }));
    setSubmitError(null);
  };

  const failWith = (message: string): void => {
    setSubmitError(message);
    requestAnimationFrame(() => errorRef.current?.focus());
  };

  const save = async (): Promise<void> => {
    if (operationRef.current || conflict || !isDirty) return;
    const result = operationInputOf(draft, canLinkPersons);
    if ('errors' in result) {
      setErrors(result.errors);

      return;
    }
    operationRef.current = true;
    setIsSaving(true);
    setErrors({});
    setSubmitError(null);
    try {
      const saved = await updateOperationRequest(operation.id, {
        ...result.input,
        expectedVersion: base.version,
      });
      if (!mountedRef.current) return;
      setBase(saved);
      setDraft(operationDraftOf(saved));
      onChange(saved);
      toast.success('Opération mise à jour');
    } catch (caught) {
      if (!mountedRef.current) return;
      const fieldErrors =
        caught instanceof ApiClientError
          ? operationErrorsOf(caught.details)
          : {};
      if (Object.values(fieldErrors).some(Boolean)) {
        setErrors(fieldErrors);

        return;
      }
      if (caught instanceof ApiClientError && caught.status < 500) {
        if (caught.status === 409 || caught.status === 404) setConflict(true);
        failWith(caught.message);

        return;
      }
      setConflict(true);
      failWith(
        'Le résultat de l’enregistrement n’a pas pu être confirmé. Actualisez la version pour vérifier l’opération avant de réessayer.',
      );
    } finally {
      operationRef.current = false;
      if (mountedRef.current) setIsSaving(false);
    }
  };

  const refresh = async (): Promise<void> => {
    if (operationRef.current) return;
    operationRef.current = true;
    setIsRefreshing(true);
    try {
      const fresh = await onReload();
      if (!mountedRef.current) return;
      setBase(fresh);
      setDraft(operationDraftOf(fresh));
      setConflict(false);
      setSubmitError(null);
      setErrors({});
    } catch {
      if (mountedRef.current)
        failWith('Actualisation impossible. Réessayez avant d’enregistrer.');
    } finally {
      operationRef.current = false;
      if (mountedRef.current) setIsRefreshing(false);
    }
  };

  return (
    <>
      <section id={ID}>
        <h2 className="sr-only" id={`${ID}-title`} tabIndex={-1}>
          Opération
        </h2>
        <form
          aria-busy={isBusy || undefined}
          aria-labelledby={`${ID}-title`}
          autoComplete="off"
          className="space-y-3"
          id={FORM_ID}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          {submitError && (
            <p
              className="text-destructive text-sm"
              ref={errorRef}
              role="alert"
              tabIndex={-1}
            >
              {submitError}
            </p>
          )}
          <RubricCard
            icon={<ReceiptText />}
            id={`${ID}-card-title`}
            title="Opération"
          >
            <OperationFields
              canLinkPersons={canLinkPersons}
              choices={choices}
              disabled={isBusy}
              draft={draft}
              errors={errors}
              idPrefix={ID}
              kindEditable={false}
              onChange={change}
              personHidden={base.personLinked && !base.person}
            />
          </RubricCard>
        </form>
      </section>

      {(isDirty || conflict) &&
        actionBarSlot &&
        createPortal(
          <SectionActionBar
            conflict={conflict}
            hasChanges={isDirty}
            isResolvingConflict={isRefreshing}
            isSaving={isSaving}
            onCancel={() => {
              if (!operationRef.current) setPendingDiscard(true);
            }}
            onResolveConflict={() => void refresh()}
            saveForm={FORM_ID}
            saveType="submit"
          />,
          actionBarSlot,
        )}

      <UnsavedNavigationDialog
        cancelLabel={pendingDiscard ? 'Continuer la modification' : 'Rester'}
        confirmLabel={
          pendingDiscard
            ? 'Abandonner les modifications'
            : 'Quitter sans enregistrer'
        }
        contentClassName="sm:max-w-lg"
        description={
          pendingDiscard
            ? 'Les modifications de cette opération ne sont pas enregistrées.'
            : 'Vous avez des modifications non enregistrées sur cette opération. Quitter la page abandonnera votre saisie.'
        }
        onCancel={() => {
          setPendingDiscard(false);
          cancelPendingNavigation();
        }}
        onCloseAutoFocus={(event) => {
          if (!pendingDiscard) restoreFocus(event);
        }}
        onConfirm={() => {
          if (pendingDiscard) {
            setDraft(operationDraftOf(base));
            setErrors({});
            setSubmitError(null);
            setPendingDiscard(false);
          } else confirmPendingNavigation();
        }}
        open={pendingDiscard || pendingNavigationHref !== null}
        title={
          pendingDiscard
            ? 'Annuler les modifications ?'
            : 'Quitter sans enregistrer ?'
        }
      />
    </>
  );
};
