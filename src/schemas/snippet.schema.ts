import { z } from "zod";

import {
  descriptionSchema,
  idSchema,
  titleSchema,
} from "@/lib/validations/common";

// Must match the Prisma ProgrammingLanguage enum.
export const programmingLanguageSchema = z.enum([
  "typescript",
  "javascript",
  "python",
  "java",
  "go",
  "php",
  "sql",
]);

// Must match the Prisma SnippetStatus enum.
export const snippetStatusSchema = z.enum([
  "draft",
  "published",
  "archived",
]);

// Schema for creating a snippet.
export const createSnippetSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  code: z
    .string()
    .min(1, "Code is required")
    .max(100_000, "Code is too large"),
  language: programmingLanguageSchema,
  status: snippetStatusSchema.default("draft"),
});

// Schema for updating a snippet.
export const updateSnippetSchema = createSnippetSchema
  .omit({ status: true })
  .extend({
    status: snippetStatusSchema.optional(),
  })
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided",
  );
// Data accepted before validation
export type CreateSnippetInput = z.input<
  typeof createSnippetSchema
>;

// Data produced after successful validation
export type CreateSnippetData = z.output<
  typeof createSnippetSchema
>;

// Data accepted for updates
export type UpdateSnippetInput = z.input<
  typeof updateSnippetSchema
>;

// Data produced after successful update validation
export type UpdateSnippetData = z.output<
  typeof updateSnippetSchema
>;

// Schema for updating a snippet from the edit form (includes snippet id)
export const updateSnippetFormSchema = z.object({
  id: idSchema,
  title: titleSchema,
  description: descriptionSchema,
  code: z
    .string()
    .min(1, "Code is required")
    .max(100_000, "Code is too large"),
  language: programmingLanguageSchema,
  status: snippetStatusSchema,
});

export type UpdateSnippetFormInput = z.input<
  typeof updateSnippetFormSchema
>;

export type UpdateSnippetFormData = z.output<
  typeof updateSnippetFormSchema
>;

// Schema for deleting a snippet.
export const deleteSnippetSchema = z.object({
  id: idSchema,
});

export type DeleteSnippetInput = z.input<
  typeof deleteSnippetSchema
>;

export type DeleteSnippetData = z.output<
  typeof deleteSnippetSchema
>;

// Supported sort options for snippet discovery
export const snippetSortSchema = z.enum([
  "newest",
  "oldest",
  "updated",
  "recently_updated",
  "a-z",
  "z-a",
  "title_asc",
  "title_desc",
]);

export type SnippetSortOption = z.infer<typeof snippetSortSchema>;

// Schema for querying, searching, filtering, and sorting snippets
export const snippetQuerySchema = z.object({
  q: z.string().trim().max(100, "Search query is too long").optional(),
  search: z.string().trim().max(100, "Search query is too long").optional(),
  status: z.union([snippetStatusSchema, z.literal("all")]).optional(),
  language: z.union([programmingLanguageSchema, z.literal("all")]).optional(),
  sort: snippetSortSchema.optional().default("newest"),
  limit: z.number().int().positive().max(100).optional(),
});

export type SnippetQueryInput = z.input<typeof snippetQuerySchema>;
export type SnippetQueryData = z.output<typeof snippetQuerySchema>;

export const ALL_PROGRAMMING_LANGUAGES = programmingLanguageSchema.options;
export const ALL_SNIPPET_STATUSES = snippetStatusSchema.options;
