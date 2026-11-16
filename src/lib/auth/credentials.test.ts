import { beforeEach, describe, expect, it, vi } from "vitest";

import argon2 from "argon2";
import { prisma } from "@/lib/prisma";
import { verifyCredentials } from "./credentials";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("argon2", () => ({
  default: {
    verify: vi.fn(),
  },
}));

describe("verifyCredentials", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("invalid / missing credential input", () => {
    it("returns null when credentials are null", async () => {
      const result = await verifyCredentials(null);

      expect(result).toBeNull();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("returns null when credentials are empty object", async () => {
      const result = await verifyCredentials({});

      expect(result).toBeNull();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("returns null when email format is invalid", async () => {
      const result = await verifyCredentials({
        email: "not-an-email",
        password: "secretpassword",
      });

      expect(result).toBeNull();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("returns null when password is empty", async () => {
      const result = await verifyCredentials({
        email: "alice@example.com",
        password: "",
      });

      expect(result).toBeNull();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("unknown email", () => {
    it("returns null when user is not found in database", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      const result = await verifyCredentials({
        email: "unknown@example.com",
        password: "password123",
      });

      expect(result).toBeNull();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "unknown@example.com" },
        select: {
          id: true,
          name: true,
          email: true,
          passwordHash: true,
        },
      });
      expect(argon2.verify).not.toHaveBeenCalled();
    });
  });

  describe("incorrect password", () => {
    it("returns null when password hash verification fails", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "usr_123",
        name: "Test User",
        email: "test@example.com",
        passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$somehash",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(argon2.verify).mockResolvedValueOnce(false);

      const result = await verifyCredentials({
        email: "test@example.com",
        password: "wrong-password",
      });

      expect(result).toBeNull();
      expect(argon2.verify).toHaveBeenCalledWith(
        "$argon2id$v=19$m=65536,t=3,p=4$somehash",
        "wrong-password",
      );
    });
  });

  describe("successful credential verification", () => {
    it("returns safe user data when email and password match", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "usr_456",
        name: "Alice Developer",
        email: "alice@example.com",
        passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$validhash",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(argon2.verify).mockResolvedValueOnce(true);

      const result = await verifyCredentials({
        email: "  Alice@Example.COM  ",
        password: "correct-password",
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "alice@example.com" },
        select: {
          id: true,
          name: true,
          email: true,
          passwordHash: true,
        },
      });
      expect(argon2.verify).toHaveBeenCalledWith(
        "$argon2id$v=19$m=65536,t=3,p=4$validhash",
        "correct-password",
      );
      expect(result).toEqual({
        id: "usr_456",
        name: "Alice Developer",
        email: "alice@example.com",
      });
    });
  });

  describe("safe user object returned without password hash", () => {
    it("never exposes passwordHash in returned user object", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "usr_789",
        name: "Bob",
        email: "bob@example.com",
        passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$bobhash",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(argon2.verify).mockResolvedValueOnce(true);

      const result = await verifyCredentials({
        email: "bob@example.com",
        password: "bob-password",
      });

      expect(result).not.toBeNull();
      expect(result).not.toHaveProperty("passwordHash");
      expect(Object.keys(result!)).toEqual(["id", "name", "email"]);
    });
  });

  describe("error handling and resilience", () => {
    it("propagates Prisma/database errors instead of returning null", async () => {
      const dbError = new Error("Database connection failure");
      vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(dbError);

      await expect(
        verifyCredentials({
          email: "error@example.com",
          password: "password123",
        }),
      ).rejects.toThrow("Database connection failure");
    });

    it("returns null if argon2.verify throws an error (malformed or unsupported hash)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "usr_err",
        name: "Error User",
        email: "err@example.com",
        passwordHash: "corrupted_or_unsupported_hash",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(argon2.verify).mockRejectedValueOnce(
        new Error("The password hash is not in a valid format"),
      );

      const result = await verifyCredentials({
        email: "err@example.com",
        password: "password123",
      });

      expect(result).toBeNull();
    });

    it("returns null if user record exists but passwordHash is empty or missing", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "usr_nohash",
        name: "No Hash User",
        email: "nohash@example.com",
        passwordHash: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await verifyCredentials({
        email: "nohash@example.com",
        password: "password123",
      });

      expect(result).toBeNull();
      expect(argon2.verify).not.toHaveBeenCalled();
    });
  });
});
