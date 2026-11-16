import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { getSnippetById } from "@/services/snippet.service";
import { NotFoundError } from "@/lib/errors/app-error";
import EditSnippetForm from "./edit-snippet-form";

export const metadata: Metadata = {
  title: "Edit Snippet | DevShelf",
  description: "Update snippet code, language, and details.",
};

interface EditSnippetPageProps {
  params: Promise<{
    snippetId: string;
  }>;
}

export default async function EditSnippetPage({ params }: EditSnippetPageProps) {
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
    if (error instanceof NotFoundError) {
      notFound();
      return null;
    }
    throw error;
  }

  if (!snippet) {
    notFound();
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
            Edit Snippet
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Update your saved code snippet and settings.
          </p>
        </div>
      </div>

      <EditSnippetForm snippet={snippet} />
    </div>
  );
}
