import "server-only";

import argon2 from "argon2";
import { prisma } from "@/lib/prisma";
import { loginCredentialsSchema } from "@/schemas/auth.schema";

export interface SafeAuthUser {
  id: string;
  name: string | null;
  email: string;
}

export async function verifyCredentials(
  credentials: unknown,
): Promise<SafeAuthUser | null> {
  const result = loginCredentialsSchema.safeParse(credentials);

  if (!result.success) {
    return null;
  }

  const { email, password } = result.data;

  // Propagate database errors so outages are not masked as bad credentials.
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
    },
  });

  if (!user || !user.passwordHash) {
    return null;
  }

  let isValidPassword = false;

  // Catch malformed or corrupted hashes thrown during Argon2 verification.
  try {
    isValidPassword = await argon2.verify(user.passwordHash, password);
  } catch {
    return null;
  }

  if (!isValidPassword) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}
