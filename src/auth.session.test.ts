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
import { authConfig, handleSessionCallback } from "./auth";

describe("Session Management", () => {
  describe("authConfig session options", () => {
    it("configures JWT session strategy", () => {
      expect(authConfig.session?.strategy).toBe("jwt");
    });

    it("configures session maxAge to 30 days (in seconds)", () => {
      expect(authConfig.session?.maxAge).toBe(30 * 24 * 60 * 60);
    });

    it("configures session updateAge to 24 hours (in seconds)", () => {
      expect(authConfig.session?.updateAge).toBe(24 * 60 * 60);
    });

    it("configures secure cookie attributes for sessionToken", () => {
      const sessionCookie = authConfig.cookies?.sessionToken;

      expect(sessionCookie).toBeDefined();
      expect(sessionCookie?.options?.httpOnly).toBe(true);
      expect(sessionCookie?.options?.sameSite).toBe("lax");
      expect(sessionCookie?.options?.path).toBe("/");
    });
  });

  describe("Safe session user identity", () => {
    it("exposes user id, name, and email from token without sensitive properties", async () => {
      const mockSession: Session = {
        user: {
          id: "",
          name: "Ada Lovelace",
          email: "ada@example.com",
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const token: JWT = {
        id: "usr_safe123",
      };

      const result = await handleSessionCallback({
        session: mockSession,
        token,
      });

      expect(result.user.id).toBe("usr_safe123");
      expect(result.user.name).toBe("Ada Lovelace");
      expect(result.user.email).toBe("ada@example.com");
      expect(result.user).not.toHaveProperty("passwordHash");
      expect(result).not.toHaveProperty("passwordHash");
    });

    it("uses token.sub as user id fallback if token.id is omitted", async () => {
      const mockSession: Session = {
        user: {
          id: "",
          name: "Grace Hopper",
          email: "grace@example.com",
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const token: JWT = {
        sub: "usr_sub_456",
      };

      const result = await handleSessionCallback({
        session: mockSession,
        token,
      });

      expect(result.user.id).toBe("usr_sub_456");
    });
  });
});
