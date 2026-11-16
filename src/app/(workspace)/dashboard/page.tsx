import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { Code2, FileCode, CheckCircle2, Clock, Plus } from "lucide-react";

import { auth } from "@/auth";
import { getUserSnippets } from "@/services/snippet.service";
import { ValidationError } from "@/lib/errors/app-error";
import SnippetPreview from "@/components/previews/SnippetPreview";
import {
  NoSnippetsEmptyState,
  NoSearchResultsEmptyState,
} from "@/components/empty-states/EmptyState";
import Card from "@/components/ui/Card";
import type {
  Snippet,
  ProgrammingLanguage,
  SnippetStatus,
  SnippetSortOption,
} from "@/types/snippet";
import SnippetDiscoveryToolbar from "./snippet-discovery-toolbar";

export const metadata: Metadata = {
  title: "Dashboard | DevShelf",
  description: "View and manage your saved code snippets.",
};

export interface DashboardPageProps {
  searchParams?: Promise<{
    q?: string | string[];
    search?: string | string[];
    status?: string | string[];
    language?: string | string[];
    sort?: string | string[];
  }>;
}

export default async function DashboardPage(props?: DashboardPageProps) {
  await connection();
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
    return null;
  }

  const resolvedSearchParams = props?.searchParams
    ? await props.searchParams
    : {};

  const rawQ =
    typeof resolvedSearchParams.q === "string"
      ? resolvedSearchParams.q
      : typeof resolvedSearchParams.search === "string"
      ? resolvedSearchParams.search
      : undefined;

  const rawStatus =
    typeof resolvedSearchParams.status === "string"
      ? resolvedSearchParams.status
      : undefined;

  const rawLanguage =
    typeof resolvedSearchParams.language === "string"
      ? resolvedSearchParams.language
      : undefined;

  const rawSort =
    typeof resolvedSearchParams.sort === "string"
      ? resolvedSearchParams.sort
      : undefined;

  const cleanQuery = rawQ?.trim();
  const hasActiveFilters = Boolean(
    cleanQuery ||
      (rawStatus && rawStatus !== "all") ||
      (rawLanguage && rawLanguage !== "all") ||
      (rawSort && rawSort !== "newest"),
  );

  const hasExplicitQueryParams = Boolean(
    rawQ !== undefined ||
      rawStatus !== undefined ||
      rawLanguage !== undefined ||
      rawSort !== undefined,
  );

  let rawSnippets;
  if (!hasExplicitQueryParams) {
    // Preserve exact legacy call signature when no searchParams were provided
    rawSnippets = await getUserSnippets(session.user.id);
  } else {
    try {
      rawSnippets = await getUserSnippets(session.user.id, {
        q: cleanQuery || undefined,
        status: (rawStatus as SnippetStatus | "all") || undefined,
        language: (rawLanguage as ProgrammingLanguage | "all") || undefined,
        sort: (rawSort as SnippetSortOption) || "newest",
      });
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        // Fallback to default user snippets if query parameters are malformed
        rawSnippets = await getUserSnippets(session.user.id);
      } else {
        throw error;
      }
    }
  }

  const snippets: Snippet[] = rawSnippets.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    code: s.code,
    language: s.language as ProgrammingLanguage,
    status: s.status as SnippetStatus,
    createdAt:
      s.createdAt instanceof Date
        ? s.createdAt.toISOString()
        : String(s.createdAt),
    updatedAt:
      s.updatedAt instanceof Date
        ? s.updatedAt.toISOString()
        : String(s.updatedAt),
  }));

  const totalSnippets = snippets.length;
  const publishedCount = snippets.filter(
    (s) => s.status === "published",
  ).length;
  const draftCount = snippets.filter((s) => s.status === "draft").length;
  const uniqueLanguagesCount = new Set(snippets.map((s) => s.language)).size;

  const displayName = session.user.name ?? "Developer";

  return (
    <div className="space-y-8">
      {/* Welcome Banner & Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome back, {displayName}
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Manage and organize your personal developer library.
          </p>
        </div>

        {/* Create new snippet action button */}
        <div className="shrink-0">
          <Link
            href="/dashboard/new"
            aria-label="Create new snippet"
            className="inline-flex items-center justify-center font-medium transition-colors select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background h-8 px-3 text-xs gap-1.5 rounded-md shadow-subtle bg-primary text-white hover:bg-primary-hover active:bg-primary-hover/90"
          >
            <Plus size={16} aria-hidden="true" />
            <span>New Snippet</span>
          </Link>
        </div>
      </div>

      {/* Metrics Section: Computed strictly from user's actual retrieved records */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-foreground-secondary">
            <FileCode
              size={16}
              className="text-primary shrink-0"
              aria-hidden="true"
            />
            <span className="text-xs font-medium">Total Snippets</span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {totalSnippets}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-foreground-secondary">
            <CheckCircle2
              size={16}
              className="text-success shrink-0"
              aria-hidden="true"
            />
            <span className="text-xs font-medium">Published</span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {publishedCount}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-foreground-secondary">
            <Clock
              size={16}
              className="text-warning shrink-0"
              aria-hidden="true"
            />
            <span className="text-xs font-medium">Drafts</span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {draftCount}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-foreground-secondary">
            <Code2 size={16} className="text-info shrink-0" aria-hidden="true" />
            <span className="text-xs font-medium">Languages</span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {uniqueLanguagesCount}
          </p>
        </Card>
      </div>

      {/* Snippet Discovery Toolbar: Search, Filters, Sorting */}
      <Suspense
        fallback={
          <div className="h-28 w-full animate-pulse rounded-xl border border-border bg-surface" />
        }
      >
        <SnippetDiscoveryToolbar
          initialSearch={cleanQuery}
          initialStatus={rawStatus}
          initialLanguage={rawLanguage}
          initialSort={rawSort}
          totalResults={totalSnippets}
        />
      </Suspense>

      {/* Snippet Listing Section */}
      <section aria-labelledby="recent-snippets-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2
              id="recent-snippets-heading"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              {hasActiveFilters ? "Search Results" : "Recent Snippets"}
            </h2>
            <p className="text-xs text-foreground-muted">
              {hasActiveFilters
                ? `Showing ${totalSnippets} ${totalSnippets === 1 ? "result" : "results"}`
                : `${totalSnippets} ${totalSnippets === 1 ? "snippet" : "snippets"}`}
            </p>
          </div>
        </div>

        {totalSnippets === 0 ? (
          hasActiveFilters ? (
            <NoSearchResultsEmptyState query={cleanQuery} />
          ) : (
            <NoSnippetsEmptyState />
          )
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {snippets.map((snippet) => (
              <SnippetPreview key={snippet.id} snippet={snippet} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
