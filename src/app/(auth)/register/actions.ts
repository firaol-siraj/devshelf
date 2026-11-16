"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signIn } from "@/auth";
import { registerSchema } from "@/schemas/auth.schema";
import { registerUser } from "@/services/user.service";
import type { RegisteredUser } from "@/services/user.service";
import { ConflictError, ValidationError } from "@/lib/errors/app-error";
import type { RegisterFormState } from "./types";

export type { RegisterFormState };

function checkIsRedirectError(error: unknown): boolean {
  if (isRedirectError(error)) {
    return true;
  }
  if (error instanceof Error && error.message === "NEXT_REDIRECT") {
    return true;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  ) {
    return true;
  }
  return false;
}

export async function registerAction(
  _prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const rawInput = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  };

  const validationResult = registerSchema.safeParse(rawInput);

  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors;

    return {
      success: false,
      message: "Please correct the errors in the form.",
      errors: {
        name: fieldErrors.name,
        email: fieldErrors.email,
        password: fieldErrors.password,
        passwordConfirmation: fieldErrors.passwordConfirmation,
      },
    };
  }

  let user: RegisteredUser;

  try {
    user = await registerUser(validationResult.data);
  } catch (error: unknown) {
    if (error instanceof ConflictError) {
      return {
        success: false,
        message: error.message,
        errors: {
          email: [error.message],
        },
      };
    }

    if (error instanceof ValidationError) {
      return {
        success: false,
        message: error.message,
        errors: {
          form: [error.message],
        },
      };
    }

    console.error("Registration error:", error);

    return {
      success: false,
      message: "An unexpected error occurred. Please try again later.",
      errors: {
        form: ["An unexpected error occurred. Please try again later."],
      },
    };
  }

  // Account creation succeeded. Automatically authenticate the user.
  try {
    await signIn("credentials", {
      email: validationResult.data.email,
      password: validationResult.data.password,
      redirectTo: "/dashboard",
    });

    return {
      success: true,
      message: "Account created successfully. Redirecting to dashboard...",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  } catch (authError: unknown) {
    if (checkIsRedirectError(authError)) {
      throw authError;
    }

    console.error("Auto sign-in error after registration:", authError);

    return {
      success: false,
      message:
        "Your account was created successfully, but automatic sign-in could not be completed. Please sign in manually.",
      errors: {
        form: [
          "Your account was created successfully, but automatic sign-in could not be completed. Please sign in manually.",
        ],
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }
}
