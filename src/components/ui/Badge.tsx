import type { HTMLAttributes, ReactNode } from "react";

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "bg-surface-secondary text-foreground-secondary border-border",
  primary:
    "bg-primary/10 text-primary border-primary/20",
  info:
    "bg-primary/10 text-primary border-primary/20",
  success:
    "bg-success/10 text-success border-success/20",
  warning:
    "bg-warning/10 text-warning border-warning/20",
  danger:
    "bg-danger/10 text-danger border-danger/20",
};

export default function Badge({
  variant = "default",
  children,
  className,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border select-none transition-colors";

  return (
    <span
      {...props}
      className={[baseStyles, variantStyles[variant], className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
