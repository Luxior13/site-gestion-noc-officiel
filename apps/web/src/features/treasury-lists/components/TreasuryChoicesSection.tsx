'use client';

import { GripVertical, ListPlus, Plus, RefreshCw, Tags } from 'lucide-react';
import React, {
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

import { ContentState } from '$components/layout/ContentState';
import { Button } from '$ui/button';
import { DataTableSection } from '$ui/data-table-section';
import directoryStyles from '$ui/directory.module.css';
import { Skeleton } from '$ui/skeleton';
import { SortableList } from '$ui/sortable-list';
import { StatusBadge } from '$ui/status-badge';
import { ApiClientError } from '$utils/api.utils';
import { cn } from '$utils/css.utils';

import {
  addCommonTreasuryChoicesRequest,
  fetchTreasuryChoices,
  reorderTreasuryChoicesRequest,
} from '../treasury-list.api';
import {
  COMMON_TREASURY_CHOICES,
  compareTreasuryChoices,
  TREASURY_CHOICE_GROUP_LABELS,
  TREASURY_LIST_KINDS,
  type TreasuryChoiceKind,
  type TreasuryList,
} from '../treasury-list.constants';
import type { TreasuryChoiceItem } from '../types/treasury-list.types';
import { TreasuryChoiceDialog } from './TreasuryChoiceDialog';

/** One focus ring per line, lit by the stretched name, not by the handle. */
const LINE_FOCUS =
  'has-[[data-line-target]:focus-visible]:ring-ring has-[[data-line-target]:focus-visible]:ring-2 has-[[data-line-target]:focus-visible]:ring-inset';

/** A name that opens its window, its target covering the whole line. */
const NAME_BUTTON =
  'text-foreground hover:text-primary-emphasis block min-w-0 text-left font-medium [overflow-wrap:anywhere] after:absolute after:inset-0 hover:underline hover:underline-offset-[3px] focus-visible:border-transparent focus-visible:ring-0 max-sm:min-h-0';

/** What each list says: its title, its sentence, its nouns. */
const TEXTS: Readonly<
  Record<
    TreasuryList,
    Readonly<{
      add: string;
      common: string;
      empty: string;
      noun: string;
      sentence: string;
      title: string;
    }>
  >
> = {
  categories: {
    add: 'Ajouter une catégorie',
    common: 'Ajouter les catégories courantes',
    empty: 'Aucune catégorie pour l’instant',
    noun: 'catégorie',
    sentence:
      'Ce que représente chaque entrée ou sortie d’argent : elles font les totaux et le bilan.',
    title: 'Catégories',
  },
  'payment-methods': {
    add: 'Ajouter un moyen de paiement',
    common: 'Ajouter les moyens courants',
    empty: 'Aucun moyen de paiement pour l’instant',
    noun: 'moyen de paiement',
    sentence:
      'Comment l’argent est passé : il aide à retrouver une opération sur un relevé.',
    title: 'Moyens de paiement',
  },
};

/** « Active » for a category, « Actif » for a payment method. */
const ChoiceState: FC<{ item: TreasuryChoiceItem }> = ({ item }) => {
  const ending = item.kind === 'PAYMENT_METHOD' ? '' : 've';

  return item.isActive ? (
    <StatusBadge className="shrink-0" tone="success">
      {ending ? 'Active' : 'Actif'}
    </StatusBadge>
  ) : (
    <StatusBadge className="shrink-0" tone="muted">
      {ending ? 'Inactive' : 'Inactif'}
    </StatusBadge>
  );
};

const usesLabel = (count: number): string =>
  count === 0
    ? 'aucune opération'
    : count > 1
      ? `${count} opérations`
      : '1 opération';

type Props = { canManage: boolean; list: TreasuryList };

/**
 * A list of the treasury, tab of the Comptes page (11 November 2026): the
 * categories in two blocks, money received then paid, or the payment
 * methods; each block in the order its managers set by dragging, active or
 * not; added and edited in a window; the common values in one click while
 * the list is empty.
 */
export const TreasuryChoicesSection: FC<Props> = ({ canManage, list }) => {
  // eslint-disable-next-line security/detect-object-injection
  const texts = TEXTS[list];
  // eslint-disable-next-line security/detect-object-injection
  const kinds = TREASURY_LIST_KINDS[list];
  const [items, setItems] = useState<TreasuryChoiceItem[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [editor, setEditor] = useState<{
    item: TreasuryChoiceItem | null;
  } | null>(null);
  const [addingCommon, setAddingCommon] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return (): void => {
      mountedRef.current = false;
    };
  }, []);

  const accept = useCallback((next: TreasuryChoiceItem[]): void => {
    setItems([...next].sort(compareTreasuryChoices));
  }, []);

  const load = useCallback(async (): Promise<void> => {
    const fresh = await fetchTreasuryChoices(list);
    if (mountedRef.current) {
      accept(fresh);
      setError(null);
    }
  }, [accept, list]);

  const retry = useCallback(async (): Promise<void> => {
    setError(null);
    setItems(null);
    try {
      await load();
    } catch (caught) {
      if (mountedRef.current)
        setError(
          caught instanceof Error
            ? caught
            : new Error('Chargement impossible.'),
        );
    }
  }, [load]);

  useEffect(() => {
    void retry();
  }, [retry]);

  const addCommon = async (): Promise<void> => {
    if (addingCommon) return;
    setAddingCommon(true);
    try {
      accept(await addCommonTreasuryChoicesRequest(list));
      toast.success(
        list === 'categories'
          ? 'Catégories courantes ajoutées'
          : 'Moyens de paiement courants ajoutés',
      );
    } catch (caught) {
      toast.error(
        caught instanceof ApiClientError
          ? caught.message
          : 'L’ajout n’a pas abouti. Réessayez.',
      );
      if (caught instanceof ApiClientError && caught.status === 409)
        void load().catch(() => undefined);
    } finally {
      if (mountedRef.current) setAddingCommon(false);
    }
  };

  /** Shows the new order at once and saves it; a refusal puts it back. */
  const reorder = async (
    kind: TreasuryChoiceKind,
    group: TreasuryChoiceItem[],
  ): Promise<void> => {
    if (!items || savingOrder) return;
    const previous = items;
    accept([
      ...items.filter((item) => item.kind !== kind),
      ...group.map((item, position) => ({ ...item, position })),
    ]);
    setSavingOrder(true);
    try {
      const saved = await reorderTreasuryChoicesRequest(list, {
        ids: group.map((item) => item.id),
        kind,
      });
      if (mountedRef.current) accept(saved);
      toast.success('Ordre enregistré');
    } catch (caught) {
      if (mountedRef.current) accept(previous);
      toast.error(
        caught instanceof ApiClientError
          ? caught.message
          : 'L’ordre n’a pas été enregistré. Réessayez.',
      );
      if (caught instanceof ApiClientError && caught.status === 409)
        void load().catch(() => undefined);
    } finally {
      if (mountedRef.current) setSavingOrder(false);
    }
  };

  const open = (item: TreasuryChoiceItem | null) => (): void =>
    setEditor({ item });

  if (error)
    return (
      <ContentState
        action={
          <Button
            onClick={() => void retry()}
            size="sm"
            type="button"
            variant="outline"
          >
            <RefreshCw className="size-4" />
            Réessayer
          </Button>
        }
        description={error.message}
        kind="error"
        title="La liste ne peut pas être chargée"
      />
    );

  const addButton =
    canManage && items && items.length > 0 ? (
      <Button onClick={open(null)} size="sm" type="button" variant="outline">
        <Plus className="size-4" />
        {texts.add}
      </Button>
    ) : undefined;

  const emptyState = (
    <ContentState
      action={
        canManage ? (
          <div className="flex flex-col items-center gap-2 sm:flex-row">
            <Button
              disabled={addingCommon}
              loading={addingCommon}
              onClick={() => void addCommon()}
              size="sm"
              type="button"
            >
              {!addingCommon && <ListPlus className="size-4" />}
              {texts.common}
            </Button>
            <Button
              disabled={addingCommon}
              onClick={open(null)}
              size="sm"
              type="button"
              variant="outline"
            >
              <Plus className="size-4" />
              {texts.add}
            </Button>
          </div>
        ) : undefined
      }
      className="min-h-0 border-0 bg-transparent p-0"
      description={
        canManage
          ? // eslint-disable-next-line security/detect-object-injection
            `Les courantes : ${COMMON_TREASURY_CHOICES[list]
              .map(({ name }) => name)
              .join(', ')}. Elles se modifient ensuite comme les autres.`
          : undefined
      }
      icon={<Tags aria-hidden="true" className="size-5" />}
      layout="panel"
      title={texts.empty}
    />
  );

  const skeleton = (
    <div
      aria-busy="true"
      aria-label={`Chargement : ${texts.title}`}
      className="space-y-2 p-4"
    >
      {[0, 1, 2].map((line) => (
        <Skeleton className="h-9 w-full" key={line} />
      ))}
    </div>
  );

  const row = (item: TreasuryChoiceItem, handle: ReactNode): ReactNode => (
    <div
      className={cn(
        'flex min-h-12 items-center gap-2 py-1.5 pr-4 text-sm',
        handle ? 'pl-2' : 'pl-4',
        canManage && cn(LINE_FOCUS, 'hover:bg-surface-row-hover'),
      )}
    >
      {handle}
      <div className="min-w-0 flex-1">
        {canManage ? (
          <Button
            aria-label={`Modifier ${texts.noun} ${item.name}`}
            className={NAME_BUTTON}
            data-line-target=""
            onClick={open(item)}
            size="inline"
            type="button"
            variant="link"
          >
            {item.name}
          </Button>
        ) : (
          <span className="block font-medium [overflow-wrap:anywhere]">
            {item.name}
          </span>
        )}
      </div>
      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
        {usesLabel(item.useCount)}
      </span>
      <ChoiceState item={item} />
    </div>
  );

  // A heading per block when the list has two (money received, then paid).
  const groups = (all: TreasuryChoiceItem[]): ReactNode =>
    kinds.map((kind) => {
      const group = all.filter((item) => item.kind === kind);
      const headingId = `treasury-choices-${kind.toLowerCase()}`;

      return (
        <section
          className="border-border-divider not-first:border-t"
          key={kind}
        >
          <h3
            className={cn(
              'bg-surface-table-head border-border-divider text-muted-foreground flex items-center justify-between border-b px-4 py-2 text-xs font-semibold',
              kinds.length === 1 && 'sr-only',
            )}
            id={headingId}
          >
            {/* A closed list of three kinds. */}
            {/* eslint-disable-next-line security/detect-object-injection */}
            {TREASURY_CHOICE_GROUP_LABELS[kind]}
            <span className="tabular-nums">{group.length}</span>
          </h3>
          {group.length === 0 ? (
            <p className="text-muted-foreground px-4 py-3 text-xs">
              {kind === 'INCOME_CATEGORY'
                ? 'Aucune catégorie d’entrée.'
                : kind === 'EXPENSE_CATEGORY'
                  ? 'Aucune catégorie de sortie.'
                  : 'Aucun moyen de paiement.'}
            </p>
          ) : (
            <SortableList
              aria-labelledby={headingId}
              canReorder={canManage}
              className="divide-border-divider divide-y"
              frozen={savingOrder}
              itemClassName="even:bg-surface-row-alternate"
              items={group}
              labelOf={(item) => item.name}
              onReorder={(next) => void reorder(kind, next)}
              renderItem={row}
            />
          )}
        </section>
      );
    });

  return (
    <div className={directoryStyles.directory}>
      <DataTableSection
        className="border-border-content bg-surface-content rounded-panel"
        description={texts.sentence}
        headerClassName="bg-surface-content-header"
        headerLayout="inline"
        title={texts.title}
        toolbar={
          addButton && <div className="flex sm:justify-end">{addButton}</div>
        }
        toolbarClassName="@min-[56rem]/data-table:flex-none"
      >
        {items === null ? (
          skeleton
        ) : items.length === 0 ? (
          <div className="px-4 py-8">{emptyState}</div>
        ) : (
          <>
            {groups(items)}
            {canManage && (
              <p className="border-border-divider text-muted-foreground flex items-start gap-2 border-t px-4 py-3 text-xs">
                <GripVertical
                  aria-hidden="true"
                  className="mt-px size-3.5 shrink-0"
                />
                Glissez une valeur par sa poignée pour la placer selon son
                importance, active ou non : cet ordre est repris dans les menus
                de chaque opération.
              </p>
            )}
          </>
        )}
      </DataTableSection>
      {editor && (
        <TreasuryChoiceDialog
          item={editor.item}
          list={list}
          onClose={() => setEditor(null)}
          onDeleted={(id) => {
            accept((items ?? []).filter((item) => item.id !== id));
            setEditor(null);
          }}
          onReload={load}
          onSaved={(saved) => {
            accept([
              ...(items ?? []).filter((item) => item.id !== saved.id),
              saved,
            ]);
            setEditor(null);
          }}
        />
      )}
    </div>
  );
};
