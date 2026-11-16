"use client";

import { useState, type ReactNode } from "react";
import Sidebar from "@/components/navigation/Sidebar";
import DashboardHeader from "@/components/navigation/DashboardHeader";

export interface WorkspaceShellProps {
  children: ReactNode;
  title?: string;
  description?: string;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}

export default function WorkspaceShell({
  children,
  title = "Dashboard",
  description = "Manage and organize your reusable code snippets.",
  user,
}: WorkspaceShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleOpenMobileNav = () => {
    setIsMobileNavOpen(true);
  };

  const handleCloseMobileNav = () => {
    setIsMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar: Desktop permanent (256px) + Mobile slide-in drawer */}
      <Sidebar
        isOpen={isMobileNavOpen}
        onClose={handleCloseMobileNav}
        user={user}
      />

      {/* Main Workspace Column: md:pl-64 reserves 256px for the desktop sidebar */}
      <div className="flex min-h-screen flex-col md:pl-64 transition-[padding] duration-200">
        {/* Sticky Dashboard Header */}
        <DashboardHeader
          title={title}
          description={description}
          onMenuClick={handleOpenMobileNav}
        />

        {/* Workspace Content Canvas */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
