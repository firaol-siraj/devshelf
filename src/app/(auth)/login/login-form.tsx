"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { loginAction } from "./actions";
import { initialLoginFormState } from "./types";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialLoginFormState,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4" noValidate>
      {/* Form Error Message */}
      {state.errors?.form && state.errors.form.length > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm text-danger"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-0.5">
            {state.errors.form.map((err) => (
              <p key={err}>{err}</p>
            ))}
          </div>
        </div>
      )}

      <Input
        id="email"
        name="email"
        type="email"
        label="Email address"
        placeholder="jane@example.com"
        autoComplete="email"
        required
        disabled={isPending}
        error={state.errors?.email?.[0]}
      />

      <Input
        id="password"
        name="password"
        type="password"
        label="Password"
        placeholder="Enter your password"
        autoComplete="current-password"
        required
        disabled={isPending}
        error={state.errors?.password?.[0]}
      />

      <Button
        type="submit"
        variant="primary"
        className="w-full mt-2"
        isLoading={isPending}
        disabled={isPending}
      >
        Sign In
      </Button>
    </form>
  );
}
