import { z } from "zod";

export const serverEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid URL")
    .refine((value) => {
      try {
        const protocol = new URL(value).protocol;

        return ["postgres:", "postgresql:"].includes(protocol);
      } catch {
        return false;
      }
    }, "DATABASE_URL must use PostgreSQL"),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

