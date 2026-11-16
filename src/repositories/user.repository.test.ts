import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/prisma";
import { createUser, findUserByEmail } from "./user.repository";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("user.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findUserByEmail", () => {
    it("looks up user by email with safe selection", async () => {
      const mockUser = {
        id: "usr_123",
        name: "Ada Lovelace",
        email: "ada@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as never);

      const result = await findUserByEmail("ada@example.com");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "ada@example.com" },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it("returns null when user is not found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      const result = await findUserByEmail("missing@example.com");

      expect(result).toBeNull();
    });
  });

  describe("createUser", () => {
    it("creates user in database and selects only safe fields", async () => {
      const mockCreated = {
        id: "usr_new",
        name: "Ada Lovelace",
        email: "ada@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.create).mockResolvedValueOnce(mockCreated as never);

      const result = await createUser({
        name: "Ada Lovelace",
        email: "ada@example.com",
        passwordHash: "$argon2id$v=19$mockhash",
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: "Ada Lovelace",
          email: "ada@example.com",
          passwordHash: "$argon2id$v=19$mockhash",
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(mockCreated);
      expect(result).not.toHaveProperty("passwordHash");
    });
  });
});
