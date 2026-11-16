import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Sign In | DevShelf",
  description: "Sign in to your DevShelf developer workspace.",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 text-foreground shadow-card">
      <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>

      <p className="mt-2 text-sm text-foreground-secondary">
        Sign in to your DevShelf account.
      </p>

      <LoginForm />

      <p className="mt-6 text-center text-xs text-foreground-secondary">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-primary hover:underline hover:text-primary-hover"
        >
          Create one now
        </Link>
      </p>
    </div>
  );
}
