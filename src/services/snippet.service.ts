import "server-only";

import {
  createSnippet as repositoryCreateSnippet,
  deleteSnippet as repositoryDeleteSnippet,
  findSnippetByIdAndUserId as repositoryFindSnippetByIdAndUserId,
  findSnippetsByUserId,
  updateSnippet as repositoryUpdateSnippet,
} from "@/repositories/snippet.repository";
import {
  createSnippetSchema,
  updateSnippetSchema,
  snippetQuerySchema,
  type CreateSnippetInput,
  type UpdateSnippetInput,
  type SnippetQueryInput,
} from "@/schemas/snippet.schema";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/errors/app-error";

const DEFAULT_SNIPPET_LIMIT = 20;

export async function createSnippet(userId: string, input: CreateSnippetInput) {
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    throw new UnauthorizedError("You must be logged in to create a snippet");
  }

  const validationResult = createSnippetSchema.safeParse(input);
  if (!validationResult.success) {
    throw new ValidationError(
      validationResult.error.issues[0]?.message ?? "Invalid snippet data",
    );
  }

  return repositoryCreateSnippet(userId.trim(), validationResult.data);
}

export async function getUserSnippets(
  userId: string,
  options?: SnippetQueryInput,
) {
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return [];
  }

  if (!options) {
    return findSnippetsByUserId(
      userId.trim(),
      DEFAULT_SNIPPET_LIMIT,
    );
  }

  const validationResult = snippetQuerySchema.safeParse(options);
  if (!validationResult.success) {
    throw new ValidationError(
      validationResult.error.issues[0]?.message ?? "Invalid query parameters",
    );
  }

  const limit = validationResult.data.limit ?? DEFAULT_SNIPPET_LIMIT;

  return findSnippetsByUserId(
    userId.trim(),
    limit,
    validationResult.data,
  );
}

export async function getSnippetById(id: string, userId: string) {
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    throw new UnauthorizedError("Authentication required");
  }

  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new ValidationError("Snippet ID is required");
  }

  const snippet = await repositoryFindSnippetByIdAndUserId(
    id.trim(),
    userId.trim(),
  );

  if (!snippet) {
    throw new NotFoundError("Snippet not found");
  }

  return snippet;
}

export async function updateSnippet(
  id: string,
  userId: string,
  input: UpdateSnippetInput,
) {
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    throw new UnauthorizedError("Authentication required");
  }

  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new ValidationError("Snippet ID is required");
  }

  const validationResult = updateSnippetSchema.safeParse(input);
  if (!validationResult.success) {
    throw new ValidationError(
      validationResult.error.issues[0]?.message ?? "Invalid snippet update data",
    );
  }

  const updated = await repositoryUpdateSnippet(
    id.trim(),
    userId.trim(),
    validationResult.data,
  );

  if (!updated) {
    throw new NotFoundError("Snippet not found");
  }

  return updated;
}

export async function deleteSnippet(
  id: string,
  userId: string,
): Promise<{ success: boolean }> {
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    throw new UnauthorizedError("Authentication required");
  }

  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new ValidationError("Snippet ID is required");
  }

  const deleted = await repositoryDeleteSnippet(id.trim(), userId.trim());

  if (!deleted) {
    throw new NotFoundError("Snippet not found");
  }

  return { success: true };
}
