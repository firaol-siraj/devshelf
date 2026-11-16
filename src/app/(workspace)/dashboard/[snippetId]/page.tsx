import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Code2,
  Terminal,
  Calendar,
  Clock,
} from "lucide-react";

import { auth } from "@/auth";
import { getSnippetById } from "@/services/snippet.service";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";
import Badge, { type BadgeVariant } from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import type { ProgrammingLanguage, SnippetStatus } from "@/types/snippet";

import CopyCodeButton from "./copy-code-button";
import DeleteSnippetButton from "./delete-snippet-button";

export const metadata: Metadata = {
  title: "Snippet Details | DevShelf",
  description: "View snippet code, details, and metadata.",
};

const statusVariants: Record<SnippetStatus, BadgeVariant> = {
  draft: "warning",
  published: "success",
  archived: "default",
};

const languageLabels: Record<ProgrammingLanguage, string> = {
  typescript: "TypeScript",
  javascript: "JavaScript",
  python: "Python",
  java: "Java",
  go: "Go",
  php: "PHP",
  sql: "SQL",
};

export function formatSnippetDate(
  date: Date | string | null | undefined,
): { formatted: string; iso: string; isValid: boolean } {
  if (!date) {
    return { formatted: "Unknown", iso: "", isValid: false };
  }
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {
    return { formatted: "Unknown", iso: "", isValid: false };
  }
  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
    return { formatted, iso: d.toISOString(), isValid: true };
  } catch {
    return { formatted: "Unknown", iso: "", isValid: false };
  }
}

export interface SnippetDetailPageProps {
  params: Promise<{
    snippetId: string;
  }>;
}

export default async function SnippetDetailPage({ params }: SnippetDetailPageProps) {
  await connection();
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
    return null;
  }

  const { snippetId } = await params;

  let snippet;
  try {
    snippet = await getSnippetById(snippetId, session.user.id);
  } catch (error: unknown) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      notFound();
      return null;
    }
    throw error;
  }

  if (!snippet) {
    notFound();
    return null;
  }

  const languageLabel =
    languageLabels[snippet.language as ProgrammingLanguage] ?? snippet.language;
  const createdDate = formatSnippetDate(snippet.createdAt);
  const updatedDate = formatSnippetDate(snippet.updatedAt);
  const lineCount = snippet.code.split("\n").length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back to Dashboard Navigation Link */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-2 py-1 -ml-2"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Main Header / Info Card */}
      <Card className="p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={statusVariants[snippet.status as SnippetStatus] ?? "default"}
                className="capitalize"
              >
                {snippet.status}
              </Badge>
              <Badge variant="info">
                {languageLabel}
              </Badge>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl break-words">
              {snippet.title}
            </h1>

            {snippet.description ? (
              <p className="text-sm text-foreground-secondary leading-relaxed break-words">
                {snippet.description}
              </p>
            ) : (
              <p className="text-sm italic text-foreground-muted">
                No description provided.
              </p>
            )}
          </div>

          {/* Action buttons: Edit and Delete */}
          <div className="flex items-center gap-2 shrink-0 pt-1">
            <Link
              href={`/dashboard/${snippet.id}/edit`}
              className="inline-flex items-center justify-center font-medium transition-colors select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background h-8 px-2.5 text-xs gap-1.5 rounded-md border border-border bg-surface text-foreground hover:bg-surface-secondary shadow-subtle"
              aria-label={`Edit ${snippet.title}`}
            >
              <Pencil size={13} aria-hidden="true" />
              <span>Edit</span>
            </Link>

            <DeleteSnippetButton
              snippetId={snippet.id}
              snippetTitle={snippet.title}
            />
          </div>
        </div>

        {/* Snippet Metadata: Creation Date & Update Date */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-4 border-t border-border/70 text-xs text-foreground-muted">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} aria-hidden="true" className="text-foreground-muted shrink-0" />
            <span>Created</span>
            <time
              dateTime={createdDate.isValid ? createdDate.iso : undefined}
              className="font-medium text-foreground-secondary"
            >
              {createdDate.formatted}
            </time>
          </div>

          <span className="text-border hidden sm:inline" aria-hidden="true">•</span>

          <div className="flex items-center gap-1.5">
            <Clock size={14} aria-hidden="true" className="text-foreground-muted shrink-0" />
            <span>Updated</span>
            <time
              dateTime={updatedDate.isValid ? updatedDate.iso : undefined}
              className="font-medium text-foreground-secondary"
            >
              {updatedDate.formatted}
            </time>
          </div>

          <span className="text-border hidden sm:inline" aria-hidden="true">•</span>

          <span className="text-foreground-muted">
            {lineCount === 1 ? "1 line" : `${lineCount} lines`}
          </span>
        </div>
      </Card>

      {/* Code Container */}
      <section
        aria-labelledby="snippet-code-heading"
        className="flex flex-col rounded-xl border border-border bg-surface-secondary/40 overflow-hidden shadow-card"
      >
        {/* Code Header: Language and Copy Code Action */}
        <div className="flex items-center justify-between border-b border-border bg-surface-secondary/80 px-4 py-2.5">
          <div className="flex items-center gap-2 text-foreground-secondary">
            {snippet.language === "sql" ? (
              <Terminal
                size={15}
                className="text-foreground-muted shrink-0"
                aria-hidden="true"
              />
            ) : (
              <Code2
                size={15}
                className="text-foreground-muted shrink-0"
                aria-hidden="true"
              />
            )}
            <h2
              id="snippet-code-heading"
              className="font-mono text-xs font-semibold tracking-wide uppercase text-foreground-secondary"
            >
              {languageLabel}
            </h2>
          </div>

          <CopyCodeButton
            code={snippet.code}
            snippetTitle={snippet.title}
          />
        </div>

        {/* Code Content */}
        <pre
          tabIndex={0}
          aria-label={`${languageLabel} code for ${snippet.title}`}
          className="overflow-x-auto p-4 sm:p-5 font-mono text-sm leading-relaxed text-foreground scrollbar-thin focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <code className="block whitespace-pre min-w-full font-mono">{snippet.code}</code>
        </pre>
      </section>
    </div>
  );
}
