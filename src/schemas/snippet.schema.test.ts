import { describe, it, expect } from "vitest";

import {
  createSnippetSchema,
  deleteSnippetSchema,
  updateSnippetSchema,
  updateSnippetFormSchema,
  programmingLanguageSchema,
  snippetStatusSchema,
  snippetSortSchema,
  snippetQuerySchema,
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

describe("updateSnippetFormSchema", () => {
  const validFormData = {
    id: "snip_123",
    title: "Updated Title",
    description: "Updated description",
    code: "const updated = true;",
    language: "typescript",
    status: "published",
  };

  it("accepts valid edit form data", () => {
    const result = updateSnippetFormSchema.safeParse(validFormData);

    expect(result.success).toBe(true);
  });

  it("rejects when id is missing or empty", () => {
    const result = updateSnippetFormSchema.safeParse({
      ...validFormData,
      id: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty title", () => {
    const result = updateSnippetFormSchema.safeParse({
      ...validFormData,
      title: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty code", () => {
    const result = updateSnippetFormSchema.safeParse({
      ...validFormData,
      code: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid language", () => {
    const result = updateSnippetFormSchema.safeParse({
      ...validFormData,
      language: "c++",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid status", () => {
    const result = updateSnippetFormSchema.safeParse({
      ...validFormData,
      status: "deleted",
    });

    expect(result.success).toBe(false);
  });
});

describe("deleteSnippetSchema", () => {
  it("accepts a valid snippet ID", () => {
    const result = deleteSnippetSchema.safeParse({
      id: "snip_valid123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty snippet ID", () => {
    const result = deleteSnippetSchema.safeParse({
      id: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a whitespace-only snippet ID", () => {
    const result = deleteSnippetSchema.safeParse({
      id: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects when ID is missing", () => {
    const result = deleteSnippetSchema.safeParse({});

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

describe("snippetSortSchema", () => {
  it.each([
    "newest",
    "oldest",
    "updated",
    "recently_updated",
    "a-z",
    "z-a",
    "title_asc",
    "title_desc",
  ])("accepts valid sort option %s", (sort) => {
    expect(snippetSortSchema.safeParse(sort).success).toBe(true);
  });

  it("rejects unsupported sort options", () => {
    expect(snippetSortSchema.safeParse("random").success).toBe(false);
    expect(snippetSortSchema.safeParse("").success).toBe(false);
  });
});

describe("snippetQuerySchema", () => {
  it("defaults sort to newest when no sort is specified", () => {
    const result = snippetQuerySchema.parse({});
    expect(result.sort).toBe("newest");
  });

  it("trims whitespace from search queries", () => {
    const result = snippetQuerySchema.parse({
      q: "  react hook  ",
    });
    expect(result.q).toBe("react hook");
  });

  it("accepts search query via 'search' parameter and trims whitespace", () => {
    const result = snippetQuerySchema.parse({
      search: "  sql query  ",
    });
    expect(result.search).toBe("sql query");
  });

  it("rejects queries exceeding 100 characters", () => {
    const result = snippetQuerySchema.safeParse({
      q: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it.each(["draft", "published", "archived", "all"])(
    "accepts status '%s'",
    (status) => {
      const result = snippetQuerySchema.safeParse({ status });
      expect(result.success).toBe(true);
    },
  );

  it("rejects invalid status", () => {
    const result = snippetQuerySchema.safeParse({ status: "invalid_status" });
    expect(result.success).toBe(false);
  });

  it.each([
    "typescript",
    "javascript",
    "python",
    "java",
    "go",
    "php",
    "sql",
    "all",
  ])("accepts language '%s'", (language) => {
    const result = snippetQuerySchema.safeParse({ language });
    expect(result.success).toBe(true);
  });

  it("rejects invalid language", () => {
    const result = snippetQuerySchema.safeParse({ language: "csharp" });
    expect(result.success).toBe(false);
  });

  it("accepts combined valid query options", () => {
    const result = snippetQuerySchema.safeParse({
      q: "memoization",
      status: "published",
      language: "typescript",
      sort: "updated",
      limit: 50,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe("memoization");
      expect(result.data.status).toBe("published");
      expect(result.data.language).toBe("typescript");
      expect(result.data.sort).toBe("updated");
      expect(result.data.limit).toBe(50);
    }
  });

  it("rejects invalid limit values", () => {
    expect(snippetQuerySchema.safeParse({ limit: -1 }).success).toBe(false);
    expect(snippetQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(snippetQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
  });
});
