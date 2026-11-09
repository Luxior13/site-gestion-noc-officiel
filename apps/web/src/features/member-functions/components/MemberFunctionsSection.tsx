'use client';

import { GripVertical, ListPlus, Plus, RefreshCw, UserCog } from 'lucide-react';
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
  addCommonGameFunctionsRequest,
  fetchGameFunctions,
  reorderGameFunctionsRequest,
} from '../member-function.api';
import {
  COMMON_GAME_FUNCTIONS,
  compareMemberFunctions,
  MEMBER_FUNCTION_KINDS,
  memberFunctionGroupLabel,
  type MemberFunctionKind,
} from '../member-function.constants';
import type { MemberFunctionItem } from '../types/member-function.types';
import { MemberFunctionDialog } from './MemberFunctionDialog';

/** One focus ring per line, lit by the stretched name, not by the handle. */
const LINE_FOCUS =
  'has-[[data-line-target]:focus-visible]:ring-ring has-[[data-line-target]:focus-visible]:ring-2 has-[[data-line-target]:focus-visible]:ring-inset';

/**
 * A name that opens its window, its target covering the whole line; the
 * line's ring replaces the button's own.
 */
const NAME_BUTTON =
  'text-foreground hover:text-primary-emphasis block min-w-0 text-left font-medium [overflow-wrap:anywhere] after:absolute after:inset-0 hover:underline hover:underline-offset-[3px] focus-visible:border-transparent focus-visible:ring-0 max-sm:min-h-0';

const COMMON_NAMES = COMMON_GAME_FUNCTIONS.map(({ name }) => name);

/** « Aucune fonction d’encadrement » under an empty group. */
const EMPTY_GROUP: ReadonlyMap<MemberFunctionKind, string> = new Map([
  ['PLAYER', 'Aucune fonction de joueur'],
  ['STAFF', 'Aucune fonction d’encadrement'],
]);

const FunctionState: FC<{ item: MemberFunctionItem }> = ({ item }) =>
  item.isActive ? (
    <StatusBadge className="shrink-0" tone="success">
      Active
    </StatusBadge>
  ) : (
    <StatusBadge className="shrink-0" tone="muted">
      Inactive
    </StatusBadge>
  );

const FunctionName: FC<{
  canManage: boolean;
  item: MemberFunctionItem;
  onOpen: () => void;
}> = ({ canManage, item, onOpen }) =>
  canManage ? (
    <Button
      aria-label={`Modifier la fonction ${item.name}`}
      className={NAME_BUTTON}
      data-line-target=""
      onClick={onOpen}
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
  );

type Editor = { item: MemberFunctionItem | null } | null;

type Props = {
  canManage: boolean;
  game: Readonly<{ id: string; name: string }>;
  /** Keeps the tab's count in step with the list. */
  onCountChange: (count: number) => void;
};

/**
 * The functions of a game (9 November 2026), first tab of its record: the
 * players, then the staff, each in the order its managers set by dragging
 * (the same on every page); added and edited in a window. While the list is
 * empty, the common functions come in one click.
 */
