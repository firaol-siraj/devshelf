import "server-only";

import { prisma } from "@/lib/prisma";

export function findSnippetsByUserId(
  userId: string,
  limit: number,
) {
  return prisma.snippet.findMany({
    where: {
      userId,
    },

    orderBy: {
      updatedAt: "desc",
    },

    take: limit,

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
}
