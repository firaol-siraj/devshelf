import Card from "@/components/ui/Card";

export interface SnippetPreviewSkeletonProps {
  className?: string;
}

export default function SnippetPreviewSkeleton({
  className,
}: SnippetPreviewSkeletonProps) {
  return (
    <Card
      aria-hidden="true"
      className={[
        "flex flex-col gap-4 min-w-0 overflow-hidden animate-pulse motion-reduce:animate-none select-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Header: Title and Status Badge Skeletons */}
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="h-5 w-3/5 rounded-md bg-surface-secondary" />
        <div className="h-5 w-16 shrink-0 rounded-full bg-surface-secondary" />
      </div>

      {/* Description Skeleton (Two lines) */}
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-surface-secondary" />
        <div className="h-4 w-4/5 rounded bg-surface-secondary" />
      </div>

      {/* Code Container Skeleton */}
      <div className="flex flex-col rounded-lg border border-border bg-surface-secondary/40 overflow-hidden min-w-0">
        {/* Code Header: Language Info and Action Skeletons */}
        <div className="flex items-center justify-between border-b border-border bg-surface-secondary/80 px-3 py-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 rounded bg-surface-secondary" />
            <div className="h-3 w-16 rounded bg-surface-secondary" />
          </div>
          <div className="h-6 w-14 rounded bg-surface-secondary" />
        </div>

        {/* Code Content Skeleton Lines */}
        <div className="space-y-2.5 p-3.5 font-mono">
          <div className="h-3 w-3/4 rounded bg-surface-secondary/80" />
          <div className="h-3 w-1/2 rounded bg-surface-secondary/80" />
          <div className="h-3 w-5/6 rounded bg-surface-secondary/80" />
          <div className="h-3 w-2/5 rounded bg-surface-secondary/80" />
        </div>
      </div>

      {/* Footer: Language Badge and Date Skeletons */}
      <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/60 min-w-0">
        <div className="h-4 w-16 rounded-full bg-surface-secondary" />
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="h-3 w-3 rounded-full bg-surface-secondary" />
          <div className="h-3 w-20 rounded bg-surface-secondary" />
        </div>
      </div>
    </Card>
  );
}
