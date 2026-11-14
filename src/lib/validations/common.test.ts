import { describe, it, expect } from "vitest";

import {
  idSchema,
  titleSchema,
  descriptionSchema,
} from "./common";

describe("idSchema", () => {
  it("accepts a valid ID", () => {
    expect(idSchema.parse("user_123")).toBe("user_123");
  });

  it("trims whitespace", () => {
    expect(idSchema.parse("  user_123  ")).toBe("user_123");
  });

  it("rejects an empty ID", () => {
    expect(idSchema.safeParse("").success).toBe(false);
  });
});

describe("titleSchema", () => {
  it("accepts a valid title", () => {
    expect(titleSchema.parse("My Snippet")).toBe("My Snippet");
  });

  it("trims whitespace", () => {
    expect(titleSchema.parse("  My Snippet  ")).toBe("My Snippet");
  });

  it("rejects an empty title", () => {
    expect(titleSchema.safeParse("").success).toBe(false);
  });

  it("rejects titles longer than 120 characters", () => {
    expect(titleSchema.safeParse("a".repeat(121)).success).toBe(false);
  });
});

describe("descriptionSchema", () => {
  it("accepts a valid description", () => {
    expect(descriptionSchema.parse("A useful snippet")).toBe(
      "A useful snippet",
    );
  });

  it("accepts null", () => {
    expect(descriptionSchema.parse(null)).toBeNull();
  });

  it("accepts undefined", () => {
    expect(descriptionSchema.parse(undefined)).toBeUndefined();
  });

  it("rejects descriptions longer than 500 characters", () => {
    expect(descriptionSchema.safeParse("a".repeat(501)).success).toBe(
      false,
    );
  });
});
