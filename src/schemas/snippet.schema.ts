import { z } from "zod";

import {
  descriptionSchema,
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
