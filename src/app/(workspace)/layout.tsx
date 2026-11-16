import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import WorkspaceShell from "@/components/navigation/WorkspaceShell";

export const instant = false;

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connection();
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
    return null;
  }

  return <WorkspaceShell user={session.user}>{children}</WorkspaceShell>;
}
