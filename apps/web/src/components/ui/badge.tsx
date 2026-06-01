import { cn } from "../../lib/utils";
import { HTMLAttributes, forwardRef } from "react";

/**
 * Badge / chip component following the Melotech design language.
 *
 * Used for platform names, statuses, regions, age ranges, gender,
 * and source labels. Small, uppercase, thin border, muted background.
 */
export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "processing"
  | "cache"
  | "spotify"
  | "tiktok"
  | "youtube";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "border-border-subtle bg-white/[0.06] text-text-secondary",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  error: "border-error/30 bg-error/10 text-error",
  processing: "border-processing/30 bg-processing/10 text-processing",
  cache: "border-cache/30 bg-cache/10 text-cache",
  spotify: "border-spotify/30 bg-spotify/10 text-spotify",
  tiktok: "border-tiktok/30 bg-tiktok/10 text-tiktok",
  youtube: "border-youtube/30 bg-youtube/10 text-youtube",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
          variantStyles[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Badge.displayName = "Badge";
