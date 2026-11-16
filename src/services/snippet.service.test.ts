import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createSnippet as repositoryCreateSnippet,
  deleteSnippet as repositoryDeleteSnippet,
  findSnippetByIdAndUserId as repositoryFindSnippetByIdAndUserId,
  findSnippetsByUserId,
  updateSnippet as repositoryUpdateSnippet,
} from "@/repositories/snippet.repository";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/errors/app-error";
import {
  createSnippet,
  deleteSnippet,
  getSnippetById,
  getUserSnippets,
  updateSnippet,
} from "./snippet.service";

vi.mock("@/repositories/snippet.repository", () => ({
  findSnippetsByUserId: vi.fn(),
  findSnippetByIdAndUserId: vi.fn(),
  createSnippet: vi.fn(),
  updateSnippet: vi.fn(),
  deleteSnippet: vi.fn(),
}));

describe("SnippetService - getUserSnippets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls findSnippetsByUserId with authenticated userId and default limit of 20", async () => {
    const mockSnippets = [
      {
        id: "snip_1",
        title: "Test Snippet",
        description: "Test description",
        code: "const x = 1;",
        language: "typescript",
        status: "published",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(findSnippetsByUserId).mockResolvedValueOnce(mockSnippets as never);

    const result = await getUserSnippets("usr_user123");

    expect(findSnippetsByUserId).toHaveBeenCalledWith("usr_user123", 20);
    expect(result).toEqual(mockSnippets);
  });

  it("returns an empty array when the user has no snippets", async () => {
    vi.mocked(findSnippetsByUserId).mockResolvedValueOnce([]);

    const result = await getUserSnippets("usr_empty");

    expect(findSnippetsByUserId).toHaveBeenCalledWith("usr_empty", 20);
    expect(result).toEqual([]);
  });

  it("safely returns empty array without calling repository when userId is missing or empty", async () => {
    const res1 = await getUserSnippets("");
    const res2 = await getUserSnippets("  ");

    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
    expect(findSnippetsByUserId).not.toHaveBeenCalled();
  });

  describe("search, filter, and sort options validation", () => {
    it("validates and passes query options to repository", async () => {
      vi.mocked(findSnippetsByUserId).mockResolvedValueOnce([]);

      await getUserSnippets("usr_123", {
        q: "react",
        status: "published",
        language: "typescript",
        sort: "updated",
      });

      expect(findSnippetsByUserId).toHaveBeenCalledWith("usr_123", 20, {
        q: "react",
        status: "published",
        language: "typescript",
        sort: "updated",
      });
    });

    it("respects custom limit if provided", async () => {
      vi.mocked(findSnippetsByUserId).mockResolvedValueOnce([]);

      await getUserSnippets("usr_123", {
        limit: 50,
      });

      expect(findSnippetsByUserId).toHaveBeenCalledWith(
        "usr_123",
        50,
        expect.objectContaining({ limit: 50 }),
      );
    });

    it("throws ValidationError when status is invalid", async () => {
      await expect(
        getUserSnippets("usr_123", {
          // @ts-expect-error Testing runtime check with invalid status
          status: "bogus_status",
        }),
      ).rejects.toThrow(ValidationError);

      expect(findSnippetsByUserId).not.toHaveBeenCalled();
    });

    it("throws ValidationError when language is invalid", async () => {
      await expect(
        getUserSnippets("usr_123", {
          // @ts-expect-error Testing runtime check with invalid language
          language: "ruby",
        }),
      ).rejects.toThrow(ValidationError);

      expect(findSnippetsByUserId).not.toHaveBeenCalled();
    });

    it("throws ValidationError when sort option is invalid", async () => {
      await expect(
        getUserSnippets("usr_123", {
          // @ts-expect-error Testing runtime check with invalid sort
          sort: "magic_sort",
        }),
      ).rejects.toThrow(ValidationError);

      expect(findSnippetsByUserId).not.toHaveBeenCalled();
    });

    it("throws ValidationError when search query exceeds 100 characters", async () => {
      await expect(
        getUserSnippets("usr_123", {
          q: "x".repeat(101),
        }),
      ).rejects.toThrow(ValidationError);

      expect(findSnippetsByUserId).not.toHaveBeenCalled();
    });

    it("trims whitespace from search query before repository delegation", async () => {
      vi.mocked(findSnippetsByUserId).mockResolvedValueOnce([]);

      await getUserSnippets("usr_123", {
        q: "   trimmed search   ",
      });

      expect(findSnippetsByUserId).toHaveBeenCalledWith(
        "usr_123",
        20,
        expect.objectContaining({
          q: "trimmed search",
        }),
      );
    });
  });
});

