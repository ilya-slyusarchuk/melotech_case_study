import { cn } from "../../lib/utils";
import { LabelHTMLAttributes, forwardRef } from "react";

/**
 * Label component for form fields.
 *
 * Uses muted secondary text so labels do not compete with input values.
 */
export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "block text-xs font-medium uppercase tracking-wider text-text-secondary mb-1.5",
          className,
        )}
        {...props}
      />
    );
  },
);

Label.displayName = "Label";
