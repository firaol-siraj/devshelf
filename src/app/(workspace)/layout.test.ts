import { beforeEach, describe, expect, it, vi } from "vitest";

import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import WorkspaceLayout from "./layout";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("next/server", () => ({
  connection: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/components/navigation/WorkspaceShell", () => ({
  default: ({ children }: { children: unknown }) => children,
}));

const mockAuth = vi.mocked(auth as () => Promise<Session | null>);

describe("WorkspaceLayout - Server-side Route Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated visitors to /login", async () => {
    mockAuth.mockResolvedValueOnce(null);

    await WorkspaceLayout({ children: "Protected Content" });

    expect(auth).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects when session exists but user is null or undefined", async () => {
    mockAuth.mockResolvedValueOnce({
      expires: "2026-01-01",
    } as unknown as Session);

    await WorkspaceLayout({ children: "Protected Content" });

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("allows authenticated users into the workspace", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "usr_123",
        name: "Ada Lovelace",
        email: "ada@example.com",
      },
      expires: "2026-01-01",
    });

    const result = await WorkspaceLayout({ children: "Protected Content" });

    expect(redirect).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});
