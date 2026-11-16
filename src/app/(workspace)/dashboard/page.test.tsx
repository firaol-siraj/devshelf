import { beforeEach, describe, expect, it, vi } from "vitest";

import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { renderToStaticMarkup } from "react-dom/server";
import { auth } from "@/auth";
import { getUserSnippets } from "@/services/snippet.service";
import { ValidationError } from "@/lib/errors/app-error";
import DashboardPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("next/server", () => ({
  connection: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/services/snippet.service", () => ({
  getUserSnippets: vi.fn(),
}));

vi.mock("./snippet-discovery-toolbar", () => ({
  default: () => <div data-testid="snippet-discovery-toolbar" />,
}));

const mockAuth = vi.mocked(auth as () => Promise<Session | null>);

describe("DashboardPage - User-Specific Snippet Listing (READ)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retrieves snippets scoped strictly to the authenticated user ID", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "usr_alice",
        name: "Alice Engineer",
        email: "alice@example.com",
      },
      expires: "2026-01-01",
    });

    const mockSnippets = [
      {
        id: "snip_1",
        title: "React Custom Hook",
        description: "Reusable hook for window dimensions",
        code: "function useWindowSize() {}",
        language: "typescript",
        status: "published",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-02"),
      },
      {
        id: "snip_2",
        title: "SQL Index Migration",
        description: "Concurrent index creation",
        code: "CREATE INDEX CONCURRENTLY idx_users ON users(email);",
        language: "sql",
        status: "draft",
        createdAt: new Date("2026-01-03"),
        updatedAt: new Date("2026-01-04"),
      },
    ];

    vi.mocked(getUserSnippets).mockResolvedValueOnce(mockSnippets as never);

    const result = await DashboardPage();

    expect(auth).toHaveBeenCalled();
    expect(getUserSnippets).toHaveBeenCalledWith("usr_alice");
    expect(redirect).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it("handles empty snippet collections and renders without error", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "usr_bob",
        name: "Bob Developer",
        email: "bob@example.com",
      },
      expires: "2026-01-01",
    });

    vi.mocked(getUserSnippets).mockResolvedValueOnce([]);

    const result = await DashboardPage();

    expect(getUserSnippets).toHaveBeenCalledWith("usr_bob");
    expect(redirect).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it("redirects unauthenticated visitors to /login", async () => {
    mockAuth.mockResolvedValueOnce(null);

    await DashboardPage();

    expect(auth).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/login");
    expect(getUserSnippets).not.toHaveBeenCalled();
  });

  it("redirects when session exists but user.id is missing", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "",
        name: null,
        email: null,
      },
      expires: "2026-01-01",
    });

    await DashboardPage();

    expect(redirect).toHaveBeenCalledWith("/login");
    expect(getUserSnippets).not.toHaveBeenCalled();
  });

  it("ensures different users only have their own snippets queried", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "usr_userA",
        name: "User A",
        email: "usera@example.com",
      },
      expires: "2026-01-01",
    });
    vi.mocked(getUserSnippets).mockResolvedValueOnce([]);

    await DashboardPage();
    expect(getUserSnippets).toHaveBeenCalledWith("usr_userA");

    vi.clearAllMocks();

    mockAuth.mockResolvedValueOnce({
      user: {
        id: "usr_userB",
        name: "User B",
        email: "userb@example.com",
      },
      expires: "2026-01-01",
    });
    vi.mocked(getUserSnippets).mockResolvedValueOnce([]);

    await DashboardPage();
    expect(getUserSnippets).toHaveBeenCalledWith("usr_userB");
    expect(getUserSnippets).not.toHaveBeenCalledWith("usr_userA");
  });

  describe("Snippet discovery, search, filtering, and sorting integration", () => {
    it("passes search, status, language, and sort parameters to getUserSnippets", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "usr_alice", name: "Alice" },
        expires: "2026-01-01",
      });

      vi.mocked(getUserSnippets).mockResolvedValueOnce([]);

      await DashboardPage({
        searchParams: Promise.resolve({
          q: "  algorithm  ",
          status: "published",
          language: "typescript",
          sort: "updated",
        }),
      });

      expect(getUserSnippets).toHaveBeenCalledWith("usr_alice", {
        q: "algorithm",
        status: "published",
        language: "typescript",
        sort: "updated",
      });
    });

    it("renders NoSearchResultsEmptyState when active search returns 0 results", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "usr_alice", name: "Alice" },
        expires: "2026-01-01",
      });

      vi.mocked(getUserSnippets).mockResolvedValueOnce([]);

      const page = await DashboardPage({
        searchParams: Promise.resolve({
          q: "nonexistent query",
        }),
      });

      expect(page).not.toBeNull();
      const html = renderToStaticMarkup(page!);

      expect(html).toContain("No snippets found");
      expect(html).toContain("nonexistent query");
      expect(html).toContain("Clear search");
      expect(html).toContain("Search Results");
      expect(html).toContain("Showing 0 results");
    });

    it("renders NoSnippetsEmptyState when no filters are active and library is empty", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "usr_alice", name: "Alice" },
        expires: "2026-01-01",
      });

      vi.mocked(getUserSnippets).mockResolvedValueOnce([]);

      const page = await DashboardPage();

      expect(page).not.toBeNull();
      const html = renderToStaticMarkup(page!);

      expect(html).toContain("Your shelf is waiting");
      expect(html).toContain("Create your first snippet");
      expect(html).toContain("Recent Snippets");
      expect(html).toContain("0 snippets");
    });

    it("gracefully catches ValidationError from malformed query params and falls back to default snippets", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "usr_alice", name: "Alice" },
        expires: "2026-01-01",
      });

      // First call throws ValidationError because of malformed query parameter
      vi.mocked(getUserSnippets)
        .mockRejectedValueOnce(new ValidationError("Invalid query parameters"))
        .mockResolvedValueOnce([
          {
            id: "snip_safe",
            title: "Safe Fallback Snippet",
            description: "Default fallback",
            code: "const safe = true;",
            language: "typescript",
            status: "published",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ] as never);

      const page = await DashboardPage({
        searchParams: Promise.resolve({
          status: "malicious_status_injection",
        }),
      });

      expect(getUserSnippets).toHaveBeenCalledTimes(2);
      expect(getUserSnippets).toHaveBeenLastCalledWith("usr_alice");

      expect(page).not.toBeNull();
      const html = renderToStaticMarkup(page!);
      expect(html).toContain("Safe Fallback Snippet");
    });

    it("renders matching snippets with search results heading when query is active", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "usr_alice", name: "Alice" },
        expires: "2026-01-01",
      });

      const matchedSnippets = [
        {
          id: "snip_auth_1",
          title: "JWT Authentication Middleware",
          description: "Verify Bearer tokens securely",
          code: "export function auth() {}",
          language: "typescript",
          status: "published",
          createdAt: new Date("2026-01-01"),
          updatedAt: new Date("2026-01-02"),
        },
      ];

      vi.mocked(getUserSnippets).mockResolvedValueOnce(matchedSnippets as never);

      const page = await DashboardPage({
        searchParams: Promise.resolve({
          q: "JWT",
        }),
      });

      expect(page).not.toBeNull();
      const html = renderToStaticMarkup(page!);
      expect(html).toContain("Search Results");
      expect(html).toContain("Showing 1 result");
      expect(html).toContain("JWT Authentication Middleware");
    });
  });
});
