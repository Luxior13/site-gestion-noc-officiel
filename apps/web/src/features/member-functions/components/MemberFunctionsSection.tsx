'use client';

import { ListPlus, Plus, RefreshCw, UserCog } from 'lucide-react';
import React, {
  type FC,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

import { ContentState } from '$components/layout/ContentState';
import { Button } from '$ui/button';
import {
  DataTableDesktop,
  DataTableMobileList,
  DataTableSection,
} from '$ui/data-table-section';
import directoryStyles from '$ui/directory.module.css';
import { Skeleton } from '$ui/skeleton';
import { StatusBadge } from '$ui/status-badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '$ui/table';
import { ApiClientError } from '$utils/api.utils';
import { cn } from '$utils/css.utils';

import {
  addCommonGameFunctionsRequest,
  fetchGameFunctions,
} from '../member-function.api';
import {
  COMMON_GAME_FUNCTIONS,
  compareMemberFunctions,
  memberFunctionKindLabel,
} from '../member-function.constants';
import type { MemberFunctionItem } from '../types/member-function.types';
import { MemberFunctionDialog } from './MemberFunctionDialog';

/** One focus ring per line: the stretched name button lights its row. */
const LINE_FOCUS =
  'has-[button:focus-visible]:ring-ring relative has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-inset';

/**
 * A name that opens its window, its target covering the whole line; the
 * line's ring replaces the button's own.
 */
const NAME_BUTTON =
  'text-foreground hover:text-primary-emphasis block min-w-0 text-left font-medium [overflow-wrap:anywhere] after:absolute after:inset-0 hover:underline hover:underline-offset-[3px] focus-visible:border-transparent focus-visible:ring-0 max-sm:min-h-0';

const COMMON_NAMES = COMMON_GAME_FUNCTIONS.map(({ name }) => name);

const FunctionState: FC<{ className?: string; item: MemberFunctionItem }> = ({
  className,
  item,
}) =>
  item.isActive ? (
    <StatusBadge className={className} tone="success">
      Active
    </StatusBadge>
  ) : (
    <StatusBadge className={className} tone="muted">
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
 * The functions of a game (9 November 2026), first tab of its record: players
 * first, then the staff, active ones first; added and edited in a window.
 * While the list is empty, the common functions come in one click.
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

  return (
    <div className={directoryStyles.directory}>
      <DataTableSection
        className="border-border-content bg-surface-content rounded-panel"
        description={`Ce que fait chaque membre d’une équipe de ${game.name} : jouer, coacher, manager…`}
        headerClassName="bg-surface-content-header"
        headerLayout="inline"
        title="Fonctions"
        toolbar={
          addButton && <div className="flex sm:justify-end">{addButton}</div>
        }
      >
        {items === null ? (
          skeleton
        ) : items.length === 0 ? (
          <div className="px-4 py-8">{emptyState}</div>
        ) : (
          <>
            <DataTableDesktop>
              <Table
                aria-label={`Fonctions de ${game.name}`}
                className={directoryStyles.table}
              >
                <TableCaption className="sr-only">
                  Les fonctions de {game.name}, leur type et leur état ; les
                  joueurs d’abord, puis l’encadrement.
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fonction</TableHead>
                    <TableHead className="w-[200px]">Type</TableHead>
                    <TableHead className="w-[130px]">État</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow
                      className={cn(canManage && LINE_FOCUS)}
                      key={item.id}
                    >
                      <TableCell>
                        <FunctionName
                          canManage={canManage}
                          item={item}
                          onOpen={open(item)}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground pointer-events-none">
                        {memberFunctionKindLabel(item.kind)}
                      </TableCell>
                      <TableCell className="pointer-events-none">
                        <FunctionState item={item} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataTableDesktop>
            <DataTableMobileList className={directoryStyles.mobileList}>
              {items.map((item) => (
                <div
                  className={cn(
                    canManage && LINE_FOCUS,
                    'flex min-h-14 items-center gap-3 px-4 py-2.5 text-sm',
                    canManage && 'hover:bg-[var(--surface-row-hover)]',
                  )}
                  key={item.id}
                >
                  <div className="min-w-0 flex-1">
                    <FunctionName
                      canManage={canManage}
                      item={item}
                      onOpen={open(item)}
                    />
                    <p className="text-muted-foreground text-xs">
                      {memberFunctionKindLabel(item.kind)}
                    </p>
                  </div>
                  <FunctionState className="shrink-0" item={item} />
                </div>
              ))}
            </DataTableMobileList>
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
