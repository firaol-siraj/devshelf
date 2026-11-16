"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { registerAction } from "./actions";
import { initialRegisterFormState } from "./types";

export default function RegisterForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialRegisterFormState,
  );

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="mt-6 space-y-4" noValidate>
      {/* Global Form Error Message */}
      {state.errors?.form && state.errors.form.length > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm text-danger"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            {state.errors.form.map((err) => (
              <p key={err}>{err}</p>
            ))}
            {state.user && (
              <p className="pt-1 text-xs">
                <Link
                  href="/login"
                  className="font-semibold underline hover:text-danger/80"
                >
                  Proceed to Sign In
                </Link>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Success State Banner */}
      {state.success && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold">
              {state.message || "Account created successfully!"}
            </p>
            <p className="text-xs text-foreground-secondary">
              Redirecting you to your dashboard...{" "}
              <Link
                href="/dashboard"
                className="font-medium underline hover:text-foreground"
              >
                Click here if not redirected automatically.
              </Link>
            </p>
          </div>
        </div>
      )}

      <Input
        id="name"
        name="name"
        type="text"
        label="Full name"
        placeholder="Jane Doe"
        autoComplete="name"
        required
        disabled={isPending || state.success || Boolean(state.user)}
        error={state.errors?.name?.[0]}
      />

      <Input
        id="email"
        name="email"
        type="email"
        label="Email address"
        placeholder="jane@example.com"
        autoComplete="email"
        required
        disabled={isPending || state.success || Boolean(state.user)}
        error={state.errors?.email?.[0]}
      />

      <Input
        id="password"
        name="password"
        type="password"
        label="Password"
        placeholder="At least 8 characters (with letters and numbers)"
        autoComplete="new-password"
        required
        disabled={isPending || state.success || Boolean(state.user)}
        error={state.errors?.password?.[0]}
      />

      <Input
        id="passwordConfirmation"
        name="passwordConfirmation"
        type="password"
        label="Confirm password"
        placeholder="Re-enter your password"
        autoComplete="new-password"
        required
        disabled={isPending || state.success || Boolean(state.user)}
        error={state.errors?.passwordConfirmation?.[0]}
      />

      <Button
        type="submit"
        variant="primary"
        className="w-full mt-2"
        isLoading={isPending}
        disabled={isPending || state.success || Boolean(state.user)}
      >
        Create Account
      </Button>
    </form>
  );
}
