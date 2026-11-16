import { z } from "zod";

export const serverEnvSchema = z
  .object({
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

    AUTH_SECRET: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production") {
      if (!data.AUTH_SECRET || data.AUTH_SECRET.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "AUTH_SECRET is required in production",
          path: ["AUTH_SECRET"],
        });
      } else if (data.AUTH_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "AUTH_SECRET must be at least 32 characters long in production",
          path: ["AUTH_SECRET"],
        });
      }
    }
  });
