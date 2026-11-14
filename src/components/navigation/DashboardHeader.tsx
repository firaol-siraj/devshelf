"use client";

import type { ReactNode } from "react";
import { Menu, Code2 } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";

export interface DashboardHeaderProps {
  title: string;
  description?: string;
  onMenuClick?: () => void;
  className?: string;
  children?: ReactNode;
}

export default function DashboardHeader({
  title,
  description,
  onMenuClick,
  className,
  children,
}: DashboardHeaderProps) {
  return (
    <header
      aria-label="Workspace header"
      className={[
        "sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur-md transition-colors sm:px-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Left Section: Mobile Navigation, Brand & View Titles */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Navigation Trigger */}
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-secondary text-foreground-secondary hover:bg-surface-secondary/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background md:hidden cursor-pointer shrink-0 transition-colors"
          >
            <Menu size={18} aria-hidden="true" />
          </button>
        )}

        {/* Mobile-only Branding */}
        <div className="flex items-center gap-2 md:hidden shrink-0 select-none">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white shadow-subtle shrink-0">
            <Code2 size={15} aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            DevShelf
          </span>
          <span
            className="h-3.5 w-px bg-border mx-0.5"
            aria-hidden="true"
          />
        </div>

        {/* Title and Subtitle */}
        <div className="flex flex-col min-w-0">
          <h1 className="text-sm font-semibold tracking-tight text-foreground truncate">
            {title}
          </h1>
          {description && (
            <p className="text-xs text-foreground-muted truncate hidden sm:block">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Right Section: Actions & Theme Controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        {children}
        <ThemeToggle />
      </div>
    </header>
  );
}
