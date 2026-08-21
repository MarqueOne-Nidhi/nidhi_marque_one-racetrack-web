import React from 'react';
import { NavigationMenu as Base } from '@base-ui/react/navigation-menu';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * ─── Navigation menu ──────────────────────────────────────────────────────
 *
 * The shadcn composition over Base UI, adapted rather than copied. Three
 * things about this project made a straight `npx shadcn add` impossible, and
 * each is the reason for a difference you will notice against the docs:
 *
 *   no components.json, so the CLI has nothing to attach to
 *   no @/ alias and no tsconfig, so imports are relative and this is .jsx
 *   no shadcn CSS variables, so `bg-popover` and `text-popover-foreground`
 *   would have resolved to nothing
 *
 * That last one matters most. The site already has a palette: sections
 * publish --surface, --ink and --rule (see ui/Section.jsx), and the panel
 * reads those rather than introducing a second set of tokens that would then
 * have to be kept in step with the first.
 *
 * Base UI moves the open panel between items itself and animates the size
 * change, which is what the old hand-rolled panel spent most of its code
 * doing: a close timer so the pointer could cross the gap, a measured pointer
 * x for the little arrow, and refs to every item to measure from.
 */

/**
 * The panel is portalled to the end of the document, so it does not inherit
 * anything from the bar. The surface variables therefore have to be handed to
 * it explicitly; relying on inheritance left the popup background resolving
 * to rgba(0,0,0,0), which only looked right because it was blurred over a
 * dark hero and would have been unreadable over an ivory section.
 */
const TONES = {
  light: {
    '--surface': '#F5F1E8',
    '--ink': '#090909',
    '--rule': 'rgba(9, 9, 9, 0.14)',
    '--accent': '#cc0000',
  },
  dark: {
    '--surface': '#090909',
    '--ink': '#F5F1E8',
    '--rule': 'rgba(245, 241, 232, 0.14)',
    // The brand red measures 3.38:1 on #090909, under the 4.5:1 small text
    // needs. Same substitution ui/Section.jsx makes on every dark ground.
    '--accent': '#FF4D4D',
  },
};

function NavigationMenu({ className, children, viewport = true, tone = 'dark', ...props }) {
  return (
    <Base.Root
      data-slot="navigation-menu"
      className={cn('relative flex max-w-max flex-1 items-center justify-center', className)}
      {...props}
    >
      {children}
      {viewport && <NavigationMenuViewport tone={tone} />}
    </Base.Root>
  );
}

function NavigationMenuList({ className, ...props }) {
  return (
    <Base.List
      data-slot="navigation-menu-list"
      className={cn('group flex flex-1 list-none items-center justify-center gap-1', className)}
      {...props}
    />
  );
}

function NavigationMenuItem({ className, ...props }) {
  return (
    <Base.Item data-slot="navigation-menu-item" className={cn('relative', className)} {...props} />
  );
}

/**
 * Shared by triggers and by links that sit directly on the bar, so a page
 * with a panel and a page without look like the same row of items.
 */
const navigationMenuTriggerStyle = () =>
  cn(
    'group inline-flex h-9 w-max items-center justify-center gap-1 rounded-sm',
    'bg-transparent px-3 py-2 font-sans text-[0.7rem] tracking-[0.18em] uppercase',
    'cursor-pointer border-none outline-none select-none',
    'transition-colors duration-300',
    'opacity-70 hover:opacity-100 focus-visible:opacity-100',
    'data-[popup-open]:opacity-100'
  );

function NavigationMenuTrigger({ className, children, ...props }) {
  return (
    <Base.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(navigationMenuTriggerStyle(), className)}
      {...props}
    >
      {children}
      <Base.Icon
        // Base UI turns this on the open item. Rotating rather than swapping
        // the glyph keeps it from jumping a pixel as it flips.
        className="transition-transform duration-300 data-[popup-open]:rotate-180"
      >
        <ChevronDown size={12} aria-hidden="true" />
      </Base.Icon>
    </Base.Trigger>
  );
}

function NavigationMenuContent({ className, ...props }) {
  return (
    <Base.Content
      data-slot="navigation-menu-content"
      className={cn(
        'w-full p-5',
        // Base UI hands the panel its direction of travel, so an item to the
        // right of the last one slides in from the right.
        'transition-[opacity,transform] duration-300 ease-out',
        'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
        'data-[activation-direction=left]:data-[starting-style]:-translate-x-1/4',
        'data-[activation-direction=right]:data-[starting-style]:translate-x-1/4',
        'data-[activation-direction=left]:data-[ending-style]:translate-x-1/4',
        'data-[activation-direction=right]:data-[ending-style]:-translate-x-1/4',
        className
      )}
      {...props}
    />
  );
}

/**
 * The panel every item's content is shown inside.
 *
 * It reads --surface and --rule from whatever section the navbar is standing
 * over, so the panel is the same stock as the page rather than a third
 * colour introduced here.
 */
function NavigationMenuViewport({ className, tone = 'dark', ...props }) {
  return (
    <Base.Portal>
      <Base.Positioner
        data-slot="navigation-menu-positioner"
        sideOffset={10}
        collisionPadding={16}
        className="z-[1200] box-border h-[var(--positioner-height)] w-[var(--positioner-width)] transition-[top,left,right,bottom,width,height] duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] before:absolute before:content-[''] data-[instant]:transition-none"
        // Set here rather than on the bar: this is the outermost thing inside
        // the portal, so everything below it can inherit.
        style={{ ...(TONES[tone] || TONES.dark), '--duration': '0.35s' }}
      >
        <Base.Popup
          data-slot="navigation-menu-popup"
          className={cn(
            'relative h-[var(--popup-height)] w-full origin-[var(--transform-origin)]',
            'overflow-hidden rounded-sm border rule shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)]',
            'backdrop-blur-md',
            'transition-[opacity,transform,width,height,scale,translate] duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
            'data-[starting-style]:opacity-0 data-[starting-style]:scale-95',
            'data-[ending-style]:opacity-0 data-[ending-style]:scale-95',
            className
          )}
          style={{
            // 92 per cent rather than solid: the bar itself is translucent and
            // blurred, and a solid panel hanging off it reads as a different
            // component that happens to be adjacent.
            backgroundColor: 'color-mix(in srgb, var(--surface) 92%, transparent)',
            color: 'var(--ink)',
          }}
          {...props}
        >
          <Base.Viewport className="relative h-full w-full overflow-hidden" />
        </Base.Popup>
      </Base.Positioner>
    </Base.Portal>
  );
}

function NavigationMenuLink({ className, ...props }) {
  return (
    <Base.Link
      data-slot="navigation-menu-link"
      className={cn(
        'block rounded-sm px-3 py-2 font-sans text-[0.8rem] font-light leading-snug',
        'no-underline outline-none transition-colors duration-200',
        'opacity-70 hover:opacity-100 focus-visible:opacity-100',
        'hover:text-[var(--accent)]',
        className
      )}
      {...props}
    />
  );
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
};
