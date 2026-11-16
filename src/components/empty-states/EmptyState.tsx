import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { FolderCode, SearchX, FilterX, RotateCcw, Plus } from "lucide-react";
import Button, { type ButtonVariant } from "@/components/ui/Button";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  variant?: ButtonVariant;
  icon?: LucideIcon;
  ariaLabel?: string;
}

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  titleLevel?: "h2" | "h3" | "h4";
  children?: ReactNode;
}

function ActionButton({
  action,
  defaultVariant,
}: {
  action: EmptyStateAction;
  defaultVariant: ButtonVariant;
}) {
  const Icon = action.icon;
  const variant = action.variant ?? defaultVariant;

  if (action.href && !action.disabled) {
    const isPrimary = variant === "primary";
    return (
      <Link
        href={action.href}
        aria-label={action.ariaLabel}
        className={[
          "inline-flex items-center justify-center font-medium transition-colors select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background h-8 px-3 text-xs gap-1.5 rounded-md shadow-subtle",
          isPrimary
            ? "bg-primary text-white hover:bg-primary-hover active:bg-primary-hover/90 border border-transparent"
            : "bg-surface-secondary text-foreground hover:bg-surface-secondary/80 active:bg-surface-secondary/90 border border-border",
        ].join(" ")}
      >
        {Icon && <Icon size={14} aria-hidden="true" className="shrink-0" />}
        <span>{action.label}</span>
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      onClick={action.onClick}
      disabled={action.disabled}
      aria-label={action.ariaLabel}
    >
      {Icon && <Icon size={14} aria-hidden="true" className="shrink-0" />}
      <span>{action.label}</span>
    </Button>
  );
}

export default function EmptyState({
  title,
  description,
  icon: Icon,
  primaryAction,
  secondaryAction,
  className,
  titleLevel = "h3",
  children,
}: EmptyStateProps) {
  const HeadingTag = titleLevel;

  return (
    <div
      role="status"
      aria-label={title}
      className={[
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 px-6 py-12 text-center sm:px-12 sm:py-16 transition-colors",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {Icon && (
        <div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-secondary text-foreground-secondary shadow-subtle select-none"
          aria-hidden="true"
        >
          <Icon size={22} className="text-foreground-secondary" />
        </div>
      )}

      <HeadingTag className="text-base font-semibold tracking-tight text-foreground">
        {title}
      </HeadingTag>

      <p className="mt-2 max-w-sm text-sm leading-relaxed text-foreground-secondary">
        {description}
      </p>

      {(primaryAction || secondaryAction || children) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {primaryAction && (
            <ActionButton action={primaryAction} defaultVariant="primary" />
          )}
          {secondaryAction && (
            <ActionButton action={secondaryAction} defaultVariant="secondary" />
          )}
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Empty State A: First-time onboarding when collection has zero snippets
 */
export interface NoSnippetsEmptyStateProps {
  onCreateSnippet?: () => void;
  createHref?: string;
  className?: string;
}

export function NoSnippetsEmptyState({
  onCreateSnippet,
  createHref = "/dashboard/new",
  className,
}: NoSnippetsEmptyStateProps) {
  return (
    <EmptyState
      icon={FolderCode}
      title="Your shelf is waiting"
      description="Start building your personal developer library. Save useful code snippets and keep your favorite solutions organized in one place."
      primaryAction={{
        label: "Create your first snippet",
        icon: Plus,
        href: onCreateSnippet ? undefined : createHref,
        onClick: onCreateSnippet,
        ariaLabel: "Create your first snippet",
      }}
      className={className}
    />
  );
}

/**
 * Empty State B: Search returns zero results
 */
export interface NoSearchResultsEmptyStateProps {
  query?: string;
  onClearSearch?: () => void;
  className?: string;
}

export function NoSearchResultsEmptyState({
  query,
  onClearSearch,
  className,
}: NoSearchResultsEmptyStateProps) {
  return (
    <EmptyState
      icon={SearchX}
      title="No snippets found"
      description={
        query
          ? `We couldn't find any snippets matching "${query}". Try a different keyword.`
          : "We couldn't find any snippets matching your search. Try a different keyword."
      }
      secondaryAction={{
        label: "Clear search",
        icon: RotateCcw,
        href: onClearSearch ? undefined : "/dashboard",
        onClick: onClearSearch,
        ariaLabel: "Clear search query and view all snippets",
      }}
      className={className}
    />
  );
}

/**
 * Empty State C: Language filter returns zero results
 */
export interface NoLanguageMatchesEmptyStateProps {
  language?: string;
  onClearFilter?: () => void;
  className?: string;
}

export function NoLanguageMatchesEmptyState({
  language,
  onClearFilter,
  className,
}: NoLanguageMatchesEmptyStateProps) {
  return (
    <EmptyState
      icon={FilterX}
      title="No matching snippets"
      description={
        language
          ? `There are no snippets available for ${language} yet.`
          : "There are no snippets available for this programming language yet."
      }
      secondaryAction={{
        label: "Clear filter",
        icon: RotateCcw,
        href: onClearFilter ? undefined : "/dashboard",
        onClick: onClearFilter,
        ariaLabel: "Clear language filter and view all snippets",
      }}
      className={className}
    />
  );
}
