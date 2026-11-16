import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { ConflictError, ValidationError } from "@/lib/errors/app-error";
import { registerUser } from "@/services/user.service";
import { registerAction } from "./actions";
import { initialRegisterFormState } from "./types";

vi.mock("@/services/user.service", () => ({
  registerUser: vi.fn(),
}));

vi.mock("@/auth", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

describe("registerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createFormData(data: Record<string, string>) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      formData.append(key, value);
    }
    return formData;
  }

  it("successfully registers a user, invokes signIn with correct params, and re-throws redirect", async () => {
    vi.mocked(registerUser).mockResolvedValueOnce({
      id: "usr_123",
      name: "Ada Lovelace",
      email: "ada@example.com",
      createdAt: new Date(),
    });

    const redirectError = new Error("NEXT_REDIRECT");
    vi.mocked(signIn).mockRejectedValueOnce(redirectError);

    const formData = createFormData({
      name: "  Ada Lovelace  ",
      email: "  ADA@Example.COM  ",
      password: "Password123",
      passwordConfirmation: "Password123",
    });

    await expect(
      registerAction(initialRegisterFormState, formData),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(registerUser).toHaveBeenCalledWith({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "Password123",
      passwordConfirmation: "Password123",
    });

    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "ada@example.com",
      password: "Password123",
      redirectTo: "/dashboard",
    });
  });

  it("re-throws native Next.js digest redirect errors without swallowing them", async () => {
    vi.mocked(registerUser).mockResolvedValueOnce({
      id: "usr_123",
      name: "Ada Lovelace",
      email: "ada@example.com",
      createdAt: new Date(),
    });

    const digestRedirectError = {
      digest: "NEXT_REDIRECT;replace;/dashboard;307;",
    };
    vi.mocked(signIn).mockRejectedValueOnce(digestRedirectError);

    const formData = createFormData({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "Password123",
      passwordConfirmation: "Password123",
    });

    await expect(
      registerAction(initialRegisterFormState, formData),
    ).rejects.toEqual(digestRedirectError);
  });

  it("returns safe user data when signIn completes without throwing redirect", async () => {
    vi.mocked(registerUser).mockResolvedValueOnce({
      id: "usr_123",
      name: "Ada Lovelace",
      email: "ada@example.com",
      createdAt: new Date(),
    });
    vi.mocked(signIn).mockResolvedValueOnce(undefined as never);

    const formData = createFormData({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "Password123",
      passwordConfirmation: "Password123",
    });

    const state = await registerAction(initialRegisterFormState, formData);

    expect(state.success).toBe(true);
    expect(state.message).toContain("Redirecting to dashboard");
    expect(state.user).toEqual({
      id: "usr_123",
      name: "Ada Lovelace",
      email: "ada@example.com",
    });
    expect(state.user).not.toHaveProperty("password");
    expect(state.user).not.toHaveProperty("passwordHash");
  });

  it("handles authentication failure after successful account creation without retrying creation", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(registerUser).mockResolvedValueOnce({
      id: "usr_123",
      name: "Ada Lovelace",
      email: "ada@example.com",
      createdAt: new Date(),
    });
    vi.mocked(signIn).mockRejectedValueOnce(new AuthError("CredentialsSignin"));

    const formData = createFormData({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "Password123",
      passwordConfirmation: "Password123",
    });

    const state = await registerAction(initialRegisterFormState, formData);

    // Should indicate sign-in failed, NOT that registration failed
    expect(state.success).toBe(false);
    expect(state.message).toBe(
      "Your account was created successfully, but automatic sign-in could not be completed. Please sign in manually.",
    );
    expect(state.errors?.form).toContain(
      "Your account was created successfully, but automatic sign-in could not be completed. Please sign in manually.",
    );
    expect(state.user).toEqual({
      id: "usr_123",
      name: "Ada Lovelace",
      email: "ada@example.com",
    });

    // registerUser was called exactly ONCE - not retried!
    expect(registerUser).toHaveBeenCalledTimes(1);

    // No password or hash in returned state
    expect(JSON.stringify(state)).not.toContain("Password123");
    expect(state.user).not.toHaveProperty("passwordHash");

    consoleSpy.mockRestore();
  });

  it("handles authentication infrastructure failure after user creation without exposing internal details", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(registerUser).mockResolvedValueOnce({
      id: "usr_123",
      name: "Ada Lovelace",
      email: "ada@example.com",
      createdAt: new Date(),
    });
    vi.mocked(signIn).mockRejectedValueOnce(
      new Error("FATAL: Auth infrastructure unreachable at 192.168.1.1"),
    );

    const formData = createFormData({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "Password123",
      passwordConfirmation: "Password123",
    });

    const state = await registerAction(initialRegisterFormState, formData);

    expect(state.success).toBe(false);
    expect(state.message).toBe(
      "Your account was created successfully, but automatic sign-in could not be completed. Please sign in manually.",
    );
    expect(state.user?.id).toBe("usr_123");
    expect(JSON.stringify(state)).not.toContain("192.168.1.1");

    consoleSpy.mockRestore();
  });

  it("returns validation errors when input is invalid without calling service or signIn", async () => {
    const formData = createFormData({
      name: "",
      email: "invalid-email",
      password: "short",
      passwordConfirmation: "mismatch",
    });

    const state = await registerAction(initialRegisterFormState, formData);

    expect(state.success).toBe(false);
    expect(state.errors?.name).toBeDefined();
    expect(state.errors?.email).toBeDefined();
    expect(state.errors?.password).toBeDefined();
    expect(state.errors?.passwordConfirmation).toBeDefined();
    expect(registerUser).not.toHaveBeenCalled();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("handles ConflictError when email is already registered and does not invoke signIn", async () => {
    vi.mocked(registerUser).mockRejectedValueOnce(
      new ConflictError("An account with this email already exists"),
    );

    const formData = createFormData({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "Password123",
      passwordConfirmation: "Password123",
    });

    const state = await registerAction(initialRegisterFormState, formData);

    expect(state.success).toBe(false);
    expect(state.errors?.email).toContain(
      "An account with this email already exists",
    );
    expect(signIn).not.toHaveBeenCalled();
  });

  it("handles ValidationError safely without invoking signIn", async () => {
    vi.mocked(registerUser).mockRejectedValueOnce(
      new ValidationError("Invalid registration parameters"),
    );

    const formData = createFormData({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "Password123",
      passwordConfirmation: "Password123",
    });

    const state = await registerAction(initialRegisterFormState, formData);

    expect(state.success).toBe(false);
    expect(state.errors?.form).toContain("Invalid registration parameters");
    expect(signIn).not.toHaveBeenCalled();
  });

  it("handles unexpected database errors safely without exposing internal details or invoking signIn", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(registerUser).mockRejectedValueOnce(
      new Error("FATAL: Database connection pool destroyed at IP 10.0.0.1"),
    );

    const formData = createFormData({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "Password123",
      passwordConfirmation: "Password123",
    });

    const state = await registerAction(initialRegisterFormState, formData);

    expect(state.success).toBe(false);
    expect(state.message).toBe("An unexpected error occurred. Please try again later.");
    expect(state.errors?.form).toContain(
      "An unexpected error occurred. Please try again later.",
    );
    expect(JSON.stringify(state)).not.toContain("FATAL: Database connection pool");
    expect(signIn).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
