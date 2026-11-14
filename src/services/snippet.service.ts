import "server-only";

import { findSnippetsByUserId } from "@/repositories/snippet.repository";

const DEFAULT_SNIPPET_LIMIT = 20;

export async function getUserSnippets(userId: string) {
  return findSnippetsByUserId(
    userId,
    DEFAULT_SNIPPET_LIMIT,
  );
}
