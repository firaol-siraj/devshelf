import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover active:bg-primary-hover/90 shadow-subtle border border-transparent",
  secondary:
    "bg-surface-secondary text-foreground hover:bg-surface-secondary/80 active:bg-surface-secondary/90 border border-border shadow-subtle",
  outline:
    "bg-transparent text-foreground hover:bg-surface-secondary hover:text-foreground active:bg-surface-secondary/80 border border-border",
  ghost:
    "bg-transparent text-foreground-secondary hover:bg-surface-secondary hover:text-foreground active:bg-surface-secondary/80 border border-transparent",
  danger:
    "bg-danger text-white hover:bg-danger/90 active:bg-danger/80 shadow-subtle border border-transparent",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-2.5 text-xs gap-1.5 rounded-md",
  md: "h-9 px-3.5 text-sm gap-2 rounded-md",
  lg: "h-10 px-4 text-sm gap-2.5 rounded-lg",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-colors select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading ? true : undefined}
      className={[baseStyles, variantStyles[variant], sizeStyles[size], className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg
            className="h-4 w-4 animate-spin shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
