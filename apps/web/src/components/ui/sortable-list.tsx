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
import React, { type ReactNode, useId, useMemo } from 'react';

import { cn } from '$utils/css.utils';

import { Button } from './button';

type SortableItem = Readonly<{ id: string }>;

type SortableListProps<T extends SortableItem> = {
  'aria-labelledby'?: string;
  /** False for a reader: the rows show no handle and nothing moves. */
  canReorder: boolean;
  className?: string;
  /** Holds the order still while the previous one is being saved. */
  frozen?: boolean;
  itemClassName?: string;
  items: readonly T[];
  /** The item's name, for its handle and the screen reader's announcements. */
  labelOf: (item: T) => string;
  onReorder: (items: T[]) => void;
  /** The row's content; `handle` is null without the right to reorder. */
  renderItem: (item: T, handle: ReactNode) => ReactNode;
};

/**
 * A row only moves up and down, inside its own list: it never covers the
 * heading of its group or another list.
 */
const withinList: Modifier = ({
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

const SortableRow = <T extends SortableItem>({
  canReorder,
  className,
  frozen,
  item,
  label,
  renderItem,
}: {
  canReorder: boolean;
  className?: string;
  frozen: boolean;
  item: T;
  label: string;
  renderItem: SortableListProps<T>['renderItem'];
}): React.JSX.Element => {
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
    disabled: !canReorder || frozen,
    id: item.id,
  });

  const handle = canReorder ? (
    <Button
      {...attributes}
      {...listeners}
      aria-disabled={frozen || undefined}
      aria-label={`Déplacer ${label}`}
      // Above a name stretched over its line; no scrolling from the handle.
      className="text-muted-foreground relative z-10 shrink-0 cursor-grab touch-none active:cursor-grabbing"
      ref={setActivatorNodeRef}
      size="icon"
      variant="ghost"
    >
      <GripVertical aria-hidden="true" className="size-4" />
    </Button>
  ) : null;

  return (
    <li
      className={cn(
        'relative',
        className,
        isDragging &&
          'bg-surface-row-hover ring-border-strong z-20 shadow-lg ring-1',
      )}
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      {renderItem(item, handle)}
    </li>
  );
};

/**
 * A list whose order its managers set by dragging a handle (owner,
 * 9 November 2026: functions of a game, by importance). Mouse, finger and
 * keyboard (Espace, flèches, Espace ; Échap), announced in French to a screen
 * reader. Without the right to reorder, the same rows without handle.
 */
export const SortableList = <T extends SortableItem>({
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
        screenReaderInstructions: SCREEN_READER_INSTRUCTIONS,
      }}
      collisionDetection={closestCenter}
      id={id}
      modifiers={[withinList]}
      onDragEnd={drop}
      sensors={sensors}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul aria-labelledby={labelledBy} className={className}>
          {items.map((item) => (
            <SortableRow
              canReorder={canReorder}
              className={itemClassName}
              frozen={frozen}
              item={item}
              key={item.id}
              label={labelOf(item)}
              renderItem={renderItem}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
};
