import "server-only";

import { serverEnvSchema } from "@/lib/env/schema";

const result = serverEnvSchema.safeParse(process.env);

if (!result.success) {
  console.error(
    "Invalid server environment:",
    result.error.flatten().fieldErrors,
  );

  throw new Error("Invalid server environment configuration");
}

export const serverEnv = result.data;
