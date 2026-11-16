import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: {
    AUTH_SECRET: "test-auth-secret",
    NODE_ENV: "test",
  },
}));

vi.mock("@/lib/auth/credentials", () => ({
  verifyCredentials: vi.fn(),
}));

import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { authConfig, handleJwtCallback, handleSessionCallback } from "./auth";

describe("authConfig", () => {
  it("uses the jwt session strategy", () => {
    expect(authConfig.session?.strategy).toBe("jwt");
  });

  it("configures the custom sign-in page", () => {
    expect(authConfig.pages?.signIn).toBe("/login");
  });

  describe("jwt callback handler", () => {
    it("persists user id into the token upon initial sign in", async () => {
      const initialToken: JWT = {};
      const user = {
        id: "user_abc123",
        name: "Alice",
        email: "alice@example.com",
      };

      const updatedToken = await handleJwtCallback({
        token: initialToken,
        user,
      });

      expect(updatedToken.id).toBe("user_abc123");
    });

    it("preserves existing token properties when user is undefined", async () => {
      const existingToken: JWT = {
        id: "user_abc123",
        email: "alice@example.com",
      };

      const resultToken = await handleJwtCallback({
        token: existingToken,
      });

      expect(resultToken.id).toBe("user_abc123");
      expect(resultToken.email).toBe("alice@example.com");
    });
  });

  describe("session callback handler", () => {
    it("attaches the user id from token.id to session.user", async () => {
      const mockSession: Session = {
        user: {
          id: "",
          name: "Alice",
          email: "alice@example.com",
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      };
      const token: JWT = {
        id: "user_abc123",
      };

      const updatedSession = await handleSessionCallback({
        session: mockSession,
        token,
      });

      expect(updatedSession.user.id).toBe("user_abc123");
      expect(updatedSession.user.name).toBe("Alice");
      expect(updatedSession.user.email).toBe("alice@example.com");
      expect(updatedSession.user).not.toHaveProperty("passwordHash");
    });

    it("falls back to token.sub if token.id is missing", async () => {
      const mockSession: Session = {
        user: {
          id: "",
          name: "Bob",
          email: "bob@example.com",
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      };
      const token: JWT = {
        sub: "user_sub456",
      };

      const updatedSession = await handleSessionCallback({
        session: mockSession,
        token,
      });

      expect(updatedSession.user.id).toBe("user_sub456");
    });
  });
});
