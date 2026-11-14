import { useId, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  id,
  className,
  disabled,
  "aria-describedby": ariaDescribedBy,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  const describedBy = [
    ariaDescribedBy,
    error ? errorId : undefined,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  const inputBaseStyles =
    "h-9 w-full rounded-md border bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-foreground-muted transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-secondary";

  const inputStateStyles = error
    ? "border-danger focus:border-danger focus:ring-danger/20"
    : "border-border focus:border-ring focus:ring-ring/20";

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-foreground-secondary select-none"
        >
          {label}
        </label>
      )}

      <input
        {...props}
        id={inputId}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={[inputBaseStyles, inputStateStyles, className]
          .filter(Boolean)
          .join(" ")}
      />

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
