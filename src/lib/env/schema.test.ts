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
});