describe("SnippetService - createSnippet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validSnippetInput = {
    title: "Binary Search",
    description: "Standard binary search implementation",
    code: "function binarySearch() { return -1; }",
    language: "typescript" as const,
    status: "published" as const,
  };

  it("successfully validates input and delegates to repository with trimmed userId", async () => {
    const mockCreatedSnippet = {
      id: "snip_new123",
      title: "Binary Search",
      description: "Standard binary search implementation",
      code: "function binarySearch() { return -1; }",
      language: "typescript",
      status: "published",
      createdAt: new Date("2026-02-01"),
      updatedAt: new Date("2026-02-01"),
    };

    vi.mocked(repositoryCreateSnippet).mockResolvedValueOnce(mockCreatedSnippet as never);

    const result = await createSnippet("  usr_user123  ", validSnippetInput);

    expect(repositoryCreateSnippet).toHaveBeenCalledWith("usr_user123", {
      title: "Binary Search",
      description: "Standard binary search implementation",
      code: "function binarySearch() { return -1; }",
      language: "typescript",
      status: "published",
    });
    expect(result).toEqual(mockCreatedSnippet);
  });

  it("defaults status to 'draft' when status is omitted", async () => {
    const inputWithoutStatus = {
      title: "Draft Snippet",
      code: "console.log('draft');",
      language: "javascript" as const,
    };

    const mockCreatedSnippet = {
      id: "snip_draft1",
      title: "Draft Snippet",
      description: null,
      code: "console.log('draft');",
      language: "javascript",
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(repositoryCreateSnippet).mockResolvedValueOnce(mockCreatedSnippet as never);

    const result = await createSnippet("usr_user123", inputWithoutStatus);

    expect(repositoryCreateSnippet).toHaveBeenCalledWith("usr_user123", {
      title: "Draft Snippet",
      code: "console.log('draft');",
      language: "javascript",
      status: "draft",
    });
    expect(result.status).toBe("draft");
  });

  it("throws UnauthorizedError when userId is empty, missing, or whitespace", async () => {
    await expect(
      createSnippet("", validSnippetInput),
    ).rejects.toThrow(UnauthorizedError);

    await expect(
      createSnippet("   ", validSnippetInput),
    ).rejects.toThrow("You must be logged in to create a snippet");

    // @ts-expect-error Testing runtime check with null
    await expect(createSnippet(null, validSnippetInput)).rejects.toThrow(
      UnauthorizedError,
    );

    expect(repositoryCreateSnippet).not.toHaveBeenCalled();
  });

  it("throws ValidationError when title is missing or empty", async () => {
    await expect(
      createSnippet("usr_123", {
        ...validSnippetInput,
        title: "",
      }),
    ).rejects.toThrow(ValidationError);

    expect(repositoryCreateSnippet).not.toHaveBeenCalled();
  });

  it("throws ValidationError when title exceeds 120 characters", async () => {
    await expect(
      createSnippet("usr_123", {
        ...validSnippetInput,
        title: "a".repeat(121),
      }),
    ).rejects.toThrow(ValidationError);

    expect(repositoryCreateSnippet).not.toHaveBeenCalled();
  });

  it("throws ValidationError when code is empty", async () => {
    await expect(
      createSnippet("usr_123", {
        ...validSnippetInput,
        code: "",
      }),
    ).rejects.toThrow(ValidationError);

    expect(repositoryCreateSnippet).not.toHaveBeenCalled();
  });

  it("throws ValidationError when language is invalid", async () => {
    await expect(
      createSnippet("usr_123", {
        ...validSnippetInput,
        // @ts-expect-error Testing invalid language
        language: "ruby",
      }),
    ).rejects.toThrow(ValidationError);

    expect(repositoryCreateSnippet).not.toHaveBeenCalled();
  });

  it("propagates repository errors when repository throws", async () => {
    vi.mocked(repositoryCreateSnippet).mockRejectedValueOnce(
      new Error("Database connection lost"),
    );

    await expect(
      createSnippet("usr_user123", validSnippetInput),
    ).rejects.toThrow("Database connection lost");
  });
});

describe("SnippetService - getSnippetById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns snippet when found for authenticated owner", async () => {
    const mockSnippet = {
      id: "snip_abc",
      title: "Owner Snippet",
      description: "Description",
      code: "const a = 1;",
      language: "typescript",
      status: "published",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(repositoryFindSnippetByIdAndUserId).mockResolvedValueOnce(
      mockSnippet as never,
    );

    const result = await getSnippetById("snip_abc", "usr_owner");

    expect(repositoryFindSnippetByIdAndUserId).toHaveBeenCalledWith(
      "snip_abc",
      "usr_owner",
    );
    expect(result).toEqual(mockSnippet);
  });

  it("throws UnauthorizedError when userId is empty or missing", async () => {
    await expect(getSnippetById("snip_1", "")).rejects.toThrow(
      UnauthorizedError,
    );
    await expect(getSnippetById("snip_1", "   ")).rejects.toThrow(
      "Authentication required",
    );
    expect(repositoryFindSnippetByIdAndUserId).not.toHaveBeenCalled();
  });

  it("throws ValidationError when snippetId is empty or missing", async () => {
    await expect(getSnippetById("", "usr_owner")).rejects.toThrow(
      ValidationError,
    );
    await expect(getSnippetById("   ", "usr_owner")).rejects.toThrow(
      "Snippet ID is required",
    );
    expect(repositoryFindSnippetByIdAndUserId).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when repository returns null (nonexistent or ownership mismatch)", async () => {
    vi.mocked(repositoryFindSnippetByIdAndUserId).mockResolvedValueOnce(null);

    await expect(
      getSnippetById("snip_other_user", "usr_attacker"),
    ).rejects.toThrow(NotFoundError);
    await expect(
      getSnippetById("snip_other_user", "usr_attacker"),
    ).rejects.toThrow("Snippet not found");
  });
});

