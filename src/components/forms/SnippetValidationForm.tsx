"use client";

import { useActionState } from "react";

import {
  validateSnippetAction,
  type SnippetFormState,
} from "@/app/(workspace)/dashboard/actions";

const initialState: SnippetFormState = {
  success: false,
  message: "",
};

export default function SnippetValidationForm() {
  const [state, formAction, isPending] = useActionState(
    validateSnippetAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-border bg-card p-5"
    >
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Test snippet validation
        </h3>

        <p className="mt-1 text-sm text-foreground-secondary">
          This form validates input on the server. It does not save anything.
        </p>
      </div>

      <div>
        <label
          htmlFor="title"
          className="mb-1 block text-sm font-medium"
        >
          Title
        </label>

        <input
          id="title"
          name="title"
          required
          maxLength={120}
          className="w-full rounded-lg border border-border bg-background px-3 py-2"
          placeholder="My TypeScript snippet"
        />

        {state.errors?.title?.map((error) => (
          <p key={error} className="mt-1 text-sm text-red-500">
            {error}
          </p>
        ))}
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-1 block text-sm font-medium"
        >
          Description
        </label>

        <input
          id="description"
          name="description"
          maxLength={500}
          className="w-full rounded-lg border border-border bg-background px-3 py-2"
          placeholder="What does this snippet do?"
        />

        {state.errors?.description?.map((error) => (
          <p key={error} className="mt-1 text-sm text-red-500">
            {error}
          </p>
        ))}
      </div>

      <div>
        <label
          htmlFor="language"
          className="mb-1 block text-sm font-medium"
        >
          Language
        </label>

        <select
          id="language"
          name="language"
          required
          defaultValue="typescript"
          className="w-full rounded-lg border border-border bg-background px-3 py-2"
        >
          <option value="typescript">TypeScript</option>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="go">Go</option>
          <option value="php">PHP</option>
          <option value="sql">SQL</option>
        </select>

        {state.errors?.language?.map((error) => (
          <p key={error} className="mt-1 text-sm text-red-500">
            {error}
          </p>
        ))}
      </div>

      <div>
        <label
          htmlFor="code"
          className="mb-1 block text-sm font-medium"
        >
          Code
        </label>

        <textarea
          id="code"
          name="code"
          required
          rows={5}
          maxLength={100_000}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
          placeholder="const greeting = 'Hello DevShelf';"
        />

        {state.errors?.code?.map((error) => (
          <p key={error} className="mt-1 text-sm text-red-500">
            {error}
          </p>
        ))}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {isPending ? "Validating..." : "Validate snippet"}
      </button>

      {state.message && (
        <p
          aria-live="polite"
          className={`text-sm ${
            state.success ? "text-green-600" : "text-red-500"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
