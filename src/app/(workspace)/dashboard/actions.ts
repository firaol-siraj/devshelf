"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { auth } from "@/auth";
import {
  createSnippet,
  deleteSnippet,
  updateSnippet,
} from "@/services/snippet.service";
import {
  createSnippetSchema,
  deleteSnippetSchema,
  updateSnippetFormSchema,
} from "@/schemas/snippet.schema";
import { AppError } from "@/lib/errors/app-error";
import type {
  CreateSnippetFormState,
  DeleteSnippetFormState,
  UpdateSnippetFormState,
} from "./types";

export type {
  CreateSnippetFormState,
  DeleteSnippetFormState,
  UpdateSnippetFormState,
};

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

function checkIsRedirectError(error: unknown): boolean {
  if (isRedirectError(error)) {
    return true;
  }
  if (error instanceof Error && error.message === "NEXT_REDIRECT") {
    return true;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  ) {
    return true;
  }
  return false;
}

export async function createSnippetAction(
  _prevState: CreateSnippetFormState,
  formData: FormData,
): Promise<CreateSnippetFormState> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "You must be logged in to create a snippet.",
      errors: {
        form: ["You must be logged in to create a snippet."],
      },
    };
  }

  const rawInput = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    code: formData.get("code"),
    language: formData.get("language"),
    status: formData.get("status") || "draft",
  };

  const validationResult = createSnippetSchema.safeParse(rawInput);

  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors;

    return {
      success: false,
      message: "Please correct the errors in the form.",
      errors: {
        title: fieldErrors.title,
        description: fieldErrors.description,
        code: fieldErrors.code,
        language: fieldErrors.language,
        status: fieldErrors.status,
      },
    };
  }

  try {
    await createSnippet(session.user.id, validationResult.data);
    revalidatePath("/dashboard");
    redirect("/dashboard");
  } catch (error: unknown) {
    if (checkIsRedirectError(error)) {
      throw error;
    }

    if (error instanceof AppError) {
      return {
        success: false,
        message: error.message,
        errors: {
          form: [error.message],
        },
      };
    }

    console.error("Snippet creation error:", error);

    return {
      success: false,
      message:
        "An unexpected error occurred while creating the snippet. Please try again.",
      errors: {
        form: [
          "An unexpected error occurred while creating the snippet. Please try again.",
        ],
      },
    };
  }
}

export async function updateSnippetAction(
  _prevState: UpdateSnippetFormState,
  formData: FormData,
): Promise<UpdateSnippetFormState> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "You must be logged in to update a snippet.",
      errors: {
        form: ["You must be logged in to update a snippet."],
      },
    };
  }

  const rawInput = {
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    code: formData.get("code"),
    language: formData.get("language"),
    status: formData.get("status"),
  };

  const validationResult = updateSnippetFormSchema.safeParse(rawInput);

  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors;

    return {
      success: false,
      message: "Please correct the errors in the form.",
      errors: {
        id: fieldErrors.id,
        title: fieldErrors.title,
        description: fieldErrors.description,
        code: fieldErrors.code,
        language: fieldErrors.language,
        status: fieldErrors.status,
      },
    };
  }

  const { id, ...dataToUpdate } = validationResult.data;

  try {
    await updateSnippet(id, session.user.id, dataToUpdate);
    revalidatePath("/dashboard");
    redirect("/dashboard");
  } catch (error: unknown) {
    if (checkIsRedirectError(error)) {
      throw error;
    }

    if (error instanceof AppError) {
      return {
        success: false,
        message: error.message,
        errors: {
          form: [error.message],
        },
      };
    }

    console.error("Snippet update error:", error);

    return {
      success: false,
      message:
        "An unexpected error occurred while updating the snippet. Please try again.",
      errors: {
        form: [
          "An unexpected error occurred while updating the snippet. Please try again.",
        ],
      },
    };
  }
}

function getSafeRedirectPath(value: FormDataEntryValue | null): string | null {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return null;
  }

  try {
    const baseUrl = "https://devshelf.invalid";
    const parsedUrl = new URL(value, baseUrl);

    if (parsedUrl.origin !== baseUrl) {
      return null;
    }

    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return null;
  }
}

export async function deleteSnippetAction(
  _prevState: DeleteSnippetFormState,
  formData: FormData,
): Promise<DeleteSnippetFormState> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "You must be logged in to delete a snippet.",
      errors: {
        form: ["You must be logged in to delete a snippet."],
      },
    };
  }

  const rawInput = {
    id: formData.get("id"),
  };

  const validationResult = deleteSnippetSchema.safeParse(rawInput);

  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors;

    return {
      success: false,
      message: "Invalid snippet ID.",
      errors: {
        id: fieldErrors.id,
        form: fieldErrors.id,
      },
    };
  }

  try {
    await deleteSnippet(validationResult.data.id, session.user.id);
    revalidatePath("/dashboard");

    const redirectTo = getSafeRedirectPath(formData.get("redirectTo"));
    if (redirectTo) {
      redirect(redirectTo);
    }

    return {
      success: true,
      message: "Snippet deleted successfully.",
    };
  } catch (error: unknown) {
    if (checkIsRedirectError(error)) {
      throw error;
    }

    if (error instanceof AppError) {
      return {
        success: false,
        message: error.message,
        errors: {
          form: [error.message],
        },
      };
    }

    console.error("Snippet deletion error:", error);

    return {
      success: false,
      message:
        "An unexpected error occurred while deleting the snippet. Please try again.",
      errors: {
        form: [
          "An unexpected error occurred while deleting the snippet. Please try again.",
        ],
      },
    };
  }
}

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
