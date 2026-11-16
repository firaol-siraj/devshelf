import { beforeEach, describe, expect, it, vi } from "vitest";

import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import AuthLayout from "./layout";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("next/server", () => ({
  connection: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

const mockAuth = vi.mocked(auth as () => Promise<Session | null>);

describe("AuthLayout - Authenticated User Redirection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects authenticated visitors away to /dashboard", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "usr_123",
        name: "Ada Lovelace",
        email: "ada@example.com",
      },
      expires: "2026-01-01",
    });

    await AuthLayout({ children: "Auth Page" });

    expect(auth).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("allows unauthenticated visitors to view the auth pages", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await AuthLayout({ children: "Auth Page" });

    expect(redirect).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});