describe("SnippetService - updateSnippet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validUpdateInput = {
    title: "Updated Title",
    description: "Updated description",
    code: "console.log('updated');",
    language: "typescript" as const,
    status: "published" as const,
  };

  it("successfully validates update input and delegates to repository with trimmed IDs", async () => {
    const mockUpdatedSnippet = {
      id: "snip_123",
      title: "Updated Title",
      description: "Updated description",
      code: "console.log('updated');",
      language: "typescript",
      status: "published",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(repositoryUpdateSnippet).mockResolvedValueOnce(
      mockUpdatedSnippet as never,
    );

    const result = await updateSnippet(
      "  snip_123  ",
      "  usr_owner  ",
      validUpdateInput,
    );

    expect(repositoryUpdateSnippet).toHaveBeenCalledWith(
      "snip_123",
      "usr_owner",
      validUpdateInput,
    );
    expect(result).toEqual(mockUpdatedSnippet);
  });

  it("throws UnauthorizedError when userId is empty or missing", async () => {
    await expect(
      updateSnippet("snip_123", "", validUpdateInput),
    ).rejects.toThrow(UnauthorizedError);

    expect(repositoryUpdateSnippet).not.toHaveBeenCalled();
  });

  it("throws ValidationError when snippetId is empty or missing", async () => {
    await expect(
      updateSnippet("", "usr_owner", validUpdateInput),
    ).rejects.toThrow(ValidationError);

    expect(repositoryUpdateSnippet).not.toHaveBeenCalled();
  });

  it("throws ValidationError when update payload is empty", async () => {
    await expect(
      updateSnippet("snip_123", "usr_owner", {}),
    ).rejects.toThrow(ValidationError);

    expect(repositoryUpdateSnippet).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when repository returns null (unauthorized or nonexistent)", async () => {
    vi.mocked(repositoryUpdateSnippet).mockResolvedValueOnce(null);

    await expect(
      updateSnippet("snip_123", "usr_other", validUpdateInput),
    ).rejects.toThrow(NotFoundError);
    await expect(
      updateSnippet("snip_123", "usr_other", validUpdateInput),
    ).rejects.toThrow("Snippet not found");
  });

  it("propagates unexpected errors when repository throws", async () => {
    vi.mocked(repositoryUpdateSnippet).mockRejectedValueOnce(
      new Error("Database connection dropped"),
    );

    await expect(
      updateSnippet("snip_123", "usr_owner", validUpdateInput),
    ).rejects.toThrow("Database connection dropped");
  });
});

describe("SnippetService - deleteSnippet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successfully validates inputs and delegates deletion to repository", async () => {
    vi.mocked(repositoryDeleteSnippet).mockResolvedValueOnce(true);

    const result = await deleteSnippet("  snip_target_1  ", "  usr_owner  ");

    expect(repositoryDeleteSnippet).toHaveBeenCalledWith(
      "snip_target_1",
      "usr_owner",
    );
    expect(result).toEqual({ success: true });
  });

  it("throws UnauthorizedError when userId is empty or missing", async () => {
    await expect(deleteSnippet("snip_123", "")).rejects.toThrow(
      UnauthorizedError,
    );

    await expect(deleteSnippet("snip_123", "   ")).rejects.toThrow(
      "Authentication required",
    );

    expect(repositoryDeleteSnippet).not.toHaveBeenCalled();
  });

  it("throws ValidationError when snippetId is empty or missing", async () => {
    await expect(deleteSnippet("", "usr_owner")).rejects.toThrow(
      ValidationError,
    );

    await expect(deleteSnippet("   ", "usr_owner")).rejects.toThrow(
      "Snippet ID is required",
    );

    expect(repositoryDeleteSnippet).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when repository returns false (ownership mismatch or nonexistent)", async () => {
    vi.mocked(repositoryDeleteSnippet).mockResolvedValueOnce(false);

    await expect(
      deleteSnippet("snip_alice", "usr_attacker"),
    ).rejects.toThrow(NotFoundError);

    await expect(
      deleteSnippet("snip_alice", "usr_attacker"),
    ).rejects.toThrow("Snippet not found");
  });

  it("propagates unexpected errors when repository throws", async () => {
    vi.mocked(repositoryDeleteSnippet).mockRejectedValueOnce(
      new Error("Database connection terminated"),
    );

    await expect(
      deleteSnippet("snip_123", "usr_owner"),
    ).rejects.toThrow("Database connection terminated");
  });
});
