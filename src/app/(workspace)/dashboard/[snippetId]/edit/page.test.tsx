import { beforeEach, describe, expect, it, vi } from "vitest";

import { notFound, redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { getSnippetById } from "@/services/snippet.service";
import { NotFoundError } from "@/lib/errors/app-error";
import EditSnippetPage from "./page";

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

vi.mock("./edit-snippet-form", () => ({
  default: () => <div data-testid="edit-snippet-form" />,
}));

const mockAuth = vi.mocked(auth as () => Promise<Session | null>);

describe("EditSnippetPage - Authenticated Snippet Edit Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSnippet = {
    id: "snip_alice_1",
    title: "Alice Snippet",
    description: "Alice Description",
    code: "const a = 1;",
    language: "typescript",
    status: "published",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("renders edit snippet page for authenticated owner", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "usr_alice",
        name: "Alice Engineer",
        email: "alice@example.com",
      },
      expires: "2026-01-01",
    });

    vi.mocked(getSnippetById).mockResolvedValueOnce(mockSnippet as never);

    const page = await EditSnippetPage({
      params: Promise.resolve({ snippetId: "snip_alice_1" }),
    });

    expect(auth).toHaveBeenCalled();
    expect(getSnippetById).toHaveBeenCalledWith("snip_alice_1", "usr_alice");
    expect(redirect).not.toHaveBeenCalled();
    expect(notFound).not.toHaveBeenCalled();
    expect(page).toBeDefined();
  });

  it("redirects unauthenticated visitor to /login", async () => {
    mockAuth.mockResolvedValueOnce(null);

    await EditSnippetPage({
      params: Promise.resolve({ snippetId: "snip_alice_1" }),
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

    await EditSnippetPage({
      params: Promise.resolve({ snippetId: "snip_alice_1" }),
    });

    expect(redirect).toHaveBeenCalledWith("/login");
    expect(getSnippetById).not.toHaveBeenCalled();
  });

  it("calls notFound() when snippet belongs to another user or does not exist", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "usr_attacker",
        name: "Attacker",
        email: "attacker@example.com",
      },
      expires: "2026-01-01",
    });

    vi.mocked(getSnippetById).mockRejectedValueOnce(
      new NotFoundError("Snippet not found"),
    );

    await EditSnippetPage({
      params: Promise.resolve({ snippetId: "snip_alice_1" }),
    });

    expect(getSnippetById).toHaveBeenCalledWith("snip_alice_1", "usr_attacker");
    expect(notFound).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("calls notFound() if getSnippetById resolves to null", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "usr_alice",
        name: "Alice",
        email: "alice@example.com",
      },
      expires: "2026-01-01",
    });

    vi.mocked(getSnippetById).mockResolvedValueOnce(null as never);

    await EditSnippetPage({
      params: Promise.resolve({ snippetId: "snip_missing" }),
    });

    expect(notFound).toHaveBeenCalled();
  });
});
