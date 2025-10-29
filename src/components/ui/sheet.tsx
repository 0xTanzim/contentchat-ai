/**
 * Sheet Component (Side Panel)
 * Based on Radix UI Dialog for sliding panels
 */

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import * as React from 'react';

const Sheet = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(({ children, open, onOpenChange, ...props }, ref) => {
  return (
    <div ref={ref} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { open, onOpenChange });
        }
        return child;
      })}
    </div>
  );
});
Sheet.displayName = 'Sheet';

const SheetTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(({ children, asChild, onOpenChange, ...props }, ref) => {
  const handleClick = () => {
    onOpenChange?.(true);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<unknown>, {
      ...props,
      onClick: handleClick,
    });
  }

  return (
    <button ref={ref} onClick={handleClick} {...props}>
      {children}
    </button>
  );
});
SheetTrigger.displayName = 'SheetTrigger';

const SheetContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    side?: 'top' | 'right' | 'bottom' | 'left';
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(
  (
    { className, children, side = 'right', open, onOpenChange, ...props },
    ref
  ) => {
    const sideClasses = {
      top: 'top-0 left-0 right-0 border-b',
      right: 'top-0 right-0 bottom-0 border-l',
      bottom: 'bottom-0 left-0 right-0 border-t',
      left: 'top-0 left-0 bottom-0 border-r',
    };

    const slideClasses = {
      top: open ? 'translate-y-0' : '-translate-y-full',
      right: open ? 'translate-x-0' : 'translate-x-full',
      bottom: open ? 'translate-y-0' : 'translate-y-full',
      left: open ? 'translate-x-0' : '-translate-x-full',
    };

    if (!open) return null;

    return (
      <>
        {/* Overlay */}
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in"
          onClick={() => onOpenChange?.(false)}
        />

        {/* Sheet Panel */}
        <div
          ref={ref}
          className={cn(
            'fixed z-50 bg-background shadow-xl transition-transform duration-300 ease-in-out',
            sideClasses[side],
            slideClasses[side],
            className
          )}
          {...props}
        >
          <button
            onClick={() => onOpenChange?.(false)}
            className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          {children}
        </div>
      </>
    );
  }
);
SheetContent.displayName = 'SheetContent';

const SheetHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col space-y-2 text-center sm:text-left',
      className
    )}
    {...props}
  />
));
SheetHeader.displayName = 'SheetHeader';

const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('text-lg font-semibold text-foreground', className)}
    {...props}
  />
));
SheetTitle.displayName = 'SheetTitle';

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger };
