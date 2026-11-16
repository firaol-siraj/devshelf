import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";

export const instant = false;

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connection();
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      {children}
    </main>
  );
}
