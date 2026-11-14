import type { ReactNode } from "react";

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <nav className="mx-auto flex max-w-6xl items-center justify-between p-5">
          <span className="text-xl font-bold">DevShelf</span>

          <div className="flex gap-6">
            <span>Home</span>
            <span>About</span>
            <span>Features</span>
          </div>
        </nav>
      </header>

      <main>{children}</main>

      <footer className="border-t p-6 text-center">
        DevShelf © 2026
      </footer>
    </div>
  );
}