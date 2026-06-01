import { cn } from "../../lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

/**
 * Button variants following the Melotech design language.
 *
 * Primary: white-on-black with clear active border.
 * Secondary: transparent glass with thin border.
 * Danger: soft red for destructive actions.
 */
export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-white text-bg-primary border border-white/40 hover:bg-white/90 hover:shadow-[0_0_12px_rgba(255,255,255,0.15)] active:scale-[0.98]",
  secondary:
    "bg-surface-glass text-text-primary border border-border-subtle hover:border-border-active hover:bg-white/[0.08] active:scale-[0.98]",
  danger:
    "bg-error/10 text-error border border-error/30 hover:bg-error/20 active:scale-[0.98]",
  ghost:
    "bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/[0.04]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {isLoading && (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
