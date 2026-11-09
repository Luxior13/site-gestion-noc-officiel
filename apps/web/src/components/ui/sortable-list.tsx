'use client';

import {
  type Announcements,
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  type Modifier,
  PointerSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import React, {
  createContext,
  type CSSProperties,
  type ReactNode,
  useContext,
  useId,
  useMemo,
} from 'react';

import { cn } from '$utils/css.utils';

import { Button } from './button';

type SortableEntry = Readonly<{ id: string }>;

/**
 * A row only moves up and down, inside its own container: it never covers
 * the heading of its group or another list.
 */
const withinContainer: Modifier = ({
  containerNodeRect,
  draggingNodeRect,
  transform,
}) => {
  if (!containerNodeRect || !draggingNodeRect) return { ...transform, x: 0 };
  const highest = containerNodeRect.top - draggingNodeRect.top;
  const lowest = containerNodeRect.bottom - draggingNodeRect.bottom;

  return {
    ...transform,
    x: 0,
    y: Math.min(Math.max(transform.y, highest), lowest),
  };
};

const SCREEN_READER_INSTRUCTIONS = {
  draggable:
    'Pour déplacer cet élément, appuyez sur Espace ou Entrée, puis sur les flèches haut et bas ; Espace ou Entrée pour le poser, Échap pour annuler.',
};

/** While an order is being saved, the handles stay focusable but inert. */
const FrozenContext = createContext(false);

type SortableGroupProps<T extends SortableEntry> = {
  children: ReactNode;
  frozen?: boolean;
  items: readonly T[];
  /** An item's name, for the screen reader's announcements. */
  labelOf: (item: T) => string;
  onReorder: (items: T[]) => void;
};

/**
 * The items one handle can move among (owner, 9 November 2026: games, the
 * teams of a game, the functions of a kind). Renders no element of its own,
 * so it may wrap table rows; its announcements live at the end of the page.
 */
export const SortableGroup = <T extends SortableEntry>({
  children,
  frozen = false,
  items,
  labelOf,
  onReorder,
}: SortableGroupProps<T>): React.JSX.Element => {
  const id = useId();
  const sensors = useSensors(
    // A few pixels before a drag starts: a tap on the handle stays a tap.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const announcements = useMemo((): Announcements => {
    const total = items.length;
    const nameOf = (key: UniqueIdentifier): string => {
      const found = items.find((item) => item.id === key);

      return found ? labelOf(found) : '';
    };
    const rank = (key: UniqueIdentifier): number =>
      ids.indexOf(String(key)) + 1;

    return {
      onDragCancel: ({ active }) =>
        `Déplacement annulé : ${nameOf(active.id)} reste en position ${rank(active.id)} sur ${total}.`,
      onDragEnd: ({ active, over }) =>
        over
          ? `${nameOf(active.id)} : nouvelle position ${rank(over.id)} sur ${total}.`
          : `${nameOf(active.id)} reste à sa place.`,
      onDragOver: ({ active, over }) =>
        over
          ? `${nameOf(active.id)} : position ${rank(over.id)} sur ${total}.`
          : `${nameOf(active.id)} est hors de la liste.`,
      onDragStart: ({ active }) =>
        `Déplacement de ${nameOf(active.id)} : position ${rank(active.id)} sur ${total}.`,
    };
  }, [ids, items, labelOf]);

  const drop = ({ active, over }: DragEndEvent): void => {
    if (!over || active.id === over.id || frozen) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove([...items], from, to));
  };

  return (
    <DndContext
      accessibility={{
        announcements,
        // Never inside a table or a list: the page's end holds them.
        container: typeof document === 'undefined' ? undefined : document.body,
        screenReaderInstructions: SCREEN_READER_INSTRUCTIONS,
      }}
      collisionDetection={closestCenter}
      id={id}
      modifiers={[withinContainer]}
      onDragEnd={drop}
      sensors={sensors}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <FrozenContext.Provider value={frozen}>
          {children}
        </FrozenContext.Provider>
      </SortableContext>
    </DndContext>
  );
};

