"use server";

import { createSnippetSchema } from "@/schemas/snippet.schema";

export type SnippetFormState = {
  success: boolean;
  message: string;
  errors?: {
    title?: string[];
    description?: string[];
    code?: string[];
    language?: string[];
  };
};

export async function validateSnippetAction(
  _previousState: SnippetFormState,
  formData: FormData,
): Promise<SnippetFormState> {
  const input = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    code: formData.get("code"),
    language: formData.get("language"),
  };

  const result = createSnippetSchema.safeParse(input);

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;

    return {
      success: false,
      message: "Please correct the errors below.",
      errors: {
        title: fieldErrors.title,
        description: fieldErrors.description,
        code: fieldErrors.code,
        language: fieldErrors.language,
      },
    };
  }

  // Demonstration only: no database write happens here.
  return {
    success: true,
    message: `Validation successful! "${result.data.title}" is valid. No data was saved.`,
  };
}
