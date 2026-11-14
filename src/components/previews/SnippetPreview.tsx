"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Check, AlertCircle, Code2, Terminal, Clock } from "lucide-react";

import Card from "@/components/ui/Card";
import Badge, { type BadgeVariant } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { Snippet, SnippetStatus, ProgrammingLanguage } from "@/types/snippet";

export interface SnippetPreviewProps {
  snippet: Snippet;
  className?: string;
}

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


function formatUpdatedDate(dateString: string): { formatted: string; isValid: boolean } {
  if (!dateString || typeof dateString !== "string") {
    return { formatted: "Unknown", isValid: false };
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return { formatted: "Unknown", isValid: false };
  }
  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
    return { formatted, isValid: true };
  } catch {
    return { formatted: "Unknown", isValid: false };
  }
}

type CopyStatus = "idle" | "copying" | "success" | "error";

export default function SnippetPreview({
  snippet,
  className,
}: SnippetPreviewProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up any pending timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    // Prevent repeated clicks while copying
    if (copyStatus === "copying") return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setCopyStatus("copying");
    setErrorMessage("");

    try {
      if (
        typeof window === "undefined" ||
        !navigator?.clipboard ||
        typeof navigator.clipboard.writeText !== "function"
      ) {
        throw new Error("Clipboard API is unavailable in this environment");
      }

      await navigator.clipboard.writeText(snippet.code);
      setCopyStatus("success");

      timerRef.current = setTimeout(() => {
        setCopyStatus("idle");
      }, 2000);
    } catch {
      setCopyStatus("error");
      setErrorMessage("Unable to copy. Select the code manually.");

      timerRef.current = setTimeout(() => {
        setCopyStatus("idle");
        setErrorMessage("");
      }, 3500);
    }
  };

  const languageLabel = languageLabels[snippet.language] ?? snippet.language;
  const dateInfo = formatUpdatedDate(snippet.updatedAt);

  return (
    <Card className={["flex flex-col gap-4 min-w-0 overflow-hidden", className].filter(Boolean).join(" ")}>
      {/* Header: Title and Status Badge */}
      <div className="flex items-start justify-between gap-3 min-w-0">
        <h3
          title={snippet.title}
          className="text-base font-semibold tracking-tight text-foreground truncate min-w-0 flex-1"
        >
          {snippet.title}
        </h3>

        <Badge
          variant={statusVariants[snippet.status] ?? "default"}
          className="shrink-0 capitalize"
        >
          {snippet.status}
        </Badge>
      </div>

      {/* Description */}
      {snippet.description && (
        <p className="text-sm text-foreground-secondary line-clamp-2 leading-relaxed break-words">
          {snippet.description}
        </p>
      )}

      {/* Code Container */}
      <div className="flex flex-col rounded-lg border border-border bg-surface-secondary/40 overflow-hidden min-w-0">
        {/* Code Header: Language Info and Copy Action */}
        <div className="flex items-center justify-between border-b border-border bg-surface-secondary/80 px-3 py-1.5 min-w-0">
          <div className="flex items-center gap-2 min-w-0 text-foreground-secondary">
            {snippet.language === "sql" ? (
              <Terminal
                size={14}
                className="text-foreground-muted shrink-0"
                aria-hidden="true"
              />
            ) : (
              <Code2
                size={14}
                className="text-foreground-muted shrink-0"
                aria-hidden="true"
              />
            )}
            <span className="font-mono text-[11px] font-medium tracking-wide uppercase truncate">
              {languageLabel}
            </span>
          </div>

          <Button
            type="button"
            variant={copyStatus === "success" ? "secondary" : "ghost"}
            size="sm"
            onClick={handleCopy}
            disabled={copyStatus === "copying"}
            aria-label={
              copyStatus === "success"
                ? "Code copied to clipboard"
                : copyStatus === "error"
                ? "Unable to copy code to clipboard"
                : `Copy code for ${snippet.title}`
            }
            title={
              copyStatus === "success"
                ? "Copied to clipboard"
                : copyStatus === "error"
                ? "Unable to copy"
                : "Copy code"
            }
            className={[
              "h-7 px-2.5 text-xs font-mono transition-colors motion-reduce:transition-none cursor-pointer",
              copyStatus === "success" && "text-success border-success/30 bg-success/10 hover:bg-success/15 hover:text-success",
              copyStatus === "error" && "text-danger border-danger/30 bg-danger/10 hover:bg-danger/15 hover:text-danger",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {copyStatus === "success" ? (
              <>
                <Check size={13} className="text-success shrink-0" aria-hidden="true" />
                <span className="text-success font-medium">Copied!</span>
              </>
            ) : copyStatus === "error" ? (
              <>
                <AlertCircle size={13} className="text-danger shrink-0" aria-hidden="true" />
                <span className="text-danger font-medium">Failed</span>
              </>
            ) : (
              <>
                <Copy size={13} className="text-foreground-muted shrink-0" aria-hidden="true" />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>

        {/* Code Content */}
        <pre
          tabIndex={0}
          aria-label={`${languageLabel} code for ${snippet.title}`}
          className="overflow-x-auto p-3.5 font-mono text-xs leading-relaxed text-foreground scrollbar-thin focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <code className="block whitespace-pre min-w-full font-mono">{snippet.code}</code>
        </pre>
      </div>

      {/* Accessible Copy Error Message */}
      {copyStatus === "error" && errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-danger/20 bg-danger/10 px-3 py-1.5 text-xs text-danger transition-colors motion-reduce:transition-none"
        >
          <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Visually Hidden Aria-Live Status Announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {copyStatus === "success" && "Code copied to clipboard."}
        {copyStatus === "error" && errorMessage}
      </div>

      {/* Footer: Language Badge and Updated Date */}
      <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/60 text-xs text-foreground-muted min-w-0">
        <Badge variant="info" className="text-[11px] font-normal">
          {languageLabel}
        </Badge>

        <time
          dateTime={dateInfo.isValid ? snippet.updatedAt : undefined}
          className="flex items-center gap-1.5 text-xs text-foreground-muted shrink-0"
        >
          <Clock size={12} aria-hidden="true" className="shrink-0 text-foreground-muted" />
          <span>Updated {dateInfo.formatted}</span>
        </time>
      </div>
    </Card>
  );
}