/** What an item gives its element: the handle, and where it is dragged. */
type SortableItemParts = Readonly<{
  handle: ReactNode;
  isDragging: boolean;
  ref?: (node: HTMLElement | null) => void;
  style?: CSSProperties;
}>;

type SortableItemProps = {
  children: (parts: SortableItemParts) => ReactNode;
  /** Classes of the handle, to place it (absolute in a table row, say). */
  handleClassName?: string;
  id: string;
  /** The item's name: « Déplacer Valorant ». */
  label: string;
};

const ActiveSortableItem = ({
  children,
  handleClassName,
  id,
  label,
}: SortableItemProps): ReactNode => {
  const frozen = useContext(FrozenContext);
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    attributes: { roleDescription: 'élément déplaçable' },
    disabled: frozen,
    id,
  });

  return children({
    handle: (
      <Button
        {...attributes}
        {...listeners}
        aria-disabled={frozen || undefined}
        aria-label={`Déplacer ${label}`}
        // Above a name stretched over its line; no scrolling from the handle.
        className={cn(
          'text-muted-foreground relative z-10 shrink-0 cursor-grab touch-none active:cursor-grabbing',
          handleClassName,
        )}
        ref={setActivatorNodeRef}
        size="icon"
        variant="ghost"
      >
        <GripVertical aria-hidden="true" className="size-4" />
      </Button>
    ),
    isDragging,
    ref: setNodeRef,
    style: {
      position: 'relative',
      transform: CSS.Translate.toString(transform),
      transition,
      ...(isDragging ? { zIndex: 20 } : {}),
    },
  });
};

/**
 * One item of a `SortableGroup`. Disabled (an inactive item, a reader, a
 * filtered list), it renders the same element without handle nor movement.
 */
export const SortableItem = ({
  enabled,
  ...props
}: SortableItemProps & { enabled: boolean }): ReactNode =>
  enabled ? (
    <ActiveSortableItem {...props} />
  ) : (
    props.children({ handle: null, isDragging: false })
  );

type SortableListProps<T extends SortableEntry> = {
  /** Rows after the sortable ones, in the same list (the inactive items). */
  after?: ReactNode;
  'aria-labelledby'?: string;
  /** False for a reader: the rows show no handle and nothing moves. */
  canReorder: boolean;
  className?: string;
  frozen?: boolean;
  itemClassName?: string;
  items: readonly T[];
  labelOf: (item: T) => string;
  onReorder: (items: T[]) => void;
  /** The row's content; `handle` is null without the right to reorder. */
  renderItem: (item: T, handle: ReactNode) => ReactNode;
};

/**
 * A list whose order its managers set by dragging a handle (owner,
 * 9 November 2026): mouse, finger and keyboard (Espace, flèches, Espace ;
 * Échap), announced in French. Without the right, the same rows.
 */
export const SortableList = <T extends SortableEntry>({
  after,
  'aria-labelledby': labelledBy,
  canReorder,
  className,
  frozen = false,
  itemClassName,
  items,
  labelOf,
  onReorder,
  renderItem,
}: SortableListProps<T>): React.JSX.Element => {
  const rows = (
    <ul aria-labelledby={labelledBy} className={className}>
      {items.map((item) => (
        <SortableItem
          enabled={canReorder}
          id={item.id}
          key={item.id}
          label={labelOf(item)}
        >
          {({ handle, isDragging, ref, style }) => (
            <li
              className={cn(
                itemClassName,
                isDragging &&
                  'bg-surface-row-hover ring-border-strong shadow-lg ring-1',
              )}
              ref={ref}
              style={style}
            >
              {renderItem(item, handle)}
            </li>
          )}
        </SortableItem>
      ))}
      {after}
    </ul>
  );

  return canReorder ? (
    <SortableGroup
      frozen={frozen}
      items={items}
      labelOf={labelOf}
      onReorder={onReorder}
    >
      {rows}
    </SortableGroup>
  ) : (
    rows
  );
};
