import { cn } from "../../lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

/**
 * Input component styled for the dark Melotech aesthetic.
 *
 * Uses a translucent background with a thin border.
 * Focus state brightens the border.
 */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-lg border border-border-subtle bg-white/[0.04] px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary",
          "focus:border-border-active focus:outline-none focus:ring-1 focus:ring-border-active",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
