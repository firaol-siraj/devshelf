import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import { getUserSnippets } from "../src/services/snippet.service";

async function main() {
  console.log("Connecting to PostgreSQL...");

  await prisma.$connect();

  console.log("Database connected successfully!");

  const result = await prisma.$queryRaw<
    { current_database: string; current_user: string }[]
  >`
    SELECT current_database(), current_user
  `;

  console.log("Connection information:", result);

  const userCount = await prisma.user.count();

  console.log("Current user count:", userCount);

  // Use an existing user, or a harmless ID for an empty-result test.
  const user = await prisma.user.findFirst({
    select: { id: true },
  });

  const userId = user?.id ?? "__devshelf_read_probe__";

  // Test the actual service -> repository -> Prisma flow.
  const snippets = await getUserSnippets(userId);

  console.log("Snippet service read successful!");
  console.log("Returned snippet count:", snippets.length);
}

main()
  .catch((error) => {
    console.error("Database test failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
