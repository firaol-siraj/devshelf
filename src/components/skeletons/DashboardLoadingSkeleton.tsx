import SnippetPreviewSkeleton from "@/components/skeletons/SnippetPreviewSkeleton";

export interface DashboardLoadingSkeletonProps {
  count?: number;
  showHeader?: boolean;
  className?: string;
}

export default function DashboardLoadingSkeleton({
  count = 4,
  showHeader = true,
  className,
}: DashboardLoadingSkeletonProps) {
  return (
    <section
      role="status"
      aria-label="Loading snippets"
      className={["space-y-6", className].filter(Boolean).join(" ")}
    >
      {/* Screen-reader-only accessible status message */}
      <div className="sr-only" aria-live="polite">
        Loading your snippets...
      </div>

      {/* Optional Header Skeleton (used for route-level loading) */}
      {showHeader && (
        <div
          aria-hidden="true"
          className="space-y-2 animate-pulse motion-reduce:animate-none select-none"
        >
          <div className="h-7 w-40 rounded-md bg-surface-secondary" />
          <div className="h-4 w-64 rounded bg-surface-secondary" />
        </div>
      )}

      {/* Grid of Snippet Preview Skeletons */}
      <div
        aria-hidden="true"
        className="grid gap-5 md:grid-cols-2"
      >
        {Array.from({ length: count }).map((_, index) => (
          <SnippetPreviewSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}
