import type { Metadata } from "next";
import Link from "next/link";
import RegisterForm from "./register-form";

export const metadata: Metadata = {
  title: "Create an Account | DevShelf",
  description: "Sign up to start organizing your developer snippets and notes.",
};

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 text-foreground shadow-card">
      <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>

      <p className="mt-2 text-sm text-foreground-secondary">
        Join DevShelf to organize your code snippets, notes, and collections.
      </p>

      <RegisterForm />

      <p className="mt-6 text-center text-xs text-foreground-secondary">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline hover:text-primary-hover"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}
