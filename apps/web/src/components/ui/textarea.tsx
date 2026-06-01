import { cn } from "../../lib/utils";
import { TextareaHTMLAttributes, forwardRef } from "react";

/**
 * Textarea component styled for the dark Melotech aesthetic.
 *
 * Same translucent treatment as Input but with vertical resize.
 */
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-border-subtle bg-white/[0.04] px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary",
        "focus:border-border-active focus:outline-none focus:ring-1 focus:ring-border-active",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "min-h-[100px] resize-y",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
