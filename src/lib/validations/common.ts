import { z } from "zod";

// Reusable identifier validation
export const idSchema = z.string().trim().min(1, "ID is required");

// Reusable title validation
export const titleSchema = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(120, "Title cannot exceed 120 characters");

// Reusable description validation
export const descriptionSchema = z
  .string()
  .trim()
  .max(500, "Description cannot exceed 500 characters")
  .nullable()
  .optional();
