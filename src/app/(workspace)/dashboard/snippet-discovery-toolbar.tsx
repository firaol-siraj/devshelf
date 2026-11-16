"use client";

import {
  useState,
  useEffect,
  useTransition,
  useId,
  type ChangeEvent,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  X,
  ArrowUpDown,
  RotateCcw,
  Code2,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Badge, { type BadgeVariant } from "@/components/ui/Badge";
import type { ProgrammingLanguage, SnippetStatus } from "@/types/snippet";

export interface SnippetDiscoveryToolbarProps {
  initialSearch?: string;
  initialStatus?: string;
  initialLanguage?: string;
  initialSort?: string;
  totalResults: number;
}

const statusOptions: Array<{ label: string; value: SnippetStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Published", value: "published" },
  { label: "Draft", value: "draft" },
  { label: "Archived", value: "archived" },
];

const languageOptions: Array<{ label: string; value: ProgrammingLanguage | "all" }> = [
  { label: "All Languages", value: "all" },
  { label: "TypeScript", value: "typescript" },
  { label: "JavaScript", value: "javascript" },
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "Go", value: "go" },
  { label: "PHP", value: "php" },
  { label: "SQL", value: "sql" },
];

const sortOptions = [
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
  { label: "Recently updated", value: "updated" },
  { label: "Alphabetical (A–Z)", value: "a-z" },
  { label: "Alphabetical (Z–A)", value: "z-a" },
];

const statusBadgeVariants: Record<string, BadgeVariant> = {
  published: "success",
  draft: "warning",
  archived: "default",
};

const languageLabels: Record<string, string> = {
  typescript: "TypeScript",
  javascript: "JavaScript",
  python: "Python",
  java: "Java",
  go: "Go",
  php: "PHP",
  sql: "SQL",
};

const sortLabels: Record<string, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  updated: "Recently updated",
  recently_updated: "Recently updated",
  "a-z": "Alphabetical (A–Z)",
  title_asc: "Alphabetical (A–Z)",
  "z-a": "Alphabetical (Z–A)",
  title_desc: "Alphabetical (Z–A)",
};

