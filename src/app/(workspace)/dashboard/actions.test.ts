import { beforeEach, describe, expect, it, vi } from "vitest";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  createSnippet,
  deleteSnippet,
  updateSnippet,
} from "@/services/snippet.service";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";
import {
  createSnippetAction,
  deleteSnippetAction,
  updateSnippetAction,
  validateSnippetAction,
} from "./actions";
import {
  initialCreateSnippetFormState,
  initialDeleteSnippetFormState,
  initialUpdateSnippetFormState,
} from "./types";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    const error = new Error("NEXT_REDIRECT");
    (error as unknown as { digest: string }).digest = `NEXT_REDIRECT;replace;${url};303;`;
    throw error;
  }),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/services/snippet.service", () => ({
  createSnippet: vi.fn(),
  updateSnippet: vi.fn(),
  deleteSnippet: vi.fn(),
}));

describe("dashboard/actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createFormData(data: Record<string, string>) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      formData.append(key, value);
    }
    return formData;
  }

  describe("createSnippetAction", () => {
    it("returns error if user is unauthenticated (no session)", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as never);

      const formData = createFormData({
        title: "Test Snippet",
        code: "const a = 1;",
        language: "typescript",
      });

      const result = await createSnippetAction(
        initialCreateSnippetFormState,
        formData,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("You must be logged in to create a snippet.");
      expect(result.errors?.form).toContain(
        "You must be logged in to create a snippet.",
      );
      expect(createSnippet).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });

    it("returns error if session user has no id", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { name: "Test User", email: "test@example.com" },
      } as never);

      const formData = createFormData({
        title: "Test Snippet",
        code: "const a = 1;",
        language: "typescript",
      });

      const result = await createSnippetAction(
        initialCreateSnippetFormState,
        formData,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("You must be logged in to create a snippet.");
      expect(createSnippet).not.toHaveBeenCalled();
    });

    it("validates form data and returns field errors when required fields are missing", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "usr_auth_123" },
      } as never);

      const formData = createFormData({
        title: "",
        code: "",
        language: "invalid_lang",
      });

      const result = await createSnippetAction(
        initialCreateSnippetFormState,
        formData,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("Please correct the errors in the form.");
      expect(result.errors?.title).toBeDefined();
      expect(result.errors?.code).toBeDefined();
      expect(result.errors?.language).toBeDefined();
      expect(createSnippet).not.toHaveBeenCalled();
    });

    it("creates snippet for authenticated user, revalidates /dashboard and redirects", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "usr_auth_123" },
      } as never);

      vi.mocked(createSnippet).mockResolvedValueOnce({
        id: "snip_new_1",
        title: "Binary Search",
        description: "Binary search in TS",
        code: "const search = () => {};",
        language: "typescript",
        status: "published",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const formData = createFormData({
        title: "Binary Search",
        description: "Binary search in TS",
        code: "const search = () => {};",
        language: "typescript",
        status: "published",
        // Malicious client trying to inject a different userId
        userId: "usr_attacker_666",
      });

      await expect(
        createSnippetAction(initialCreateSnippetFormState, formData),
      ).rejects.toThrow("NEXT_REDIRECT");

      // Verifies that ownership is derived strictly from session.user.id, ignoring form injection
      expect(createSnippet).toHaveBeenCalledWith("usr_auth_123", {
        title: "Binary Search",
        description: "Binary search in TS",
        code: "const search = () => {};",
        language: "typescript",
        status: "published",
      });

      expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
      expect(redirect).toHaveBeenCalledWith("/dashboard");
    });

    it("defaults status to draft if status is omitted", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "usr_auth_123" },
      } as never);

      vi.mocked(createSnippet).mockResolvedValueOnce({} as never);

      const formData = createFormData({
        title: "Quick Sort",
        code: "const sort = () => {};",
        language: "python",
      });

      await expect(
        createSnippetAction(initialCreateSnippetFormState, formData),
      ).rejects.toThrow("NEXT_REDIRECT");

      expect(createSnippet).toHaveBeenCalledWith("usr_auth_123", {
        title: "Quick Sort",
        description: undefined,
        code: "const sort = () => {};",
        language: "python",
        status: "draft",
      });
    });

    it("catches AppError from service and returns structured error state", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "usr_auth_123" },
      } as never);

      vi.mocked(createSnippet).mockRejectedValueOnce(
        new ValidationError("Invalid snippet data"),
      );

      const formData = createFormData({
        title: "Valid Title",
        code: "const x = 1;",
        language: "typescript",
      });

      const result = await createSnippetAction(
        initialCreateSnippetFormState,
        formData,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("Invalid snippet data");
      expect(result.errors?.form).toContain("Invalid snippet data");
      expect(redirect).not.toHaveBeenCalled();
    });

    it("catches unexpected database errors without leaking internal connection details", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "usr_auth_123" },
      } as never);

      vi.mocked(createSnippet).mockRejectedValueOnce(
        new Error("FATAL: database connection lost at postgresql://user:secret@db:5432"),
      );

      const formData = createFormData({
        title: "Valid Title",
        code: "const x = 1;",
        language: "typescript",
      });

      const result = await createSnippetAction(
        initialCreateSnippetFormState,
        formData,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "An unexpected error occurred while creating the snippet. Please try again.",
      );
      expect(result.message).not.toContain("postgresql://");
      expect(result.errors?.form).toContain(
        "An unexpected error occurred while creating the snippet. Please try again.",
      );
      expect(redirect).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("validateSnippetAction", () => {
    it("returns validation errors when required fields are missing", async () => {
      const formData = createFormData({
        title: "",
        code: "",
        language: "invalid",
      });

      const result = await validateSnippetAction(
        { success: false, message: "" },
        formData,
      );

      expect(result.success).toBe(false);
      expect(result.errors?.title).toBeDefined();
      expect(result.errors?.code).toBeDefined();
      expect(result.errors?.language).toBeDefined();
    });

    it("returns success when snippet data is valid", async () => {
      const formData = createFormData({
        title: "Valid Algorithm",
        code: "console.log('hello');",
        language: "javascript",
      });

      const result = await validateSnippetAction(
        { success: false, message: "" },
        formData,
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain("Validation successful!");
    });
  });

  describe("updateSnippetAction", () => {
    it("returns error if user is unauthenticated (no session)", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as never);

      const formData = createFormData({
        id: "snip_1",
        title: "Test Snippet",
        code: "const a = 1;",
        language: "typescript",
        status: "published",
      });

      const result = await updateSnippetAction(
        initialUpdateSnippetFormState,
        formData,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("You must be logged in to update a snippet.");
      expect(result.errors?.form).toContain(
        "You must be logged in to update a snippet.",
      );
      expect(updateSnippet).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });

    it("returns error if session user has no id", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { name: "User without ID" },
      } as never);

      const formData = createFormData({
        id: "snip_1",
        title: "Test Snippet",
        code: "const a = 1;",
        language: "typescript",
        status: "published",
      });

      const result = await updateSnippetAction(
        initialUpdateSnippetFormState,
        formData,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("You must be logged in to update a snippet.");
      expect(updateSnippet).not.toHaveBeenCalled();
    });

    it("validates form data and returns field errors when required fields are missing", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "usr_auth_123" },
      } as never);

      const formData = createFormData({
        id: "",
        title: "",
        code: "",
        language: "invalid_lang",
        status: "invalid_status",
      });

      const result = await updateSnippetAction(
        initialUpdateSnippetFormState,
        formData,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("Please correct the errors in the form.");
      expect(result.errors?.id).toBeDefined();
      expect(result.errors?.title).toBeDefined();
      expect(result.errors?.code).toBeDefined();
      expect(result.errors?.language).toBeDefined();
      expect(result.errors?.status).toBeDefined();
      expect(updateSnippet).not.toHaveBeenCalled();
    });

    it("updates snippet for authenticated owner, revalidates /dashboard and redirects", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "usr_auth_123" },
      } as never);

      vi.mocked(updateSnippet).mockResolvedValueOnce({
        id: "snip_target_1",
        title: "Updated Algorithm",
        description: "Updated description",
        code: "const search = (x) => x;",
        language: "typescript",
        status: "published",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const formData = createFormData({
        id: "snip_target_1",
        title: "Updated Algorithm",
        description: "Updated description",
        code: "const search = (x) => x;",
        language: "typescript",
        status: "published",
        // Client trying to impersonate another user ID
        userId: "usr_attacker_666",
      });

      await expect(
        updateSnippetAction(initialUpdateSnippetFormState, formData),
      ).rejects.toThrow("NEXT_REDIRECT");

      // Verifies ownership is derived strictly from session.user.id
      expect(updateSnippet).toHaveBeenCalledWith("snip_target_1", "usr_auth_123", {
        title: "Updated Algorithm",
        description: "Updated description",
        code: "const search = (x) => x;",
        language: "typescript",
        status: "published",
      });

      expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
      expect(redirect).toHaveBeenCalledWith("/dashboard");
    });

    it("catches NotFoundError from service (ownership mismatch or missing) and returns error", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "usr_auth_123" },
      } as never);

      vi.mocked(updateSnippet).mockRejectedValueOnce(
        new NotFoundError("Snippet not found"),
      );

      const formData = createFormData({
        id: "snip_other_user",
        title: "Updated Title",
        code: "const x = 1;",
        language: "typescript",
        status: "published",
      });

      const result = await updateSnippetAction(
        initialUpdateSnippetFormState,
        formData,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("Snippet not found");
      expect(result.errors?.form).toContain("Snippet not found");
      expect(redirect).not.toHaveBeenCalled();
    });

    it("catches unexpected database errors without leaking internal connection details", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "usr_auth_123" },
      } as never);

      vi.mocked(updateSnippet).mockRejectedValueOnce(
        new Error("FATAL: connection timeout at postgresql://user:secret@db:5432"),
      );

      const formData = createFormData({
        id: "snip_1",
        title: "Valid Title",
        code: "const x = 1;",
        language: "typescript",
        status: "draft",
      });

      const result = await updateSnippetAction(
        initialUpdateSnippetFormState,
        formData,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "An unexpected error occurred while updating the snippet. Please try again.",
      );
      expect(result.message).not.toContain("postgresql://");
      expect(result.errors?.form).toContain(
        "An unexpected error occurred while updating the snippet. Please try again.",
      );
      expect(redirect).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("deleteSnippetAction", () => {
    it("returns error if user is unauthenticated (no session)", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as never);

      const formData = createFormData({
        id: "snip_1",
      });

      const result = await deleteSnippetAction(
        initialDeleteSnippetFormState,
        formData,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("You must be logged in to delete a snippet.");
      expect(result.errors?.form).toContain(
        "You must be logged in to delete a snippet.",
      );
      expect(deleteSnippet).not.toHaveBeenCalled();
    });

    it("returns error if session user has no id", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { name: "User without ID" },
      } as never);

      const formData = createFormData({
        id: "snip_1",
      });

      const result = await deleteSnippetAction(
        initialDeleteSnippetFormState,
        formData,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("You must be logged in to delete a snippet.");
      expect(deleteSnippet).not.toHaveBeenCalled();
    });

    it("returns validation error when snippet id is missing or empty", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "usr_auth_123" },
      } as never);

      const formData = createFormData({
        id: "",
      });

      const result = await deleteSnippetAction(
        initialDeleteSnippetFormState,
        formData,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("Invalid snippet ID.");
      expect(result.errors?.id).toBeDefined();
      expect(deleteSnippet).not.toHaveBeenCalled();
    });

    it("deletes snippet for authenticated user, ignores malicious client userId, and revalidates /dashboard", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "usr_auth_123" },
      } as never);

      vi.mocked(deleteSnippet).mockResolvedValueOnce({ success: true });

      const formData = createFormData({
        id: "snip_target_1",
        userId: "usr_attacker_666",
      });

      const result = await deleteSnippetAction(
        initialDeleteSnippetFormState,
        formData,
      );

      expect(deleteSnippet).toHaveBeenCalledWith("snip_target_1", "usr_auth_123");
      expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
      expect(result.success).toBe(true);
      expect(result.message).toBe("Snippet deleted successfully.");
      expect(redirect).not.toHaveBeenCalled();
    });

    it("handles redirectTo parameter and triggers redirect when specified", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "usr_auth_123" },
      } as never);

      vi.mocked(deleteSnippet).mockResolvedValueOnce({ success: true });

      const formData = createFormData({
        id: "snip_target_1",
        redirectTo: "/dashboard",
      });

      await expect(
        deleteSnippetAction(initialDeleteSnippetFormState, formData),
      ).rejects.toThrow("NEXT_REDIRECT");

      expect(deleteSnippet).toHaveBeenCalledWith("snip_target_1", "usr_auth_123");
      expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
      expect(redirect).toHaveBeenCalledWith("/dashboard");
    });

    it.each([
      "//evil.example",
      "///evil.example",
      "/\\evil.example",
    ])("rejects unsafe redirect destination: %s", async (redirectTo) => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "usr_auth_123" },
      } as never);

      vi.mocked(deleteSnippet).mockResolvedValueOnce({ success: true });

      const formData = createFormData({
        id: "snip_target_1",
        redirectTo,
      });

      const result = await deleteSnippetAction(
        initialDeleteSnippetFormState,
        formData,
      );

      expect(result.success).toBe(true);
      expect(redirect).not.toHaveBeenCalled();
      expect(deleteSnippet).toHaveBeenCalledWith(
        "snip_target_1",
        "usr_auth_123",
      );
    });

    it("catches NotFoundError from service and returns structured error state", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "usr_auth_123" },
      } as never);

      vi.mocked(deleteSnippet).mockRejectedValueOnce(
        new NotFoundError("Snippet not found"),
      );

      const formData = createFormData({
        id: "snip_other_user",
      });

      const result = await deleteSnippetAction(
        initialDeleteSnippetFormState,
        formData,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("Snippet not found");
      expect(result.errors?.form).toContain("Snippet not found");
      expect(redirect).not.toHaveBeenCalled();
    });

    it("catches unexpected database errors without leaking internal connection details", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "usr_auth_123" },
      } as never);

      vi.mocked(deleteSnippet).mockRejectedValueOnce(
        new Error("FATAL: database timeout at postgresql://user:secret@db:5432"),
      );

      const formData = createFormData({
        id: "snip_1",
      });

      const result = await deleteSnippetAction(
        initialDeleteSnippetFormState,
        formData,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "An unexpected error occurred while deleting the snippet. Please try again.",
      );
      expect(result.message).not.toContain("postgresql://");
      expect(result.errors?.form).toContain(
        "An unexpected error occurred while deleting the snippet. Please try again.",
      );
      expect(redirect).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
