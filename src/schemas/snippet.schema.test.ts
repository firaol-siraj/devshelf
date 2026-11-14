import { describe, it, expect } from "vitest";

import {
  createSnippetSchema,
  updateSnippetSchema,
  programmingLanguageSchema,
  snippetStatusSchema,
} from "./snippet.schema";

const validSnippet = {
  title: "Authentication Helper",
  description: "A TypeScript authentication example",
  code: "function authenticate() { return true; }",
  language: "typescript" as const,
};

describe("createSnippetSchema", () => {
  it("accepts valid snippet data", () => {
    const result = createSnippetSchema.safeParse(validSnippet);

    expect(result.success).toBe(true);
  });

  it("defaults status to draft", () => {
    const result = createSnippetSchema.parse(validSnippet);

    expect(result.status).toBe("draft");
  });

  it("accepts an explicit published status", () => {
    const result = createSnippetSchema.parse({
      ...validSnippet,
      status: "published",
    });

    expect(result.status).toBe("published");
  });

  it("rejects an empty title", () => {
    const result = createSnippetSchema.safeParse({
      ...validSnippet,
      title: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty code", () => {
    const result = createSnippetSchema.safeParse({
      ...validSnippet,
      code: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects code larger than 100000 characters", () => {
    const result = createSnippetSchema.safeParse({
      ...validSnippet,
      code: "a".repeat(100001),
    });

    expect(result.success).toBe(false);
  });

  it("rejects unsupported programming languages", () => {
    const result = createSnippetSchema.safeParse({
      ...validSnippet,
      language: "ruby",
    });

    expect(result.success).toBe(false);
  });
});

describe("updateSnippetSchema", () => {
  it("accepts a partial update", () => {
    const result = updateSnippetSchema.safeParse({
      title: "Updated title",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty update", () => {
    const result = updateSnippetSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});

describe("programmingLanguageSchema", () => {
  it.each([
    "typescript",
    "javascript",
    "python",
    "java",
    "go",
    "php",
    "sql",
  ])("accepts %s", (language) => {
    expect(programmingLanguageSchema.safeParse(language).success).toBe(
      true,
    );
  });
});

describe("snippetStatusSchema", () => {
  it.each(["draft", "published", "archived"])(
    "accepts %s",
    (status) => {
      expect(snippetStatusSchema.safeParse(status).success).toBe(true);
    },
  );

  it("rejects unsupported statuses", () => {
    expect(snippetStatusSchema.safeParse("deleted").success).toBe(false);
  });
});
