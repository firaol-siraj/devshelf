import { describe, expect, it } from "vitest";

import { serverEnvSchema } from "./schema";

describe("serverEnvSchema", () => {
  it("accepts a valid PostgreSQL connection URL", () => {
    const result = serverEnvSchema.safeParse({
      DATABASE_URL: "postgresql://user:password@localhost:5432/devshelf",
      NODE_ENV: "development",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a missing DATABASE_URL", () => {
    const result = serverEnvSchema.safeParse({
      NODE_ENV: "development",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid URL", () => {
    const result = serverEnvSchema.safeParse({
      DATABASE_URL: "not-a-url",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a non-PostgreSQL URL", () => {
    const result = serverEnvSchema.safeParse({
      DATABASE_URL: "https://example.com",
    });

    expect(result.success).toBe(false);
  });

  it("defaults NODE_ENV to development", () => {
    const result = serverEnvSchema.safeParse({
      DATABASE_URL: "postgresql://user:password@localhost:5432/devshelf",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.NODE_ENV).toBe("development");
    }
  });

  it("rejects an unsupported NODE_ENV", () => {
    const result = serverEnvSchema.safeParse({
      DATABASE_URL: "postgresql://user:password@localhost:5432/devshelf",
      NODE_ENV: "staging",
    });

    expect(result.success).toBe(false);
  });

  describe("AUTH_SECRET validation", () => {
    it("allows a missing AUTH_SECRET in development", () => {
      const result = serverEnvSchema.safeParse({
        DATABASE_URL: "postgresql://user:password@localhost:5432/devshelf",
        NODE_ENV: "development",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.AUTH_SECRET).toBeUndefined();
      }
    });

    it("allows a missing AUTH_SECRET in test", () => {
      const result = serverEnvSchema.safeParse({
        DATABASE_URL: "postgresql://user:password@localhost:5432/devshelf",
        NODE_ENV: "test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.AUTH_SECRET).toBeUndefined();
      }
    });

    it("rejects a missing AUTH_SECRET in production", () => {
      const result = serverEnvSchema.safeParse({
        DATABASE_URL: "postgresql://user:password@localhost:5432/devshelf",
        NODE_ENV: "production",
      });

      expect(result.success).toBe(false);
    });

    it("rejects an empty AUTH_SECRET in production", () => {
      const result = serverEnvSchema.safeParse({
        DATABASE_URL: "postgresql://user:password@localhost:5432/devshelf",
        NODE_ENV: "production",
        AUTH_SECRET: "",
      });

      expect(result.success).toBe(false);
    });

    it("rejects a whitespace-only AUTH_SECRET in production", () => {
      const result = serverEnvSchema.safeParse({
        DATABASE_URL: "postgresql://user:password@localhost:5432/devshelf",
        NODE_ENV: "production",
        AUTH_SECRET: "   ",
      });

      expect(result.success).toBe(false);
    });

    it("rejects a too-short AUTH_SECRET in production (less than 32 characters)", () => {
      const result = serverEnvSchema.safeParse({
        DATABASE_URL: "postgresql://user:password@localhost:5432/devshelf",
        NODE_ENV: "production",
        AUTH_SECRET: "short-secret-less-than-32-chars",
      });

      expect(result.success).toBe(false);
    });

    it("accepts a valid AUTH_SECRET in production (at least 32 characters)", () => {
      const validSecret = "a-cryptographically-secure-secret-32-chars-long";
      const result = serverEnvSchema.safeParse({
        DATABASE_URL: "postgresql://user:password@localhost:5432/devshelf",
        NODE_ENV: "production",
        AUTH_SECRET: validSecret,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.AUTH_SECRET).toBe(validSecret);
      }
    });
  });
});
