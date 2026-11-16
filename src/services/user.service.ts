import "server-only";

import argon2 from "argon2";
import { Prisma } from "@/generated/prisma/client";
import { ConflictError } from "@/lib/errors/app-error";
import { createUser, findUserByEmail } from "@/repositories/user.repository";

export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
}

export interface RegisteredUser {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
}

export async function registerUser(
  data: RegisterUserData,
): Promise<RegisteredUser> {
  const normalizedEmail = data.email.trim().toLowerCase();

  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new ConflictError("An account with this email already exists");
  }

  const passwordHash = await argon2.hash(data.password);

  try {
    const newUser = await createUser({
      name: data.name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt,
    };
  } catch (error: unknown) {
    if (
      (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002") ||
      (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: string }).code === "P2002")
    ) {
      throw new ConflictError("An account with this email already exists");
    }

    throw error;
  }
}
