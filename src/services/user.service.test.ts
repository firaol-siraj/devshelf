import { beforeEach, describe, expect, it, vi } from "vitest";

import argon2 from "argon2";
import { Prisma } from "@/generated/prisma/client";
import { createUser, findUserByEmail } from "@/repositories/user.repository";
import { registerUser } from "./user.service";

vi.mock("argon2", () => ({
  default: {
    hash: vi.fn(),
  },
}));

vi.mock("@/repositories/user.repository", () => ({
  findUserByEmail: vi.fn(),
  createUser: vi.fn(),
}));

describe("user.service - registerUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validRegistrationInput = {
    name: "Ada Lovelace",
    email: "Ada@Example.COM",
    password: "Password123",
  };

  it("successfully registers a user with Argon2 password hashing", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);
    vi.mocked(argon2.hash).mockResolvedValue("$argon2id$v=19$mockedhash");
    vi.mocked(createUser).mockResolvedValue({
      id: "usr_123",
      name: "Ada Lovelace",
      email: "ada@example.com",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    });

    const result = await registerUser(validRegistrationInput);

    expect(findUserByEmail).toHaveBeenCalledWith("ada@example.com");
    expect(argon2.hash).toHaveBeenCalledWith("Password123");
    expect(createUser).toHaveBeenCalledWith({
      name: "Ada Lovelace",
      email: "ada@example.com",
      passwordHash: "$argon2id$v=19$mockedhash",
    });
    expect(result).toEqual({
      id: "usr_123",
      name: "Ada Lovelace",
      email: "ada@example.com",
      createdAt: new Date("2026-01-01"),
    });
  });

  it("never exposes passwordHash in returned user object", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);
    vi.mocked(argon2.hash).mockResolvedValue("$argon2id$v=19$mockedhash");
    vi.mocked(createUser).mockResolvedValue({
      id: "usr_123",
      name: "Ada Lovelace",
      email: "ada@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await registerUser(validRegistrationInput);

    expect(result).not.toHaveProperty("passwordHash");
    expect(Object.keys(result)).toEqual(["id", "name", "email", "createdAt"]);
  });

  it("throws ConflictError when email already exists", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({
      id: "usr_existing",
      name: "Existing User",
      email: "ada@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(registerUser(validRegistrationInput)).rejects.toThrow(
      "An account with this email already exists",
    );
    expect(argon2.hash).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
  });

  it("handles Prisma unique constraint race conditions (P2002) and throws ConflictError", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);
    vi.mocked(argon2.hash).mockResolvedValue("$argon2id$v=19$mockedhash");

    const p2002Error = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed on the fields: (`email`)",
      {
        code: "P2002",
        clientVersion: "7.10.1",
      },
    );
    vi.mocked(createUser).mockRejectedValue(p2002Error);

    await expect(registerUser(validRegistrationInput)).rejects.toThrow(
      "An account with this email already exists",
    );
  });

  it("propagates unexpected database errors during user creation", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);
    vi.mocked(argon2.hash).mockResolvedValue("$argon2id$v=19$mockedhash");
    vi.mocked(createUser).mockRejectedValue(
      new Error("Database connection dropped"),
    );

    await expect(registerUser(validRegistrationInput)).rejects.toThrow(
      "Database connection dropped",
    );
  });

  it("propagates unexpected database errors during email lookup", async () => {
    vi.mocked(findUserByEmail).mockRejectedValue(
      new Error("Database unreachable"),
    );

    await expect(registerUser(validRegistrationInput)).rejects.toThrow(
      "Database unreachable",
    );
  });
});
