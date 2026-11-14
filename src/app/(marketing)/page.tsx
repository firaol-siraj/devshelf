import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-6xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-5xl font-bold tracking-tight">
        Your Developer Workspace
      </h1>

      <p className="mt-6 max-w-xl text-lg text-foreground-secondary">
        Organize your projects, manage your resources,
        and build better software with DevShelf.
      </p>

      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary-hover"
        >
          Get Started
        </Link>

        <Link
          href="/dashboard"
          className="rounded-lg border px-6 py-3 border-border"
        >
          Explore Dashboard
        </Link>
      </div>
    </main>
  );
}
