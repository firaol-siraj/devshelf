import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/prisma";
import {
  createSnippet,
  deleteSnippet,
  findSnippetByIdAndUserId,
  findSnippetsByUserId,
  countSnippetsByUserId,
  updateSnippet,
} from "./snippet.repository";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    snippet: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe("SnippetRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findSnippetsByUserId", () => {
    it("queries snippets strictly scoped to the authenticated user ID", async () => {
      const mockSnippets = [
        {
          id: "snip_1",
          title: "Snippet One",
          description: "First description",
          code: "console.log('1')",
          language: "typescript",
          status: "published",
          createdAt: new Date("2026-01-01"),
          updatedAt: new Date("2026-01-02"),
        },
      ];

      vi.mocked(prisma.snippet.findMany).mockResolvedValueOnce(
        mockSnippets as never,
      );

      const result = await findSnippetsByUserId("usr_user123", 20);

      expect(prisma.snippet.findMany).toHaveBeenCalledWith({
        where: {
          userId: "usr_user123",
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 20,
        select: {
          id: true,
          title: true,
          description: true,
          code: true,
          language: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(result).toEqual(mockSnippets);
    });

    it("never includes user relations or passwordHash in query selection", async () => {
      vi.mocked(prisma.snippet.findMany).mockResolvedValueOnce([]);

      await findSnippetsByUserId("usr_abc", 10);

      const findManyCall = vi.mocked(prisma.snippet.findMany).mock.calls[0][0];
      const selectFields = findManyCall?.select as Record<string, boolean>;

      expect(selectFields).toBeDefined();
      expect(selectFields.passwordHash).toBeUndefined();
      expect(selectFields.user).toBeUndefined();
      expect(selectFields.userId).toBeUndefined();
    });

    it("returns empty array immediately when userId is empty or whitespace without calling database", async () => {
      const res1 = await findSnippetsByUserId("", 20);
      const res2 = await findSnippetsByUserId("   ", 20);

      expect(res1).toEqual([]);
      expect(res2).toEqual([]);
      expect(prisma.snippet.findMany).not.toHaveBeenCalled();
    });

    it("respects the custom limit parameter", async () => {
      vi.mocked(prisma.snippet.findMany).mockResolvedValueOnce([]);

      await findSnippetsByUserId("usr_user123", 5);

      expect(prisma.snippet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });

    describe("search, filtering, and sorting", () => {
      it("searches case-insensitively across title, description, code, and matching language enums", async () => {
        vi.mocked(prisma.snippet.findMany).mockResolvedValueOnce([]);

        await findSnippetsByUserId("usr_123", 20, {
          search: "type",
        });

        expect(prisma.snippet.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              userId: "usr_123",
              AND: [
                {
                  OR: [
                    { title: { contains: "type", mode: "insensitive" } },
                    { description: { contains: "type", mode: "insensitive" } },
                    { code: { contains: "type", mode: "insensitive" } },
                    { language: { in: ["typescript"] } },
                  ],
                },
              ],
            },
            orderBy: { createdAt: "desc" },
          }),
        );
      });

      it("handles empty or whitespace-only search without adding OR conditions", async () => {
        vi.mocked(prisma.snippet.findMany).mockResolvedValueOnce([]);

        await findSnippetsByUserId("usr_123", 20, {
          search: "   ",
        });

        expect(prisma.snippet.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              userId: "usr_123",
            },
          }),
        );
      });

      it("filters by status (published, draft, archived) and ignores 'all'", async () => {
        vi.mocked(prisma.snippet.findMany).mockResolvedValue([]);

        // Explicit status
        await findSnippetsByUserId("usr_123", 20, { status: "published" });
        expect(prisma.snippet.findMany).toHaveBeenLastCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              userId: "usr_123",
              status: "published",
            }),
          }),
        );

        // Status "all" should not filter
        await findSnippetsByUserId("usr_123", 20, { status: "all" });
        const lastCallWhere = vi.mocked(prisma.snippet.findMany).mock.calls[1][0]?.where;
        expect(lastCallWhere?.status).toBeUndefined();
      });

      it("filters by programming language and ignores 'all'", async () => {
        vi.mocked(prisma.snippet.findMany).mockResolvedValue([]);

        await findSnippetsByUserId("usr_123", 20, { language: "python" });
        expect(prisma.snippet.findMany).toHaveBeenLastCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              userId: "usr_123",
              language: "python",
            }),
          }),
        );

        await findSnippetsByUserId("usr_123", 20, { language: "all" });
        const lastCallWhere = vi.mocked(prisma.snippet.findMany).mock.calls[1][0]?.where;
        expect(lastCallWhere?.language).toBeUndefined();
      });

      it("supports all sorting options accurately", async () => {
        vi.mocked(prisma.snippet.findMany).mockResolvedValue([]);

        // Newest first (default)
        await findSnippetsByUserId("usr_123", 20, { sort: "newest" });
        expect(prisma.snippet.findMany).toHaveBeenLastCalledWith(
          expect.objectContaining({ orderBy: { createdAt: "desc" } }),
        );

        // Oldest first
        await findSnippetsByUserId("usr_123", 20, { sort: "oldest" });
        expect(prisma.snippet.findMany).toHaveBeenLastCalledWith(
          expect.objectContaining({ orderBy: { createdAt: "asc" } }),
        );

        // Recently updated
        await findSnippetsByUserId("usr_123", 20, { sort: "updated" });
        expect(prisma.snippet.findMany).toHaveBeenLastCalledWith(
          expect.objectContaining({ orderBy: { updatedAt: "desc" } }),
        );

        // Alphabetical A-Z
        await findSnippetsByUserId("usr_123", 20, { sort: "a-z" });
        expect(prisma.snippet.findMany).toHaveBeenLastCalledWith(
          expect.objectContaining({ orderBy: { title: "asc" } }),
        );

        // Alphabetical Z-A
        await findSnippetsByUserId("usr_123", 20, { sort: "z-a" });
        expect(prisma.snippet.findMany).toHaveBeenLastCalledWith(
          expect.objectContaining({ orderBy: { title: "desc" } }),
        );
      });

      it("applies combined search, filters, and sort together", async () => {
        vi.mocked(prisma.snippet.findMany).mockResolvedValueOnce([]);

        await findSnippetsByUserId("usr_123", 20, {
          search: "algorithm",
          status: "published",
          language: "go",
          sort: "a-z",
        });

        expect(prisma.snippet.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              userId: "usr_123",
              status: "published",
              language: "go",
              AND: [
                {
                  OR: [
                    { title: { contains: "algorithm", mode: "insensitive" } },
                    { description: { contains: "algorithm", mode: "insensitive" } },
                    { code: { contains: "algorithm", mode: "insensitive" } },
                  ],
                },
              ],
            },
            orderBy: { title: "asc" },
          }),
        );
      });
    });
  });

  describe("countSnippetsByUserId", () => {
    it("counts snippets strictly scoped to authenticated user", async () => {
      vi.mocked(prisma.snippet.count).mockResolvedValueOnce(5);

      const count = await countSnippetsByUserId("usr_alice");

      expect(prisma.snippet.count).toHaveBeenCalledWith({
        where: {
          userId: "usr_alice",
        },
      });
      expect(count).toBe(5);
    });

    it("applies search and filter conditions to count query", async () => {
      vi.mocked(prisma.snippet.count).mockResolvedValueOnce(2);

      const count = await countSnippetsByUserId("usr_alice", {
        search: "auth",
        status: "draft",
        language: "typescript",
      });

      expect(prisma.snippet.count).toHaveBeenCalledWith({
        where: {
          userId: "usr_alice",
          status: "draft",
          language: "typescript",
          AND: [
            {
              OR: [
                { title: { contains: "auth", mode: "insensitive" } },
                { description: { contains: "auth", mode: "insensitive" } },
                { code: { contains: "auth", mode: "insensitive" } },
              ],
            },
          ],
        },
      });
      expect(count).toBe(2);
    });

    it("returns 0 without querying database if userId is empty", async () => {
      const c1 = await countSnippetsByUserId("");
      const c2 = await countSnippetsByUserId("   ");

      expect(c1).toBe(0);
      expect(c2).toBe(0);
      expect(prisma.snippet.count).not.toHaveBeenCalled();
    });
  });

  describe("createSnippet", () => {
    it("creates a snippet associated strictly with the provided userId and returns safe fields", async () => {
      const mockCreated = {
        id: "snip_new_123",
        title: "New TypeScript Snippet",
        description: "A description",
        code: "const x = 42;",
        language: "typescript",
        status: "published",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
      };

      vi.mocked(prisma.snippet.create).mockResolvedValueOnce(
        mockCreated as never,
      );

      const result = await createSnippet("usr_author99", {
        title: "  New TypeScript Snippet  ",
        description: "  A description  ",
        code: "const x = 42;",
        language: "typescript",
        status: "published",
      });

      expect(prisma.snippet.create).toHaveBeenCalledWith({
        data: {
          userId: "usr_author99",
          title: "New TypeScript Snippet",
          description: "A description",
          code: "const x = 42;",
          language: "typescript",
          status: "published",
        },
        select: {
          id: true,
          title: true,
          description: true,
          code: true,
          language: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(result).toEqual(mockCreated);
      expect(result).not.toHaveProperty("passwordHash");
      expect(result).not.toHaveProperty("userId");
    });

    it("defaults status to draft when status is not provided", async () => {
      vi.mocked(prisma.snippet.create).mockResolvedValueOnce({
        id: "snip_1",
        title: "Snippet",
        description: null,
        code: "code",
        language: "python",
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      await createSnippet("usr_123", {
        title: "Python Snippet",
        code: "print('hello')",
        language: "python",
      });

      expect(prisma.snippet.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "draft",
            description: null,
          }),
        }),
      );
    });

    it("throws an error if userId is missing or empty", async () => {
      await expect(
        createSnippet("", {
          title: "Title",
          code: "code",
          language: "go",
        }),
      ).rejects.toThrow("User ID is required");

      await expect(
        createSnippet("   ", {
          title: "Title",
          code: "code",
          language: "go",
        }),
      ).rejects.toThrow("User ID is required");

      expect(prisma.snippet.create).not.toHaveBeenCalled();
    });
  });

  describe("findSnippetByIdAndUserId", () => {
    it("queries snippet strictly by both ID and authenticated userId", async () => {
      const mockSnippet = {
        id: "snip_abc",
        title: "My Snippet",
        description: "My description",
        code: "console.log('hi');",
        language: "javascript",
        status: "published",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.snippet.findFirst).mockResolvedValueOnce(
        mockSnippet as never,
      );

      const result = await findSnippetByIdAndUserId("snip_abc", "usr_alice");

      expect(prisma.snippet.findFirst).toHaveBeenCalledWith({
        where: {
          id: "snip_abc",
          userId: "usr_alice",
        },
        select: {
          id: true,
          title: true,
          description: true,
          code: true,
          language: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(mockSnippet);
    });

    it("returns null if snippet belongs to another user", async () => {
      vi.mocked(prisma.snippet.findFirst).mockResolvedValueOnce(null);

      const result = await findSnippetByIdAndUserId("snip_bob_owned", "usr_alice");

      expect(prisma.snippet.findFirst).toHaveBeenCalledWith({
        where: {
          id: "snip_bob_owned",
          userId: "usr_alice",
        },
        select: expect.any(Object),
      });
      expect(result).toBeNull();
    });

    it("returns null immediately when id or userId is missing or empty", async () => {
      const res1 = await findSnippetByIdAndUserId("", "usr_alice");
      const res2 = await findSnippetByIdAndUserId("snip_1", "");
      const res3 = await findSnippetByIdAndUserId("   ", "usr_alice");

      expect(res1).toBeNull();
      expect(res2).toBeNull();
      expect(res3).toBeNull();
      expect(prisma.snippet.findFirst).not.toHaveBeenCalled();
    });
  });

  describe("updateSnippet", () => {
    it("updates snippet when ID and userId match (ownership confirmed)", async () => {
      const existingSnippet = { id: "snip_123" };
      const updatedSnippet = {
        id: "snip_123",
        title: "Updated Title",
        description: "Updated description",
        code: "const updated = 1;",
        language: "typescript",
        status: "published",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-02-01"),
      };

      vi.mocked(prisma.snippet.findFirst).mockResolvedValueOnce(
        existingSnippet as never,
      );
      vi.mocked(prisma.snippet.update).mockResolvedValueOnce(
        updatedSnippet as never,
      );

      const result = await updateSnippet("snip_123", "usr_owner", {
        title: "  Updated Title  ",
        description: "  Updated description  ",
        code: "const updated = 1;",
        language: "typescript",
        status: "published",
      });

      expect(prisma.snippet.findFirst).toHaveBeenCalledWith({
        where: {
          id: "snip_123",
          userId: "usr_owner",
        },
        select: {
          id: true,
        },
      });

      expect(prisma.snippet.update).toHaveBeenCalledWith({
        where: {
          id: "snip_123",
        },
        data: {
          title: "Updated Title",
          description: "Updated description",
          code: "const updated = 1;",
          language: "typescript",
          status: "published",
        },
        select: {
          id: true,
          title: true,
          description: true,
          code: true,
          language: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(result).toEqual(updatedSnippet);
    });

    it("enforces ownership at query level and returns null without updating if user is not the owner", async () => {
      vi.mocked(prisma.snippet.findFirst).mockResolvedValueOnce(null);

      const result = await updateSnippet("snip_other_user", "usr_attacker", {
        title: "Hacked Title",
      });

      expect(prisma.snippet.findFirst).toHaveBeenCalledWith({
        where: {
          id: "snip_other_user",
          userId: "usr_attacker",
        },
        select: { id: true },
      });
      expect(prisma.snippet.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("returns null without updating if snippet does not exist", async () => {
      vi.mocked(prisma.snippet.findFirst).mockResolvedValueOnce(null);

      const result = await updateSnippet("snip_nonexistent", "usr_user", {
        title: "New Title",
      });

      expect(result).toBeNull();
      expect(prisma.snippet.update).not.toHaveBeenCalled();
    });

    it("throws an error if id or userId is missing or empty", async () => {
      await expect(
        updateSnippet("", "usr_owner", { title: "Title" }),
      ).rejects.toThrow("Snippet ID is required");

      await expect(
        updateSnippet("snip_1", "", { title: "Title" }),
      ).rejects.toThrow("User ID is required");

      expect(prisma.snippet.findFirst).not.toHaveBeenCalled();
      expect(prisma.snippet.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteSnippet", () => {
    it("deletes snippet scoped strictly to both ID and authenticated userId", async () => {
      vi.mocked(prisma.snippet.deleteMany).mockResolvedValueOnce({ count: 1 });

      const result = await deleteSnippet("snip_123", "usr_owner");

      expect(prisma.snippet.deleteMany).toHaveBeenCalledWith({
        where: {
          id: "snip_123",
          userId: "usr_owner",
        },
      });
      expect(result).toBe(true);
    });

    it("returns false if snippet belongs to another user (unauthorized deletion prevented)", async () => {
      vi.mocked(prisma.snippet.deleteMany).mockResolvedValueOnce({ count: 0 });

      const result = await deleteSnippet("snip_alice", "usr_bob");

      expect(prisma.snippet.deleteMany).toHaveBeenCalledWith({
        where: {
          id: "snip_alice",
          userId: "usr_bob",
        },
      });
      expect(result).toBe(false);
    });

    it("returns false if snippet does not exist", async () => {
      vi.mocked(prisma.snippet.deleteMany).mockResolvedValueOnce({ count: 0 });

      const result = await deleteSnippet("snip_nonexistent", "usr_owner");

      expect(result).toBe(false);
    });

    it("throws an error if id or userId is missing or empty", async () => {
      await expect(deleteSnippet("", "usr_owner")).rejects.toThrow(
        "Snippet ID is required",
      );

      await expect(deleteSnippet("snip_1", "")).rejects.toThrow(
        "User ID is required",
      );

      await expect(deleteSnippet("   ", "usr_owner")).rejects.toThrow(
        "Snippet ID is required",
      );

      await expect(deleteSnippet("snip_1", "   ")).rejects.toThrow(
        "User ID is required",
      );

      expect(prisma.snippet.deleteMany).not.toHaveBeenCalled();
    });
  });
});