export default function SnippetDiscoveryToolbar({
  initialSearch = "",
  initialStatus = "all",
  initialLanguage = "all",
  initialSort = "newest",
  totalResults,
}: SnippetDiscoveryToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const searchInputId = useId();
  const languageSelectId = useId();
  const sortSelectId = useId();

  // Active filter state derived from URL or initial props
  const activeSearch =
    searchParams?.get("q") ?? searchParams?.get("search") ?? initialSearch;
  const activeStatus =
    searchParams?.get("status") ?? initialStatus;
  const activeLanguage =
    searchParams?.get("language") ?? initialLanguage;
  const activeSort =
    searchParams?.get("sort") ?? initialSort;

  const [searchTerm, setSearchTerm] = useState(activeSearch);
  const [prevActiveSearch, setPrevActiveSearch] = useState(activeSearch);

  // Sync internal search input state if external searchParam changes
  if (prevActiveSearch !== activeSearch) {
    setPrevActiveSearch(activeSearch);
    setSearchTerm(activeSearch);
  }

  // Navigate with updated search parameters
  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");

    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === "all" || (key === "sort" && value === "newest")) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    // Clean up alternative parameter name
    if (updates.q !== undefined) {
      params.delete("search");
    }

    const queryString = params.toString();
    const destination = queryString ? `${pathname}?${queryString}` : pathname;

    startTransition(() => {
      router.replace(destination, { scroll: false });
    });
  };

  // Debounced search input handler (300ms)
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed === activeSearch.trim()) {
      return;
    }

    const timer = setTimeout(() => {
      updateQuery({ q: trimmed || null });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    updateQuery({ q: null });
  };

  const handleStatusChange = (status: string) => {
    updateQuery({ status });
  };

  const handleLanguageChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateQuery({ language: e.target.value });
  };

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateQuery({ sort: e.target.value });
  };

  const handleClearAllFilters = () => {
    setSearchTerm("");
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  };

  const hasSearch = Boolean(activeSearch.trim());
  const hasStatusFilter = activeStatus !== "all";
  const hasLanguageFilter = activeLanguage !== "all";
  const hasSortFilter = activeSort !== "newest";

  const hasActiveFilters =
    hasSearch || hasStatusFilter || hasLanguageFilter || hasSortFilter;

  return (
    <div
      role="search"
      aria-label="Snippet discovery and filtering"
      className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-subtle transition-colors"
    >
      {/* Primary Row: Search Input + Language & Sort Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Input Box */}
        <div className="relative flex-1 min-w-[260px]">
          <Search
            size={16}
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none"
          />
          <input
            id={searchInputId}
            type="search"
            role="searchbox"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by title, description, language, or code..."
            aria-label="Search snippets"
            className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-9 text-xs text-foreground placeholder:text-foreground-muted transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search text"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-foreground-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Filter Controls Row: Language Select + Sort Select */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Language Selector */}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor={languageSelectId}
              className="text-xs font-medium text-foreground-secondary sr-only sm:not-sr-only"
            >
              <span className="flex items-center gap-1">
                <Code2 size={13} aria-hidden="true" className="text-foreground-muted" />
                <span>Language:</span>
              </span>
            </label>
            <select
              id={languageSelectId}
              aria-label="Filter by programming language"
              value={activeLanguage}
              onChange={handleLanguageChange}
              className="h-9 rounded-lg border border-border bg-surface px-2.5 text-xs text-foreground font-medium focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors cursor-pointer"
            >
              {languageOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor={sortSelectId}
              className="text-xs font-medium text-foreground-secondary sr-only sm:not-sr-only"
            >
              <span className="flex items-center gap-1">
                <ArrowUpDown size={13} aria-hidden="true" className="text-foreground-muted" />
                <span>Sort:</span>
              </span>
            </label>
            <select
              id={sortSelectId}
              aria-label="Sort snippets"
              value={activeSort}
              onChange={handleSortChange}
              className="h-9 rounded-lg border border-border bg-surface px-2.5 text-xs text-foreground font-medium focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors cursor-pointer"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Secondary Row: Status Filter Tabs / Pills */}
      <div className="flex flex-col gap-2 pt-1 border-t border-border/60 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="group"
          aria-label="Filter by status"
          className="flex flex-wrap items-center gap-1.5"
        >
          <span className="text-xs font-medium text-foreground-muted mr-1">
            Status:
          </span>
          {statusOptions.map((opt) => {
            const isActive = activeStatus === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleStatusChange(opt.value)}
                aria-pressed={isActive}
                className={[
                  "inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-primary text-white shadow-subtle"
                    : "bg-surface-secondary/70 text-foreground-secondary hover:bg-surface-secondary hover:text-foreground border border-border/50",
                ].join(" ")}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Pending Indicator & Result Count hint */}
        <div className="flex items-center gap-2 text-xs text-foreground-muted">
          {isPending && (
            <span
              role="status"
              aria-live="polite"
              className="inline-flex items-center gap-1.5 text-primary text-xs font-medium animate-pulse"
            >
              Updating...
            </span>
          )}
          <span>
            {totalResults} {totalResults === 1 ? "snippet" : "snippets"}
          </span>
        </div>
      </div>

      {/* Active Filter Indicators Banner */}
      {hasActiveFilters && (
        <div
          aria-label="Active filters"
          className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60 text-xs"
        >
          <span className="text-foreground-muted text-xs">Active filters:</span>

          {hasSearch && (
            <Badge
              variant="default"
              className="gap-1.5 py-0.5 px-2 font-normal text-[11px]"
            >
              <span>Search: &ldquo;{activeSearch}&rdquo;</span>
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Remove search filter"
                className="cursor-pointer hover:text-danger rounded p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <X size={11} aria-hidden="true" />
              </button>
            </Badge>
          )}

          {hasStatusFilter && (
            <Badge
              variant={statusBadgeVariants[activeStatus] ?? "default"}
              className="gap-1.5 py-0.5 px-2 font-normal text-[11px] capitalize"
            >
              <span>Status: {activeStatus}</span>
              <button
                type="button"
                onClick={() => updateQuery({ status: null })}
                aria-label="Remove status filter"
                className="cursor-pointer hover:text-danger rounded p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <X size={11} aria-hidden="true" />
              </button>
            </Badge>
          )}

          {hasLanguageFilter && (
            <Badge
              variant="info"
              className="gap-1.5 py-0.5 px-2 font-normal text-[11px] capitalize"
            >
              <span>Language: {languageLabels[activeLanguage] ?? activeLanguage}</span>
              <button
                type="button"
                onClick={() => updateQuery({ language: null })}
                aria-label="Remove language filter"
                className="cursor-pointer hover:text-danger rounded p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <X size={11} aria-hidden="true" />
              </button>
            </Badge>
          )}

          {hasSortFilter && (
            <Badge
              variant="default"
              className="gap-1.5 py-0.5 px-2 font-normal text-[11px]"
            >
              <span>Sort: {sortLabels[activeSort] ?? activeSort}</span>
              <button
                type="button"
                onClick={() => updateQuery({ sort: null })}
                aria-label="Reset sort to newest"
                className="cursor-pointer hover:text-danger rounded p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <X size={11} aria-hidden="true" />
              </button>
            </Badge>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearAllFilters}
            aria-label="Clear all active filters"
            className="h-6 px-2 text-[11px] text-foreground-secondary hover:text-danger transition-colors cursor-pointer"
          >
            <RotateCcw size={11} aria-hidden="true" />
            <span>Reset all</span>
          </Button>
        </div>
      )}
    </div>
  );
}
