export default function LoginPage() {
  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 text-foreground shadow-card">
      <h1 className="text-2xl font-bold">Welcome Back</h1>

      <p className="mt-2 text-foreground-secondary">
        Sign in to your DevShelf account.
      </p>

      <form className="mt-6 space-y-4">
        <input
          type="email"
          placeholder="Email address"
          className="w-full rounded-lg border border-border bg-background p-3 text-foreground placeholder:text-foreground-muted"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full rounded-lg border border-border bg-background p-3 text-foreground placeholder:text-foreground-muted"
        />

        <button
          type="submit"
          className="w-full rounded-lg bg-primary p-3 text-white hover:bg-primary-hover"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
