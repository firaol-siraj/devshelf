import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export default function Card({
  children,
  className,
  ...props
}: CardProps) {
  const baseStyles =
    "rounded-xl border border-border bg-surface p-5 text-foreground shadow-subtle transition-colors";

  return (
    <div
      {...props}
      className={[baseStyles, className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}
