import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { loginAction, logoutAction } from "./actions";
import { initialLoginFormState } from "./types";

vi.mock("@/auth", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

describe("login/actions", () => {
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

  describe("loginAction", () => {
    it("successfully calls signIn with normalized credentials and redirectTo /dashboard", async () => {
      vi.mocked(signIn).mockResolvedValueOnce(undefined as never);

      const formData = createFormData({
        email: "  Ada.Lovelace@Example.COM  ",
        password: "Password123",
      });

      const state = await loginAction(initialLoginFormState, formData);

      expect(signIn).toHaveBeenCalledWith("credentials", {
        email: "ada.lovelace@example.com",
        password: "Password123",
        redirectTo: "/dashboard",
      });
      expect(state.success).toBe(true);
      expect(state.message).toBe("Signed in successfully.");
    });

    it("returns validation failure when email is invalid without calling signIn", async () => {
      const formData = createFormData({
        email: "not-an-email",
        password: "Password123",
      });

      const state = await loginAction(initialLoginFormState, formData);

      expect(state.success).toBe(false);
      expect(state.errors?.email).toBeDefined();
      expect(state.errors?.form).toContain("Invalid email or password.");
      expect(signIn).not.toHaveBeenCalled();
    });

    it("returns validation failure when password is empty without calling signIn", async () => {
      const formData = createFormData({
        email: "ada@example.com",
        password: "",
      });

      const state = await loginAction(initialLoginFormState, formData);

      expect(state.success).toBe(false);
      expect(state.errors?.password).toBeDefined();
      expect(state.errors?.form).toContain("Invalid email or password.");
      expect(signIn).not.toHaveBeenCalled();
    });

    it("returns generic invalid credentials message when signIn throws AuthError", async () => {
      const authError = new AuthError("CredentialsSignin");
      vi.mocked(signIn).mockRejectedValueOnce(authError);

      const formData = createFormData({
        email: "ada@example.com",
        password: "WrongPassword123",
      });

      const state = await loginAction(initialLoginFormState, formData);

      expect(state.success).toBe(false);
      expect(state.message).toBe("Invalid email or password.");
      expect(state.errors?.form).toContain("Invalid email or password.");
    });

    it("rethrows redirect errors (non-AuthError) so Next.js can handle the redirect", async () => {
      const redirectError = new Error("NEXT_REDIRECT");
      vi.mocked(signIn).mockRejectedValueOnce(redirectError);

      const formData = createFormData({
        email: "ada@example.com",
        password: "Password123",
      });

      await expect(loginAction(initialLoginFormState, formData)).rejects.toThrow(
        "NEXT_REDIRECT",
      );
    });
  });

  describe("logoutAction", () => {
    it("calls signOut with redirectTo /login", async () => {
      vi.mocked(signOut).mockResolvedValueOnce(undefined as never);

      await logoutAction();

      expect(signOut).toHaveBeenCalledWith({
        redirectTo: "/login",
      });
    });
  });
});