export const MemberFunctionsSection: FC<Props> = ({
  canManage,
  game,
  onCountChange,
}) => {
  const [items, setItems] = useState<MemberFunctionItem[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [editor, setEditor] = useState<Editor>(null);
  const [addingCommon, setAddingCommon] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return (): void => {
      mountedRef.current = false;
    };
  }, []);

  const accept = useCallback(
    (next: MemberFunctionItem[]): void => {
      const sorted = [...next].sort(compareMemberFunctions);
      setItems(sorted);
      onCountChange(sorted.length);
    },
    [onCountChange],
  );

  const load = useCallback(async (): Promise<void> => {
    const fresh = await fetchGameFunctions(game.id);
    if (mountedRef.current) {
      accept(fresh);
      setError(null);
    }
  }, [accept, game.id]);

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
      accept(await addCommonGameFunctionsRequest(game.id));
      toast.success('Fonctions courantes ajoutées');
    } catch (caught) {
      toast.error(
        caught instanceof ApiClientError
          ? caught.message
          : 'L’ajout n’a pas abouti. Réessayez.',
      );
      // Another hand may have added functions meanwhile: show them.
      if (caught instanceof ApiClientError && caught.status === 409)
        void load().catch(() => undefined);
    } finally {
      if (mountedRef.current) setAddingCommon(false);
    }
  };

  /**
   * Shows the new order at once and saves it; a refusal puts the former
   * order back, and a list changed meanwhile is read again.
   */
  const reorder = async (
    kind: MemberFunctionKind,
    group: MemberFunctionItem[],
  ): Promise<void> => {
    if (!items || savingOrder) return;
    const previous = items;
    // The functions of the group take ranks 0 to n − 1.
    accept([
      ...items.filter((item) => item.kind !== kind),
      ...group.map((item, position) => ({ ...item, position })),
    ]);
    setSavingOrder(true);
    try {
      const saved = await reorderGameFunctionsRequest(game.id, {
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

  const open = (item: MemberFunctionItem | null) => (): void =>
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
        title="Les fonctions ne peuvent pas être chargées"
      />
    );

  const addButton =
    canManage && items && items.length > 0 ? (
      <Button onClick={open(null)} size="sm" type="button" variant="outline">
        <Plus className="size-4" />
        Ajouter une fonction
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
              Ajouter les fonctions courantes
            </Button>
            <Button
              disabled={addingCommon}
              onClick={open(null)}
              size="sm"
              type="button"
              variant="outline"
            >
              <Plus className="size-4" />
              Ajouter une fonction
            </Button>
          </div>
        ) : undefined
      }
      className="min-h-0 border-0 bg-transparent p-0"
      description={
        canManage
          ? `Les fonctions courantes : ${COMMON_NAMES.join(', ')}. Elles se modifient ensuite comme les autres.`
          : undefined
      }
      icon={<UserCog aria-hidden="true" className="size-5" />}
      layout="panel"
      title="Aucune fonction pour l’instant"
    />
  );

  const skeleton = (
    <div
      aria-busy="true"
      aria-label="Chargement des fonctions"
      className="space-y-2 p-4"
    >
      {[0, 1, 2].map((line) => (
        <Skeleton className="h-9 w-full" key={line} />
      ))}
    </div>
  );

  const row = (item: MemberFunctionItem, handle: ReactNode): ReactNode => (
    <div
      className={cn(
        'flex min-h-12 items-center gap-2 py-1.5 pr-4 text-sm',
        handle ? 'pl-2' : 'pl-4',
        canManage && cn(LINE_FOCUS, 'hover:bg-surface-row-hover'),
      )}
    >
      {handle}
      <div className="min-w-0 flex-1">
        <FunctionName canManage={canManage} item={item} onOpen={open(item)} />
      </div>
      <FunctionState item={item} />
    </div>
  );

  // Players, then the staff: a heading per group, each group in its order,
  // active or not: an inactive item never blocks (owner, 9 November 2026).
  const groups = (list: MemberFunctionItem[]): ReactNode =>
    MEMBER_FUNCTION_KINDS.map((kind) => {
      const group = list.filter((item) => item.kind === kind);
      const headingId = `member-functions-${kind.toLowerCase()}`;

      return (
        <section
          className="border-border-divider not-first:border-t"
          key={kind}
        >
          <h3
            className="bg-surface-table-head border-border-divider text-muted-foreground flex items-center justify-between border-b px-4 py-2 text-xs font-semibold"
            id={headingId}
          >
            {memberFunctionGroupLabel(kind)}
            <span className="tabular-nums">{group.length}</span>
          </h3>
          {group.length === 0 ? (
            <p className="text-muted-foreground px-4 py-3 text-xs">
              {EMPTY_GROUP.get(kind)}
            </p>
          ) : (
            <SortableList
              aria-labelledby={headingId}
              // A handle even alone, so names line up from one group to the other.
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
        description={
          canManage
            ? `Ce que fait chaque membre d’une équipe de ${game.name}.`
            : `Ce que fait chaque membre d’une équipe de ${game.name}, dans l’ordre de leur importance.`
        }
        headerClassName="bg-surface-content-header"
        headerLayout="inline"
        title="Fonctions"
        toolbar={
          addButton && <div className="flex sm:justify-end">{addButton}</div>
        }
        // A single button, not a search bar: it keeps its own width and the
        // sentence wraps beside it instead of running under it.
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
              // Under the list it explains (owner, 9 November 2026).
              <p className="border-border-divider text-muted-foreground flex items-start gap-2 border-t px-4 py-3 text-xs">
                <GripVertical
                  aria-hidden="true"
                  className="mt-px size-3.5 shrink-0"
                />
                Glissez une fonction par sa poignée pour la placer selon son
                importance, active ou non : cet ordre est repris partout.
              </p>
            )}
          </>
        )}
      </DataTableSection>
      <MemberFunctionDialog
        game={game}
        item={editor?.item ?? null}
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
        open={editor !== null}
      />
    </div>
  );
};
