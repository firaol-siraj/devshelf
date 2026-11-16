"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { loginCredentialsSchema } from "@/schemas/auth.schema";
import type { LoginFormState } from "./types";

export type { LoginFormState };

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const rawInput = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validationResult = loginCredentialsSchema.safeParse(rawInput);

  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors;

    return {
      success: false,
      message: "Invalid email or password.",
      errors: {
        email: fieldErrors.email,
        password: fieldErrors.password,
        form: ["Invalid email or password."],
      },
    };
  }

  try {
    await signIn("credentials", {
      email: validationResult.data.email,
      password: validationResult.data.password,
      redirectTo: "/dashboard",
    });

    return {
      success: true,
      message: "Signed in successfully.",
    };
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return {
        success: false,
        message: "Invalid email or password.",
        errors: {
          form: ["Invalid email or password."],
        },
      };
    }

    throw error;
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
