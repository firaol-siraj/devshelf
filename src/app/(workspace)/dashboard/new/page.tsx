import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import SnippetForm from "./snippet-form";

export const metadata: Metadata = {
  title: "New Snippet | DevShelf",
  description: "Create and save a new reusable code snippet.",
};

export default async function NewSnippetPage() {
  await connection();
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Navigation / Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground-secondary hover:bg-surface-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Create Snippet
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Save a code snippet to your personal developer shelf.
          </p>
        </div>
      </div>

      <SnippetForm />
    </div>
  );
}
