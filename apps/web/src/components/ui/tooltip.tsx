"use client";

import { useState, type ReactNode, forwardRef } from "react";
import { cn } from "../../lib/utils";

/**
 * Minimal glass tooltip that appears above its trigger on hover or focus.
 *
 * Uses React state instead of an external library to keep the bundle small.
 * The tooltip panel follows the Melotech glass aesthetic.
 */
export interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  className?: string;
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ children, content, className }, ref) => {
    const [open, setOpen] = useState(false);

    return (
      <div
        ref={ref}
        className={cn("relative flex", className)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
        {open && (
          <div
            className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border-subtle bg-surface-glass px-3 py-1.5 text-xs text-text-primary shadow-lg backdrop-blur-sm"
            role="tooltip"
          >
            {content}
          </div>
        )}
      </div>
    );
  },
);

Tooltip.displayName = "Tooltip";
