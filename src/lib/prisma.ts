import "server-only";

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { serverEnv } from "@/lib/env/server";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({
  connectionString: serverEnv.DATABASE_URL,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      serverEnv.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });

if (serverEnv.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
