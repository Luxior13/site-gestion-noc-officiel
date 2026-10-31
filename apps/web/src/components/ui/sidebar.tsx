'use client';

import { Slot } from '@radix-ui/react-slot';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import * as React from 'react';

import { Button } from '$ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '$ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '$ui/tooltip';
import { cn } from '$utils/css.utils';

import {
  SidebarContext,
  type SidebarContextProps,
  useMobileViewport,
  useSidebar,
} from './sidebar-context';
import { useSidebarResponsiveFocus } from './sidebar-focus';

const SIDEBAR_ID = 'app-sidebar';
const SIDEBAR_WIDTH = '16.5rem';
const SIDEBAR_WIDTH_MOBILE = '18rem';
const SIDEBAR_SCROLL_STORAGE_PREFIX = 'sidebar_scroll:';
const SIDEBAR_SCROLL_SAVE_DELAY_MS = 120;

/**
 * The desktop sidebar is always open at 264 px, without a reduced mode
 * (owner decision of 27 September 2026): only the mobile sheet opens and
 * closes. Former desktop preferences in storage are simply ignored.
 */
function SidebarProvider({
  children,
  className,
  style,
  ...props
}: React.ComponentProps<'div'>): React.ReactNode {
  const { isMobile, isResolved: isMobileResolved } = useMobileViewport();
  const [openMobile, setOpenMobile] = React.useState(false);

  React.useEffect(() => {
    if (!isMobile) setOpenMobile(false);
  }, [isMobile]);

  const toggleSidebar = React.useCallback((): void => {
    setOpenMobile((value) => !value);
  }, []);

  const contextValue = React.useMemo<SidebarContextProps>(
    (): SidebarContextProps => ({
      isMobile,
      isMobileResolved,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [isMobile, isMobileResolved, openMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot="sidebar-wrapper"
        style={
          {
            '--sidebar-width': SIDEBAR_WIDTH,
            '--sidebar-width-mobile': SIDEBAR_WIDTH_MOBILE,
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          'box-border flex h-svh max-h-svh w-full overflow-hidden',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

function Sidebar({
  children,
  className,
  id,
  ...props
}: React.ComponentProps<'div'>): React.ReactNode {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  const returnFocusRef = React.useRef<HTMLElement | null>(null);
  const openedAtHrefRef = React.useRef<string | null>(null);

  useSidebarResponsiveFocus(id ?? SIDEBAR_ID);

  if (isMobile) {
    return (
      <Sheet
        open={openMobile}
        onOpenChange={(nextOpen) => {
          // Explicit dismissal still returns to Menu after selecting a space
          // while keeping the mobile sheet open on its new destination.
          if (!nextOpen) openedAtHrefRef.current = window.location.href;
          setOpenMobile(nextOpen);
        }}
      >
        <SheetContent
          onOpenAutoFocus={() => {
            returnFocusRef.current = document.querySelector<HTMLElement>(
              '[data-sidebar="trigger"]',
            );
            openedAtHrefRef.current = window.location.href;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (
              openedAtHrefRef.current === window.location.href &&
              returnFocusRef.current?.getClientRects().length
            ) {
              returnFocusRef.current?.focus({ preventScroll: true });
            }
          }}
          data-sidebar="sidebar"
          data-slot="sidebar"
          id={id ?? SIDEBAR_ID}
          side="left"
          style={
            {
              '--sidebar-width-mobile': SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          className={cn(
            'bg-sidebar text-sidebar-foreground w-[var(--sidebar-width-mobile)] max-w-[calc(100vw-1rem)] overflow-hidden p-0 [&_[data-sidebar=header]]:pr-14 [&>button]:top-1.5 [&>button]:right-1.5 [&>button]:z-10 [&>button]:size-11 [&>button]:opacity-100',
          )}
        >
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Navigation principale
          </SheetDescription>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      aria-label="Barre latérale"
      data-slot="sidebar"
      id={id ?? SIDEBAR_ID}
      className={cn(
        'group/sidebar bg-sidebar text-sidebar-foreground border-sidebar-border relative hidden h-full w-[var(--sidebar-width)] shrink-0 flex-col overflow-hidden border-r lg:flex',
        className,
      )}
      {...props}
    >
      {children}
    </aside>
  );
}

/** Opens and closes the navigation sheet under 1 024 px. */
function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>): React.ReactNode {
  const { isMobileResolved, openMobile, toggleSidebar } = useSidebar();
  const isExpanded = isMobileResolved ? openMobile : undefined;
  const actionLabel = !isMobileResolved
    ? 'Basculer la navigation'
    : openMobile
      ? 'Fermer la navigation'
      : 'Ouvrir la navigation';
  const TriggerIcon = openMobile ? PanelLeftClose : PanelLeftOpen;

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <Button
          aria-controls={SIDEBAR_ID}
          aria-expanded={isExpanded}
          aria-label={actionLabel}
          data-sidebar="trigger"
          data-slot="sidebar-trigger"
          type="button"
          variant="ghost"
          size="icon"
          className={cn('size-11 lg:size-10', className)}
          onClick={(event) => {
            onClick?.(event);
            toggleSidebar();
          }}
          {...props}
        >
          <TriggerIcon className="size-4" />
          <span className="sr-only">{actionLabel}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="rounded-sm">
        {actionLabel}
      </TooltipContent>
    </Tooltip>
  );
}

function SidebarInset({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactNode {
  return (
    <div
      data-slot="sidebar-inset"
      className={cn(
        'relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
        className,
      )}
      {...props}
    />
  );
}

function SidebarHeader({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactNode {
  return (
    <div
      data-sidebar="header"
      data-slot="sidebar-header"
      className={cn('flex flex-col gap-2 p-3', className)}
      {...props}
    />
  );
}

function SidebarFooter({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactNode {
  return (
    <div
      data-sidebar="footer"
      data-slot="sidebar-footer"
      className={cn('flex flex-col gap-2 p-3', className)}
      {...props}
    />
  );
}

type SidebarContentProps = React.ComponentProps<'div'> & {
  scrollRestoreKey?: string;
  scrollStorageKey?: string;
};

function SidebarContent({
  children,
  className,
  onScroll,
  scrollRestoreKey,
  scrollStorageKey,
  ...props
}: SidebarContentProps): React.ReactNode {
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const pendingScrollTopRef = React.useRef<number | null>(null);
  const scrollSaveTimeoutRef = React.useRef<number | null>(null);
  const storageKey = scrollStorageKey
    ? `${SIDEBAR_SCROLL_STORAGE_PREFIX}${scrollStorageKey}`
    : null;

  React.useEffect((): (() => void) | undefined => {
    const viewport = viewportRef.current;

    if (!viewport) return undefined;

    let scrollTop = 0;

    if (storageKey) {
      try {
        scrollTop = Number(window.sessionStorage.getItem(storageKey) ?? 0);
      } catch {
        scrollTop = 0;
      }
    }

    const revealActiveItem = (): void => {
      const activeItem = [
        '[aria-current="page"]',
        '[aria-current="location"]',
        '[data-active="true"]',
      ]
        .map((selector) => viewport.querySelector<HTMLElement>(selector))
        .find(
          (candidate) => candidate && candidate.getClientRects().length > 0,
        );

      if (!activeItem) return;

      const viewportRect = viewport.getBoundingClientRect();
      const activeItemRect = activeItem.getBoundingClientRect();

      if (activeItemRect.top < viewportRect.top) {
        viewport.scrollTop -= viewportRect.top - activeItemRect.top;
      } else if (activeItemRect.bottom > viewportRect.bottom) {
        viewport.scrollTop += activeItemRect.bottom - viewportRect.bottom;
      }
    };
    const restoreScroll = (): void => {
      viewport.scrollTop = Number.isFinite(scrollTop) ? scrollTop : 0;
      revealActiveItem();
    };
    const frameId = window.requestAnimationFrame(restoreScroll);

    restoreScroll();

    const resizeObserver = new ResizeObserver(revealActiveItem);
    resizeObserver.observe(viewport);
    // A current subpage can mount after its parent group opens. Revealing only
    // newly inserted current links avoids jumping when exploring other groups.
    const contentObserver = new MutationObserver((records) => {
      const currentLinkAdded = records.some((record) =>
        Array.from(record.addedNodes).some(
          (node) =>
            node instanceof HTMLElement &&
            (node.matches('[aria-current]') ||
              node.querySelector('[aria-current]')),
        ),
      );
      if (currentLinkAdded) revealActiveItem();
    });
    contentObserver.observe(viewport, { childList: true, subtree: true });

    return (): void => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      contentObserver.disconnect();
    };
  }, [scrollRestoreKey, storageKey]);

  React.useEffect((): (() => void) => {
    return (): void => {
      if (scrollSaveTimeoutRef.current !== null) {
        window.clearTimeout(scrollSaveTimeoutRef.current);
        scrollSaveTimeoutRef.current = null;
      }

      if (storageKey && pendingScrollTopRef.current !== null) {
        try {
          window.sessionStorage.setItem(
            storageKey,
            String(pendingScrollTopRef.current),
          );
        } catch {
          // Ignore storage errors in constrained environments.
        }
      }

      pendingScrollTopRef.current = null;
    };
  }, [storageKey]);

  const handleViewportScroll = React.useCallback<
    React.UIEventHandler<HTMLDivElement>
  >(
    (event) => {
      onScroll?.(event);

      if (!storageKey) return;

      pendingScrollTopRef.current = event.currentTarget.scrollTop;

      if (scrollSaveTimeoutRef.current !== null) return;

      scrollSaveTimeoutRef.current = window.setTimeout(() => {
        scrollSaveTimeoutRef.current = null;

        if (pendingScrollTopRef.current === null) return;

        try {
          window.sessionStorage.setItem(
            storageKey,
            String(pendingScrollTopRef.current),
          );
        } catch {
          // Ignore storage errors in constrained environments.
        }
      }, SIDEBAR_SCROLL_SAVE_DELAY_MS);
    },
    [onScroll, storageKey],
  );

  return (
    <div
      {...props}
      ref={viewportRef}
      data-sidebar="content"
      data-slot="sidebar-content"
      className={cn(
        'sidebar-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-2.5',
        className,
      )}
      onScroll={handleViewportScroll}
    >
      <div data-sidebar="content-inner" className="flex min-w-0 flex-col gap-2">
        {children}
      </div>
    </div>
  );
}

function SidebarGroup({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactNode {
  return (
    <div
      data-sidebar="group"
      data-slot="sidebar-group"
      className={cn(
        'relative flex w-full max-w-full min-w-0 flex-col gap-1.5 py-1.5',
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupLabel({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactNode {
  return (
    <div
      data-sidebar="group-label"
      data-slot="sidebar-group-label"
      className={cn(
        'text-muted-foreground text-caption flex h-6 shrink-0 items-center overflow-hidden px-2 font-medium transition-opacity duration-150',
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactNode {
  return (
    <div
      data-sidebar="group-content"
      data-slot="sidebar-group-content"
      className={cn('w-full max-w-full min-w-0 text-sm', className)}
      {...props}
    />
  );
}

function SidebarMenu({
  className,
  ...props
}: React.ComponentProps<'ul'>): React.ReactNode {
  return (
    <ul
      data-sidebar="menu"
      data-slot="sidebar-menu"
      className={cn('flex w-full max-w-full min-w-0 flex-col gap-1', className)}
      {...props}
    />
  );
}

function SidebarMenuItem({
  className,
  ...props
}: React.ComponentProps<'li'>): React.ReactNode {
  return (
    <li
      data-sidebar="menu-item"
      data-slot="sidebar-menu-item"
      className={cn(
        'group/menu-item relative w-full max-w-full min-w-0',
        className,
      )}
      {...props}
    />
  );
}

type SidebarMenuButtonProps = React.ComponentProps<'button'> & {
  asChild?: boolean;
  isActive?: boolean;
  size?: 'default' | 'lg' | 'sm';
};

function SidebarMenuButton({
  asChild = false,
  className,
  isActive = false,
  size = 'default',
  ...props
}: SidebarMenuButtonProps): React.ReactNode {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-active={isActive}
      data-sidebar="menu-button"
      data-size={size}
      data-slot="sidebar-menu-button"
      className={cn(
        'hover:bg-surface-navigation-hover hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring [&>svg]:text-muted-foreground relative flex w-full max-w-full min-w-0 items-center gap-2.5 overflow-hidden rounded-sm border border-transparent px-3 text-left text-sm font-medium transition-[background-color,color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-inset disabled:pointer-events-none disabled:opacity-50 [&>span]:max-w-full [&>span]:min-w-0 [&>span]:flex-1 [&>span]:truncate [&>span]:overflow-hidden [&>span]:whitespace-nowrap [&>span]:transition-opacity [&>span]:duration-100 [&>svg]:size-4 [&>svg]:shrink-0',
        'data-[active=true]:bg-surface-navigation-active data-[active=true]:text-sidebar-accent-foreground data-[active=true]:[&>svg]:text-sidebar-accent-foreground data-[active=true]:font-semibold',
        size === 'sm' && 'h-11 text-xs lg:h-9',
        size === 'default' && 'h-11 lg:h-10',
        size === 'lg' && 'h-12',
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuAction({
  className,
  ...props
}: React.ComponentProps<'button'>): React.ReactNode {
  return (
    <button
      data-sidebar="menu-action"
      data-slot="sidebar-menu-action"
      type="button"
      className={cn(
        'text-sidebar-foreground/65 hover:bg-sidebar-accent/45 hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring absolute top-0 right-0 flex size-11 items-center justify-center rounded-lg border border-transparent transition-colors outline-none focus-visible:ring-2 lg:top-1.5 lg:right-1 lg:size-6',
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSub({
  className,
  ...props
}: React.ComponentProps<'ul'>): React.ReactNode {
  return (
    <ul
      data-sidebar="menu-sub"
      data-slot="sidebar-menu-sub"
      className={cn(
        'border-sidebar-border/60 ml-3 flex min-w-0 translate-x-px flex-col gap-1 border-l py-1 pr-1 pl-2',
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<'li'>): React.ReactNode {
  return (
    <li
      data-sidebar="menu-sub-item"
      data-slot="sidebar-menu-sub-item"
      className={cn('group/menu-sub-item relative', className)}
      {...props}
    />
  );
}

function SidebarMenuSubButton({
  asChild = false,
  className,
  isActive = false,
  ...props
}: React.ComponentProps<'button'> & {
  asChild?: boolean;
  isActive?: boolean;
}): React.ReactNode {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-active={isActive}
      data-sidebar="menu-sub-button"
      data-slot="sidebar-menu-sub-button"
      className={cn(
        'hover:bg-surface-navigation-hover hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring [&>svg]:text-muted-foreground flex h-11 w-full min-w-0 items-center gap-2 overflow-hidden rounded-sm border border-transparent px-2.5 text-sm font-medium transition-[background-color,color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-inset lg:h-8 [&>span]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
        'data-[active=true]:bg-surface-navigation-active data-[active=true]:text-sidebar-accent-foreground data-[active=true]:[&>svg]:text-sidebar-accent-foreground data-[active=true]:font-semibold',
        className,
      )}
      {...props}
    />
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
};
