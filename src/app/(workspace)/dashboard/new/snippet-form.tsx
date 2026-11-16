"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, Code2, Terminal } from "lucide-react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { createSnippetAction } from "@/app/(workspace)/dashboard/actions";
import { initialCreateSnippetFormState } from "@/app/(workspace)/dashboard/types";
import type { ProgrammingLanguage } from "@/types/snippet";

const languageOptions: { value: ProgrammingLanguage; label: string }[] = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "go", label: "Go" },
  { value: "php", label: "PHP" },
  { value: "sql", label: "SQL" },
];

export default function SnippetForm() {
  const [state, formAction, isPending] = useActionState(
    createSnippetAction,
    initialCreateSnippetFormState,
  );

  const [selectedLanguage, setSelectedLanguage] =
    useState<ProgrammingLanguage>("typescript");

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {/* Global Form Error Banner */}
      {state.errors?.form && state.errors.form.length > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 rounded-lg border border-danger/20 bg-danger/10 p-4 text-sm text-danger"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-0.5">
            {state.errors.form.map((err) => (
              <p key={err}>{err}</p>
            ))}
          </div>
        </div>
      )}

      <Card className="space-y-5 p-6">
        {/* Title Input */}
        <div className="space-y-1">
          <Input
            id="title"
            name="title"
            type="text"
            label="Snippet Title *"
            placeholder="e.g., QuickSort implementation in TypeScript"
            required
            maxLength={120}
            disabled={isPending}
            error={state.errors?.title?.[0]}
            aria-describedby="title-help"
          />
          <p id="title-help" className="text-xs text-foreground-muted">
            A clear, searchable name for this code snippet (up to 120 characters).
          </p>
        </div>

        {/* Description Input */}
        <div className="space-y-1.5">
          <label
            htmlFor="description"
            className="text-xs font-medium text-foreground-secondary select-none"
          >
            Description <span className="text-foreground-muted">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            maxLength={500}
            disabled={isPending}
            placeholder="Briefly explain what this snippet does, any prerequisites, or usage instructions..."
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {state.errors?.description?.[0] && (
            <p className="text-xs text-danger" role="alert">
              {state.errors.description[0]}
            </p>
          )}
        </div>

        {/* Language and Status Selectors */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Language Selector */}
          <div className="space-y-1.5">
            <label
              htmlFor="language"
              className="text-xs font-medium text-foreground-secondary select-none"
            >
              Programming Language *
            </label>
            <div className="relative">
              <select
                id="language"
                name="language"
                value={selectedLanguage}
                onChange={(e) =>
                  setSelectedLanguage(e.target.value as ProgrammingLanguage)
                }
                disabled={isPending}
                className="h-9 w-full appearance-none rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {languageOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {state.errors?.language?.[0] && (
              <p className="text-xs text-danger" role="alert">
                {state.errors.language[0]}
              </p>
            )}
          </div>

          {/* Status Selector */}
          <div className="space-y-1.5">
            <label
              htmlFor="status"
              className="text-xs font-medium text-foreground-secondary select-none"
            >
              Publication Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue="draft"
              disabled={isPending}
              className="h-9 w-full appearance-none rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="draft">Draft (Work in progress)</option>
              <option value="published">Published (Ready for use)</option>
            </select>
            {state.errors?.status?.[0] && (
              <p className="text-xs text-danger" role="alert">
                {state.errors.status[0]}
              </p>
            )}
          </div>
        </div>

        {/* Code Content Editor / Textarea */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="code"
              className="text-xs font-medium text-foreground-secondary select-none"
            >
              Code Content *
            </label>
            <span className="text-[11px] font-mono text-foreground-muted uppercase">
              {selectedLanguage}
            </span>
          </div>

          <div className="rounded-lg border border-border bg-surface-secondary/40 overflow-hidden focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 transition-all">
            {/* Editor Header Bar */}
            <div className="flex items-center justify-between border-b border-border bg-surface-secondary/80 px-3 py-1.5 text-xs text-foreground-muted select-none">
              <div className="flex items-center gap-2 font-mono text-[11px]">
                {selectedLanguage === "sql" ? (
                  <Terminal size={13} aria-hidden="true" />
                ) : (
                  <Code2 size={13} aria-hidden="true" />
                )}
                <span className="font-semibold uppercase tracking-wider">
                  {selectedLanguage} editor
                </span>
              </div>
              <span className="text-[11px] text-foreground-muted">
                Plain text / UTF-8
              </span>
            </div>

            {/* Code Textarea */}
            <textarea
              id="code"
              name="code"
              required
              rows={12}
              spellCheck={false}
              disabled={isPending}
              placeholder={`// Write or paste your ${selectedLanguage} code here...`}
              className="w-full resize-y bg-transparent p-3.5 font-mono text-xs leading-relaxed text-foreground placeholder:text-foreground-muted/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {state.errors?.code?.[0] && (
            <p className="text-xs text-danger" role="alert">
              {state.errors.code[0]}
            </p>
          )}
        </div>
      </Card>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/dashboard"
          className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-surface px-4 text-xs font-medium text-foreground hover:bg-surface-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Cancel
        </Link>

        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isPending}
          disabled={isPending}
        >
          Save Snippet
        </Button>
      </div>
    </form>
  );
}
