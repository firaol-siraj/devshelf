import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { notFound, redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { getSnippetById } from "@/services/snippet.service";
import { NotFoundError } from "@/lib/errors/app-error";
import SnippetDetailPage, { formatSnippetDate } from "./page";
import CopyCodeButton, { copySnippetCode } from "./copy-code-button";
import DeleteSnippetButton from "./delete-snippet-button";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("next/server", () => ({
  connection: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/services/snippet.service", () => ({
  getSnippetById: vi.fn(),
}));

const mockAuth = vi.mocked(auth as () => Promise<Session | null>);

describe("SnippetDetailPage - Individual Snippet Detail View (READ)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSnippet = {
    id: "snip_alice_101",
    title: "Binary Search Tree Traversal",
    description: "In-order and pre-order traversal routines for balanced binary trees.",
    code: "function traverseInOrder(root) { if (root) { traverseInOrder(root.left); console.log(root.val); traverseInOrder(root.right); } }",
    language: "typescript",
    status: "published",
    createdAt: new Date("2026-01-15T10:00:00Z"),
    updatedAt: new Date("2026-01-18T16:45:00Z"),
  };

  describe("Authenticated access and route security", () => {
    it("renders snippet detail page for authenticated owner", async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: "usr_alice",
          name: "Alice Engineer",
          email: "alice@example.com",
        },
        expires: "2026-01-01",
      });

      vi.mocked(getSnippetById).mockResolvedValueOnce(mockSnippet as never);

      const page = await SnippetDetailPage({
        params: Promise.resolve({ snippetId: "snip_alice_101" }),
      });

      expect(auth).toHaveBeenCalled();
      expect(getSnippetById).toHaveBeenCalledWith("snip_alice_101", "usr_alice");
      expect(redirect).not.toHaveBeenCalled();
      expect(notFound).not.toHaveBeenCalled();
      expect(page).toBeDefined();
    });

    it("redirects unauthenticated visitor to /login", async () => {
      mockAuth.mockResolvedValueOnce(null);

      await SnippetDetailPage({
        params: Promise.resolve({ snippetId: "snip_alice_101" }),
      });

      expect(auth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login");
      expect(getSnippetById).not.toHaveBeenCalled();
    });

    it("redirects when session exists but user.id is missing or empty", async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: "",
          name: "Anonymous",
          email: "anon@example.com",
        },
        expires: "2026-01-01",
      });

      await SnippetDetailPage({
        params: Promise.resolve({ snippetId: "snip_alice_101" }),
      });

      expect(auth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login");
      expect(getSnippetById).not.toHaveBeenCalled();
    });

    it("redirects when session exists but user object is undefined", async () => {
      mockAuth.mockResolvedValueOnce({
        expires: "2026-01-01",
      } as unknown as Session);

      await SnippetDetailPage({
        params: Promise.resolve({ snippetId: "snip_alice_101" }),
      });

      expect(redirect).toHaveBeenCalledWith("/login");
      expect(getSnippetById).not.toHaveBeenCalled();
    });
  });

  describe("Correct snippet retrieval and missing snippet handling", () => {
    it("retrieves the snippet using the asynchronous route params and session user id", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "usr_bob" },
        expires: "2026-01-01",
      });

      vi.mocked(getSnippetById).mockResolvedValueOnce({
        ...mockSnippet,
        id: "snip_custom_999",
      } as never);

      await SnippetDetailPage({
        params: Promise.resolve({ snippetId: "snip_custom_999" }),
      });

      expect(getSnippetById).toHaveBeenCalledWith("snip_custom_999", "usr_bob");
    });

    it("calls notFound() when snippet does not exist", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "usr_alice" },
        expires: "2026-01-01",
      });

      vi.mocked(getSnippetById).mockRejectedValueOnce(
        new NotFoundError("Snippet not found"),
      );

      await SnippetDetailPage({
        params: Promise.resolve({ snippetId: "snip_nonexistent" }),
      });

      expect(getSnippetById).toHaveBeenCalledWith("snip_nonexistent", "usr_alice");
      expect(notFound).toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });

    it("calls notFound() if getSnippetById resolves to null", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "usr_alice" },
        expires: "2026-01-01",
      });

      vi.mocked(getSnippetById).mockResolvedValueOnce(null as never);

      await SnippetDetailPage({
        params: Promise.resolve({ snippetId: "snip_null" }),
      });

      expect(notFound).toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe("Cross-user access prevention", () => {
    it("prevents cross-user access and triggers notFound() when accessing another user's snippet", async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: "usr_attacker",
          name: "Attacker",
          email: "attacker@example.com",
        },
        expires: "2026-01-01",
      });

      // Repository and service strictly query by (id, userId). When userId mismatch occurs, NotFoundError is thrown.
      vi.mocked(getSnippetById).mockRejectedValueOnce(
        new NotFoundError("Snippet not found"),
      );

      await SnippetDetailPage({
        params: Promise.resolve({ snippetId: "snip_alice_101" }),
      });

      expect(getSnippetById).toHaveBeenCalledWith("snip_alice_101", "usr_attacker");
      expect(notFound).toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe("Rendering snippet metadata, content, and semantic HTML", () => {
    it("renders title, description, language badge, status badge, code, and formatted timestamps", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "usr_alice" },
        expires: "2026-01-01",
      });

      vi.mocked(getSnippetById).mockResolvedValueOnce(mockSnippet as never);

      const page = await SnippetDetailPage({
        params: Promise.resolve({ snippetId: "snip_alice_101" }),
      });

      expect(page).not.toBeNull();
      const html = renderToStaticMarkup(page!);

      // Title
      expect(html).toContain("Binary Search Tree Traversal");
      // Description
      expect(html).toContain("In-order and pre-order traversal routines for balanced binary trees.");
      // Language
      expect(html).toContain("TypeScript");
      // Status
      expect(html).toContain("published");
      // Code
      expect(html).toContain("function traverseInOrder(root)");
      // Creation Date and Update Date
      expect(html).toContain("Created");
      expect(html).toContain("Jan 15, 2026");
      expect(html).toContain("Updated");
      expect(html).toContain("Jan 18, 2026");
      // Semantic <time> tags with valid ISO datetime
      expect(html).toContain('dateTime="2026-01-15T10:00:00.000Z"');
      expect(html).toContain('dateTime="2026-01-18T16:45:00.000Z"');
      // Code container accessibility
      expect(html).toContain('tabindex="0"');
      expect(html).toContain('aria-label="TypeScript code for Binary Search Tree Traversal"');
    });

    it("renders fallback text when snippet description is null", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "usr_alice" },
        expires: "2026-01-01",
      });

      vi.mocked(getSnippetById).mockResolvedValueOnce({
        ...mockSnippet,
        description: null,
      } as never);

      const page = await SnippetDetailPage({
        params: Promise.resolve({ snippetId: "snip_alice_101" }),
      });

      const html = renderToStaticMarkup(page!);
      expect(html).toContain("No description provided.");
    });

    it("handles SQL language with Terminal icon heading", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "usr_alice" },
        expires: "2026-01-01",
      });

      vi.mocked(getSnippetById).mockResolvedValueOnce({
        ...mockSnippet,
        language: "sql",
        code: "SELECT * FROM users WHERE active = true;",
      } as never);

      const page = await SnippetDetailPage({
        params: Promise.resolve({ snippetId: "snip_sql_1" }),
      });

      const html = renderToStaticMarkup(page!);
      expect(html).toContain("SQL");
      expect(html).toContain("SELECT * FROM users WHERE active = true;");
    });
  });

  describe("Navigation links", () => {
    it("renders Back to Dashboard link to /dashboard and Edit link to /dashboard/[snippetId]/edit", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "usr_alice" },
        expires: "2026-01-01",
      });

      vi.mocked(getSnippetById).mockResolvedValueOnce(mockSnippet as never);

      const page = await SnippetDetailPage({
        params: Promise.resolve({ snippetId: "snip_alice_101" }),
      });

      const html = renderToStaticMarkup(page!);

      // Back to Dashboard link
      expect(html).toContain('href="/dashboard"');
      expect(html).toContain("Back to Dashboard");

      // Edit link
      expect(html).toContain('href="/dashboard/snip_alice_101/edit"');
      expect(html).toContain("Edit");
    });
  });

  describe("Copy interaction and CopyCodeButton component", () => {
    it("copySnippetCode copies text when clipboard API is available", async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("window", {});
      vi.stubGlobal("navigator", {
        clipboard: { writeText: writeTextMock },
      });

      const result = await copySnippetCode("const x = 42;");

      expect(writeTextMock).toHaveBeenCalledWith("const x = 42;");
      expect(result.success).toBe(true);

      vi.unstubAllGlobals();
    });

    it("copySnippetCode returns failure message when clipboard writeText rejects", async () => {
      const writeTextMock = vi.fn().mockRejectedValue(new Error("Permission denied"));
      vi.stubGlobal("window", {});
      vi.stubGlobal("navigator", {
        clipboard: { writeText: writeTextMock },
      });

      const result = await copySnippetCode("const x = 42;");

      expect(writeTextMock).toHaveBeenCalledWith("const x = 42;");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unable to copy. Select the code manually.");

      vi.unstubAllGlobals();
    });

    it("copySnippetCode returns failure when clipboard API is undefined", async () => {
      vi.stubGlobal("window", {});
      vi.stubGlobal("navigator", {});

      const result = await copySnippetCode("const x = 42;");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Clipboard API is unavailable in this environment");

      vi.unstubAllGlobals();
    });

    it("renders CopyCodeButton in idle state", () => {
      const html = renderToStaticMarkup(
        <CopyCodeButton code="const a = 1;" snippetTitle="Test Snippet" />,
      );

      expect(html).toContain("Copy Code");
      expect(html).toContain('aria-label="Copy code for Test Snippet"');
      expect(html).toContain('title="Copy code"');
    });

    it("renders CopyCodeButton in success state with accessible announcement", () => {
      const html = renderToStaticMarkup(
        <CopyCodeButton
          code="const a = 1;"
          snippetTitle="Test Snippet"
          initialStatus="success"
        />,
      );

      expect(html).toContain("Copied!");
      expect(html).toContain('aria-label="Code copied to clipboard"');
      expect(html).toContain("Code copied to clipboard.");
    });

    it("renders CopyCodeButton in error state with accessible failure notification", () => {
      const html = renderToStaticMarkup(
        <CopyCodeButton
          code="const a = 1;"
          snippetTitle="Test Snippet"
          initialStatus="error"
          initialError="Unable to copy code"
        />,
      );

      expect(html).toContain("Failed");
      expect(html).toContain('aria-label="Unable to copy code to clipboard"');
      expect(html).toContain("Unable to copy code");
    });
  });

  describe("Delete interaction and DeleteSnippetButton component", () => {
    it("renders DeleteSnippetButton initial trigger button", () => {
      const html = renderToStaticMarkup(
        <DeleteSnippetButton
          snippetId="snip_alice_101"
          snippetTitle="Binary Search Tree Traversal"
        />,
      );

      expect(html).toContain("Delete");
      expect(html).toContain('aria-label="Delete Binary Search Tree Traversal"');
      // Dialog is closed initially
      expect(html).not.toContain('role="alertdialog"');
    });

    it("renders accessible confirmation dialog when open", () => {
      const html = renderToStaticMarkup(
        <DeleteSnippetButton
          snippetId="snip_alice_101"
          snippetTitle="Binary Search Tree Traversal"
          initialOpen={true}
        />,
      );

      // Dialog accessibility attributes
      expect(html).toContain('role="alertdialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby="delete-dialog-title-snip_alice_101"');
      expect(html).toContain('aria-describedby="delete-dialog-desc-snip_alice_101"');

      // Confirmation messaging with snippet title
      expect(html).toContain("Delete Snippet");
      expect(html).toContain("Binary Search Tree Traversal");
      expect(html).toContain("This action cannot be undone and will permanently remove this snippet");

      // Form hidden inputs
      expect(html).toContain('name="id"');
      expect(html).toContain('value="snip_alice_101"');
      expect(html).toContain('name="redirectTo"');
      expect(html).toContain('value="/dashboard"');

      // Actions
      expect(html).toContain("Cancel");
      expect(html).toContain("Delete Snippet");
    });
  });

  describe("formatSnippetDate utility", () => {
    it("formats valid Date instances and ISO strings", () => {
      const date = new Date("2026-05-20T12:00:00Z");
      const result = formatSnippetDate(date);

      expect(result.isValid).toBe(true);
      expect(result.formatted).toBe("May 20, 2026");
      expect(result.iso).toBe(date.toISOString());

      const stringResult = formatSnippetDate("2026-05-20T12:00:00Z");
      expect(stringResult.isValid).toBe(true);
      expect(stringResult.formatted).toBe("May 20, 2026");
    });

    it("handles invalid or empty dates gracefully", () => {
      expect(formatSnippetDate(null)).toEqual({
        formatted: "Unknown",
        iso: "",
        isValid: false,
      });

      expect(formatSnippetDate(undefined)).toEqual({
        formatted: "Unknown",
        iso: "",
        isValid: false,
      });

      expect(formatSnippetDate("invalid-date")).toEqual({
        formatted: "Unknown",
        iso: "",
        isValid: false,
      });
    });
  });
});
