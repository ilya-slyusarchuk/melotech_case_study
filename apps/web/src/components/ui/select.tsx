import { cn } from "../../lib/utils";
import { SelectHTMLAttributes, forwardRef } from "react";

/**
 * Select dropdown styled for the dark Melotech aesthetic.
 */
export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "w-full appearance-none rounded-lg border border-border-subtle bg-white/[0.04] px-4 py-2.5 pr-10 text-sm text-text-primary",
          "focus:border-border-active focus:outline-none focus:ring-1 focus:ring-border-active",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
});

Select.displayName = "Select";
