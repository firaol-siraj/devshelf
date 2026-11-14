import { Suspense } from "react";
import SnippetPreview from "@/components/previews/SnippetPreview";
import {
  NoSnippetsEmptyState,
  NoSearchResultsEmptyState,
  NoLanguageMatchesEmptyState,
} from "@/components/empty-states/EmptyState";
import DashboardLoadingSkeleton from "@/components/skeletons/DashboardLoadingSkeleton";
import SnippetValidationForm from "@/components/forms/SnippetValidationForm";
import type { Snippet } from "@/types/snippet";

const sampleSnippets: Snippet[] = [
  {
    id: "snippet-1",
    title: "TypeScript Generic Function",
    description: "A reusable function that preserves the input type.",
    language: "typescript",
    code: `function identity<T>(value: T): T {
  return value;
}

const result = identity("DevShelf");`,
    status: "published",
    createdAt: "2026-11-01T10:00:00.000Z",
    updatedAt: "2026-11-10T08:00:00.000Z",
  },
  {
    id: "snippet-2",
    title: "Python List Comprehension",
    description: "Create a list of squared numbers.",
    language: "python",
    code: `numbers = [1, 2, 3, 4, 5]
squares = [number ** 2 for number in numbers]

print(squares)`,
    status: "draft",
    createdAt: "2026-11-02T10:00:00.000Z",
    updatedAt: "2026-11-09T12:00:00.000Z",
  },
];

interface DashboardPageProps {
  searchParams?: Promise<{
    q?: string;
    language?: string;
  }>;
}

export default function DashboardPage({ searchParams }: DashboardPageProps) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Your Snippets
        </h2>
        <p className="mt-1 text-sm text-foreground-secondary">
          Your saved and reusable code snippets.
        </p>
      </div>

	<SnippetValidationForm />
      <Suspense fallback={<DashboardLoadingSkeleton showHeader={false} count={4} />}>
        <SnippetContent searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function SnippetContent({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    language?: string;
  }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const query = resolvedParams.q?.trim().toLowerCase();
  const language = resolvedParams.language?.trim().toLowerCase();

  // 1. First-time onboarding: collection has zero snippets
  if (sampleSnippets.length === 0) {
    return <NoSnippetsEmptyState />;
  }

  // 2. Filter sample snippets by query and language
  let filtered = sampleSnippets;

  if (query) {
    filtered = filtered.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
	(s.description ?? "").toLowerCase().includes(query) ||
        s.code.toLowerCase().includes(query)
    );
  }

  if (language) {
    filtered = filtered.filter(
      (s) => s.language.toLowerCase() === language
    );
  }

  // 3. Filtered results empty states
  if (filtered.length === 0) {
    if (query) {
      return <NoSearchResultsEmptyState query={resolvedParams.q} />;
    }
    if (language) {
      return <NoLanguageMatchesEmptyState language={resolvedParams.language} />;
    }
    return <NoSearchResultsEmptyState />;
  }

  // 4. Populated snippet grid
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {filtered.map((snippet) => (
        <SnippetPreview key={snippet.id} snippet={snippet} />
      ))}
    </div>
  );
}
