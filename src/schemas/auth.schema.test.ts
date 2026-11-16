import { describe, expect, it } from "vitest";

import { loginCredentialsSchema, registerSchema } from "./auth.schema";

describe("loginCredentialsSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginCredentialsSchema.safeParse({
      email: "user@example.com",
      password: "securepassword123",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
      expect(result.data.password).toBe("securepassword123");
    }
  });

  it("normalizes email by trimming whitespace and lowercasing", () => {
    const result = loginCredentialsSchema.safeParse({
      email: "  USER.Name@Example.COM  ",
      password: "password123",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe("user.name@example.com");
    }
  });

  it("rejects an invalid email format", () => {
    const result = loginCredentialsSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing email", () => {
    const result = loginCredentialsSchema.safeParse({
      password: "password123",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginCredentialsSchema.safeParse({
      email: "user@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing password", () => {
    const result = loginCredentialsSchema.safeParse({
      email: "user@example.com",
    });

    expect(result.success).toBe(false);
  });

  it("safely rejects non-object inputs", () => {
    expect(loginCredentialsSchema.safeParse(null).success).toBe(false);
    expect(loginCredentialsSchema.safeParse(undefined).success).toBe(false);
    expect(loginCredentialsSchema.safeParse("string").success).toBe(false);
    expect(loginCredentialsSchema.safeParse(123).success).toBe(false);
    expect(loginCredentialsSchema.safeParse([]).success).toBe(false);
  });
});

describe("registerSchema", () => {
  const validData = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    password: "Password123",
    passwordConfirmation: "Password123",
  };

  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse(validData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Ada Lovelace");
      expect(result.data.email).toBe("ada@example.com");
      expect(result.data.password).toBe("Password123");
      expect(result.data.passwordConfirmation).toBe("Password123");
    }
  });

  it("normalizes email by trimming and converting to lowercase", () => {
    const result = registerSchema.safeParse({
      ...validData,
      email: "  ADA.Lovelace@Example.COM  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("ada.lovelace@example.com");
    }
  });

  it("normalizes name by trimming whitespace", () => {
    const result = registerSchema.safeParse({
      ...validData,
      name: "   Ada Lovelace   ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Ada Lovelace");
    }
  });

  it("rejects a missing name", () => {
    const result = registerSchema.safeParse({
      email: "ada@example.com",
      password: "Password123",
      passwordConfirmation: "Password123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toBeDefined();
    }
  });

  it("rejects an empty or whitespace-only name", () => {
    const result = registerSchema.safeParse({
      ...validData,
      name: "   ",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toContain("Name is required");
    }
  });

  it("rejects a name exceeding 100 characters", () => {
    const result = registerSchema.safeParse({
      ...validData,
      name: "a".repeat(101),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toContain(
        "Name cannot exceed 100 characters",
      );
    }
  });

  it("rejects an invalid email format", () => {
    const result = registerSchema.safeParse({
      ...validData,
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toContain(
        "Invalid email address",
      );
    }
  });

  it("rejects a missing email", () => {
    const result = registerSchema.safeParse({
      name: "Ada Lovelace",
      password: "Password123",
      passwordConfirmation: "Password123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toBeDefined();
    }
  });

  it("rejects weak password with less than 8 characters", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "Pass1",
      passwordConfirmation: "Pass1",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toContain(
        "Password must be at least 8 characters",
      );
    }
  });

  it("rejects weak password missing a number", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "PasswordWithoutNumber",
      passwordConfirmation: "PasswordWithoutNumber",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toContain(
        "Password must contain at least one number",
      );
    }
  });

  it("rejects weak password missing a letter", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "1234567890",
      passwordConfirmation: "1234567890",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toContain(
        "Password must contain at least one letter",
      );
    }
  });

  it("rejects password confirmation mismatch", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "Password123",
      passwordConfirmation: "DifferentPassword123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.passwordConfirmation).toContain(
        "Passwords do not match",
      );
    }
  });

  it("rejects missing password confirmation", () => {
    const result = registerSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "Password123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.passwordConfirmation).toBeDefined();
    }
  });

  it("safely rejects non-object inputs", () => {
    expect(registerSchema.safeParse(null).success).toBe(false);
    expect(registerSchema.safeParse(undefined).success).toBe(false);
    expect(registerSchema.safeParse("not an object").success).toBe(false);
    expect(registerSchema.safeParse(42).success).toBe(false);
  });
});
