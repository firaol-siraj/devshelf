"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  House,
  Code2,
  X,
  LogOut,
} from "lucide-react";

import Button from "@/components/ui/Button";
import { logoutAction } from "@/app/(auth)/login/actions";
import type { NavigationItem } from "@/types/navigation";

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Home",
    href: "/",
    icon: House,
  },
];

function subscribeToDesktopQuery(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia("(min-width: 768px)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getDesktopSnapshot(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(min-width: 768px)").matches;
}

function getServerDesktopSnapshot(): boolean {
  return true;
}

export default function Sidebar({
  isOpen = false,
  onClose,
  user,
}: SidebarProps) {
  const pathname = usePathname();

  // Responsive breakpoint tracking via useSyncExternalStore
  const isDesktop = useSyncExternalStore(
    subscribeToDesktopQuery,
    getDesktopSnapshot,
    getServerDesktopSnapshot
  );
  const isMobile = !isDesktop;

  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Automatically close mobile drawer when viewport expands to desktop
  useEffect(() => {
    if (isDesktop && isOpen) {
      onClose?.();
    }
  }, [isDesktop, isOpen, onClose]);

  // Handle body scroll lock on mobile when drawer is open
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isOpen && isMobile) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, isMobile]);

  // Handle keyboard focus management, Escape key, and focus trap
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isOpen && isMobile) {
      // 1. Capture previously focused element to restore when closed
      if (document.activeElement instanceof HTMLElement) {
        previousFocusRef.current = document.activeElement;
      }

      // 2. Move focus to the close button inside drawer
      const focusTimer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      // 3. Handle Escape key and Tab focus trapping
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose?.();
          return;
        }

        if (event.key === "Tab") {
          if (!drawerRef.current) return;
          const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );

          if (focusableElements.length === 0) return;

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      return () => {
        clearTimeout(focusTimer);
        document.removeEventListener("keydown", handleKeyDown);
        // Restore focus to opener element upon closing
        if (
          previousFocusRef.current &&
          typeof previousFocusRef.current.focus === "function"
        ) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, isMobile, onClose]);

  const handleLinkClick = () => {
    if (isMobile) {
      onClose?.();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onClose}
        className={[
          "fixed inset-0 z-30 bg-black/40 backdrop-blur-xs transition-opacity duration-300 md:hidden motion-reduce:transition-none cursor-pointer",
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ]
          .filter(Boolean)
          .join(" ")}
      />

      {/* Sidebar / Mobile Drawer Surface */}
      <aside
        ref={drawerRef}
        role={isMobile && isOpen ? "dialog" : undefined}
        aria-modal={isMobile && isOpen ? "true" : undefined}
        aria-label={isMobile && isOpen ? "Mobile navigation" : "Sidebar"}
        inert={isMobile && !isOpen ? true : undefined}
        className={[
          "fixed inset-y-0 left-0 flex flex-col justify-between border-r border-border bg-surface p-4 transition-transform duration-300 ease-in-out motion-reduce:transition-none z-40 md:z-30",
          "w-[280px] max-w-[85vw] md:w-64",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="flex flex-col gap-6">
          {/* Header Area with Brand & Mobile Close Button */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-subtle shrink-0">
                <Code2 size={18} aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-tight text-foreground leading-none">
                  DevShelf
                </span>
                <span className="text-[11px] font-normal text-foreground-muted mt-1 leading-none">
                  Developer Workspace
                </span>
              </div>
            </div>

            {/* Mobile-only Close Button */}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close navigation menu"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface-secondary text-foreground-secondary hover:text-foreground hover:bg-surface-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background md:hidden cursor-pointer shrink-0 transition-colors"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav
            aria-label="Workspace navigation"
            className="flex flex-col gap-1"
          >
            {navigationItems.map((item) => {
              const Icon = item.icon;

              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors select-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                    isActive
                      ? "bg-surface-secondary text-foreground font-medium shadow-subtle border border-border/60"
                      : "text-foreground-secondary hover:bg-surface-secondary/60 hover:text-foreground border border-transparent",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {isActive && (
                    <span
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                  <Icon
                    size={16}
                    aria-hidden="true"
                    className={
                      isActive
                        ? "text-primary shrink-0 transition-colors"
                        : "text-foreground-muted group-hover:text-foreground shrink-0 transition-colors"
                    }
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-3">
          {/* User profile & Sign Out if authenticated */}
          {user && (
            <div className="border-t border-border pt-3 px-2 flex flex-col gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold shrink-0 select-none">
                  {user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-medium text-foreground truncate">
                    {user.name || "User"}
                  </span>
                  <span className="text-[11px] text-foreground-muted truncate">
                    {user.email}
                  </span>
                </div>
              </div>

              <form action={logoutAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs text-foreground-secondary hover:text-danger hover:bg-danger/10"
                >
                  <LogOut size={14} className="mr-2" aria-hidden="true" />
                  Sign Out
                </Button>
              </form>
            </div>
          )}

          {/* Footer Version Indicator */}
          <div className="border-t border-border pt-3 px-2 flex items-center justify-between text-xs text-foreground-muted select-none">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
              <span
                className="h-1.5 w-1.5 rounded-full bg-success"
                aria-hidden="true"
              />
              DevShelf
            </span>
            <span className="font-mono text-[11px]">v0.1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
