import "server-only";

import { prisma } from "@/lib/prisma";
import type {
  ProgrammingLanguage,
  SnippetSortOption,
  SnippetStatus,
} from "@/types/snippet";
import { ALL_PROGRAMMING_LANGUAGES } from "@/schemas/snippet.schema";

export interface SnippetQueryOptions {
  search?: string;
  q?: string;
  status?: SnippetStatus | "all";
  language?: ProgrammingLanguage | "all";
  sort?: SnippetSortOption;
}

export interface CreateSnippetData {
  title: string;
  description?: string | null;
  code: string;
  language: ProgrammingLanguage;
  status?: SnippetStatus;
}

export interface UpdateSnippetData {
  title?: string;
  description?: string | null;
  code?: string;
  language?: ProgrammingLanguage;
  status?: SnippetStatus;
}

export async function createSnippet(userId: string, data: CreateSnippetData) {
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    throw new Error("User ID is required to create a snippet");
  }

  return prisma.snippet.create({
    data: {
      userId: userId.trim(),
      title: data.title.trim(),
      description: data.description ? data.description.trim() : null,
      code: data.code,
      language: data.language,
      status: data.status ?? "draft",
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
}

export async function findSnippetsByUserId(
  userId: string,
  limit: number,
  options?: SnippetQueryOptions,
) {
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return [];
  }

  // Preserve exact legacy behavior when called without options
  if (!options) {
    return prisma.snippet.findMany({
      where: {
        userId: userId.trim(),
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

  const where: {
    userId: string;
    status?: SnippetStatus;
    language?: ProgrammingLanguage;
    AND?: Array<{
      OR: Array<{
        title?: { contains: string; mode: "insensitive" };
        description?: { contains: string; mode: "insensitive" };
        code?: { contains: string; mode: "insensitive" };
        language?: { in: ProgrammingLanguage[] };
      }>;
    }>;
  } = {
    userId: userId.trim(),
  };

  if (options.status && options.status !== "all") {
    where.status = options.status;
  }

  if (options.language && options.language !== "all") {
    where.language = options.language;
  }

  const cleanSearch = (options.q ?? options.search)?.trim();
  if (cleanSearch) {
    const matchedLanguages: ProgrammingLanguage[] = [
      ...ALL_PROGRAMMING_LANGUAGES,
    ].filter((lang) => lang.toLowerCase().includes(cleanSearch.toLowerCase()));

    const searchConditions: Array<{
      title?: { contains: string; mode: "insensitive" };
      description?: { contains: string; mode: "insensitive" };
      code?: { contains: string; mode: "insensitive" };
      language?: { in: ProgrammingLanguage[] };
    }> = [
      { title: { contains: cleanSearch, mode: "insensitive" } },
      { description: { contains: cleanSearch, mode: "insensitive" } },
      { code: { contains: cleanSearch, mode: "insensitive" } },
    ];

    if (matchedLanguages.length > 0) {
      searchConditions.push({ language: { in: matchedLanguages } });
    }

    where.AND = [{ OR: searchConditions }];
  }

  let orderBy:
    | { createdAt: "asc" | "desc" }
    | { updatedAt: "asc" | "desc" }
    | { title: "asc" | "desc" };

  switch (options.sort) {
    case "oldest":
      orderBy = { createdAt: "asc" };
      break;
    case "updated":
    case "recently_updated":
      orderBy = { updatedAt: "desc" };
      break;
    case "a-z":
    case "title_asc":
      orderBy = { title: "asc" };
      break;
    case "z-a":
    case "title_desc":
      orderBy = { title: "desc" };
      break;
    case "newest":
    default:
      orderBy = { createdAt: "desc" };
      break;
  }

  return prisma.snippet.findMany({
    where,
    orderBy,
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

export async function countSnippetsByUserId(
  userId: string,
  options?: SnippetQueryOptions,
): Promise<number> {
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return 0;
  }

  const where: {
    userId: string;
    status?: SnippetStatus;
    language?: ProgrammingLanguage;
    AND?: Array<{
      OR: Array<{
        title?: { contains: string; mode: "insensitive" };
        description?: { contains: string; mode: "insensitive" };
        code?: { contains: string; mode: "insensitive" };
        language?: { in: ProgrammingLanguage[] };
      }>;
    }>;
  } = {
    userId: userId.trim(),
  };

  if (options) {
    if (options.status && options.status !== "all") {
      where.status = options.status;
    }

    if (options.language && options.language !== "all") {
      where.language = options.language;
    }

    const cleanSearch = (options.q ?? options.search)?.trim();
    if (cleanSearch) {
      const matchedLanguages: ProgrammingLanguage[] = [
        ...ALL_PROGRAMMING_LANGUAGES,
      ].filter((lang) => lang.toLowerCase().includes(cleanSearch.toLowerCase()));

      const searchConditions: Array<{
        title?: { contains: string; mode: "insensitive" };
        description?: { contains: string; mode: "insensitive" };
        code?: { contains: string; mode: "insensitive" };
        language?: { in: ProgrammingLanguage[] };
      }> = [
        { title: { contains: cleanSearch, mode: "insensitive" } },
        { description: { contains: cleanSearch, mode: "insensitive" } },
        { code: { contains: cleanSearch, mode: "insensitive" } },
      ];

      if (matchedLanguages.length > 0) {
        searchConditions.push({ language: { in: matchedLanguages } });
      }

      where.AND = [{ OR: searchConditions }];
    }
  }

  return prisma.snippet.count({
    where,
  });
}

export async function findSnippetByIdAndUserId(
  id: string,
  userId: string,
) {
  if (!id || typeof id !== "string" || id.trim() === "") {
    return null;
  }
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return null;
  }

  return prisma.snippet.findFirst({
    where: {
      id: id.trim(),
      userId: userId.trim(),
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
}

export async function updateSnippet(
  id: string,
  userId: string,
  data: UpdateSnippetData,
) {
  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new Error("Snippet ID is required to update a snippet");
  }
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    throw new Error("User ID is required to update a snippet");
  }

  const existing = await prisma.snippet.findFirst({
    where: {
      id: id.trim(),
      userId: userId.trim(),
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    return null;
  }

  const updateData: {
    title?: string;
    description?: string | null;
    code?: string;
    language?: ProgrammingLanguage;
    status?: SnippetStatus;
  } = {};

  if (data.title !== undefined) {
    updateData.title = data.title.trim();
  }
  if (data.description !== undefined) {
    updateData.description = data.description ? data.description.trim() : null;
  }
  if (data.code !== undefined) {
    updateData.code = data.code;
  }
  if (data.language !== undefined) {
    updateData.language = data.language;
  }
  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  return prisma.snippet.update({
    where: {
      id: existing.id,
    },
    data: updateData,
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

export async function deleteSnippet(
  id: string,
  userId: string,
): Promise<boolean> {
  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new Error("Snippet ID is required to delete a snippet");
  }
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    throw new Error("User ID is required to delete a snippet");
  }

  const result = await prisma.snippet.deleteMany({
    where: {
      id: id.trim(),
      userId: userId.trim(),
    },
  });

  return result.count > 0;
}
