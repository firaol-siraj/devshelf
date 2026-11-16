import { beforeEach, describe, expect, it, vi } from "vitest";

import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import NewSnippetPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("next/server", () => ({
  connection: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("./snippet-form", () => ({
  default: () => <div data-testid="snippet-form" />,
}));

const mockAuth = vi.mocked(auth as () => Promise<Session | null>);

describe("NewSnippetPage - Authenticated Snippet Creation Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders snippet creation page for authenticated user", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "usr_alice",
        name: "Alice Engineer",
        email: "alice@example.com",
      },
      expires: "2026-01-01",
    });

    const page = await NewSnippetPage();

    expect(auth).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
    expect(page).toBeDefined();
  });

  it("redirects unauthenticated visitor to /login", async () => {
    mockAuth.mockResolvedValueOnce(null);

    await NewSnippetPage();

    expect(auth).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/login");
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

    await NewSnippetPage();

    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
